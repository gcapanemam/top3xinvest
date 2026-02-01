import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  robot: {
    name: string;
  } | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cryptos, setCryptos] = useState<Cryptocurrency[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  useEffect(() => {
    if (user) {
      fetchData();
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
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {profile?.full_name || user?.user_metadata?.full_name || 'Investidor'}! 👋
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo ao seu painel de investimentos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-fade-in-up hover-lift group" style={{ animationDelay: '0ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:gradient-primary transition-all duration-300">
              <Wallet className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-text bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-primary)' }}>
              {formatCurrency(profile?.balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Disponível para investir
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up hover-lift group" style={{ animationDelay: '100ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investido</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 group-hover:gradient-accent transition-all duration-300">
              <Bot className="h-5 w-5 text-accent group-hover:text-white transition-colors" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
            <p className="text-xs text-muted-foreground">
              Em {investments.length} robôs ativos
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up hover-lift group" style={{ animationDelay: '200ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Acumulado</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 group-hover:gradient-success transition-all duration-300">
              <TrendingUp className="h-5 w-5 text-success group-hover:text-white transition-colors" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              Rendimentos dos robôs
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up hover-lift group" style={{ animationDelay: '300ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrimônio Total</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:gradient-primary transition-all duration-300">
              <Sparkles className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency((profile?.balance || 0) + totalInvested + totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo + Investimentos + Lucros
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>O que você deseja fazer hoje?</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="gradient" className="h-auto flex-col gap-2 py-4">
              <Link to="/deposits">
                <Plus className="h-5 w-5" />
                <span>Depositar</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4 hover:border-primary/50">
              <Link to="/robots">
                <Bot className="h-5 w-5" />
                <span>Ver Robôs</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4 hover:border-primary/50">
              <Link to="/investments">
                <TrendingUp className="h-5 w-5" />
                <span>Meus Investimentos</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4 hover:border-primary/50">
              <Link to="/withdrawals">
                <Wallet className="h-5 w-5" />
                <span>Sacar</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Crypto Prices */}
        <Card className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Cotações</CardTitle>
              <CardDescription>Preços das principais criptos</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cryptos.map((crypto, index) => (
                <div
                  key={crypto.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 p-3 transition-all duration-200 hover:border-primary/30 hover:shadow-md animate-fade-in-up"
                  style={{ animationDelay: `${600 + index * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-bold text-white shadow-glow">
                      {crypto.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium">{crypto.name}</p>
                      <p className="text-sm text-muted-foreground">{crypto.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCrypto(crypto.current_price)}</p>
                    <p
                      className={`flex items-center justify-end text-sm font-medium ${
                        crypto.price_change_24h >= 0 ? 'text-success' : 'text-destructive'
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
          </CardContent>
        </Card>
      </div>

      {/* Active Investments */}
      {investments.length > 0 && (
        <Card className="animate-fade-in-up" style={{ animationDelay: '700ms' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Investimentos Ativos</CardTitle>
              <CardDescription>Seus robôs em operação</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link to="/investments">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {investments.map((investment, index) => (
                <div
                  key={investment.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-md animate-fade-in-up"
                  style={{ animationDelay: `${800 + index * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-glow">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{investment.robot?.name || 'Robô'}</p>
                      <p className="text-sm text-muted-foreground">
                        Investido: {formatCurrency(investment.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success">
                      +{formatCurrency(investment.profit_accumulated)}
                    </p>
                    <p className="text-sm text-muted-foreground">Lucro acumulado</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
