import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowDownCircle, ArrowUpCircle, Wallet, Bot, TrendingUp } from 'lucide-react';

interface Stats {
  totalUsers: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalInvested: number;
  activeRobots: number;
  pendingDepositsAmount: number;
  pendingWithdrawalsAmount: number;
}

const AdminDashboard = () => {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalInvested: 0,
    activeRobots: 0,
    pendingDepositsAmount: 0,
    pendingWithdrawalsAmount: 0,
  });

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    // Fetch users count
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Fetch pending deposits
    const { data: pendingDepositsData } = await supabase
      .from('deposits')
      .select('amount')
      .eq('status', 'pending');

    // Fetch pending withdrawals
    const { data: pendingWithdrawalsData } = await supabase
      .from('withdrawals')
      .select('amount')
      .eq('status', 'pending');

    // Fetch total invested
    const { data: investmentsData } = await supabase
      .from('investments')
      .select('amount')
      .eq('status', 'active');

    // Fetch active robots
    const { count: robotsCount } = await supabase
      .from('robots')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    setStats({
      totalUsers: usersCount || 0,
      pendingDeposits: pendingDepositsData?.length || 0,
      pendingWithdrawals: pendingWithdrawalsData?.length || 0,
      totalInvested: investmentsData?.reduce((sum, i) => sum + Number(i.amount), 0) || 0,
      activeRobots: robotsCount || 0,
      pendingDepositsAmount: pendingDepositsData?.reduce((sum, d) => sum + Number(d.amount), 0) || 0,
      pendingWithdrawalsAmount: pendingWithdrawalsData?.reduce((sum, w) => sum + Number(w.amount), 0) || 0,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
        <p className="text-muted-foreground">
          Visão geral da plataforma
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Usuários cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Depósitos Pendentes</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingDeposits}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.pendingDepositsAmount)} aguardando
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saques Pendentes</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingWithdrawals}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.pendingWithdrawalsAmount)} aguardando
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investido</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalInvested)}</div>
            <p className="text-xs text-muted-foreground">Em robôs ativos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Robôs Ativos</CardTitle>
            <CardDescription>
              {stats.activeRobots} robôs em operação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats.activeRobots}</p>
                <p className="text-muted-foreground">Robôs configurados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Gerencie a plataforma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/admin/deposits"
              className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent"
            >
              <ArrowDownCircle className="h-5 w-5 text-primary" />
              <span>Aprovar Depósitos ({stats.pendingDeposits})</span>
            </a>
            <a
              href="/admin/withdrawals"
              className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent"
            >
              <ArrowUpCircle className="h-5 w-5 text-primary" />
              <span>Aprovar Saques ({stats.pendingWithdrawals})</span>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
