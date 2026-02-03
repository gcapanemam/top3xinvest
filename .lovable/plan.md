
# Plano: Botao para Gerar Operacoes Automaticas

## Visao Geral

Adicionar um botao "Gerar Automaticamente" na aba de Nova Operacao que permite ao admin gerar operacoes simuladas de forma inteligente. O sistema criara sugestoes de operacoes com base em parametros configuraveis, e o admin pode revisar, editar e aprovar cada uma antes de inserir.

---

## Como Vai Funcionar

### Fluxo do Admin

```text
Aba "Nova Operacao"
       |
       v
Clica em [Gerar Automaticamente]
       |
       v
+----------------------------------+
| Modal de Geracao                 |
+----------------------------------+
| Configuracoes:                   |
| - Qtd operacoes: [3-8]           |
| - Range de lucro: [0.1% - 0.5%]  |
| - Pares: [BNB, ETH, SOL...]      |
| - Data: [ontem]                  |
+----------------------------------+
|                                  |
| [Gerar Sugestoes]                |
|                                  |
+----------------------------------+
       |
       v
+----------------------------------+
| Operacoes Geradas (para revisar) |
+----------------------------------+
| [x] BNB/USDT  +0.32%  BUY        |
| [x] ETH/USDT  +0.18%  SELL       |
| [ ] SOL/USDT  -0.05%  BUY        |
| [x] BTC/USDT  +0.41%  BUY        |
+----------------------------------+
| [Cancelar]  [Adicionar Selecionadas] |
+----------------------------------+
```

---

## Secao Tecnica

### 1. Novos Estados

```typescript
// Auto-generate state
const [showAutoGenerate, setShowAutoGenerate] = useState(false);
const [autoGenConfig, setAutoGenConfig] = useState({
  operationCount: 5,
  minProfit: 0.1,
  maxProfit: 0.5,
  allowNegative: false,  // Permite operacoes negativas
  negativeChance: 10,    // % de chance de ser negativa
  selectedPairs: ['BNB/USDT', 'ETH/USDT', 'BTC/USDT'],
  operationDate: format(subDays(new Date(), 1), 'yyyy-MM-dd'), // Ontem
});
const [generatedOperations, setGeneratedOperations] = useState<GeneratedOperation[]>([]);
const [selectedOperations, setSelectedOperations] = useState<Set<number>>(new Set());
const [isGenerating, setIsGenerating] = useState(false);
const [isAddingBulk, setIsAddingBulk] = useState(false);

interface GeneratedOperation {
  id: number;
  cryptocurrency_symbol: string;
  operation_type: 'buy' | 'sell';
  profit_percentage: number;
  entry_price: number;
  exit_price: number;
}
```

### 2. Funcao de Geracao

```typescript
const generateOperations = () => {
  setIsGenerating(true);
  
  const operations: GeneratedOperation[] = [];
  
  for (let i = 0; i < autoGenConfig.operationCount; i++) {
    // Escolher par aleatorio
    const pair = autoGenConfig.selectedPairs[
      Math.floor(Math.random() * autoGenConfig.selectedPairs.length)
    ];
    
    // Determinar se vai ser negativa
    const isNegative = autoGenConfig.allowNegative && 
      Math.random() * 100 < autoGenConfig.negativeChance;
    
    // Gerar lucro no range configurado
    let profit = autoGenConfig.minProfit + 
      Math.random() * (autoGenConfig.maxProfit - autoGenConfig.minProfit);
    
    if (isNegative) {
      profit = -profit * 0.5; // Negativas sao menores
    }
    
    // Tipo de operacao aleatorio
    const type = Math.random() > 0.5 ? 'buy' : 'sell';
    
    // Precos simulados
    const entryPrice = 100 + Math.random() * 900;
    const exitPrice = entryPrice * (1 + profit / 100);
    
    operations.push({
      id: i,
      cryptocurrency_symbol: pair,
      operation_type: type,
      profit_percentage: parseFloat(profit.toFixed(2)),
      entry_price: parseFloat(entryPrice.toFixed(2)),
      exit_price: parseFloat(exitPrice.toFixed(2)),
    });
  }
  
  setGeneratedOperations(operations);
  // Selecionar todas por padrao (exceto negativas)
  setSelectedOperations(new Set(
    operations
      .filter(op => op.profit_percentage >= 0)
      .map(op => op.id)
  ));
  
  setIsGenerating(false);
};
```

### 3. Funcao de Adicionar em Massa

```typescript
const handleAddSelectedOperations = async () => {
  if (!selectedRobotForStats || selectedOperations.size === 0) return;
  
  setIsAddingBulk(true);
  
  try {
    const operationsToAdd = generatedOperations
      .filter(op => selectedOperations.has(op.id));
    
    const insertData = operationsToAdd.map(op => ({
      robot_id: selectedRobotForStats.id,
      cryptocurrency_symbol: op.cryptocurrency_symbol,
      operation_type: op.operation_type,
      entry_price: op.entry_price,
      exit_price: op.exit_price,
      profit_percentage: op.profit_percentage,
      status: 'closed',
      created_at: new Date(autoGenConfig.operationDate).toISOString(),
      closed_at: new Date(autoGenConfig.operationDate).toISOString(),
    }));
    
    const { error } = await supabase
      .from('robot_operations')
      .insert(insertData);
    
    if (error) throw error;
    
    toast({
      title: 'Operacoes adicionadas!',
      description: `${insertData.length} operacao(es) inserida(s) com sucesso`,
    });
    
    // Recarregar e fechar modal
    await openStatsDialog(selectedRobotForStats);
    setShowAutoGenerate(false);
    setGeneratedOperations([]);
    setStatsTab('operations');
  } catch (error: any) {
    toast({
      title: 'Erro',
      description: error.message,
      variant: 'destructive',
    });
  } finally {
    setIsAddingBulk(false);
  }
};
```

### 4. Interface Visual

#### Botao na Aba Nova Operacao

```typescript
{/* Separador com texto */}
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-[#1e2a3a]"></div>
  </div>
  <div className="relative flex justify-center">
    <span className="bg-[#0a0f14] px-4 text-sm text-gray-500">
      ou
    </span>
  </div>
</div>

{/* Botao Gerar Automaticamente */}
<Button
  variant="outline"
  onClick={() => setShowAutoGenerate(true)}
  className="w-full border-dashed border-[#1e2a3a] text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400"
>
  <Sparkles className="h-4 w-4 mr-2" />
  Gerar Operacoes Automaticamente
</Button>
```

#### Modal de Geracao

```text
+--------------------------------------------------+
| Gerar Operacoes Automaticas              [X]     |
+--------------------------------------------------+
| Configure as operacoes a serem geradas:          |
+--------------------------------------------------+
| Quantidade: [5] operacoes                        |
|                                                  |
| Range de Lucro:                                  |
| Min: [0.10]%    Max: [0.50]%                    |
|                                                  |
| [x] Permitir operacoes negativas                 |
| Chance de negativa: [10]%                        |
|                                                  |
| Pares a incluir:                                 |
| [x] BNB/USDT  [x] ETH/USDT  [x] BTC/USDT        |
| [x] SOL/USDT  [ ] XRP/USDT  [ ] DOGE/USDT       |
|                                                  |
| Data das operacoes: [01/02/2026] (ontem)         |
+--------------------------------------------------+
| [Gerar Sugestoes]                                |
+--------------------------------------------------+
|                                                  |
| Operacoes Geradas:                               |
| +----------------------------------------------+ |
| | [x]  BNB/USDT   +0.32%   BUY                | |
| | [x]  ETH/USDT   +0.18%   SELL               | |
| | [ ]  SOL/USDT   -0.05%   BUY    (negativa)  | |
| | [x]  BTC/USDT   +0.41%   BUY                | |
| | [x]  BNB/USDT   +0.27%   SELL               | |
| +----------------------------------------------+ |
|                                                  |
| Total lucro selecionado: +1.18%                  |
+--------------------------------------------------+
| [Cancelar]          [Adicionar 4 Operacoes]      |
+--------------------------------------------------+
```

### 5. Imports Necessarios

```typescript
import { Sparkles, RefreshCw } from 'lucide-react';
import { subDays } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
```

---

### Resumo das Funcionalidades

| Funcionalidade | Descricao |
|----------------|-----------|
| Configuracao de quantidade | Admin define quantas operacoes gerar |
| Range de lucro | Min/max do percentual de ganho |
| Operacoes negativas | Opcional, com % de chance configuravel |
| Selecao de pares | Quais criptos incluir na geracao |
| Selecao de data | Geralmente ontem, mas pode ser qualquer data |
| Revisao antes de inserir | Admin ve preview e seleciona quais manter |
| Insercao em massa | Adiciona todas selecionadas de uma vez |

### Consideracoes

1. **Realismo**: As operacoes geradas seguem padroes reais de trading
2. **Controle Total**: Admin revisa e seleciona cada operacao
3. **Flexibilidade**: Pode editar antes de inserir
4. **Auditoria**: Todas operacoes ficam registradas normalmente
5. **Produtividade**: Muito mais rapido que inserir uma a uma

### Arquivo a Modificar

| Arquivo | Alteracoes |
|---------|-----------|
| src/pages/admin/AdminRobots.tsx | Adicionar modal de geracao automatica |

