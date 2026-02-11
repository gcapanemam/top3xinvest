

# Plano: Exibir cotacoes em tempo real no Dashboard

## Problema
A secao "Cotacoes" no Dashboard exibe apenas os precos salvos no banco de dados, que so sao atualizados quando o admin acessa a pagina de cotacoes. O usuario quer ver os precos reais do mercado.

## Solucao

Ao carregar o Dashboard, alem de buscar os precos do banco (fallback), chamar a edge function `fetch-crypto-prices` para obter os precos atualizados do CoinGecko e exibi-los diretamente.

### Mudancas em `src/pages/Dashboard.tsx`

1. Apos buscar as criptos do banco, chamar `supabase.functions.invoke('fetch-crypto-prices')` com os simbolos das criptos
2. Se a edge function retornar dados, atualizar o estado `cryptos` com os precos reais (price e change)
3. Manter os dados do banco como fallback caso a edge function falhe

### Logica

```text
1. Buscar criptos do banco (comportamento atual) -> exibe imediatamente
2. Em paralelo, chamar fetch-crypto-prices com os simbolos
3. Se sucesso, atualizar current_price e price_change_24h de cada crypto com os dados reais
4. Se falha, manter dados do banco (silencioso, sem erro para o usuario)
```

### Detalhes tecnicos

| Mudanca | Descricao |
|---------|-----------|
| Nova funcao | `fetchRealPrices(cryptoList)` que chama a edge function e atualiza o estado |
| Chamada | Executada apos `fetchData` retornar as criptos do banco |
| Fallback | Se a edge function falhar, os precos do banco permanecem exibidos |
| Sem salvar no banco | Apenas atualiza a exibicao no Dashboard, sem persistir (isso e responsabilidade do admin) |

