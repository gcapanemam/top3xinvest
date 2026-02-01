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
  ArrowRight
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {profile?.full_name || user?.user_metadata?.full_name || 'Investidor'}! 👋
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo ao seu painel de investimentos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(profile?.balance || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Disponível para investir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investido</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
            <p className="text-xs text-muted-foreground">
              Em {investments.length} robôs ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Acumulado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              Rendimentos dos robôs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrimônio Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
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
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>O que você deseja fazer hoje?</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button asChild className="h-auto flex-col gap-2 py-4">
              <Link to="/deposits">
                <Plus className="h-5 w-5" />
                <span>Depositar</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
              <Link to="/robots">
                <Bot className="h-5 w-5" />
                <span>Ver Robôs</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
              <Link to="/investments">
                <TrendingUp className="h-5 w-5" />
                <span>Meus Investimentos</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
              <Link to="/withdrawals">
                <Wallet className="h-5 w-5" />
                <span>Sacar</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Crypto Prices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Cotações</CardTitle>
              <CardDescription>Preços das principais criptos</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cryptos.map((crypto) => (
                <div
                  key={crypto.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {crypto.symbol}
                    </div>
                    <div>
                      <p className="font-medium">{crypto.name}</p>
                      <p className="text-sm text-muted-foreground">{crypto.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCrypto(crypto.current_price)}</p>
                    <p
                      className={`flex items-center justify-end text-sm ${
                        crypto.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Investimentos Ativos</CardTitle>
              <CardDescription>Seus robôs em operação</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/investments" className="gap-1">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {investments.map((investment) => (
                <div
                  key={investment.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{investment.robot?.name || 'Robô'}</p>
                      <p className="text-sm text-muted-foreground">
                        Investido: {formatCurrency(investment.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
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
