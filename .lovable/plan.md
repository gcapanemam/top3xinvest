
# Plano: Extrato de Recebimentos na Pagina de Saques

## Objetivo
Adicionar abaixo da secao de saques um extrato de recebimentos agrupado por data, com filtro de periodo, mostrando: Bonus 1o nivel, Bonus 2o nivel, Bonus 3o nivel, Bonus 4o nivel, Rendimentos Robos e Total.

## Fontes de Dados

- **Bonus niveis 1-4**: Tabela `referral_commissions` filtrada por `user_id` e agrupada por `level` (1, 2, 3, 4) e por data (`created_at`)
- **Rendimentos Robos**: Tabela `robot_operations` cruzada com `investments` do usuario. O rendimento e calculado como `investment.amount * operation.profit_percentage / 100` para cada operacao fechada, agrupado por data (`closed_at`)

## Mudancas em `src/pages/Withdrawals.tsx`

### 1. Novos estados
- `startDate` e `endDate` para filtro de periodo (date picker)
- `statement` para armazenar os dados do extrato agrupados por data

### 2. Funcao `fetchStatement`
Buscar:
- `referral_commissions` do usuario no periodo, com campo `level` e `amount`
- `investments` ativos do usuario para obter os `robot_id` e `amount`
- `robot_operations` fechadas dos robos investidos no periodo, com `profit_percentage` e `closed_at`

Agrupar por data e calcular:
- Bonus nivel 1: soma de `referral_commissions` onde `level = 1`
- Bonus nivel 2: soma onde `level = 2`
- Bonus nivel 3: soma onde `level = 3`
- Bonus nivel 4: soma onde `level = 4`
- Rendimentos Robos: soma de `(investment.amount * operation.profit_percentage / 100)` por dia
- Total: soma de todos

### 3. UI do extrato
Abaixo do historico de saques, adicionar:

```text
[Extrato de Recebimentos]

Filtro: [Data inicio] [Data fim] [Filtrar]

Tabela:
| Data       | Bonus 1o Nivel | Bonus 2o Nivel | Bonus 3o Nivel | Bonus 4o Nivel | Rendimentos Robos | Total   |
|------------|----------------|----------------|----------------|----------------|-------------------|---------|
| 10/02/2026 | $10.00         | $5.00          | $3.00          | $2.00          | $25.00            | $45.00  |
| 09/02/2026 | $8.00          | $0.00          | $0.00          | $0.00          | $18.50            | $26.50  |

Rodape com totais gerais
```

- Usar date pickers para selecao de periodo
- Usar componentes Table do shadcn para a tabela
- Estilo consistente com o tema dark da pagina

### 4. Filtro padrao
- Data inicio: 30 dias atras
- Data fim: hoje

## Detalhes tecnicos

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Withdrawals.tsx` | Adicionar secao de extrato com filtro de datas, busca de comissoes e rendimentos, tabela agrupada por data com totais |

### Queries principais

```typescript
// Bonus por nivel
const { data: commissions } = await supabase
  .from('referral_commissions')
  .select('amount, level, created_at')
  .eq('user_id', effectiveUserId)
  .gte('created_at', startDate)
  .lte('created_at', endDate);

// Investimentos do usuario
const { data: investments } = await supabase
  .from('investments')
  .select('id, amount, robot_id')
  .eq('user_id', effectiveUserId)
  .eq('status', 'active');

// Operacoes dos robos
const { data: operations } = await supabase
  .from('robot_operations')
  .select('robot_id, profit_percentage, closed_at')
  .in('robot_id', robotIds)
  .eq('status', 'closed')
  .gte('closed_at', startDate)
  .lte('closed_at', endDate);
```

Tambem sera usado `effectiveUserId` para suportar impersonacao pelo admin.
