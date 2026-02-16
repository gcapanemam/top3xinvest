
# Correcao Critica: Filtrar Operacoes por Data de Ativacao do Investimento

## O Problema
Quando um usuario ativa um robo (ex: dia 15/02), o sistema calcula o lucro usando TODAS as operacoes do robo, incluindo operacoes anteriores a data de ativacao. Isso gera lucros indevidos para o cliente.

**Regra correta**: Somente operacoes com data posterior (ou igual) ao `created_at` do investimento devem ser consideradas no calculo de lucro daquele investimento.

## Arquivos Afetados (4 locais com o mesmo bug)

### 1. `src/pages/Investments.tsx` - Calculo de lucro nos cards
- **Linha 109**: `allOps.filter(op => op.robot_id === inv.robot_id)` nao filtra por data
- **Correcao**: Adicionar filtro `op.created_at >= inv.created_at`
- **Linha 128** (fetchOperations para dialog): Tambem nao filtra por data do investimento
- **Correcao**: Passar `created_at` do investimento e filtrar com `.gte('created_at', investmentCreatedAt)`

### 2. `src/pages/Dashboard.tsx` - Lucro acumulado (linha 183)
- **Linha 183**: `allOps.filter(op => op.robot_id === inv.robot_id)` sem filtro de data
- **Correcao**: Adicionar filtro `op.created_at >= inv.created_at`

### 3. `src/pages/Dashboard.tsx` - Grafico de fluxo anual (linha 270)
- **Linha 270**: `allChartOps.filter(op => op.robot_id === invAny.robot_id)` sem filtro de data
- **Correcao**: Adicionar filtro `new Date(op.created_at) >= invDate`

### 4. `src/pages/Receivables.tsx` - Extrato de recebimentos (linha 82-86)
- O agrupamento por robo nao considera a data de criacao do investimento
- **Correcao**: Filtrar operacoes para cada investimento considerando apenas as posteriores ao `created_at` do investimento

## Logica da Correcao

Em todos os locais onde se faz:
```typescript
// ERRADO - pega TODAS as operacoes do robo
const ops = allOps.filter(op => op.robot_id === inv.robot_id);
```

Sera corrigido para:
```typescript
// CORRETO - pega apenas operacoes posteriores a ativacao
const ops = allOps.filter(op => 
  op.robot_id === inv.robot_id && 
  new Date(op.created_at) >= new Date(inv.created_at)
);
```

## Impacto
- Corrige o calculo de lucro em todos os cards de investimento
- Corrige o lucro acumulado total no dashboard
- Corrige os graficos de fluxo anual
- Corrige o extrato de recebimentos
- O historico de trades do dialog tambem passara a mostrar apenas operacoes relevantes para aquele investimento
