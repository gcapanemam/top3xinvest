
# Plano: Gestao Avancada de Robos com Estatisticas de Trading

## Visao Geral

Implementar uma interface completa de gerenciamento de robos para o painel administrativo, incluindo:

1. **Visualizar investidores**: Ver quem investiu em cada robo com detalhes
2. **Registrar rentabilidade diaria**: Adicionar operacoes de trading dia a dia
3. **Mostrar ativos negociados**: Exibir quais criptomoedas foram operadas e os ganhos de cada operacao (como na imagem de referencia)

---

## Secao Tecnica

### Estrutura de Dados

A tabela `robot_operations` ja existe com a estrutura adequada:

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID | Identificador unico |
| robot_id | UUID | ID do robo |
| cryptocurrency_symbol | TEXT | Par negociado (ex: BNB/USDT) |
| operation_type | TEXT | "buy" ou "sell" |
| entry_price | NUMERIC | Preco de entrada |
| exit_price | NUMERIC | Preco de saida |
| profit_percentage | NUMERIC | Percentual de lucro |
| status | TEXT | "open" ou "closed" |
| created_at | TIMESTAMP | Data/hora da operacao |
| closed_at | TIMESTAMP | Data/hora de fechamento |

### Arquivos a Modificar

| Arquivo | Alteracoes |
|---------|-----------|
| src/pages/admin/AdminRobots.tsx | Adicionar dialog de estatisticas com abas |

---

### 1. Novo Dialog de Estatisticas do Robo

Adicionar um botao para abrir as estatisticas de cada robo:

```text
+------------------------------------------------+
| ESTATISTICAS DE TRADING                        |
| Bot BTC Agressivo                     [X]      |
| #ABC123   [ATIVO]                              |
+------------------------------------------------+
| DIAS: 5     TRADES: 12     PROFIT: 4.08%       |
| [calendario] [check]       [grafico]           |
+------------------------------------------------+
|                                                |
| [Investidores] [Operacoes] [Nova Operacao]     |
|                                                |
+------------------------------------------------+
| ABA INVESTIDORES:                              |
| +--------------------------------------------+ |
| | Usuario    | Valor     | Data    | Status | |
| | Maria S.   | R$ 500    | 02/02   | Ativo  | |
| | Joao P.    | R$ 1000   | 01/02   | Ativo  | |
| +--------------------------------------------+ |
|                                                |
| ABA OPERACOES:                                 |
| 02/02/2026 | 0.82%                             |
| +------------+ +------------+ +------------+   |
| | BNB/USDT   | | BNB/USDT   | | BNB/USDT   |   |
| | +0.16%     | | +0.34%     | | +0.32%     |   |
| | [SELL]     | | [BUY]      | | [BUY]      |   |
| | Detalhes   | | Detalhes   | | Detalhes   |   |
| +------------+ +------------+ +------------+   |
|                                                |
| 31/01/2026 | 0.68%                             |
| +------------+ +------------+                  |
| | BNB/USDT   | | BNB/USDT   |                  |
| | +0.26%     | | +0.42%     |                  |
| | [SELL]     | | [BUY]      |                  |
| | Detalhes   | | Detalhes   |                  |
| +------------+ +------------+                  |
+------------------------------------------------+
```

---

### 2. Aba de Nova Operacao

Formulario para admin inserir operacoes manualmente:

```text
+------------------------------------------------+
| NOVA OPERACAO                                  |
+------------------------------------------------+
| Par: [BNB/USDT v]                              |
| Tipo: (x) Buy  ( ) Sell                        |
| Preco Entrada: [___________]                   |
| Preco Saida: [___________]                     |
| % Lucro: [___________] (calculado auto)        |
| Data: [02/02/2026]                             |
+------------------------------------------------+
| [Cancelar]              [Adicionar Operacao]   |
+------------------------------------------------+
```

---

### 3. Alteracoes no AdminRobots.tsx

**Novos estados:**

```typescript
// Dialog de estatisticas
const [statsDialogOpen, setStatsDialogOpen] = useState(false);
const [selectedRobotForStats, setSelectedRobotForStats] = useState<Robot | null>(null);
const [statsTab, setStatsTab] = useState<'investors' | 'operations' | 'new'>('operations');

// Dados carregados
const [robotInvestors, setRobotInvestors] = useState<InvestorData[]>([]);
const [robotOperations, setRobotOperations] = useState<OperationData[]>([]);
const [isLoadingStats, setIsLoadingStats] = useState(false);

// Formulario nova operacao
const [newOperation, setNewOperation] = useState({
  cryptocurrency_symbol: 'BNB/USDT',
  operation_type: 'buy',
  entry_price: '',
  exit_price: '',
  profit_percentage: '',
});
```

**Novas interfaces:**

```typescript
interface InvestorData {
  id: string;
  user_id: string;
  amount: number;
  profit_accumulated: number;
  status: string;
  created_at: string;
  profile: {
    full_name: string | null;
  } | null;
}

interface OperationData {
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

**Novas funcoes:**

```typescript
// Abrir dialog de stats
const openStatsDialog = async (robot: Robot) => {
  setSelectedRobotForStats(robot);
  setStatsDialogOpen(true);
  setIsLoadingStats(true);
  
  // Buscar investidores
  const { data: investors } = await supabase
    .from('investments')
    .select('*, profile:profiles(full_name)')
    .eq('robot_id', robot.id)
    .order('created_at', { ascending: false });
  
  // Buscar operacoes
  const { data: operations } = await supabase
    .from('robot_operations')
    .select('*')
    .eq('robot_id', robot.id)
    .order('created_at', { ascending: false });
  
  setRobotInvestors(investors || []);
  setRobotOperations(operations || []);
  setIsLoadingStats(false);
};

// Adicionar nova operacao
const handleAddOperation = async () => {
  if (!selectedRobotForStats) return;
  
  const { error } = await supabase
    .from('robot_operations')
    .insert({
      robot_id: selectedRobotForStats.id,
      cryptocurrency_symbol: newOperation.cryptocurrency_symbol,
      operation_type: newOperation.operation_type,
      entry_price: parseFloat(newOperation.entry_price),
      exit_price: parseFloat(newOperation.exit_price),
      profit_percentage: parseFloat(newOperation.profit_percentage),
      status: 'closed',
      closed_at: new Date().toISOString(),
    });
  
  if (!error) {
    toast({ title: 'Operacao adicionada!' });
    // Recarregar operacoes
    openStatsDialog(selectedRobotForStats);
    setStatsTab('operations');
    setNewOperation({ ... });
  }
};

// Agrupar operacoes por data
const groupOperationsByDate = (operations: OperationData[]) => {
  return operations.reduce((groups, op) => {
    const date = format(new Date(op.created_at), 'dd/MM/yyyy');
    if (!groups[date]) {
      groups[date] = { operations: [], totalProfit: 0 };
    }
    groups[date].operations.push(op);
    groups[date].totalProfit += op.profit_percentage || 0;
    return groups;
  }, {} as Record<string, { operations: OperationData[]; totalProfit: number }>);
};
```

---

### 4. Novo Botao na Lista de Robos

Adicionar botao de estatisticas ao lado dos botoes existentes:

```typescript
<button 
  className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all"
  onClick={() => openStatsDialog(robot)}
  title="Ver Estatísticas"
>
  <BarChart3 className="h-4 w-4" />
</button>
```

---

### 5. Componentes Visuais do Dialog

**Cards de Estatisticas (topo):**

```typescript
<div className="grid grid-cols-3 gap-4 mb-6">
  <div className="bg-white rounded-xl p-4 text-center">
    <div className="flex items-center justify-between">
      <span className="text-gray-600 font-medium">DAYS:</span>
      <Calendar className="h-5 w-5 text-green-500" />
    </div>
    <p className="text-2xl font-bold text-gray-800">{totalDays}</p>
  </div>
  <div className="bg-white rounded-xl p-4 text-center">
    <div className="flex items-center justify-between">
      <span className="text-gray-600 font-medium">TRADES:</span>
      <CheckCircle className="h-5 w-5 text-green-500" />
    </div>
    <p className="text-2xl font-bold text-gray-800">{totalTrades}</p>
  </div>
  <div className="bg-white rounded-xl p-4 text-center">
    <div className="flex items-center justify-between">
      <span className="text-gray-600 font-medium">PROFIT:</span>
      <TrendingUp className="h-5 w-5 text-green-500" />
    </div>
    <p className="text-2xl font-bold text-green-500">{totalProfit}%</p>
  </div>
</div>
```

**Cards de Operacao (estilo da imagem):**

```typescript
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
  {dayOperations.map((op) => (
    <div 
      key={op.id}
      className="relative rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)'
      }}
    >
      {/* Tag do par */}
      <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-600 rounded text-xs text-white font-medium">
        {op.cryptocurrency_symbol}
      </div>
      
      {/* Percentual */}
      <div className="pt-8 pb-4 px-4 text-center">
        <p className="text-2xl font-bold text-white">
          +{op.profit_percentage?.toFixed(2)}%
        </p>
        
        {/* Tipo: BUY/SELL */}
        <span className={`inline-block mt-2 px-4 py-1 rounded-full text-sm font-bold ${
          op.operation_type === 'buy' 
            ? 'bg-black text-white' 
            : 'bg-black text-white'
        }`}>
          {op.operation_type.toUpperCase()}
        </span>
        
        {/* Link detalhes */}
        <button className="block w-full mt-2 text-white/80 text-sm underline">
          DETAILS
        </button>
      </div>
    </div>
  ))}
</div>
```

---

### 6. Aba de Investidores

Lista de todos que investiram neste robo:

```typescript
<div className="space-y-3">
  {robotInvestors.length === 0 ? (
    <p className="text-center text-gray-400 py-8">
      Nenhum investidor neste robo
    </p>
  ) : (
    robotInvestors.map((investor) => (
      <div key={investor.id} className="flex items-center justify-between p-4 rounded-lg bg-[#0a0f14] border border-[#1e2a3a]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center">
            <span className="text-white font-bold">
              {investor.profile?.full_name?.charAt(0) || '?'}
            </span>
          </div>
          <div>
            <p className="font-medium text-white">
              {investor.profile?.full_name || 'Usuario'}
            </p>
            <p className="text-xs text-gray-400">
              {format(new Date(investor.created_at), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-white">
            {formatCurrency(investor.amount)}
          </p>
          <p className="text-xs text-green-400">
            +{formatCurrency(investor.profit_accumulated)}
          </p>
        </div>
      </div>
    ))
  )}
</div>
```

---

### Resumo das Funcionalidades

| Funcionalidade | Descricao |
|----------------|-----------|
| Ver Investidores | Lista quem investiu no robo, valores e lucros |
| Historico de Operacoes | Operacoes agrupadas por data com cards visuais |
| Nova Operacao | Formulario para registrar trades manuais |
| Estatisticas | Dias ativos, total de trades, lucro acumulado |
| Cards de Trade | Visual identico a imagem com gradiente verde, BUY/SELL |

### Fluxo do Admin

```text
Pagina Admin Robos
       |
       v
Clica em [Estatisticas] de um robo
       |
       v
+----------------------------------+
| Dialog com 3 abas:               |
| - Operacoes (historico visual)   |
| - Investidores (lista completa)  |
| - Nova Operacao (formulario)     |
+----------------------------------+
       |
       v
Admin pode:
- Ver quem investiu e quanto
- Ver todas as operacoes do dia
- Adicionar novas operacoes de trading
```

### Observacoes

1. As operacoes serao exibidas para os usuarios na pagina deles tambem, mostrando transparencia nas negociacoes do robo
2. O admin pode inserir operacoes passadas para simular historico
3. Os dados sao automaticamente agrupados por data para facil visualizacao
4. O visual dos cards de operacao segue exatamente o padrao da imagem de referencia
