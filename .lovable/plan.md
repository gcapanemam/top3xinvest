

# Plano: Implementar Graficos no Dashboard

## Visao Geral

Adicionar dois graficos visuais ao dashboard do usuario, conforme a imagem de referencia:

1. **Fluxo Financeiro Anual**: Grafico de area mostrando Investido, Retornos e Saques ao longo dos meses
2. **Investimentos por Robo**: Grafico de rosca (donut) mostrando a distribuicao de investimentos por robo

## Layout Esperado

Os graficos serao adicionados em uma nova secao logo apos os cards de estatisticas:
- Layout em grid com 2 colunas em telas grandes
- Grafico de linha/area ocupando mais espaco (2/3)
- Grafico de rosca ocupando menos espaco (1/3)

## Fonte de Dados

### Fluxo Financeiro Anual
- **Investido**: Soma de `investments.amount` agrupado por mes
- **Retornos**: Soma de `investments.profit_accumulated` agrupado por mes
- **Saques**: Soma de `withdrawals.amount` (status approved) agrupado por mes

### Investimentos por Robo
- Agrupamento de `investments` por `robot_id`
- Nome do robo vindo da tabela `robots`
- Valor total investido em cada robo

---

## Secao Tecnica

### Arquivo a Modificar

| Arquivo | Acao |
|---------|------|
| src/pages/Dashboard.tsx | Adicionar graficos com recharts |

### 1. Novos Imports

```typescript
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
```

### 2. Novas Interfaces

```typescript
interface MonthlyData {
  month: string;
  investido: number;
  retornos: number;
  saques: number;
}

interface RobotInvestment {
  name: string;
  value: number;
  color: string;
}
```

### 3. Novos Estados

```typescript
const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
const [robotDistribution, setRobotDistribution] = useState<RobotInvestment[]>([]);
```

### 4. Funcao para Buscar Dados dos Graficos

```typescript
const fetchChartData = async () => {
  // Gerar dados para os ultimos 12 meses
  const months = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = date.toLocaleDateString('pt-BR', { month: 'short' });
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();
    
    months.push({ label: monthStr, start: monthStart, end: monthEnd });
  }
  
  // Buscar investimentos do usuario
  const { data: investmentsData } = await supabase
    .from('investments')
    .select('amount, profit_accumulated, created_at, robot:robots(name)')
    .eq('user_id', user!.id);
  
  // Buscar saques aprovados do usuario
  const { data: withdrawalsData } = await supabase
    .from('withdrawals')
    .select('amount, created_at')
    .eq('user_id', user!.id)
    .eq('status', 'approved');
  
  // Processar dados mensais
  const monthly: MonthlyData[] = months.map(m => ({
    month: m.label.charAt(0).toUpperCase() + m.label.slice(1).replace('.', ''),
    investido: 0,
    retornos: 0,
    saques: 0,
  }));
  
  investmentsData?.forEach(inv => {
    const invDate = new Date(inv.created_at);
    const monthIndex = months.findIndex(m => {
      const start = new Date(m.start);
      const end = new Date(m.end);
      return invDate >= start && invDate <= end;
    });
    if (monthIndex >= 0) {
      monthly[monthIndex].investido += Number(inv.amount);
      monthly[monthIndex].retornos += Number(inv.profit_accumulated);
    }
  });
  
  withdrawalsData?.forEach(w => {
    const wDate = new Date(w.created_at);
    const monthIndex = months.findIndex(m => {
      const start = new Date(m.start);
      const end = new Date(m.end);
      return wDate >= start && wDate <= end;
    });
    if (monthIndex >= 0) {
      monthly[monthIndex].saques += Number(w.amount);
    }
  });
  
  // Calcular valores acumulados
  let accInv = 0, accRet = 0, accSaq = 0;
  monthly.forEach(m => {
    accInv += m.investido;
    accRet += m.retornos;
    accSaq += m.saques;
    m.investido = accInv;
    m.retornos = accRet;
    m.saques = accSaq;
  });
  
  setMonthlyData(monthly);
  
  // Processar distribuicao por robo
  const robotColors = ['#14b8a6', '#22c55e', '#f59e0b', '#a855f7', '#3b82f6', '#ef4444'];
  const robotMap: Record<string, number> = {};
  
  investmentsData?.forEach(inv => {
    const robotName = inv.robot?.name || 'Sem Robo';
    robotMap[robotName] = (robotMap[robotName] || 0) + Number(inv.amount);
  });
  
  const robotDist = Object.entries(robotMap).map(([name, value], index) => ({
    name,
    value,
    color: robotColors[index % robotColors.length],
  }));
  
  setRobotDistribution(robotDist);
};
```

### 5. Chamar fetchChartData no useEffect

```typescript
useEffect(() => {
  if (user) {
    fetchData();
    fetchChartData();
  }
}, [user]);
```

### 6. Componente Grafico de Area (Fluxo Financeiro)

```tsx
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 lg:col-span-2">
  <h2 className="text-lg font-semibold text-white mb-6">Fluxo Financeiro Anual</h2>
  <div className="h-80">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={monthlyData}>
        <defs>
          <linearGradient id="colorInvestido" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorRetornos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorSaques" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
        <XAxis 
          dataKey="month" 
          stroke="#6b7280" 
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={{ stroke: '#1e2a3a' }}
        />
        <YAxis 
          stroke="#6b7280" 
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={{ stroke: '#1e2a3a' }}
          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#111820', 
            border: '1px solid #1e2a3a',
            borderRadius: '8px',
            color: '#fff'
          }}
          formatter={(value: number) => formatCurrency(value)}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value) => <span className="text-gray-400">{value}</span>}
        />
        <Area 
          type="monotone" 
          dataKey="investido" 
          name="Investido"
          stroke="#14b8a6" 
          fillOpacity={1}
          fill="url(#colorInvestido)" 
        />
        <Area 
          type="monotone" 
          dataKey="retornos" 
          name="Retornos"
          stroke="#22c55e" 
          fillOpacity={1}
          fill="url(#colorRetornos)" 
        />
        <Area 
          type="monotone" 
          dataKey="saques" 
          name="Saques"
          stroke="#f59e0b" 
          fillOpacity={1}
          fill="url(#colorSaques)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
</div>
```

### 7. Componente Grafico de Rosca (Investimentos por Robo)

```tsx
<div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6">
  <h2 className="text-lg font-semibold text-white mb-6">Investimentos por Robo</h2>
  {robotDistribution.length > 0 ? (
    <>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={robotDistribution}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {robotDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#111820',
                border: '1px solid #1e2a3a',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3 mt-4">
        {robotDistribution.map((robot, index) => {
          const total = robotDistribution.reduce((sum, r) => sum + r.value, 0);
          const percentage = total > 0 ? ((robot.value / total) * 100).toFixed(0) : 0;
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: robot.color }}
                />
                <span className="text-gray-400">{robot.name}</span>
              </div>
              <div className="text-right">
                <span className="text-white font-medium">{formatCurrency(robot.value)}</span>
                <span className="text-gray-500 text-sm ml-2">({percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  ) : (
    <div className="flex flex-col items-center justify-center h-52 text-gray-500">
      <Bot className="h-12 w-12 mb-2 opacity-50" />
      <p>Nenhum investimento ainda</p>
    </div>
  )}
</div>
```

### 8. Estrutura do Grid Atualizado

```tsx
{/* Charts Section - Nova secao apos os Stats Cards */}
<div className="grid gap-6 lg:grid-cols-3">
  {/* Area Chart - 2 columns */}
  <div className="lg:col-span-2">
    {/* Grafico Fluxo Financeiro */}
  </div>
  
  {/* Pie Chart - 1 column */}
  <div>
    {/* Grafico Investimentos por Robo */}
  </div>
</div>
```

### Cores Utilizadas

| Elemento | Cor |
|----------|-----|
| Investido | #14b8a6 (teal-500) |
| Retornos | #22c55e (green-500) |
| Saques | #f59e0b (amber-500) |
| Robos | Palette ciclica |

### Responsividade

- Em telas grandes (lg+): Grid 3 colunas com area chart ocupando 2
- Em telas menores: Stack vertical com cada grafico em linha separada

### Formatacao de Valores

- Eixo Y: Valores abreviados (ex: "R$ 1,5k", "R$ 2,3mi")
- Tooltip: Valores completos formatados em BRL
- Legenda do donut: Nome do robo + valor + percentual

