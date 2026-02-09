

# Plano: Lucro Calculado a Partir dos Trades

## Resumo
Atualmente o "Lucro" de cada investimento vem do campo `profit_accumulated` do banco (que esta zerado). O objetivo e calcular o lucro real baseado nas operacoes (trades) do robo: `valor_investido x percentual_diario`, acumulando dia a dia. O card de resumo no topo mostrara o lucro total de todos os bots somados.

## Como funciona o calculo

Para cada investimento:
1. Buscar todas as operacoes (`robot_operations`) do robo associado
2. Agrupar por dia e somar o `profit_percentage` de cada dia
3. Aplicar cada percentual diario sobre o valor investido: `amount * (dailyPercent / 100)`
4. Somar todos os dias para obter o lucro acumulado em USD

Exemplo: Investiu $100, dia 1 rendeu +0.5%, dia 2 rendeu +0.3%
- Lucro dia 1: $100 * 0.005 = $0.50
- Lucro dia 2: $100 * 0.003 = $0.30
- Lucro total: $0.80

## Mudancas

### `src/pages/Investments.tsx`

1. **Ao carregar investimentos**, buscar tambem as operacoes de todos os robos vinculados aos investimentos do usuario
2. **Calcular lucro por investimento**: para cada investimento, filtrar as operacoes do seu robo, agrupar por dia, somar percentuais, multiplicar pelo valor investido
3. **Usar o lucro calculado** no lugar de `profit_accumulated` nos cards individuais e no resumo do topo
4. **Guardar em estado** um mapa `investmentId -> lucroCalculado` para renderizar

### Logica de calculo (pseudo-codigo)

```text
Para cada investimento:
  ops = operacoes do robot_id desse investimento
  agrupar ops por dia (yyyy-MM-dd)
  para cada dia:
    dailyPercent = soma de profit_percentage das ops do dia
    dailyProfit = investment.amount * (dailyPercent / 100)
  lucroTotal = soma de todos os dailyProfit
```

### Resumo no topo
- "Lucro Acumulado" passa a ser a soma dos lucros calculados de todos os investimentos (nao mais `profit_accumulated`)

### Arquivos modificados
| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Investments.tsx` | Buscar operacoes de todos os robos, calcular lucro por investimento e exibir nos cards e resumo |

