
# Plano: Recuperacao de Senha com Envio de Email

## Visao Geral

Implementar funcionalidade completa de recuperacao de senha na pagina de autenticacao, incluindo:
1. Formulario para solicitar reset de senha (envio de email)
2. Pagina para definir nova senha (apos clicar no link do email)
3. Edge function para envio de email personalizado usando Resend

## Funcionalidades

### 1. Solicitar Reset de Senha
- Link "Esqueci minha senha" abaixo do formulario de login
- Modal/formulario para digitar email
- Envio de email com link de recuperacao

### 2. Definir Nova Senha
- Nova rota `/auth/reset-password` para processar o token
- Formulario para digitar nova senha e confirmacao
- Validacao e atualizacao da senha

### 3. Edge Function para Email
- Funcao `send-password-reset` usando Resend
- Template de email estilizado com as cores da marca

## Prerequisito: API Key do Resend

Para enviar emails personalizados, sera necessario configurar a chave API do Resend:
1. Criar conta em https://resend.com (se ainda nao tiver)
2. Validar dominio de email em https://resend.com/domains
3. Criar API key em https://resend.com/api-keys
4. Adicionar a chave como secret `RESEND_API_KEY`

---

## Secao Tecnica

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| supabase/functions/send-password-reset/index.ts | Criar edge function |
| supabase/config.toml | Adicionar configuracao da funcao |
| src/pages/Auth.tsx | Adicionar modal de recuperacao |
| src/pages/ResetPassword.tsx | Criar pagina de nova senha |
| src/App.tsx | Adicionar rota /auth/reset-password |
| src/contexts/AuthContext.tsx | Adicionar funcoes de reset |

### 1. Edge Function: send-password-reset

```typescript
// supabase/functions/send-password-reset/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type...",
};

interface PasswordResetRequest {
  email: string;
  resetUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetUrl }: PasswordResetRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Invest Hub <noreply@SEU-DOMINIO.com>",
      to: [email],
      subject: "Recupere sua senha - Invest Hub",
      html: `
        <div style="background: #0a0f14; padding: 40px; font-family: sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: #111820; border-radius: 16px; padding: 40px; border: 1px solid #1e2a3a;">
            <h1 style="color: white; margin-bottom: 20px;">Recuperacao de Senha</h1>
            <p style="color: #9ca3af;">Voce solicitou a recuperacao de senha da sua conta.</p>
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(to right, #14b8a6, #06b6d4); color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; margin: 20px 0;">
              Redefinir Senha
            </a>
            <p style="color: #6b7280; font-size: 14px;">Se voce nao solicitou isso, ignore este email.</p>
          </div>
        </div>
      `,
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
```

### 2. Atualizacao do AuthContext

Adicionar funcao `resetPassword`:

```typescript
const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  return { error: error as Error | null };
};
```

Adicionar funcao `updatePassword`:

```typescript
const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { error: error as Error | null };
};
```

### 3. Modificacoes no Auth.tsx

Adicionar estado para controlar modal:

```typescript
const [showForgotPassword, setShowForgotPassword] = useState(false);
const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
```

Adicionar link "Esqueci minha senha" apos o botao de login:

```tsx
<button 
  type="button"
  onClick={() => setShowForgotPassword(true)}
  className="w-full text-center text-sm text-teal-400 hover:text-teal-300"
>
  Esqueci minha senha
</button>
```

Adicionar Dialog para solicitar reset:

```tsx
<Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
  <DialogContent className="bg-[#111820] border-[#1e2a3a]">
    <DialogHeader>
      <DialogTitle className="text-white">Recuperar senha</DialogTitle>
      <DialogDescription className="text-gray-400">
        Digite seu email para receber o link de recuperacao
      </DialogDescription>
    </DialogHeader>
    <form onSubmit={handleForgotPassword}>
      <Input
        type="email"
        placeholder="seu@email.com"
        value={forgotPasswordEmail}
        onChange={(e) => setForgotPasswordEmail(e.target.value)}
        className="bg-[#0a0f14] border-[#1e2a3a] text-white"
      />
      <button type="submit" className="w-full mt-4 h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500...">
        Enviar link de recuperacao
      </button>
    </form>
  </DialogContent>
</Dialog>
```

### 4. Nova Pagina: ResetPassword.tsx

```tsx
// src/pages/ResetPassword.tsx
const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas nao coincidem', variant: 'destructive' });
      return;
    }

    const { error } = await updatePassword(password);
    
    if (error) {
      toast({ title: 'Erro', description: 'Nao foi possivel atualizar a senha', variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso!', description: 'Senha atualizada com sucesso' });
      navigate('/dashboard');
    }
  };

  return (
    // Layout igual ao Auth.tsx com formulario de nova senha
  );
};
```

### 5. Atualizacao do App.tsx

Adicionar rota:

```tsx
<Route path="/auth/reset-password" element={<ResetPassword />} />
```

### Fluxo Completo

```text
Usuario esqueceu senha
        |
        v
Clica "Esqueci minha senha"
        |
        v
Modal abre, digita email
        |
        v
supabase.auth.resetPasswordForEmail()
        |
        v
Supabase envia email com link para /auth/reset-password?token=xxx
        |
        v
Usuario clica no link do email
        |
        v
Abre ResetPassword.tsx (Supabase ja autentica via token)
        |
        v
Usuario digita nova senha
        |
        v
supabase.auth.updateUser({ password })
        |
        v
Redireciona para /dashboard
```

### Opcao Alternativa: Email Customizado via Edge Function

Se desejar usar email personalizado com Resend:

1. Desativar email padrao do Supabase (opcional)
2. Gerar token manualmente via edge function
3. Enviar email via Resend com template customizado

Para esta implementacao, usaremos o fluxo nativo do Supabase que ja envia email automaticamente, mas com a URL de redirect configurada para nossa pagina de reset.

### Visual da Interface

```text
+-------------------------------------------+
|  Card de Login                            |
|                                           |
|  Email: [___________________]             |
|  Senha: [___________________]             |
|                                           |
|  [        Entrar        ->]               |
|                                           |
|  Esqueci minha senha (link)               |
+-------------------------------------------+

Modal de Recuperacao:
+-------------------------------------------+
|  Recuperar senha                     [X]  |
|                                           |
|  Digite seu email para receber            |
|  o link de recuperacao                    |
|                                           |
|  Email: [___________________]             |
|                                           |
|  [  Enviar link de recuperacao  ]         |
+-------------------------------------------+

Pagina Reset Password:
+-------------------------------------------+
|  Invest Hub                               |
|                                           |
|  Redefinir sua senha                      |
|                                           |
|  Nova senha: [___________________]        |
|  Confirmar:  [___________________]        |
|                                           |
|  [      Salvar nova senha      ]          |
+-------------------------------------------+
```

### Seguranca

- Validacao de email com Zod
- Senha minima de 6 caracteres
- Confirmacao de senha obrigatoria
- Token de reset gerenciado pelo Supabase (expira em 1 hora)
- CORS configurado na edge function
