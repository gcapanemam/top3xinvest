import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Create regular client to verify the requesting user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the requesting user
    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !requestingUser) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if requesting user is admin
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !adminRole) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem executar esta ação.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, user_id, data } = await req.json();
    console.log('Admin action:', action, 'for user:', user_id);

    // Helper function to create audit log
    const createAuditLog = async (logAction: string, entityType: string, entityId: string, details: Record<string, unknown>) => {
      await supabaseAdmin.from('admin_audit_logs').insert({
        admin_id: requestingUser.id,
        action: logAction,
        entity_type: entityType,
        entity_id: entityId,
        details: details,
      });
    };

    switch (action) {
      case 'send_password_reset': {
        // Get user email from auth.users using admin client
        const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(user_id);
        
        if (getUserError || !userData.user?.email) {
          console.error('Get user error:', getUserError);
          return new Response(
            JSON.stringify({ error: 'Usuário não encontrado ou sem email' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Send password reset email
        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
          userData.user.email,
          { redirectTo: data?.redirectTo || 'https://top3xinvest.lovable.app/reset-password' }
        );

        if (resetError) {
          console.error('Reset password error:', resetError);
          return new Response(
            JSON.stringify({ error: 'Erro ao enviar email de redefinição' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create audit log
        await createAuditLog('user_password_reset_sent', 'user', user_id, {
          user_email: userData.user.email,
          action_via: 'edge_function',
        });

        return new Response(
          JSON.stringify({ success: true, message: 'Email de redefinição enviado com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete_user': {
        // Prevent self-deletion
        if (user_id === requestingUser.id) {
          return new Response(
            JSON.stringify({ error: 'Você não pode excluir sua própria conta' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get user email before deletion for logging
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(user_id);
        const userEmail = userData?.user?.email || 'unknown';

        // Delete user from auth.users (cascade will handle related tables)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

        if (deleteError) {
          console.error('Delete user error:', deleteError);
          return new Response(
            JSON.stringify({ error: 'Erro ao excluir usuário' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create audit log
        await createAuditLog('user_deleted', 'user', user_id, {
          user_email: userEmail,
          action_via: 'edge_function',
        });

        return new Response(
          JSON.stringify({ success: true, message: 'Usuário excluído com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_user_email': {
        // Get user email from auth.users
        const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(user_id);
        
        if (getUserError || !userData.user) {
          console.error('Get user error:', getUserError);
          return new Response(
            JSON.stringify({ error: 'Usuário não encontrado' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, email: userData.user.email }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'send_email_confirmation': {
        // Get user email from auth.users
        const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(user_id);
        
        if (getUserError || !userData.user?.email) {
          console.error('Get user error:', getUserError);
          return new Response(
            JSON.stringify({ error: 'Usuário não encontrado ou sem email' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Resend confirmation email using signUp invite
        const { error: resendError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          userData.user.email,
          { redirectTo: data?.redirectTo || 'https://top3xinvest.lovable.app/' }
        );

        if (resendError) {
          console.error('Resend email confirmation error:', resendError);
          return new Response(
            JSON.stringify({ error: 'Erro ao reenviar email de confirmação' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create audit log
        await createAuditLog('user_email_confirmation_resent', 'user', user_id, {
          user_email: userData.user.email,
          action_via: 'edge_function',
        });

        return new Response(
          JSON.stringify({ success: true, message: 'Email de confirmação reenviado com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Ação não reconhecida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
