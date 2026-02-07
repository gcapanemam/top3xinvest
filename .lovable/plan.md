
# Plano: Adicionar Opção para Reenviar Email de Validação de Email

## Visão Geral

Adicionar uma funcionalidade para que usuários possam reenviar o email de confirmação/validação de email, similar à opção de "Enviar Email de Redefinição de Senha" que já existe no painel de admin.

## Contexto Atual

A aplicação já possui:
- **AuthContext** (`src/contexts/AuthContext.tsx`): Gerencia autenticação com métodos como `signUp`, `signIn`, `resetPassword`, `updatePassword`
- **Edge Function admin-user-actions** (`supabase/functions/admin-user-actions/index.ts`): Executa ações privilegiadas como `send_password_reset`, `delete_user`, `get_user_email`
- **Painel AdminUsers** (`src/pages/admin/AdminUsers.tsx`): Possui um dialog de edição de usuários com uma seção "Segurança" que inclui o botão "Enviar Email de Redefinição de Senha" (linhas ~1049-1055)
- **Supabase Auth** configurado com verificação de email obrigatória

## Fluxo Atual para Redefinição de Senha

O usuário já pode:
1. Entrar no painel de admin
2. Procurar por um usuário específico
3. Clicar no dropdown de ações e depois em "Editar"
4. No dialog, ir para a aba "Ações" (ou seção "Segurança")
5. Clicar em "Enviar Email de Redefinição de Senha"
6. Um email é enviado via `admin-user-actions` edge function

## O que Será Implementado

### 1. Nova Ação na Edge Function `admin-user-actions`

Adicionar novo caso `send_email_confirmation`:
- Recebe `user_id` como parâmetro
- Usa o método Supabase `supabaseAdmin.auth.resendEnrollmentEmail(email)` para reenviar email de confirmação
- Cria um audit log registrando a ação
- Retorna sucesso ou erro

### 2. Novo Método no AuthContext

Adicionar método `resendEmailConfirmation`:
- Permite que usuários (não apenas admins) ressubmitam o email de confirmação
- Usa `supabase.auth.resendEnrollmentEmail(email)` 
- Retorna erro ou sucesso

### 3. Alterações no Painel AdminUsers

Na seção "Segurança" do dialog de edição de usuários:
- Adicionar novo botão: "Reenviar Email de Confirmação" (com ícone de envelope/mail)
- Colocar após ou ao lado do botão "Enviar Email de Redefinição de Senha"
- Implementar `handleSendEmailConfirmation` que invoca a edge function
- Adicionar estado `isSendingEmailConfirmation` para controlar o estado de carregamento

### 4. Interface do Usuário

Adicionar um botão visual simples na seção de "Segurança":

```
┌─────────────────────────────────────────────┐
│ Segurança                                   │
├─────────────────────────────────────────────┤
│ [Enviar Email de Redefinição de Senha]      │
│ [Reenviar Email de Confirmação] ← NOVO      │
└─────────────────────────────────────────────┘
```

## Arquivos a Modificar

| Arquivo | Modificação | Descrição |
|---------|-------------|-----------|
| `supabase/functions/admin-user-actions/index.ts` | Adicionar case | Novo caso `send_email_confirmation` |
| `src/contexts/AuthContext.tsx` | Adicionar método | Novo método `resendEmailConfirmation` |
| `src/pages/admin/AdminUsers.tsx` | Modificar | Adicionar handler + UI button na seção Segurança |

## Detalhes Técnicos

### Edge Function - Novo Case

```typescript
case 'send_email_confirmation': {
  const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(user_id);
  
  if (getUserError || !userData.user?.email) {
    return new Response(
      JSON.stringify({ error: 'Usuário não encontrado ou sem email' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { error: resendError } = await supabaseAdmin.auth.admin.sendEnrollmentInvitation(userData.user.email);

  if (resendError) {
    return new Response(
      JSON.stringify({ error: 'Erro ao reenviar email de confirmação' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  await createAuditLog('user_email_confirmation_resent', 'user', user_id, {
    user_email: userData.user.email,
    action_via: 'edge_function',
  });

  return new Response(
    JSON.stringify({ success: true, message: 'Email de confirmação reenviado com sucesso' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### AuthContext - Novo Método

```typescript
const resendEmailConfirmation = async (email: string) => {
  const { error } = await supabase.auth.resendEnrollmentEmail(email);
  return { error: error as Error | null };
};
```

### AdminUsers - Handler

```typescript
const handleSendEmailConfirmation = async () => {
  if (!editUser) return;
  
  setIsSendingEmailConfirmation(true);
  
  const { data, error } = await supabase.functions.invoke('admin-user-actions', {
    body: {
      action: 'send_email_confirmation',
      user_id: editUser.user_id,
    },
  });

  if (error || data?.error) {
    toast({
      title: 'Erro',
      description: data?.error || 'Não foi possível reenviar o email de confirmação',
      variant: 'destructive',
    });
  } else {
    toast({
      title: 'Email enviado!',
      description: 'O usuário receberá um link para confirmar seu email',
    });
  }

  setIsSendingEmailConfirmation(false);
};
```

### AdminUsers - UI Button

Adicionar na seção "Segurança" (próximo ao botão de password reset):

```tsx
<button
  onClick={handleSendEmailConfirmation}
  disabled={isSendingEmailConfirmation}
  className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-medium transition-colors disabled:opacity-50"
>
  <Mail className="h-4 w-4" />
  {isSendingEmailConfirmation ? 'Enviando...' : 'Reenviar Email de Confirmação'}
</button>
```

## Fluxo Esperado

1. Admin abre painel de AdminUsers
2. Procura por um usuário cuja confirmação de email pode ter falhado
3. Clica em "Editar Usuário"
4. Vai para a seção "Segurança"
5. Clica em "Reenviar Email de Confirmação"
6. O email é enviado via Supabase Auth
7. Sistema registra a ação no audit log
8. Admin recebe confirmação visual (toast)
9. Usuário recebe novo email com link de confirmação

## Segurança

- Apenas admins (verificado via `has_role` function na edge function) podem reenviar emails de confirmação para outros usuários
- Cada ação é registrada no audit log para rastreabilidade
- Usa o método seguro do Supabase Auth (`sendEnrollmentInvitation`)

## Estado Adicional Necessário em AdminUsers

- `const [isSendingEmailConfirmation, setIsSendingEmailConfirmation] = useState(false);` (já existe `isSendingReset`)
