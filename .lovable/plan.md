

# Plano: Buscar Dados Reais de Cotacoes via CoinGecko API

## Visao Geral

Adicionar funcionalidade na pagina de Gerenciar Cotacoes (AdminPrices) para buscar precos reais de criptomoedas da API CoinGecko, permitindo que o administrador atualize as cotacoes com dados do mercado em tempo real com um clique.

---

## Fluxo Proposto

```text
+-------------------------------------------------+
|        Gerenciar Cotações                       |
+-------------------------------------------------+
|                                                 |
|  [🔄 Buscar Preços Reais]    [💾 Salvar]        |
|                                                 |
|  Criptomoeda    Preço Atual    Variação    ... |
|  Bitcoin BTC    $42,500.00     +2.35%          |
|  Ethereum ETH   $2,250.00      -1.20%          |
|  ...                                           |
+-------------------------------------------------+
```

1. Admin clica em "Buscar Precos Reais"
2. Sistema busca dados da CoinGecko API
3. Campos sao preenchidos automaticamente com precos e variacoes
4. Admin pode editar manualmente se necessario
5. Admin clica em "Salvar Alteracoes" para persistir no banco

---

## API CoinGecko (Gratuita)

A CoinGecko oferece uma API publica gratuita sem necessidade de chave:

**Endpoint principal:**
```
GET https://api.coingecko.com/api/v3/simple/price
  ?ids=bitcoin,ethereum,binancecoin,solana,cardano,ripple,dogecoin,polkadot,tether
  &vs_currencies=usd
  &include_24hr_change=true
```

**Resposta:**
```json
{
  "bitcoin": {
    "usd": 42500,
    "usd_24h_change": 2.35
  },
  "ethereum": {
    "usd": 2250,
    "usd_24h_change": -1.2
  }
}
```

---

## Mapeamento de Simbolos

| Simbolo BD | ID CoinGecko |
|------------|--------------|
| BTC | bitcoin |
| ETH | ethereum |
| BNB | binancecoin |
| SOL | solana |
| ADA | cardano |
| XRP | ripple |
| DOGE | dogecoin |
| DOT | polkadot |
| USDT | tether |

---

## Secao Tecnica

### Abordagem: Edge Function

Criar uma Edge Function para fazer a chamada a API externa (evitando CORS no frontend):

**Arquivo:** `supabase/functions/fetch-crypto-prices/index.ts`

```typescript
import { corsHeaders } from "../_shared/cors.ts";

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  ADA: "cardano",
  XRP: "ripple",
  DOGE: "dogecoin",
  DOT: "polkadot",
  USDT: "tether",
  // Adicionar mais conforme necessario
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { symbols } = await req.json();
  
  // Mapear simbolos para IDs CoinGecko
  const ids = symbols
    .map((s: string) => COINGECKO_IDS[s.toUpperCase()])
    .filter(Boolean)
    .join(",");

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  
  const response = await fetch(url);
  const data = await response.json();

  // Transformar resposta para formato esperado
  const prices: Record<string, { price: number; change: number }> = {};
  
  for (const symbol of symbols) {
    const geckoId = COINGECKO_IDS[symbol.toUpperCase()];
    if (geckoId && data[geckoId]) {
      prices[symbol] = {
        price: data[geckoId].usd,
        change: data[geckoId].usd_24h_change || 0,
      };
    }
  }

  return new Response(JSON.stringify(prices), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
```

### Alteracoes em AdminPrices.tsx

1. **Novo estado para loading:**
```typescript
const [isFetchingReal, setIsFetchingReal] = useState(false);
```

2. **Nova funcao para buscar precos reais:**
```typescript
const fetchRealPrices = async () => {
  setIsFetchingReal(true);
  
  try {
    const symbols = cryptos.map(c => c.symbol);
    
    const { data, error } = await supabase.functions.invoke('fetch-crypto-prices', {
      body: { symbols }
    });
    
    if (error) throw error;
    
    // Atualizar os campos editados com precos reais
    setEditedPrices(prev => {
      const updated = { ...prev };
      for (const crypto of cryptos) {
        if (data[crypto.symbol]) {
          updated[crypto.id] = {
            price: data[crypto.symbol].price.toString(),
            change: data[crypto.symbol].change.toFixed(2),
          };
        }
      }
      return updated;
    });
    
    toast({
      title: 'Sucesso',
      description: 'Preços reais carregados da CoinGecko!',
    });
  } catch (error) {
    toast({
      title: 'Erro',
      description: 'Falha ao buscar preços reais',
      variant: 'destructive',
    });
  } finally {
    setIsFetchingReal(false);
  }
};
```

3. **Novo botao no header:**
```tsx
<button 
  onClick={fetchRealPrices} 
  disabled={isFetchingReal}
  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e2a3a] text-cyan-400 font-medium transition-all hover:bg-[#2a3a4a] disabled:opacity-50"
>
  <RefreshCw className={`h-4 w-4 ${isFetchingReal ? 'animate-spin' : ''}`} />
  {isFetchingReal ? 'Buscando...' : 'Buscar Preços Reais'}
</button>
```

---

## Arquivos a Criar/Modificar

| Arquivo | Tipo |
|---------|------|
| supabase/functions/_shared/cors.ts | Criar (se nao existir) |
| supabase/functions/fetch-crypto-prices/index.ts | Criar |
| src/pages/admin/AdminPrices.tsx | Modificar |

---

## Resultado Esperado

1. Botao "Buscar Precos Reais" no cabecalho da pagina
2. Ao clicar, busca precos atualizados da CoinGecko
3. Campos de preco e variacao sao preenchidos automaticamente
4. Admin ainda pode editar manualmente antes de salvar
5. Ao salvar, dados sao persistidos no banco

---

## Limitacoes CoinGecko API Gratuita

- Rate limit: 10-50 chamadas/minuto
- Delay de alguns segundos nos dados
- Ideal para uso administrativo (nao para atualizacao em tempo real para usuarios)

