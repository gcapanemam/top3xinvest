

# Plano: Integracao OxaPay para Pagamentos Cripto

## Visao Geral

Integrar o gateway de pagamento OxaPay para automatizar depositos via criptomoedas. O sistema criara invoices automaticamente e processara pagamentos via webhook, eliminando a necessidade de verificacao manual do administrador.

---

## Fluxo de Pagamento

```text
+------------------+     +-----------------+     +------------------+
|     Usuario      |     |   Edge Function |     |     OxaPay       |
+------------------+     +-----------------+     +------------------+
        |                        |                       |
        | 1. Novo Deposito       |                       |
        |----------------------->|                       |
        |                        | 2. Criar Invoice      |
        |                        |---------------------->|
        |                        |                       |
        |                        | 3. payLink + trackId  |
        |                        |<----------------------|
        |                        |                       |
        | 4. Redireciona         |                       |
        |<-----------------------|                       |
        |                        |                       |
        | 5. Paga na pagina OxaPay                       |
        |----------------------------------------------->|
        |                        |                       |
        |                        | 6. Webhook (Paid)     |
        |                        |<----------------------|
        |                        |                       |
        |                        | 7. Atualiza deposito  |
        |                        |    + credita saldo    |
        |                        |                       |
+------------------+     +-----------------+     +------------------+
```

---

## O que sera criado

### 1. Secret: OXAPAY_MERCHANT_KEY

Chave de API do comerciante OxaPay (necessaria para criar invoices)

### 2. Edge Function: oxapay-create-invoice

Cria uma invoice no OxaPay e retorna o link de pagamento

### 3. Edge Function: oxapay-webhook

Recebe notificacoes de pagamento do OxaPay e atualiza o status do deposito

### 4. Alteracoes no Banco de Dados

Adicionar campos na tabela `deposits`:
- `oxapay_track_id` - ID do pagamento no OxaPay
- `oxapay_pay_link` - Link de pagamento gerado

### 5. Alteracoes na Pagina de Depositos

- Ao confirmar deposito, chama a Edge Function para criar invoice
- Redireciona usuario para pagina de pagamento do OxaPay
- Status atualizado automaticamente via webhook

---

## API OxaPay Utilizada

**Criar Invoice:**
```
POST https://api.oxapay.com/merchants/request
Body: {
  merchant: "OXAPAY_MERCHANT_KEY",
  amount: 100,
  currency: "USD",
  callbackUrl: "https://.../functions/v1/oxapay-webhook",
  returnUrl: "https://app.../deposits",
  orderId: "deposit_id",
  description: "Deposito #deposit_id"
}
```

**Resposta:**
```json
{
  "result": 100,
  "trackId": "12345",
  "payLink": "https://oxapay.com/pay/...",
  "expiredAt": "2026-02-07T..."
}
```

**Webhook (callback):**
```json
{
  "trackId": "12345",
  "status": "Paid",
  "amount": "100",
  "payCurrency": "USDT",
  "network": "TRC20",
  "txID": "abc123..."
}
```

---

## Secao Tecnica

### Migracao SQL

```sql
ALTER TABLE deposits 
ADD COLUMN oxapay_track_id TEXT,
ADD COLUMN oxapay_pay_link TEXT;
```

### Edge Function: oxapay-create-invoice

Arquivo: `supabase/functions/oxapay-create-invoice/index.ts`

```typescript
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const OXAPAY_MERCHANT_KEY = Deno.env.get("OXAPAY_MERCHANT_KEY");
  if (!OXAPAY_MERCHANT_KEY) {
    return new Response(
      JSON.stringify({ error: "OXAPAY_MERCHANT_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { amount, depositId, returnUrl } = await req.json();
  
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const callbackUrl = `${SUPABASE_URL}/functions/v1/oxapay-webhook`;

  const response = await fetch("https://api.oxapay.com/merchants/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant: OXAPAY_MERCHANT_KEY,
      amount: amount,
      currency: "USD",
      callbackUrl: callbackUrl,
      returnUrl: returnUrl,
      orderId: depositId,
      description: `Deposito #${depositId}`,
      lifeTime: 60,
      feePaidByPayer: 1,
    }),
  });

  const data = await response.json();

  if (data.result !== 100) {
    return new Response(
      JSON.stringify({ error: data.message || "Erro ao criar invoice" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Atualizar deposito com trackId e payLink
  const supabase = createClient(
    SUPABASE_URL,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  await supabase
    .from("deposits")
    .update({
      oxapay_track_id: data.trackId,
      oxapay_pay_link: data.payLink,
    })
    .eq("id", depositId);

  return new Response(
    JSON.stringify({
      trackId: data.trackId,
      payLink: data.payLink,
      expiredAt: data.expiredAt,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
```

### Edge Function: oxapay-webhook

Arquivo: `supabase/functions/oxapay-webhook/index.ts`

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const body = await req.json();
  
  console.log("OxaPay Webhook received:", body);

  const { trackId, status, orderId, amount, payCurrency, network, txID } = body;

  // Apenas processar quando o pagamento for confirmado
  if (status !== "Paid") {
    console.log(`Payment status: ${status}, skipping`);
    return new Response("OK", { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Buscar deposito pelo orderId (que e o deposit.id)
  const { data: deposit, error: fetchError } = await supabase
    .from("deposits")
    .select("*, user_id")
    .eq("id", orderId)
    .single();

  if (fetchError || !deposit) {
    console.error("Deposit not found:", orderId);
    return new Response("Deposit not found", { status: 404 });
  }

  // Verificar se ja foi processado
  if (deposit.status === "approved") {
    console.log("Deposit already processed");
    return new Response("Already processed", { status: 200 });
  }

  // Atualizar deposito para aprovado
  const { error: updateError } = await supabase
    .from("deposits")
    .update({
      status: "approved",
      processed_at: new Date().toISOString(),
      admin_notes: `Pago via OxaPay - ${payCurrency} (${network}) - TxID: ${txID}`,
    })
    .eq("id", orderId);

  if (updateError) {
    console.error("Error updating deposit:", updateError);
    return new Response("Error updating deposit", { status: 500 });
  }

  // Creditar saldo do usuario
  const { error: balanceError } = await supabase.rpc("increment_balance", {
    p_user_id: deposit.user_id,
    p_amount: parseFloat(amount),
  });

  // OU atualizar diretamente:
  await supabase
    .from("profiles")
    .update({ balance: supabase.sql`balance + ${parseFloat(amount)}` })
    .eq("user_id", deposit.user_id);

  console.log(`Deposit ${orderId} approved, balance credited`);

  return new Response("OK", { status: 200 });
});
```

### Alteracoes em Deposits.tsx

```typescript
const handleDeposit = async () => {
  // ... validacoes existentes ...

  setIsSubmitting(true);

  // 1. Criar registro de deposito
  const { data: depositData, error } = await supabase
    .from("deposits")
    .insert({
      user_id: user!.id,
      amount: numAmount,
      status: "pending",
      payment_method: "oxapay",
    })
    .select()
    .single();

  if (error || !depositData) {
    toast({ title: "Erro", description: "Erro ao criar deposito", variant: "destructive" });
    setIsSubmitting(false);
    return;
  }

  // 2. Criar invoice no OxaPay
  const { data: invoiceData, error: invoiceError } = await supabase.functions.invoke(
    "oxapay-create-invoice",
    {
      body: {
        amount: numAmount,
        depositId: depositData.id,
        returnUrl: window.location.origin + "/deposits",
      },
    }
  );

  if (invoiceError || !invoiceData?.payLink) {
    toast({ title: "Erro", description: "Erro ao gerar link de pagamento", variant: "destructive" });
    setIsSubmitting(false);
    return;
  }

  // 3. Redirecionar para pagina de pagamento
  window.location.href = invoiceData.payLink;
};
```

---

## Arquivos a Criar/Modificar

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| supabase/functions/oxapay-create-invoice/index.ts | Criar | Cria invoice no OxaPay |
| supabase/functions/oxapay-webhook/index.ts | Criar | Recebe callbacks de pagamento |
| src/pages/Deposits.tsx | Modificar | Integrar com OxaPay |
| Migracao SQL | Executar | Adicionar colunas oxapay_* |

---

## Resultado Esperado

1. Usuario solicita deposito informando apenas o valor em USD
2. Sistema cria invoice automatica no OxaPay
3. Usuario e redirecionado para pagina de pagamento OxaPay
4. Usuario escolhe criptomoeda e paga
5. OxaPay envia webhook quando pagamento confirmado
6. Sistema aprova deposito automaticamente e credita saldo
7. Processo 100% automatizado, sem intervencao manual

---

## Proximos Passos Apos Aprovacao

1. Voce precisara fornecer sua chave de API do OxaPay (Merchant API Key)
2. Criar as Edge Functions
3. Executar migracao no banco de dados
4. Atualizar a pagina de depositos

