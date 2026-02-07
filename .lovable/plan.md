

# Plano: Pagina de Acompanhamento de Status OxaPay em Tempo Real

## Visao Geral

Criar uma pagina dedicada que mostra o status do pagamento OxaPay em tempo real. O usuario sera redirecionado para esta pagina apos criar um deposito, podendo acompanhar cada etapa do pagamento sem precisar sair da plataforma.

---

## Fluxo do Usuario

```text
Usuario cria deposito
        |
        v
Redireciona para /deposit/status/:depositId
        |
        v
Pagina mostra:
  - Timer de expiracao (60 minutos)
  - Status atual (New > Waiting > Confirming > Paid)
  - Botao para ir para OxaPay pagar
  - Link para copiar
        |
        v
Pagina consulta status a cada 10 segundos
        |
        v
Quando status = Paid:
  - Mostra animacao de sucesso
  - Redireciona para /deposits apos 3 segundos
```

---

## O Que Sera Criado

### 1. Nova Pagina: PaymentStatus

Arquivo: `src/pages/PaymentStatus.tsx`

Pagina com:
- Parametro de rota `:depositId`
- Consulta deposito no banco de dados
- Exibe informacoes do pagamento (valor, data, link)
- Timer de contagem regressiva (60 minutos)
- Barra de progresso visual com status
- Polling automatico a cada 10 segundos
- Estados visuais para cada status (New, Waiting, Confirming, Paid, Expired)

### 2. Nova Edge Function: oxapay-check-status

Arquivo: `supabase/functions/oxapay-check-status/index.ts`

- Recebe `trackId` como parametro
- Consulta API OxaPay (`POST https://api.oxapay.com/merchants/inquiry`)
- Atualiza status do deposito no banco
- Retorna status atualizado para o frontend

### 3. Atualizar Rota no App.tsx

Adicionar rota `/deposit/status/:depositId`

### 4. Atualizar Deposits.tsx

Redirecionar para a pagina de status ao inves de diretamente para OxaPay

---

## Detalhes da Interface

### Estados de Status

| Status OxaPay | Icone | Cor | Mensagem |
|---------------|-------|-----|----------|
| New | Clock | Amarelo | Aguardando pagamento |
| Waiting | Loader | Azul | Pagamento detectado |
| Confirming | RefreshCw | Ciano | Confirmando transacao |
| Paid | CheckCircle | Verde | Pagamento confirmado! |
| Expired | XCircle | Vermelho | Pagamento expirado |
| Failed | AlertTriangle | Vermelho | Falha no pagamento |

### Layout da Pagina

```text
+--------------------------------------------------+
|                                                  |
|    [Logo/Header - Acompanhe seu Pagamento]       |
|                                                  |
|    +------------------------------------------+  |
|    |                                          |  |
|    |   Deposito de $100.00                    |  |
|    |                                          |  |
|    |   [====Barra de Progresso Visual====]    |  |
|    |                                          |  |
|    |   Status: Aguardando pagamento           |  |
|    |                                          |  |
|    |   Tempo restante: 58:42                  |  |
|    |                                          |  |
|    |   [ Ir para Pagamento (OxaPay) ]         |  |
|    |                                          |  |
|    +------------------------------------------+  |
|                                                  |
|    Voltar para Depositos                         |
|                                                  |
+--------------------------------------------------+
```

---

## Secao Tecnica

### Edge Function: oxapay-check-status

```typescript
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OXAPAY_MERCHANT_KEY = Deno.env.get("OXAPAY_MERCHANT_KEY");
    const { trackId, depositId } = await req.json();

    console.log("Checking OxaPay status:", { trackId, depositId });

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
    console.log("OxaPay inquiry response:", data);

    if (data.result !== 100) {
      return new Response(
        JSON.stringify({ error: data.message || "Error checking status" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return status info to frontend
    return new Response(
      JSON.stringify({
        status: data.status,
        amount: data.amount,
        payAmount: data.payAmount,
        payCurrency: data.payCurrency,
        network: data.network,
        address: data.address,
        txID: data.txID,
        expiredAt: data.expiredAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in oxapay-check-status:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### Pagina PaymentStatus.tsx (Resumo)

```typescript
const PaymentStatus = () => {
  const { depositId } = useParams();
  const [deposit, setDeposit] = useState(null);
  const [status, setStatus] = useState("New");
  const [timeLeft, setTimeLeft] = useState(3600); // 60 min

  // Buscar deposito do banco
  useEffect(() => {
    fetchDeposit();
  }, [depositId]);

  // Polling de status a cada 10 segundos
  useEffect(() => {
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [deposit?.oxapay_track_id]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const checkStatus = async () => {
    if (!deposit?.oxapay_track_id) return;
    
    const { data } = await supabase.functions.invoke("oxapay-check-status", {
      body: { trackId: deposit.oxapay_track_id, depositId }
    });
    
    if (data?.status) {
      setStatus(data.status);
      
      // Se pago, redirecionar
      if (data.status === "Paid") {
        setTimeout(() => navigate("/deposits"), 3000);
      }
    }
  };

  // Render visual progress bar and status info...
};
```

### Rota no App.tsx

```typescript
<Route path="/deposit/status/:depositId" element={<PaymentStatus />} />
```

### Alteracao em Deposits.tsx

```typescript
// Ao inves de redirecionar direto para OxaPay:
// window.location.href = invoiceData.payLink;

// Redirecionar para pagina de status:
navigate(`/deposit/status/${depositData.id}`);
```

---

## Arquivos a Criar/Modificar

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| src/pages/PaymentStatus.tsx | Criar | Pagina de acompanhamento de status |
| supabase/functions/oxapay-check-status/index.ts | Criar | Edge Function para consultar status |
| supabase/config.toml | Modificar | Adicionar config da nova funcao |
| src/App.tsx | Modificar | Adicionar nova rota |
| src/pages/Deposits.tsx | Modificar | Redirecionar para pagina de status |

---

## Recursos Visuais

- Barra de progresso animada com 4 etapas
- Icones animados (spin para Confirming)
- Cores de status (amarelo > azul > ciano > verde)
- Timer com contagem regressiva
- Animacao de confete quando status = Paid
- Skeleton loading enquanto carrega dados

---

## Resultado Esperado

1. Usuario clica em "Novo Deposito" e informa valor
2. Sistema cria deposito e invoice no OxaPay
3. Usuario e redirecionado para `/deposit/status/:id`
4. Pagina mostra status em tempo real com polling
5. Usuario clica "Ir para Pagamento" para abrir OxaPay
6. Apos pagar, status atualiza automaticamente
7. Quando Paid, mostra sucesso e redireciona para `/deposits`

