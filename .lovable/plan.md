

# Plano: Corrigir exibicao de lucro no Dashboard

## Problema identificado

No **Dashboard** (pagina principal do usuario), os cards individuais de investimento mostram `profit_accumulated` do banco de dados, que sempre vale `$0.00`. O calculo dinamico baseado nas operacoes so e usado no card de resumo "Lucro Acumulado" no topo, mas NAO nos cards de cada investimento na lista inferior.

A pagina de **Meus Investimentos** ja funciona corretamente porque usa `profitMap` (calculo dinamico). O Dashboard nao.

## Trecho atual com problema (Dashboard.tsx, linha 777)

```text
+{formatCurrency(investment.profit_accumulated)}   <-- sempre $0.00
```

## Correcao

### Dashboard.tsx

1. Criar um `profitMap` (mapa de lucro por investimento) igual ao que ja existe em Investments.tsx
2. Ao buscar as operacoes para calcular `totalProfit`, tambem salvar o lucro individual de cada investimento nesse mapa
3. Na renderizacao dos cards individuais (linha 777), substituir `investment.profit_accumulated` pelo valor do mapa dinamico

### Logica da mudanca

```text
ANTES:
- Busca operacoes -> calcula totalProfit (soma geral) -> exibe no card de resumo
- Cards individuais -> mostram investment.profit_accumulated (DB = 0)

DEPOIS:
- Busca operacoes -> calcula profitMap por investimento + totalProfit
- Cards individuais -> mostram profitMap[investment.id] (calculado das operacoes)
- Card de resumo -> continua mostrando totalProfit (soma do profitMap)
```

### Detalhes tecnicos

- Adicionar estado `profitMap` com `useState<Record<string, number>>({})`
- No bloco que ja calcula `totalProfit` (linhas 168-186), salvar o lucro individual em `profitMap` por `investment.id`
- Na linha 777, trocar `investment.profit_accumulated` por `profitMap[investment.id] || 0`
- Nenhuma mudanca no banco de dados necessaria

