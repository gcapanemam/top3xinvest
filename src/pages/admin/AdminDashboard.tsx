import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
        <p className="text-gray-400">Visão geral da plataforma</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-400">Total de Usuários</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
              <Users className="h-5 w-5 text-teal-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
          <p className="text-xs text-gray-500 mt-1">Usuários cadastrados</p>
        </div>

        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-400">Depósitos Pendentes</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
              <ArrowDownCircle className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stats.pendingDeposits}</div>
          <p className="text-xs text-gray-500 mt-1">
            {formatCurrency(stats.pendingDepositsAmount)} aguardando
          </p>
        </div>

        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-400">Saques Pendentes</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <ArrowUpCircle className="h-5 w-5 text-red-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{stats.pendingWithdrawals}</div>
          <p className="text-xs text-gray-500 mt-1">
            {formatCurrency(stats.pendingWithdrawalsAmount)} aguardando
          </p>
        </div>

        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-400">Total Investido</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <Wallet className="h-5 w-5 text-green-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalInvested)}</div>
          <p className="text-xs text-gray-500 mt-1">Em robôs ativos</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Robôs Ativos</h2>
          <p className="text-sm text-gray-400 mb-4">{stats.activeRobots} robôs em operação</p>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20">
              <Bot className="h-8 w-8 text-teal-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{stats.activeRobots}</p>
              <p className="text-gray-400">Robôs configurados</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Ações Rápidas</h2>
          <p className="text-sm text-gray-400 mb-4">Gerencie a plataforma</p>
          <div className="space-y-2">
            <Link
              to="/admin/deposits"
              className="flex items-center gap-3 rounded-lg border border-[#1e2a3a] p-3 transition-all hover:border-teal-500/50 hover:bg-[#1e2a3a]/50"
            >
              <ArrowDownCircle className="h-5 w-5 text-teal-400" />
              <span className="text-white">Aprovar Depósitos ({stats.pendingDeposits})</span>
            </Link>
            <Link
              to="/admin/withdrawals"
              className="flex items-center gap-3 rounded-lg border border-[#1e2a3a] p-3 transition-all hover:border-teal-500/50 hover:bg-[#1e2a3a]/50"
            >
              <ArrowUpCircle className="h-5 w-5 text-teal-400" />
              <span className="text-white">Aprovar Saques ({stats.pendingWithdrawals})</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
