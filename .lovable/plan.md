

# Plano: Historico de Trades Agrupado por Dia

## Resumo
Redesenhar o dialog de "Historico de Trades" na pagina de Investimentos para agrupar operacoes por dia, exibir o rendimento totalizado de cada dia, e permitir expandir/recolher os trades individuais ao clicar no dia. O layout dos trades seguira o estilo de cards coloridos conforme a referencia (verde para lucro, vermelho para prejuizo).

## O que muda

### Dialog de Historico (Investments.tsx)
O conteudo do dialog sera substituido por uma nova estrutura:

1. **Lista de dias** - Cada dia mostra a data (ex: "05/02/2026") e o rendimento total do dia alinhado a direita (ex: "+0.89%")
2. **Expansao ao clicar** - Ao clicar no dia, expande e mostra os cards de operacoes daquele dia
3. **Cards de operacao** - Cards estilizados como na referencia:
   - Fundo verde para operacoes com lucro, fundo vermelho para prejuizo
   - Simbolo da cripto (ex: "ADA/USDT") no topo
   - Percentual de lucro grande no centro
   - Tipo de operacao (BUY/SELL) como badge
   - Horario abaixo
4. **Lucro acumulado** - Mostrar o lucro acumulado desde o inicio do investimento (somando dia a dia)

### Logica de agrupamento
```
operacoes agrupadas por data (yyyy-MM-dd)
  -> para cada grupo: somar profit_percentage de todas as operacoes
  -> ordenar por data descendente
  -> ao expandir: mostrar grid de cards (2-4 colunas)
```

### Lucro acumulado
- Ordenar dias do mais antigo ao mais recente
- Calcular soma acumulada dos rendimentos diarios
- Exibir ao lado ou abaixo de cada dia

## Detalhes Tecnicos

### Arquivo a modificar
| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Investments.tsx` | Redesenhar conteudo do dialog com agrupamento por dia, cards estilizados e accordion |

### Estrutura do agrupamento
```typescript
// Agrupar operacoes por dia
const groupedByDay = operations.reduce((acc, op) => {
  const day = format(new Date(op.created_at), 'yyyy-MM-dd');
  if (!acc[day]) acc[day] = [];
  acc[day].push(op);
  return acc;
}, {} as Record<string, Operation[]>);

// Calcular total por dia
const dailySummaries = Object.entries(groupedByDay)
  .map(([date, ops]) => ({
    date,
    operations: ops,
    totalProfit: ops.reduce((sum, op) => sum + (op.profit_percentage || 0), 0),
  }))
  .sort((a, b) => b.date.localeCompare(a.date));
```

### Layout dos cards (estilo da referencia)
```typescript
// Card individual de operacao
<div className={cn(
  "rounded-xl p-4 flex flex-col items-center gap-2",
  (op.profit_percentage || 0) >= 0 
    ? "bg-green-500" 
    : "bg-red-500"
)}>
  <span className="text-xs font-bold text-white bg-black/20 px-2 py-0.5 rounded">
    {op.cryptocurrency_symbol}
  </span>
  <span className="text-2xl font-bold text-white">
    {(op.profit_percentage || 0) >= 0 ? '+' : ''}{op.profit_percentage?.toFixed(2)}%
  </span>
  <span className="text-xs font-bold text-white bg-black/20 px-3 py-1 rounded-full">
    {op.operation_type.toUpperCase()}
  </span>
  <span className="text-xs text-white/80">
    {format(new Date(op.created_at), 'HH:mm')}
  </span>
</div>
```

### Interacao expand/collapse
- Usar estado local `expandedDays: Set<string>` para controlar quais dias estao expandidos
- Ao clicar na linha do dia, toggle no set
- Mostrar chevron (seta) indicando estado aberto/fechado

### Lucro acumulado
- Calcular de forma cumulativa desde a data mais antiga
- Exibir como texto pequeno abaixo do rendimento diario, ex: "Acumulado: +2.45%"

