import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  UsersRound,
  Shield,
  Edit,
  Trash2,
  AlertTriangle,
  Mail,
  Phone,
  KeyRound
} from 'lucide-react';
import { createAuditLog } from '@/lib/auditLog';

interface UserWithStats {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  balance: number;
  is_blocked: boolean;
  created_at: string;
  total_invested: number;
  total_earnings: number;
  network_count: number;
  level: string;
  activity_percentage: number;
  is_admin: boolean;
  email?: string;
}

interface NetworkMember {
  user_id: string;
  referrer_id: string;
  level: number;
  full_name: string;
  total_invested: number;
  referral_code: string;
}

interface NetworkStats {
  total_members: number;
  direct_members: number;
  total_volume: number;
  active_levels: number;
  level_1_count: number;
  level_1_volume: number;
  level_2_count: number;
  level_2_volume: number;
  level_3_count: number;
  level_3_volume: number;
  level_4_count: number;
  level_4_volume: number;
}

const AdminUsers = () => {
  const { isAdmin, isLoading, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Estados para dialog de editar usuário
  const [editUser, setEditUser] = useState<UserWithStats | null>(null);
  const [editData, setEditData] = useState({
    full_name: '',
    phone: '',
    balance: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Estados para dialog de ver rede
  const [viewNetworkUser, setViewNetworkUser] = useState<UserWithStats | null>(null);
  const [networkData, setNetworkData] = useState<NetworkMember[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(false);

  // Estados para confirmação de exclusão
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para ações de admin
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isTogglingAdmin, setIsTogglingAdmin] = useState(false);

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

    // Fetch admin roles
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .eq('role', 'admin');

    const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

    // Calculate stats per user
    const usersWithStats: UserWithStats[] = await Promise.all(
      profiles.map(async (profile) => {
        const userInvestments = investments?.filter(inv => inv.user_id === profile.user_id) || [];
        const activeInvestments = userInvestments.filter(inv => inv.status === 'active');
        
        const totalInvested = activeInvestments.reduce((acc, inv) => acc + Number(inv.amount), 0);
        const totalEarnings = userInvestments.reduce((acc, inv) => acc + Number(inv.profit_accumulated), 0);
        
        // Buscar contagem real da rede
        const { data: stats } = await supabase.rpc('get_network_stats', {
          target_user_id: profile.user_id,
        });
        const networkCount = stats?.[0]?.total_members || 0;
        
        const level = calculateLevel(totalInvested);
        const activityPercentage = calculateActivityPercentage(totalInvested, profile.balance);

        return {
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          phone: profile.phone,
          balance: profile.balance,
          is_blocked: profile.is_blocked,
          created_at: profile.created_at,
          total_invested: totalInvested,
          total_earnings: totalEarnings,
          network_count: networkCount,
          level,
          activity_percentage: activityPercentage,
          is_admin: adminUserIds.has(profile.user_id),
        };
      })
    );

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
      // Create audit log
      await createAuditLog({
        action: user.is_blocked ? 'user_unblocked' : 'user_blocked',
        entityType: 'user',
        entityId: user.user_id,
        details: {
          user_name: user.full_name,
          previous_status: user.is_blocked ? 'blocked' : 'active',
          new_status: user.is_blocked ? 'active' : 'blocked',
        },
      });

      toast({
        title: 'Sucesso',
        description: user.is_blocked ? 'Usuário desbloqueado!' : 'Usuário bloqueado!',
      });
      fetchUsersWithStats();
    }
  };

  const openEditDialog = async (user: UserWithStats) => {
    // Buscar email do usuário via edge function
    const { data, error } = await supabase.functions.invoke('admin-user-actions', {
      body: { action: 'get_user_email', user_id: user.user_id },
    });

    setEditUser({
      ...user,
      email: error ? undefined : data?.email,
    });
    setEditData({
      full_name: user.full_name || '',
      phone: user.phone || '',
      balance: user.balance.toString(),
    });
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;
    
    setIsUpdating(true);
    
    const balanceValue = parseFloat(editData.balance.replace(',', '.'));
    
    if (isNaN(balanceValue) || balanceValue < 0) {
      toast({
        title: 'Erro',
        description: 'Valor de saldo inválido',
        variant: 'destructive',
      });
      setIsUpdating(false);
      return;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editData.full_name || null,
        phone: editData.phone || null,
        balance: balanceValue,
      })
      .eq('id', editUser.id);
    
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o usuário',
        variant: 'destructive',
      });
    } else {
      // Create audit log
      await createAuditLog({
        action: 'user_edited',
        entityType: 'user',
        entityId: editUser.user_id,
        details: {
          user_name: editData.full_name,
          changes: {
            full_name: { from: editUser.full_name, to: editData.full_name },
            phone: { from: editUser.phone, to: editData.phone },
            balance: { from: editUser.balance, to: balanceValue },
          },
        },
      });

      toast({
        title: 'Sucesso!',
        description: 'Dados do usuário atualizados com sucesso',
      });
      fetchUsersWithStats();
      setEditUser(null);
    }
    
    setIsUpdating(false);
  };

  const handleToggleAdmin = async (user: UserWithStats) => {
    // Prevent self-demotion
    if (user.user_id === currentUser?.id) {
      toast({
        title: 'Ação não permitida',
        description: 'Você não pode alterar sua própria permissão de administrador',
        variant: 'destructive',
      });
      return;
    }

    setIsTogglingAdmin(true);

    if (user.is_admin) {
      // Remove admin role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.user_id)
        .eq('role', 'admin');

      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível remover permissão de administrador',
          variant: 'destructive',
        });
      } else {
        // Create audit log
        await createAuditLog({
          action: 'user_admin_revoked',
          entityType: 'user',
          entityId: user.user_id,
          details: {
            user_name: user.full_name,
          },
        });

        toast({
          title: 'Sucesso',
          description: `${user.full_name || 'Usuário'} não é mais administrador`,
        });
        fetchUsersWithStats();
      }
    } else {
      // Add admin role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.user_id,
          role: 'admin',
        });

      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível tornar usuário administrador',
          variant: 'destructive',
        });
      } else {
        // Create audit log
        await createAuditLog({
          action: 'user_admin_granted',
          entityType: 'user',
          entityId: user.user_id,
          details: {
            user_name: user.full_name,
          },
        });

        toast({
          title: 'Sucesso',
          description: `${user.full_name || 'Usuário'} agora é administrador`,
        });
        fetchUsersWithStats();
      }
    }

    setIsTogglingAdmin(false);
  };

  const handleSendPasswordReset = async () => {
    if (!editUser) return;

    setIsSendingReset(true);

    const { data, error } = await supabase.functions.invoke('admin-user-actions', {
      body: {
        action: 'send_password_reset',
        user_id: editUser.user_id,
        data: { redirectTo: `${window.location.origin}/reset-password` },
      },
    });

    if (error || data?.error) {
      toast({
        title: 'Erro',
        description: data?.error || 'Não foi possível enviar email de redefinição',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Email enviado!',
        description: 'O usuário receberá um link para redefinir a senha',
      });
    }

    setIsSendingReset(false);
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;

    // Prevent self-deletion
    if (deleteConfirmUser.user_id === currentUser?.id) {
      toast({
        title: 'Ação não permitida',
        description: 'Você não pode excluir sua própria conta',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);

    const { data, error } = await supabase.functions.invoke('admin-user-actions', {
      body: {
        action: 'delete_user',
        user_id: deleteConfirmUser.user_id,
      },
    });

    if (error || data?.error) {
      toast({
        title: 'Erro',
        description: data?.error || 'Não foi possível excluir o usuário',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Usuário excluído',
        description: 'O usuário foi removido permanentemente do sistema',
      });
      fetchUsersWithStats();
      setDeleteConfirmUser(null);
      setEditUser(null);
    }

    setIsDeleting(false);
  };

  const handleViewNetwork = async (user: UserWithStats) => {
    setViewNetworkUser(user);
    setIsLoadingNetwork(true);
    
    try {
      // Buscar árvore de rede
      const { data: tree, error: treeError } = await supabase.rpc('get_network_tree', {
        root_user_id: user.user_id,
      });
      
      if (treeError) throw treeError;
      setNetworkData(tree || []);
      
      // Buscar estatísticas
      const { data: stats, error: statsError } = await supabase.rpc('get_network_stats', {
        target_user_id: user.user_id,
      });
      
      if (statsError) throw statsError;
      setNetworkStats(stats?.[0] || null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a rede',
        variant: 'destructive',
      });
    }
    
    setIsLoadingNetwork(false);
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
  const adminCount = users.filter((u) => u.is_admin).length;

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0f14] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f14] p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Gestão de Usuários</h1>
        <p className="text-gray-500 text-sm">Gerencie usuários, carteiras e redes de indicação</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5">
        {/* Total Users */}
        <div className="bg-[#111820] rounded-xl p-4 md:p-5 border border-[#1e2a3a]">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-teal-500/10">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-teal-400" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-500">Total</p>
              <p className="text-xl md:text-2xl font-bold text-white">{users.length}</p>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-[#111820] rounded-xl p-4 md:p-5 border border-[#1e2a3a]">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-green-500/10">
              <UserCheck className="h-5 w-5 md:h-6 md:w-6 text-green-400" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-500">Ativos</p>
              <p className="text-xl md:text-2xl font-bold text-white">{activeUsers}</p>
            </div>
          </div>
        </div>

        {/* Blocked Users */}
        <div className="bg-[#111820] rounded-xl p-4 md:p-5 border border-[#1e2a3a]">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-red-500/10">
              <UserX className="h-5 w-5 md:h-6 md:w-6 text-red-400" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-500">Bloqueados</p>
              <p className="text-xl md:text-2xl font-bold text-white">{blockedUsers}</p>
            </div>
          </div>
        </div>

        {/* Admins */}
        <div className="bg-[#111820] rounded-xl p-4 md:p-5 border border-[#1e2a3a]">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-purple-500/10">
              <Shield className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-500">Admins</p>
              <p className="text-xl md:text-2xl font-bold text-white">{adminCount}</p>
            </div>
          </div>
        </div>

        {/* Total Invested */}
        <div className="bg-[#111820] rounded-xl p-4 md:p-5 border border-[#1e2a3a] col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-amber-500/10">
              <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-500">Total Investido</p>
              <p className="text-lg md:text-2xl font-bold text-white">{formatCurrency(totalInvested)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#111820] rounded-xl border border-[#1e2a3a] overflow-hidden">
        {/* Table Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-[#1e2a3a]">
          <h2 className="text-lg font-semibold text-white">Lista de Usuários</h2>
          <div className="relative w-full sm:w-72">
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Nível</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carteira</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Investido</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Rede</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Ganhos</th>
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
                      <div className="flex flex-col gap-1">
                        {user.is_admin && (
                          <Badge className="bg-purple-500/20 text-purple-400 border-0 w-fit">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {user.is_blocked ? (
                          <Badge className="bg-red-500/20 text-red-400 border-0 hover:bg-red-500/30">
                            Bloqueado
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500/20 text-green-400 border-0 hover:bg-green-500/30">
                            Ativo
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Level */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      {getLevelBadge(user.level)}
                    </td>

                    {/* Wallet */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-cyan-400" />
                        <div>
                          <p className="text-cyan-400 font-medium">{formatCurrency(user.balance)}</p>
                          <p className="text-xs text-gray-500 hidden sm:block">
                            Bloqueado: {formatCurrency(user.total_invested)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Invested */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <p className="text-white font-medium">{formatCurrency(user.total_invested)}</p>
                    </td>

                    {/* Network */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <UsersRound className="h-4 w-4 text-purple-400" />
                        <span className="text-white">{user.network_count}</span>
                      </div>
                    </td>

                    {/* Earnings */}
                    <td className="px-4 py-4 hidden xl:table-cell">
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
                            onClick={() => openEditDialog(user)}
                            className="cursor-pointer text-gray-300 focus:text-white focus:bg-[#1e2a3a]"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Usuário
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem
                            onClick={() => handleToggleAdmin(user)}
                            disabled={isTogglingAdmin || user.user_id === currentUser?.id}
                            className="cursor-pointer text-purple-400 focus:text-purple-400 focus:bg-[#1e2a3a]"
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            {user.is_admin ? 'Remover Admin' : 'Tornar Admin'}
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator className="bg-[#1e2a3a]" />
                          
                          <DropdownMenuItem
                            onClick={() => toggleUserBlock(user)}
                            className={`cursor-pointer ${user.is_blocked ? 'text-green-400 focus:text-green-400' : 'text-orange-400 focus:text-orange-400'} focus:bg-[#1e2a3a]`}
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
                          
                          <DropdownMenuItem 
                            onClick={() => handleViewNetwork(user)}
                            className="cursor-pointer text-gray-300 focus:text-white focus:bg-[#1e2a3a]"
                          >
                            <UsersRound className="mr-2 h-4 w-4" />
                            Ver Rede
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator className="bg-[#1e2a3a]" />
                          
                          <DropdownMenuItem
                            onClick={() => {
                              setDeleteConfirmUser(user);
                            }}
                            disabled={user.user_id === currentUser?.id}
                            className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-[#1e2a3a]"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir Usuário
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

      {/* Dialog: Editar Usuário */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="bg-[#111820] border-[#1e2a3a] max-w-[95vw] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit className="h-5 w-5 text-teal-400" />
              Editar Usuário
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Altere os dados do usuário {editUser?.full_name || 'Sem nome'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="w-full bg-[#0a0f14] border border-[#1e2a3a]">
              <TabsTrigger value="dados" className="flex-1 data-[state=active]:bg-[#1e2a3a]">Dados</TabsTrigger>
              <TabsTrigger value="permissoes" className="flex-1 data-[state=active]:bg-[#1e2a3a]">Permissões</TabsTrigger>
              <TabsTrigger value="acoes" className="flex-1 data-[state=active]:bg-[#1e2a3a]">Ações</TabsTrigger>
            </TabsList>
            
            {/* Aba Dados */}
            <TabsContent value="dados" className="space-y-4 mt-4">
              <div className="flex items-center gap-3 p-3 bg-[#0a0f14] rounded-lg">
                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarGradient(editUser?.full_name)} flex items-center justify-center`}>
                  <span className="text-white text-sm font-semibold">
                    {getInitials(editUser?.full_name)}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{editUser?.full_name || 'Sem nome'}</p>
                  <p className="text-sm text-gray-500">{editUser?.email || 'Email não disponível'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Nome completo</Label>
                  <Input
                    type="text"
                    placeholder="Nome do usuário"
                    value={editData.full_name}
                    onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                    className="bg-[#0a0f14] border-[#1e2a3a] text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-300">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="(00) 00000-0000"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="pl-10 bg-[#0a0f14] border-[#1e2a3a] text-white"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-300">Saldo da carteira</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <Input
                      type="text"
                      placeholder="0,00"
                      value={editData.balance}
                      onChange={(e) => setEditData({ ...editData, balance: e.target.value })}
                      className="pl-10 bg-[#0a0f14] border-[#1e2a3a] text-white"
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => setEditUser(null)} className="border-[#1e2a3a] text-gray-300 hover:bg-[#1e2a3a] hover:text-white">
                  Cancelar
                </Button>
                <button
                  onClick={handleUpdateUser}
                  disabled={isUpdating}
                  className="h-10 px-4 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium disabled:opacity-50"
                >
                  {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </DialogFooter>
            </TabsContent>
            
            {/* Aba Permissões */}
            <TabsContent value="permissoes" className="space-y-4 mt-4">
              <div className="p-4 bg-[#0a0f14] rounded-lg border border-[#1e2a3a]">
                <h4 className="text-white font-medium mb-3">Nível de Acesso</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1e2a3a] cursor-pointer hover:bg-[#1e2a3a]/50 transition-colors">
                    <input
                      type="radio"
                      name="role"
                      checked={!editUser?.is_admin}
                      onChange={() => {
                        if (editUser?.is_admin) {
                          handleToggleAdmin(editUser);
                        }
                      }}
                      disabled={editUser?.user_id === currentUser?.id}
                      className="w-4 h-4 text-teal-500"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">Usuário comum</p>
                      <p className="text-sm text-gray-500">Acesso básico ao sistema</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-purple-500/30 cursor-pointer hover:bg-purple-500/10 transition-colors">
                    <input
                      type="radio"
                      name="role"
                      checked={editUser?.is_admin}
                      onChange={() => {
                        if (!editUser?.is_admin && editUser) {
                          handleToggleAdmin(editUser);
                        }
                      }}
                      disabled={editUser?.user_id === currentUser?.id}
                      className="w-4 h-4 text-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">Administrador</p>
                        <Shield className="h-4 w-4 text-purple-400" />
                      </div>
                      <p className="text-sm text-gray-500">Acesso total ao sistema</p>
                    </div>
                  </label>
                </div>
                
                {editUser?.user_id === currentUser?.id && (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-sm text-amber-400">
                      Você não pode alterar sua própria permissão de administrador
                    </p>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="text-sm text-purple-300">
                  <strong>Atenção:</strong> Administradores têm acesso total ao sistema, incluindo gestão de usuários, transações e configurações.
                </p>
              </div>
            </TabsContent>
            
            {/* Aba Ações */}
            <TabsContent value="acoes" className="space-y-4 mt-4">
              {/* Status da Conta */}
              <div className="p-4 bg-[#0a0f14] rounded-lg border border-[#1e2a3a]">
                <h4 className="text-white font-medium mb-3">Status da Conta</h4>
                <button
                  onClick={() => editUser && toggleUserBlock(editUser)}
                  className={`w-full flex items-center justify-center gap-2 h-10 rounded-lg font-medium transition-colors ${
                    editUser?.is_blocked
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                  }`}
                >
                  {editUser?.is_blocked ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Desbloquear Usuário
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4" />
                      Bloquear Usuário
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  {editUser?.is_blocked
                    ? 'Este usuário está bloqueado e não pode acessar o sistema'
                    : 'Bloquear impede o usuário de acessar o sistema temporariamente'}
                </p>
              </div>
              
              {/* Segurança */}
              <div className="p-4 bg-[#0a0f14] rounded-lg border border-[#1e2a3a]">
                <h4 className="text-white font-medium mb-3">Segurança</h4>
                <button
                  onClick={handleSendPasswordReset}
                  disabled={isSendingReset}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 font-medium transition-colors disabled:opacity-50"
                >
                  <KeyRound className="h-4 w-4" />
                  {isSendingReset ? 'Enviando...' : 'Enviar Email de Redefinição de Senha'}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  O usuário receberá um email com link para criar uma nova senha
                </p>
              </div>
              
              {/* Zona de Perigo */}
              <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                <h4 className="text-red-400 font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Zona de Perigo
                </h4>
                <button
                  onClick={() => editUser && setDeleteConfirmUser(editUser)}
                  disabled={editUser?.user_id === currentUser?.id}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Usuário Permanentemente
                </button>
                <p className="text-xs text-red-400/70 mt-2">
                  Esta ação não pode ser desfeita. Todos os dados serão excluídos.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Exclusão */}
      <Dialog open={!!deleteConfirmUser} onOpenChange={() => setDeleteConfirmUser(null)}>
        <DialogContent className="bg-[#111820] border-red-500/30 max-w-[95vw] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Excluir Usuário
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Tem certeza que deseja excluir permanentemente o usuário{' '}
              <strong className="text-white">{deleteConfirmUser?.full_name || 'Sem nome'}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 my-4">
            <p className="text-sm text-red-400 font-medium">
              Todos os dados serão excluídos:
            </p>
            <ul className="text-sm text-gray-400 list-disc ml-4 mt-2 space-y-1">
              <li>Perfil e informações pessoais</li>
              <li>Investimentos ativos</li>
              <li>Histórico de transações</li>
              <li>Rede de indicações</li>
            </ul>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmUser(null)}
              className="border-[#1e2a3a] text-gray-300 hover:bg-[#1e2a3a] hover:text-white"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir Permanentemente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ver Rede */}
      <Dialog open={!!viewNetworkUser} onOpenChange={() => { setViewNetworkUser(null); setNetworkData([]); setNetworkStats(null); }}>
        <DialogContent className="bg-[#111820] border-[#1e2a3a] max-w-[95vw] md:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-purple-400" />
              Rede de {viewNetworkUser?.full_name || 'Usuário'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Visualize a árvore de indicações deste usuário
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingNetwork ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
            </div>
          ) : networkData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-600" />
              <p className="mt-4 text-gray-500">Este usuário não possui indicados</p>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0a0f14] p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Total na Rede</p>
                  <p className="text-xl font-bold text-white">{networkStats?.total_members || 0}</p>
                </div>
                <div className="bg-[#0a0f14] p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Diretos</p>
                  <p className="text-xl font-bold text-white">{networkStats?.direct_members || 0}</p>
                </div>
                <div className="bg-[#0a0f14] p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Volume Total</p>
                  <p className="text-xl font-bold text-cyan-400">{formatCurrency(networkStats?.total_volume || 0)}</p>
                </div>
                <div className="bg-[#0a0f14] p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Níveis Ativos</p>
                  <p className="text-xl font-bold text-white">{networkStats?.active_levels || 0}</p>
                </div>
              </div>
              
              {/* Network Tree by Level */}
              {[1, 2, 3, 4].map((level) => {
                const levelMembers = networkData.filter(m => m.level === level);
                if (levelMembers.length === 0) return null;
                
                const levelColors = {
                  1: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
                  2: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
                  3: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
                  4: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
                };
                
                const colors = levelColors[level as keyof typeof levelColors];
                
                return (
                  <div key={level}>
                    <div className={`flex items-center justify-between p-3 rounded-t-lg ${colors.bg} ${colors.border} border`}>
                      <span className={`font-medium ${colors.text}`}>Nível {level}</span>
                      <span className="text-sm text-gray-400">{levelMembers.length} membros</span>
                    </div>
                    <div className="border-x border-b border-[#1e2a3a] rounded-b-lg divide-y divide-[#1e2a3a]/50">
                      {levelMembers.slice(0, 5).map((member) => (
                        <div key={member.user_id} className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${getAvatarGradient(member.full_name)} flex items-center justify-center`}>
                              <span className="text-white text-xs font-semibold">{getInitials(member.full_name)}</span>
                            </div>
                            <span className="text-white text-sm">{member.full_name || 'Sem nome'}</span>
                          </div>
                          <span className="text-cyan-400 text-sm">{formatCurrency(member.total_invested)}</span>
                        </div>
                      ))}
                      {levelMembers.length > 5 && (
                        <p className="text-center text-sm text-gray-500 py-2">+ {levelMembers.length - 5} membros</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
