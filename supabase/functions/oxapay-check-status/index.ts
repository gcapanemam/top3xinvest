import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate authentication manually
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Não autorizado - faça login novamente" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's token for auth validation
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      console.error("Auth validation failed:", authError?.message || "No user found");
      return new Response(
        JSON.stringify({ error: "Sessão expirada - faça login novamente" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    const OXAPAY_MERCHANT_KEY = Deno.env.get("OXAPAY_MERCHANT_KEY");
    
    if (!OXAPAY_MERCHANT_KEY) {
      console.error("OXAPAY_MERCHANT_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const { trackId, depositId } = await req.json();

    console.log("Checking OxaPay status:", { trackId, depositId, userId: user.id });

    if (!trackId) {
      return new Response(
        JSON.stringify({ error: "trackId is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (!depositId) {
      return new Response(
        JSON.stringify({ error: "depositId is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Create service role client to validate deposit ownership
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // SECURITY: Validate deposit exists and belongs to the authenticated user
    const { data: deposit, error: depositError } = await supabase
      .from("deposits")
      .select("id, user_id, oxapay_track_id")
      .eq("id", depositId)
      .single();

    if (depositError || !deposit) {
      console.error("Deposit not found:", depositId, depositError);
      return new Response(
        JSON.stringify({ error: "Depósito não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Check ownership (IDOR protection)
    if (deposit.user_id !== user.id) {
      console.error("IDOR attempt: User", user.id, "tried to access deposit", depositId, "owned by", deposit.user_id);
      return new Response(
        JSON.stringify({ error: "Acesso não autorizado a este depósito" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Validate trackId matches what we have on record
    if (deposit.oxapay_track_id && deposit.oxapay_track_id !== trackId) {
      console.error("TrackId mismatch: provided", trackId, "vs stored", deposit.oxapay_track_id);
      return new Response(
        JSON.stringify({ error: "TrackId inválido para este depósito" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call OxaPay inquiry API
    const response = await fetch("https://api.oxapay.com/merchants/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant: OXAPAY_MERCHANT_KEY,
        trackId: trackId,
      }),
    });

    const data = await response.json();
    console.log("OxaPay inquiry response:", JSON.stringify(data));

    // OxaPay returns result: 100 for success
    if (data.result !== 100) {
      console.error("OxaPay inquiry failed:", data);
      return new Response(
        JSON.stringify({ 
          error: data.message || "Error checking payment status",
          result: data.result
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Return status info to frontend
    const statusResponse = {
      status: data.status,
      amount: data.amount,
      payAmount: data.payAmount,
      payCurrency: data.payCurrency,
      network: data.network,
      address: data.address,
      txID: data.txID,
      expiredAt: data.expiredAt,
      trackId: data.trackId,
    };

    console.log("Returning status:", JSON.stringify(statusResponse));

    return new Response(
      JSON.stringify(statusResponse),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in oxapay-check-status:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
