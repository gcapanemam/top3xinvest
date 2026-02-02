import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Wallet, 
  TrendingUp, 
  Bot, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
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

interface Profile {
  balance: number;
  full_name: string | null;
}

interface Cryptocurrency {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
}

interface Investment {
  id: string;
  amount: number;
  profit_accumulated: number;
  status: string;
  created_at: string;
  robot: {
    name: string;
  } | null;
}

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

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cryptos, setCryptos] = useState<Cryptocurrency[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [robotDistribution, setRobotDistribution] = useState<RobotInvestment[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchChartData();
    }
  }, [user]);

  const fetchData = async () => {
    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('balance, full_name')
      .eq('user_id', user!.id)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    // Fetch cryptocurrencies
    const { data: cryptoData } = await supabase
      .from('cryptocurrencies')
      .select('*')
      .eq('is_active', true)
      .limit(5);

    if (cryptoData) {
      setCryptos(cryptoData);
    }

    // Fetch investments
    const { data: investmentData } = await supabase
      .from('investments')
      .select('id, amount, profit_accumulated, status, robot:robots(name)')
      .eq('user_id', user!.id)
      .eq('status', 'active')
      .limit(5);

    if (investmentData) {
      setInvestments(investmentData as Investment[]);
      const invested = investmentData.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const profit = investmentData.reduce((sum, inv) => sum + Number(inv.profit_accumulated), 0);
      setTotalInvested(invested);
      setTotalProfit(profit);
    }
  };

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
      const robotName = inv.robot?.name || 'Sem Robô';
      robotMap[robotName] = (robotMap[robotName] || 0) + Number(inv.amount);
    });
    
    const robotDist = Object.entries(robotMap).map(([name, value], index) => ({
      name,
      value,
      color: robotColors[index % robotColors.length],
    }));
    
    setRobotDistribution(robotDist);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatCrypto = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: value < 1 ? 4 : 2,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Olá, {profile?.full_name || user?.user_metadata?.full_name || 'Investidor'}! 👋
        </h1>
        <p className="text-gray-400">
          Bem-vindo ao seu painel de investimentos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 transition-all hover:border-teal-500/50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-400">Saldo Disponível</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
              <Wallet className="h-5 w-5 text-teal-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-teal-400">
            {formatCurrency(profile?.balance || 0)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Disponível para investir
          </p>
        </div>

        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 transition-all hover:border-cyan-500/50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-400">Total Investido</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
              <Bot className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(totalInvested)}</div>
          <p className="text-xs text-gray-500 mt-1">
            Em {investments.length} robôs ativos
          </p>
        </div>

        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 transition-all hover:border-green-500/50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-400">Lucro Acumulado</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-green-400">{formatCurrency(totalProfit)}</div>
          <p className="text-xs text-gray-500 mt-1">
            Rendimentos dos robôs
          </p>
        </div>

        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 transition-all hover:border-yellow-500/50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-400">Patrimônio Total</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
              <Sparkles className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency((profile?.balance || 0) + totalInvested + totalProfit)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Saldo + Investimentos + Lucros
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Area Chart - Fluxo Financeiro */}
        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 lg:col-span-2 animate-fade-in-up">
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
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                  animationBegin={0}
                />
                <Area 
                  type="monotone" 
                  dataKey="retornos" 
                  name="Retornos"
                  stroke="#22c55e" 
                  fillOpacity={1}
                  fill="url(#colorRetornos)"
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                  animationBegin={200}
                />
                <Area 
                  type="monotone" 
                  dataKey="saques" 
                  name="Saques"
                  stroke="#f59e0b" 
                  fillOpacity={1}
                  fill="url(#colorSaques)"
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                  animationBegin={400}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Investimentos por Robo */}
        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <h2 className="text-lg font-semibold text-white mb-6">Investimentos por Robô</h2>
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
                      isAnimationActive={true}
                      animationDuration={1000}
                      animationEasing="ease-out"
                      animationBegin={300}
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
                    <div key={index} className="flex items-center justify-between animate-fade-in-up" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Ações Rápidas</h2>
          <p className="text-sm text-gray-400 mb-4">O que você deseja fazer hoje?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link 
              to="/deposits"
              className="flex flex-col items-center gap-2 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-teal-500/25"
            >
              <Plus className="h-5 w-5" />
              <span>Depositar</span>
            </Link>
            <Link 
              to="/robots"
              className="flex flex-col items-center gap-2 py-4 rounded-xl border border-[#1e2a3a] text-gray-300 font-medium transition-all hover:bg-[#1e2a3a] hover:text-white"
            >
              <Bot className="h-5 w-5" />
              <span>Ver Robôs</span>
            </Link>
            <Link 
              to="/investments"
              className="flex flex-col items-center gap-2 py-4 rounded-xl border border-[#1e2a3a] text-gray-300 font-medium transition-all hover:bg-[#1e2a3a] hover:text-white"
            >
              <TrendingUp className="h-5 w-5" />
              <span>Meus Investimentos</span>
            </Link>
            <Link 
              to="/withdrawals"
              className="flex flex-col items-center gap-2 py-4 rounded-xl border border-[#1e2a3a] text-gray-300 font-medium transition-all hover:bg-[#1e2a3a] hover:text-white"
            >
              <Wallet className="h-5 w-5" />
              <span>Sacar</span>
            </Link>
          </div>
        </div>

        {/* Crypto Prices */}
        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Cotações</h2>
              <p className="text-sm text-gray-400">Preços das principais criptos</p>
            </div>
          </div>
          <div className="space-y-3">
            {cryptos.map((crypto) => (
              <div
                key={crypto.id}
                className="flex items-center justify-between rounded-xl border border-[#1e2a3a] p-3 transition-all duration-200 hover:border-teal-500/30 hover:bg-[#0a0f14]/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-sm font-bold text-white">
                    {crypto.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{crypto.name}</p>
                    <p className="text-sm text-gray-400">{crypto.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-white">{formatCrypto(crypto.current_price)}</p>
                  <p
                    className={`flex items-center justify-end text-sm font-medium ${
                      crypto.price_change_24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {crypto.price_change_24h >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {Math.abs(crypto.price_change_24h).toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Investments */}
      {investments.length > 0 && (
        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Investimentos Ativos</h2>
              <p className="text-sm text-gray-400">Seus robôs em operação</p>
            </div>
            <Link 
              to="/investments"
              className="flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300"
            >
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {investments.map((investment) => (
              <div
                key={investment.id}
                className="flex items-center justify-between rounded-xl border border-[#1e2a3a] p-4 transition-all duration-200 hover:border-teal-500/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/25">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{investment.robot?.name || 'Robô'}</p>
                    <p className="text-sm text-gray-400">
                      Investido: {formatCurrency(investment.amount)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-400">
                    +{formatCurrency(investment.profit_accumulated)}
                  </p>
                  <p className="text-sm text-gray-400">Lucro acumulado</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
