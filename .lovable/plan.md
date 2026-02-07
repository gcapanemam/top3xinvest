
# Plano: Corrigir Erro 401 na Geração de Link OxaPay

## Diagnóstico do Problema

A análise dos logs de Edge Functions revelou que todas as chamadas POST para `oxapay-create-invoice` estão retornando **HTTP 401 Unauthorized**:

```
POST | 401 | https://ipxgoqpkbgyijfubqaqi.supabase.co/functions/v1/oxapay-create-invoice
```

### Causa Raiz

A função `oxapay-create-invoice` está configurada com `verify_jwt = true` no `supabase/config.toml`. Isso significa que o Supabase valida o JWT **antes** de executar a função. Quando a validação falha (sessão expirada, token inválido, ou problema de timing), retorna 401 sem executar o código da função.

Problemas possíveis:
- Sessão do usuário expirada
- Token não sendo enviado corretamente pelo cliente
- Problema de timing onde o token não foi carregado

---

## Solução Proposta

Alterar a abordagem de autenticação para **validação manual de JWT no código** (padrão mais robusto usado em outras funções do projeto).

### Benefícios desta abordagem:
1. Mensagens de erro mais claras e específicas
2. Logs detalhados para debugging
3. Maior controle sobre o fluxo de autenticação
4. Funciona mesmo com problemas de timing no cliente

---

## Alterações a Serem Feitas

### 1. Atualizar `supabase/config.toml`

```diff
[functions.oxapay-create-invoice]
- verify_jwt = true
+ verify_jwt = false
```

### 2. Atualizar `supabase/functions/oxapay-create-invoice/index.ts`

Adicionar validação manual do JWT no início da função:

```typescript
// No início da função, após CORS handling
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

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: authHeader } }
});

const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

if (authError || !user) {
  console.error("Auth error:", authError?.message || "User not found");
  return new Response(
    JSON.stringify({ error: "Sessão expirada - faça login novamente" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

console.log("Authenticated user:", user.id);
```

### 3. Fazer a Mesma Alteração em `oxapay-check-status`

Aplicar a mesma correção para consistência e melhor debugging.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/config.toml` | Alterar `verify_jwt = false` para ambas as funções OxaPay |
| `supabase/functions/oxapay-create-invoice/index.ts` | Adicionar validação manual de JWT com logs detalhados |
| `supabase/functions/oxapay-check-status/index.ts` | Adicionar validação manual de JWT com logs detalhados |

---

## Fluxo de Autenticação Após a Correção

```text
1. Usuário clica "Continuar para Pagamento"
          |
          v
2. supabase.functions.invoke() envia token JWT no header
          |
          v
3. Edge Function verifica token manualmente
          |
    [Token válido?]
        /    \
      Sim     Não
       |       |
       v       v
4. Cria invoice   Retorna erro claro:
   no OxaPay      "Sessão expirada - faça login novamente"
```

---

## Seção Técnica - Código Completo

### oxapay-create-invoice/index.ts (Trecho Modificado)

```typescript
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
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

    // Create client with user's token for auth validation
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      console.error("Auth validation failed:", authError?.message || "No user");
      return new Response(
        JSON.stringify({ error: "Sessão expirada - faça login novamente" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    // ... resto do código continua igual ...
  }
});
```

---

## Resultado Esperado

1. Usuário logado consegue criar depósitos normalmente
2. Se a sessão expirar, recebe mensagem clara: "Sessão expirada - faça login novamente"
3. Logs detalhados aparecem no Edge Function Logs para debugging
4. Erro genérico "Erro ao gerar link de pagamento" é substituído por mensagens específicas
