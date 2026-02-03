
# Plano: Animacao para Robos Ativos e Historico de Operacoes

## Visao Geral

Adicionar uma animacao visual para investimentos ativos (indicando que o robo esta "em operacao") e um botao "Historico de Trades" que abre um dialog exibindo todas as operacoes de trading registradas pelo admin para aquele robo.

---

## Alteracao Visual

### Card de Investimento Ativo (Antes)
```text
+-----------------------------------------------------+
| [Bot Icon]  S-BOT (STARTER BOT)  [Em Lock]          |
| 0.3 - 0.3% / 30 dias                                |
+-----------------------------------------------------+
```

### Card de Investimento Ativo (Depois)
```text
+-----------------------------------------------------+
| [Bot Icon Animado + Pulso Verde]  S-BOT  [ACTIVE]   |
|           ^-- Borda brilhante animada               |
| 0.3 - 0.3% / 30 dias                                |
|                                                     |
|                   [HISTORICO DE TRADES]  <-- Botao  |
+-----------------------------------------------------+
```

### Dialog de Historico de Trades
```text
+--------------------------------------------------+
|  Historico de Trades - S-BOT                     |
|  23 operacoes realizadas                         |
+--------------------------------------------------+
|                                                  |
| +----------------------------------------------+ |
| | BUY  BTC/USDT   +0.45%   02/02/26 14:30    | |
| | Entrada: $45,230.00  Saida: $45,433.53     | |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | SELL ETH/USDT   +0.32%   01/02/26 09:15    | |
| | Entrada: $2,450.00   Saida: $2,457.84      | |
| +----------------------------------------------+ |
|                                                  |
| +----------------------------------------------+ |
| | BUY  SOL/USDT   +0.28%   31/01/26 16:45    | |
| | Entrada: $123.50     Saida: $123.85        | |
| +----------------------------------------------+ |
|                                                  |
+--------------------------------------------------+
```

---

## Secao Tecnica

### 1. Novos Keyframes de Animacao (tailwind.config.ts)

Adicionar animacao de pulso verde para indicar robo em operacao:

```typescript
keyframes: {
  // Animacoes existentes...
  
  "pulse-ring": {
    "0%": {
      transform: "scale(0.8)",
      opacity: "0.8",
    },
    "50%": {
      transform: "scale(1.2)",
      opacity: "0",
    },
    "100%": {
      transform: "scale(0.8)",
      opacity: "0",
    },
  },
  "active-glow": {
    "0%, 100%": {
      boxShadow: "0 0 15px rgba(34, 197, 94, 0.4), inset 0 0 15px rgba(34, 197, 94, 0.1)",
      borderColor: "rgba(34, 197, 94, 0.5)",
    },
    "50%": {
      boxShadow: "0 0 25px rgba(34, 197, 94, 0.6), inset 0 0 20px rgba(34, 197, 94, 0.15)",
      borderColor: "rgba(34, 197, 94, 0.8)",
    },
  },
},
animation: {
  // Animacoes existentes...
  "pulse-ring": "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  "active-glow": "active-glow 2s ease-in-out infinite",
},
```

### 2. Alteracoes no Investments.tsx

**Novos imports:**
```typescript
import { Bot, TrendingUp, Lock, Unlock, History, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
```

**Interface atualizada:**
```typescript
interface Investment {
  id: string;
  amount: number;
  profit_accumulated: number;
  status: string;
  lock_until: string;
  created_at: string;
  robot_id: string | null;  // Adicionar para buscar operacoes
  robot: {
    name: string;
    profit_percentage_min: number;
    profit_percentage_max: number;
    profit_period_days: number;
  } | null;
}

interface Operation {
  id: string;
  cryptocurrency_symbol: string;
  operation_type: string;
  entry_price: number;
  exit_price: number | null;
  profit_percentage: number | null;
  status: string;
  created_at: string;
  closed_at: string | null;
}
```

**Novos estados:**
```typescript
const [operationsDialogOpen, setOperationsDialogOpen] = useState(false);
const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
const [operations, setOperations] = useState<Operation[]>([]);
const [isLoadingOperations, setIsLoadingOperations] = useState(false);
```

**Funcao para buscar operacoes:**
```typescript
const fetchOperations = async (robotId: string) => {
  setIsLoadingOperations(true);
  const { data } = await supabase
    .from('robot_operations')
    .select('*')
    .eq('robot_id', robotId)
    .order('created_at', { ascending: false });
  
  if (data) {
    setOperations(data);
  }
  setIsLoadingOperations(false);
};

const openOperationsDialog = async (investment: Investment) => {
  setSelectedInvestment(investment);
  setOperationsDialogOpen(true);
  if (investment.robot_id) {
    await fetchOperations(investment.robot_id);
  }
};
```

**Card de investimento com animacao (para status === 'active'):**
```typescript
<div 
  key={investment.id} 
  className={cn(
    "rounded-xl bg-[#111820] border p-6 transition-all duration-300",
    investment.status === 'active' 
      ? "border-green-500/50 animate-active-glow" 
      : "border-[#1e2a3a]"
  )}
>
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div className="flex items-center gap-4">
      {/* Icone do robo com animacao */}
      <div className="relative">
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          investment.status === 'active'
            ? "bg-gradient-to-r from-green-500/30 to-emerald-500/30"
            : "bg-gradient-to-r from-teal-500/20 to-cyan-500/20"
        )}>
          <Bot className={cn(
            "h-6 w-6",
            investment.status === 'active' ? "text-green-400" : "text-teal-400"
          )} />
        </div>
        {/* Anel de pulso para ativos */}
        {investment.status === 'active' && (
          <span className="absolute inset-0 rounded-xl bg-green-500/30 animate-pulse-ring" />
        )}
      </div>
      {/* ... resto do conteudo ... */}
    </div>
    
    {/* ... grid com dados ... */}
    
    {/* Botao de Historico de Trades */}
    {investment.status === 'active' && investment.robot_id && (
      <Button
        variant="outline"
        size="sm"
        onClick={() => openOperationsDialog(investment)}
        className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:text-green-300"
      >
        <History className="h-4 w-4 mr-2" />
        Historico de Trades
      </Button>
    )}
  </div>
</div>
```

**Dialog de Historico de Operacoes:**
```typescript
<Dialog open={operationsDialogOpen} onOpenChange={setOperationsDialogOpen}>
  <DialogContent className="max-w-2xl max-h-[80vh] bg-[#111820] border-[#1e2a3a] text-white flex flex-col">
    <DialogHeader>
      <DialogTitle className="text-white flex items-center gap-2">
        <History className="h-5 w-5 text-green-400" />
        Historico de Trades - {selectedInvestment?.robot?.name}
      </DialogTitle>
      <DialogDescription className="text-gray-400">
        {operations.length} operacao(es) realizada(s)
      </DialogDescription>
    </DialogHeader>

    <div className="flex-1 overflow-y-auto space-y-3 py-4">
      {isLoadingOperations ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
        </div>
      ) : operations.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Nenhuma operacao registrada ainda
        </div>
      ) : (
        operations.map((op) => (
          <div 
            key={op.id}
            className="rounded-lg bg-[#0a0f14] border border-[#1e2a3a] p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  op.operation_type === 'buy' 
                    ? "bg-green-500/20" 
                    : "bg-red-500/20"
                )}>
                  {op.operation_type === 'buy' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-400" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded",
                      op.operation_type === 'buy' 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-red-500/20 text-red-400"
                    )}>
                      {op.operation_type.toUpperCase()}
                    </span>
                    <span className="text-white font-medium">
                      {op.cryptocurrency_symbol}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Entrada: ${op.entry_price.toLocaleString()}
                    {op.exit_price && ` → Saida: $${op.exit_price.toLocaleString()}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-bold",
                  (op.profit_percentage || 0) >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  {(op.profit_percentage || 0) >= 0 ? '+' : ''}{op.profit_percentage?.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-400">
                  {format(new Date(op.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </DialogContent>
</Dialog>
```

---

## Resumo das Alteracoes

| Arquivo | Alteracoes |
|---------|-----------|
| tailwind.config.ts | Novas animacoes pulse-ring e active-glow |
| src/pages/Investments.tsx | Card animado + botao + dialog de operacoes |

### Fluxo

```text
Usuario abre "Meus Investimentos"
        |
        v
+----------------------------------+
| Investimento ATIVO:              |
| - Borda verde pulsante           |
| - Icone com animacao de pulso    |
| - Badge "ACTIVE" verde           |
| - Botao [HISTORICO DE TRADES]    |
+----------------------------------+
        |
        v (clique no botao)
+----------------------------------+
| Dialog com lista de operacoes:   |
| - BUY BTC/USDT +0.45% 02/02/26   |
| - SELL ETH/USDT +0.32% 01/02/26  |
| - BUY SOL/USDT +0.28% 31/01/26   |
+----------------------------------+
```

### Consideracoes

1. **Animacao sutil**: O brilho verde pulsa suavemente para nao distrair o usuario
2. **Performance**: As operacoes sao carregadas apenas ao abrir o dialog
3. **Responsividade**: O botao de historico se adapta ao layout mobile
4. **Consistencia visual**: Usa as mesmas cores e estilos do sistema (verde para positivo, vermelho para negativo)
5. **Indicador visual**: O anel de pulso ao redor do icone do robo indica que o sistema esta "trabalhando"
