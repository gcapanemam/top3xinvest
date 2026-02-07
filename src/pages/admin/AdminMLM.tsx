import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import { useToast } from '@/hooks/use-toast';
import { createAuditLog } from '@/lib/auditLog';
import {
  Users,
  UserPlus,
  DollarSign,
  Layers,
  Search,
  ChevronDown,
  ChevronRight,
  Network,
  TrendingUp,
  Crown,
  Star,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface UserProfile {
  user_id: string;
  full_name: string;
  referral_code: string;
  balance: number;
}

interface CommissionSetting {
  id: string;
  level: number;
  commission_percentage: number;
}

const LEVEL_COLORS = {
  1: { color: 'amber', bgColor: 'bg-amber-500/20', textColor: 'text-amber-400', borderColor: 'border-amber-500/30' },
  2: { color: 'green', bgColor: 'bg-green-500/20', textColor: 'text-green-400', borderColor: 'border-green-500/30' },
  3: { color: 'cyan', bgColor: 'bg-cyan-500/20', textColor: 'text-cyan-400', borderColor: 'border-cyan-500/30' },
  4: { color: 'purple', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400', borderColor: 'border-purple-500/30' },
};

const getLevelBadge = (volume: number) => {
  if (volume >= 100000) return { name: 'Estrela 5', icon: Crown, color: 'text-amber-400' };
  if (volume >= 50000) return { name: 'Estrela 4', icon: Star, color: 'text-amber-400' };
  if (volume >= 25000) return { name: 'Estrela 3', icon: Star, color: 'text-cyan-400' };
  if (volume >= 10000) return { name: 'Estrela 2', icon: Star, color: 'text-green-400' };
  if (volume >= 5000) return { name: 'Estrela 1', icon: Star, color: 'text-gray-400' };
  return { name: 'Iniciante', icon: Star, color: 'text-gray-500' };
};

const getInitials = (name: string | null) => {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name: string | null) => {
  if (!name) return 'bg-gray-500';
  const colors = [
    'bg-gradient-to-br from-teal-400 to-cyan-500',
    'bg-gradient-to-br from-purple-400 to-pink-500',
    'bg-gradient-to-br from-amber-400 to-orange-500',
    'bg-gradient-to-br from-green-400 to-emerald-500',
    'bg-gradient-to-br from-blue-400 to-indigo-500',
    'bg-gradient-to-br from-rose-400 to-red-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const AdminMLM = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [openLevels, setOpenLevels] = useState<number[]>([1]);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [commissionSettings, setCommissionSettings] = useState<CommissionSetting[]>([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Fetch MLM settings
  const { data: mlmSettings = [], refetch: refetchSettings } = useQuery({
    queryKey: ['mlm-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mlm_settings')
        .select('*')
        .order('level');
      
      if (error) throw error;
      return data as CommissionSetting[];
    },
  });

  // Get dynamic level config based on settings
  const getLevelConfig = () => {
    return [1, 2, 3, 4].map((level) => {
      const setting = mlmSettings.find((s) => s.level === level);
      const percentage = setting?.commission_percentage ?? [100, 50, 25, 10][level - 1];
      return { level, percentage, ...LEVEL_COLORS[level as 1 | 2 | 3 | 4] };
    });
  };

  const LEVEL_CONFIG = getLevelConfig();

  // Fetch all users for search
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['mlm-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, referral_code, balance')
        .order('full_name');
      
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // Set first user as selected by default
  useEffect(() => {
    if (users.length > 0 && !selectedUser) {
      setSelectedUser(users[0]);
    }
  }, [users, selectedUser]);

  // Fetch network stats for selected user
  const { data: networkStats, isLoading: loadingStats } = useQuery({
    queryKey: ['network-stats', selectedUser?.user_id],
    queryFn: async () => {
      if (!selectedUser) return null;
      
      const { data, error } = await supabase.rpc('get_network_stats', {
        target_user_id: selectedUser.user_id,
      });
      
      if (error) throw error;
      return data?.[0] as NetworkStats | null;
    },
    enabled: !!selectedUser,
  });

  // Fetch network tree for selected user
  const { data: networkTree = [], isLoading: loadingTree } = useQuery({
    queryKey: ['network-tree', selectedUser?.user_id],
    queryFn: async () => {
      if (!selectedUser) return [];
      
      const { data, error } = await supabase.rpc('get_network_tree', {
        root_user_id: selectedUser.user_id,
      });
      
      if (error) throw error;
      return data as NetworkMember[];
    },
    enabled: !!selectedUser,
  });

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.referral_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMembersByLevel = (level: number) => {
    return networkTree.filter((m) => m.level === level);
  };

  const getLevelStats = (level: number) => {
    if (!networkStats) return { count: 0, volume: 0 };
    switch (level) {
      case 1:
        return { count: networkStats.level_1_count, volume: networkStats.level_1_volume };
      case 2:
        return { count: networkStats.level_2_count, volume: networkStats.level_2_volume };
      case 3:
        return { count: networkStats.level_3_count, volume: networkStats.level_3_volume };
      case 4:
        return { count: networkStats.level_4_count, volume: networkStats.level_4_volume };
      default:
        return { count: 0, volume: 0 };
    }
  };

  const toggleLevel = (level: number) => {
    setOpenLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const calculateEstimatedCommission = () => {
    if (!networkStats) return 0;
    const l1 = LEVEL_CONFIG.find(c => c.level === 1)?.percentage ?? 100;
    const l2 = LEVEL_CONFIG.find(c => c.level === 2)?.percentage ?? 50;
    const l3 = LEVEL_CONFIG.find(c => c.level === 3)?.percentage ?? 25;
    const l4 = LEVEL_CONFIG.find(c => c.level === 4)?.percentage ?? 10;
    return (
      networkStats.level_1_volume * (l1 / 10000) +
      networkStats.level_2_volume * (l2 / 10000) +
      networkStats.level_3_volume * (l3 / 10000) +
      networkStats.level_4_volume * (l4 / 10000)
    );
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    
    try {
      for (const setting of commissionSettings) {
        const { error } = await supabase
          .from('mlm_settings')
          .update({ 
            commission_percentage: setting.commission_percentage,
            updated_at: new Date().toISOString(),
          })
          .eq('level', setting.level);
        
        if (error) throw error;
      }
      
      await createAuditLog({
        action: 'mlm_settings_updated',
        entityType: 'mlm_settings',
        details: {
          levels: commissionSettings.map(s => ({
            level: s.level,
            percentage: s.commission_percentage,
          })),
        },
      });
      
      toast({ title: 'Configurações salvas com sucesso!' });
      refetchSettings();
      setShowSettingsDialog(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao salvar',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const openSettingsDialog = () => {
    setCommissionSettings([...mlmSettings]);
    setShowSettingsDialog(true);
  };

  const userBadge = selectedUser
    ? getLevelBadge(networkStats?.total_volume || 0)
    : null;

  return (
    <div className="min-h-screen bg-[#0a0f14] p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500">
            <Network className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Rede MLM</h1>
          
          <Button
            variant="outline"
            size="sm"
            onClick={openSettingsDialog}
            className="ml-auto border-[#1e2a3a] text-gray-400 hover:text-white hover:border-teal-500/50"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar Comissões
          </Button>
        </div>
        <p className="text-gray-400">
          Gerencie a rede de indicações e visualize a estrutura multinível
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-[#111820] border-[#1e2a3a]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total na Rede</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {networkStats?.total_members || 0}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                <Users className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111820] border-[#1e2a3a]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Indicados Diretos</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {networkStats?.direct_members || 0}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
                <UserPlus className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111820] border-[#1e2a3a]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Volume Total</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatCurrency(networkStats?.total_volume || 0)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                <DollarSign className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111820] border-[#1e2a3a]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Níveis Ativos</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {networkStats?.active_levels || 0}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
                <Layers className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Search */}
        <Card className="bg-[#111820] border-[#1e2a3a]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="h-5 w-5 text-teal-400" />
              Buscar Usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Nome ou código de indicação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Nenhum usuário encontrado
                </p>
              ) : (
                filteredUsers.slice(0, 20).map((user) => (
                  <button
                    key={user.user_id}
                    onClick={() => setSelectedUser(user)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl transition-all',
                      selectedUser?.user_id === user.user_id
                        ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30'
                        : 'bg-[#0a0f14] hover:bg-[#1e2a3a]'
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={cn(getAvatarColor(user.full_name), 'text-white text-sm font-medium')}>
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {user.full_name || 'Sem nome'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Código: {user.referral_code}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Network Tree */}
        <Card className="bg-[#111820] border-[#1e2a3a] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Network className="h-5 w-5 text-teal-400" />
              Árvore de Indicações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedUser ? (
              <div className="space-y-4">
                {/* Selected User Header */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className={cn(getAvatarColor(selectedUser.full_name), 'text-white text-lg font-medium')}>
                      {getInitials(selectedUser.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">
                        {selectedUser.full_name || 'Sem nome'}
                      </h3>
                      {userBadge && (
                        <Badge className={cn('flex items-center gap-1', userBadge.color === 'text-amber-400' ? 'bg-amber-500/20 text-amber-400' : userBadge.color === 'text-cyan-400' ? 'bg-cyan-500/20 text-cyan-400' : userBadge.color === 'text-green-400' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400')}>
                          <userBadge.icon className="h-3 w-3" />
                          {userBadge.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {networkStats?.total_members || 0} membros na rede •{' '}
                      {formatCurrency(networkStats?.total_volume || 0)} volume total
                    </p>
                  </div>
                </div>

                {/* Levels */}
                {loadingTree ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {LEVEL_CONFIG.map((config) => {
                      const levelStats = getLevelStats(config.level);
                      const members = getMembersByLevel(config.level);
                      const isOpen = openLevels.includes(config.level);

                      return (
                        <Collapsible
                          key={config.level}
                          open={isOpen}
                          onOpenChange={() => toggleLevel(config.level)}
                        >
                          <CollapsibleTrigger asChild>
                            <button
                              className={cn(
                                'w-full flex items-center justify-between p-4 rounded-xl transition-all',
                                config.bgColor,
                                `border ${config.borderColor}`
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', config.bgColor)}>
                                  <span className={cn('font-bold', config.textColor)}>
                                    {config.level}º
                                  </span>
                                </div>
                                <div className="text-left">
                                  <p className="text-white font-medium">
                                    Nível {config.level}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {levelStats.count} membros •{' '}
                                    {formatCurrency(levelStats.volume)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={cn('text-sm font-medium', config.textColor)}>
                                  {config.percentage}% comissão
                                </span>
                                {isOpen ? (
                                  <ChevronDown className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-2 space-y-2 pl-4">
                              {members.length === 0 ? (
                                <p className="text-gray-500 text-sm py-2">
                                  Nenhum membro neste nível
                                </p>
                              ) : (
                                <>
                                  {members.slice(0, 5).map((member) => {
                                    const memberBadge = getLevelBadge(member.total_invested);
                                    return (
                                      <div
                                        key={member.user_id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-[#0a0f14]"
                                      >
                                        <div className="flex items-center gap-3">
                                          <Avatar className="h-9 w-9">
                                            <AvatarFallback className={cn(getAvatarColor(member.full_name), 'text-white text-sm')}>
                                              {getInitials(member.full_name)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <p className="text-white text-sm font-medium">
                                              {member.full_name || 'Sem nome'}
                                            </p>
                                            <Badge variant="outline" className="text-xs bg-transparent border-gray-600 text-gray-400">
                                              {memberBadge.name}
                                            </Badge>
                                          </div>
                                        </div>
                                        <span className="text-cyan-400 font-medium">
                                          {formatCurrency(member.total_invested)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                  {members.length > 5 && (
                                    <button className="w-full text-center text-sm text-teal-400 hover:text-teal-300 py-2">
                                      Ver mais {members.length - 5} membros
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                )}

                {/* Network Summary */}
                <Card className="bg-[#0a0f14] border-[#1e2a3a] mt-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-teal-400" />
                      Resumo da Rede
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {LEVEL_CONFIG.map((config) => {
                      const levelStats = getLevelStats(config.level);
                      const maxVolume = networkStats?.total_volume || 1;
                      const progress = (levelStats.volume / maxVolume) * 100;

                      return (
                        <div key={config.level}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-400">
                              Nível {config.level} ({levelStats.count})
                            </span>
                            <span className={cn('text-sm font-medium', config.textColor)}>
                              {formatCurrency(levelStats.volume)}
                            </span>
                          </div>
                          <Progress
                            value={progress}
                            className="h-2 bg-[#1e2a3a]"
                          />
                        </div>
                      );
                    })}

                    <div className="pt-4 border-t border-[#1e2a3a]">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Comissão Estimada</span>
                        <span className="text-xl font-bold text-green-400">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(calculateEstimatedCommission())}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Network className="h-12 w-12 text-gray-600 mb-4" />
                <p className="text-gray-400">
                  Selecione um usuário para ver sua rede de indicações
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="bg-[#111820] border-[#1e2a3a] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-teal-400" />
              Configurar Comissões MLM
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Defina os percentuais de comissão para cada nível da rede
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {commissionSettings.map((setting, index) => (
              <div key={setting.level} className="flex items-center justify-between p-4 rounded-lg bg-[#0a0f14] border border-[#1e2a3a]">
                <div>
                  <Label className="text-white font-medium">
                    Nível {setting.level}
                  </Label>
                  {setting.level === 1 && (
                    <p className="text-gray-400 text-xs mt-0.5">Indicação Direta</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={setting.commission_percentage}
                    onChange={(e) => {
                      let value = parseFloat(e.target.value) || 0;
                      value = Math.min(100, Math.max(0, value));
                      const updated = [...commissionSettings];
                      updated[index] = { ...setting, commission_percentage: value };
                      setCommissionSettings(updated);
                    }}
                    className="w-20 text-center bg-[#111820] border-[#1e2a3a] text-white font-bold"
                  />
                  <span className="text-teal-400 font-bold">%</span>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSettingsDialog(false)}
              className="border-[#1e2a3a] text-gray-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
            >
              {isSavingSettings ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMLM;
