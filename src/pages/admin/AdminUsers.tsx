import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Search, 
  Ban, 
  CheckCircle, 
  UserCheck, 
  UserX, 
  DollarSign, 
  MoreVertical, 
  TrendingUp,
  Star,
  Wallet,
  UsersRound
} from 'lucide-react';

interface UserWithStats {
  id: string;
  user_id: string;
  full_name: string | null;
  balance: number;
  is_blocked: boolean;
  created_at: string;
  total_invested: number;
  total_earnings: number;
  network_count: number;
  level: string;
  activity_percentage: number;
}

const AdminUsers = () => {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsersWithStats();
    }
  }, [isAdmin]);

  const calculateLevel = (totalInvested: number): string => {
    if (totalInvested >= 50000) return 'Estrela 4';
    if (totalInvested >= 20000) return 'Estrela 3';
    if (totalInvested >= 10000) return 'Estrela 2';
    if (totalInvested >= 5000) return 'Estrela 1';
    return 'Iniciante';
  };

  const calculateActivityPercentage = (totalInvested: number, balance: number): number => {
    const total = totalInvested + balance;
    if (total === 0) return 0;
    return Math.min((totalInvested / (total + 1000)) * 100, 100);
  };

  const fetchUsersWithStats = async () => {
    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError || !profiles) {
      setIsLoadingData(false);
      return;
    }

    // Fetch investments for all users
    const { data: investments } = await supabase
      .from('investments')
      .select('user_id, amount, profit_accumulated, status');

    // Calculate stats per user
    const usersWithStats: UserWithStats[] = profiles.map((profile) => {
      const userInvestments = investments?.filter(inv => inv.user_id === profile.user_id) || [];
      const activeInvestments = userInvestments.filter(inv => inv.status === 'active');
      
      const totalInvested = activeInvestments.reduce((acc, inv) => acc + Number(inv.amount), 0);
      const totalEarnings = userInvestments.reduce((acc, inv) => acc + Number(inv.profit_accumulated), 0);
      
      // Simulated network count (would need referral system)
      const networkCount = Math.floor(Math.random() * 15);
      
      const level = calculateLevel(totalInvested);
      const activityPercentage = calculateActivityPercentage(totalInvested, profile.balance);

      return {
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        balance: profile.balance,
        is_blocked: profile.is_blocked,
        created_at: profile.created_at,
        total_invested: totalInvested,
        total_earnings: totalEarnings,
        network_count: networkCount,
        level,
        activity_percentage: activityPercentage,
      };
    });

    setUsers(usersWithStats);
    setIsLoadingData(false);
  };

  const toggleUserBlock = async (user: UserWithStats) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: !user.is_blocked })
      .eq('id', user.id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar usuário',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: user.is_blocked ? 'Usuário desbloqueado!' : 'Usuário bloqueado!',
      });
      fetchUsersWithStats();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarGradient = (name: string | null) => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-cyan-500 to-blue-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-violet-500 to-purple-500',
      'from-teal-500 to-cyan-500',
    ];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  const getLevelBadge = (level: string) => {
    const config: Record<string, { bg: string; text: string; stars: number }> = {
      'Iniciante': { bg: 'bg-gray-500/20', text: 'text-gray-400', stars: 0 },
      'Estrela 1': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', stars: 1 },
      'Estrela 2': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', stars: 2 },
      'Estrela 3': { bg: 'bg-orange-500/20', text: 'text-orange-400', stars: 3 },
      'Estrela 4': { bg: 'bg-amber-500/20', text: 'text-amber-400', stars: 4 },
    };
    const { bg, text, stars } = config[level] || config['Iniciante'];
    
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${bg} ${text} text-xs font-medium`}>
        {stars > 0 ? (
          <>
            {Array.from({ length: stars }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-current" />
            ))}
          </>
        ) : (
          <span>{level}</span>
        )}
      </div>
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.user_id.includes(searchQuery)
  );

  const activeUsers = users.filter((u) => !u.is_blocked).length;
  const blockedUsers = users.filter((u) => u.is_blocked).length;
  const totalInvested = users.reduce((acc, u) => acc + u.total_invested, 0);

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0f14] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f14] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Gestão de Usuários</h1>
        <p className="text-gray-500 text-sm">Gerencie usuários, carteiras e redes de indicação</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <div className="bg-[#111820] rounded-xl p-5 border border-[#1e2a3a]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10">
              <Users className="h-6 w-6 text-teal-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Usuários</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-[#111820] rounded-xl p-5 border border-[#1e2a3a]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
              <UserCheck className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ativos</p>
              <p className="text-2xl font-bold text-white">{activeUsers}</p>
            </div>
          </div>
        </div>

        {/* Blocked Users */}
        <div className="bg-[#111820] rounded-xl p-5 border border-[#1e2a3a]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
              <UserX className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Bloqueados</p>
              <p className="text-2xl font-bold text-white">{blockedUsers}</p>
            </div>
          </div>
        </div>

        {/* Total Invested */}
        <div className="bg-[#111820] rounded-xl p-5 border border-[#1e2a3a]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
              <DollarSign className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Investido</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalInvested)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#111820] rounded-xl border border-[#1e2a3a] overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1e2a3a]">
          <h2 className="text-lg font-semibold text-white">Lista de Usuários</h2>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500 focus:border-teal-500/50 focus:ring-teal-500/20"
            />
          </div>
        </div>

        {/* Table Content */}
        {isLoadingData ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-gray-600" />
            <p className="mt-4 text-gray-500">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2a3a]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nível</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carteira</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investido</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rede</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ganhos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2a3a]/50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#0a0f14]/50 transition-colors group">
                    {/* User */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarGradient(user.full_name)} flex items-center justify-center`}>
                          <span className="text-white text-sm font-semibold">
                            {getInitials(user.full_name)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.full_name || 'Sem nome'}</p>
                          <p className="text-xs text-gray-500">{user.user_id.slice(0, 20)}...</p>
                        </div>
                      </div>
                      {/* Activity Progress Bar */}
                      <div className="mt-2 h-1 w-full bg-[#1e2a3a] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-500"
                          style={{ width: `${user.activity_percentage}%` }}
                        />
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      {user.is_blocked ? (
                        <Badge className="bg-red-500/20 text-red-400 border-0 hover:bg-red-500/30">
                          Bloqueado
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500/20 text-green-400 border-0 hover:bg-green-500/30">
                          Ativo
                        </Badge>
                      )}
                    </td>

                    {/* Level */}
                    <td className="px-4 py-4">
                      {getLevelBadge(user.level)}
                    </td>

                    {/* Wallet */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-cyan-400" />
                        <div>
                          <p className="text-cyan-400 font-medium">{formatCurrency(user.balance)}</p>
                          <p className="text-xs text-gray-500">
                            Bloqueado: {formatCurrency(user.total_invested)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Invested */}
                    <td className="px-4 py-4">
                      <p className="text-white font-medium">{formatCurrency(user.total_invested)}</p>
                    </td>

                    {/* Network */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <UsersRound className="h-4 w-4 text-purple-400" />
                        <span className="text-white">{user.network_count}</span>
                      </div>
                    </td>

                    {/* Earnings */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-green-400 font-medium">{formatCurrency(user.total_earnings)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#1e2a3a]"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end" 
                          className="w-48 bg-[#111820] border-[#1e2a3a] text-white"
                        >
                          <DropdownMenuItem
                            onClick={() => toggleUserBlock(user)}
                            className={`cursor-pointer ${user.is_blocked ? 'text-green-400 focus:text-green-400' : 'text-red-400 focus:text-red-400'} focus:bg-[#1e2a3a]`}
                          >
                            {user.is_blocked ? (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Desbloquear
                              </>
                            ) : (
                              <>
                                <Ban className="mr-2 h-4 w-4" />
                                Bloquear
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-gray-300 focus:text-white focus:bg-[#1e2a3a]">
                            <Wallet className="mr-2 h-4 w-4" />
                            Editar Saldo
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-gray-300 focus:text-white focus:bg-[#1e2a3a]">
                            <UsersRound className="mr-2 h-4 w-4" />
                            Ver Rede
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
