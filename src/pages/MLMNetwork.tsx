import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  UserPlus,
  DollarSign,
  Layers,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Network,
  TrendingUp,
  Share2,
  AlertTriangle,
  Bot,
  Link,
  Star,
  Crown,
  History,
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

interface Commission {
  id: string;
  from_user_id: string;
  level: number;
  percentage: number;
  amount: number;
  created_at: string;
  from_user?: {
    full_name: string;
  };
}

const LEVEL_CONFIG = [
  { level: 1, color: 'amber', bgColor: 'bg-amber-500/20', textColor: 'text-amber-400', borderColor: 'border-amber-500/30' },
  { level: 2, color: 'green', bgColor: 'bg-green-500/20', textColor: 'text-green-400', borderColor: 'border-green-500/30' },
  { level: 3, color: 'cyan', bgColor: 'bg-cyan-500/20', textColor: 'text-cyan-400', borderColor: 'border-cyan-500/30' },
  { level: 4, color: 'purple', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400', borderColor: 'border-purple-500/30' },
];

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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatCurrencyShort = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return formatCurrency(value);
};

const MLMNetwork = () => {
  const { user, effectiveUserId } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [openLevels, setOpenLevels] = useState<number[]>([1]);

  // Fetch user profile with referral code
  const { data: profile } = useQuery({
    queryKey: ['profile', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', effectiveUserId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveUserId,
  });

  // Fetch network stats
  const { data: networkStats, isLoading: loadingStats } = useQuery({
    queryKey: ['network-stats', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return null;
      
      const { data, error } = await supabase.rpc('get_network_stats', {
        target_user_id: effectiveUserId,
      });
      
      if (error) throw error;
      return data?.[0] as NetworkStats | null;
    },
    enabled: !!effectiveUserId,
  });

  // Fetch network tree
  const { data: networkTree = [], isLoading: loadingTree } = useQuery({
    queryKey: ['network-tree', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      
      const { data, error } = await supabase.rpc('get_network_tree', {
        root_user_id: effectiveUserId,
      });
      
      if (error) throw error;
      return data as NetworkMember[];
    },
    enabled: !!effectiveUserId,
  });

  // Fetch MLM settings (commission percentages)
  const { data: mlmSettings } = useQuery({
    queryKey: ['mlm-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mlm_settings')
        .select('level, commission_percentage')
        .order('level');
      if (error) throw error;
      return data;
    },
  });

  const getCommissionPercentage = (level: number) => {
    return mlmSettings?.find(s => s.level === level)?.commission_percentage ?? 0;
  };

  // Fetch commissions history
  const { data: commissions = [] } = useQuery({
    queryKey: ['commissions', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      
      const { data, error } = await supabase
        .from('referral_commissions')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as Commission[];
    },
    enabled: !!effectiveUserId,
  });

  const referralLink = profile?.referral_code
    ? `${window.location.origin}/auth?ref=${profile.referral_code}`
    : '';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: 'Link copiado!',
        description: 'Seu link de indicação foi copiado para a área de transferência.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link.',
        variant: 'destructive',
      });
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'N3XPRIME - Convite',
          text: 'Venha investir comigo no N3XPRIME! Use meu link de indicação:',
          url: referralLink,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      copyToClipboard();
    }
  };

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

  const totalCommissions = commissions.reduce((acc, c) => acc + Number(c.amount), 0);
  const userBadge = getLevelBadge(networkStats?.total_volume || 0);

  return (
    <div className="min-h-screen bg-[#0a0f14] p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500">
            <Network className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Minha Rede</h1>
        </div>
        <p className="text-sm md:text-base text-gray-400">
          Gerencie suas indicações e acompanhe seus ganhos
        </p>
      </div>

      {/* Inactive Account Alert */}
      {profile && !profile.is_active && (
        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 mb-6">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 shrink-0">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Conta Inativa</h3>
                  <p className="text-sm text-gray-400">
                    Seu link de indicação ainda não está ativo. Para começar a indicar pessoas, invista em pelo menos um robô.
                  </p>
                </div>
              </div>
              <RouterLink
                to="/robots"
                className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-amber-500/25 shrink-0"
              >
                <Bot className="h-4 w-4" />
                Ver Robôs
              </RouterLink>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral Link Card */}
      <Card className={cn(
        "mb-6",
        profile?.is_active 
          ? "bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-teal-500/20" 
          : "bg-[#111820] border-[#1e2a3a] opacity-60"
      )}>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                profile?.is_active 
                  ? "bg-gradient-to-r from-teal-500 to-cyan-500" 
                  : "bg-gray-600"
              )}>
                <Link className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Seu Link de Indicação</h3>
                <p className="text-sm text-gray-400">
                  Código: <span className={cn(profile?.is_active ? "text-teal-400" : "text-gray-500", "font-mono")}>{profile?.referral_code || '...'}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1">
                <div className="px-3 py-2 rounded-lg bg-[#0a0f14] border border-[#1e2a3a] text-gray-400 text-xs md:text-sm truncate">
                  {referralLink || 'Carregando...'}
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                disabled={!profile?.is_active}
                className="shrink-0 border-teal-500/30 hover:bg-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-teal-400" />
                )}
              </Button>
              <Button
                onClick={shareLink}
                disabled={!profile?.is_active}
                className="shrink-0 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <Card className="bg-[#111820] border-[#1e2a3a]">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-400">Total na Rede</p>
                <p className="text-2xl md:text-3xl font-bold text-white mt-1">
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
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-400">Indicados Diretos</p>
                <p className="text-2xl md:text-3xl font-bold text-white mt-1">
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
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-400">Volume Total</p>
                <p className="text-2xl md:text-3xl font-bold text-white mt-1">
                  {formatCurrencyShort(networkStats?.total_volume || 0)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                <DollarSign className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111820] border-[#1e2a3a]">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-400">Comissões Recebidas</p>
                <p className="text-2xl md:text-3xl font-bold text-green-400 mt-1">
                  {formatCurrencyShort(totalCommissions)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        {/* Network Tree */}
        <Card className="bg-[#111820] border-[#1e2a3a] lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Network className="h-5 w-5 text-teal-400" />
                Minha Rede de Indicações
              </CardTitle>
              <Badge className={cn('flex items-center gap-1', userBadge.color === 'text-amber-400' ? 'bg-amber-500/20 text-amber-400' : userBadge.color === 'text-cyan-400' ? 'bg-cyan-500/20 text-cyan-400' : userBadge.color === 'text-green-400' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400')}>
                <userBadge.icon className="h-3 w-3" />
                {userBadge.name}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loadingTree || loadingStats ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
              </div>
            ) : networkTree.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-gray-600 mb-4" />
                <p className="text-gray-400 mb-2">
                  Você ainda não tem indicados
                </p>
                <p className="text-sm text-gray-500">
                  Compartilhe seu link de indicação para começar a construir sua rede!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {LEVEL_CONFIG.map((config) => {
                  const levelStats = getLevelStats(config.level);
                  const members = getMembersByLevel(config.level);
                  const isOpen = openLevels.includes(config.level);

                  if (levelStats.count === 0) return null;

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
                                {formatCurrencyShort(levelStats.volume)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn('text-sm font-medium', config.textColor)}>
                              {getCommissionPercentage(config.level)}% comissão
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
                                  {formatCurrencyShort(member.total_invested)}
                                </span>
                              </div>
                            );
                          })}
                          {members.length > 5 && (
                            <p className="text-center text-sm text-gray-500 py-2">
                              + {members.length - 5} membros
                            </p>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            )}

            {/* Network Summary */}
            {networkTree.length > 0 && (
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
                    if (levelStats.count === 0) return null;
                    const maxVolume = networkStats?.total_volume || 1;
                    const progress = (levelStats.volume / maxVolume) * 100;

                    return (
                      <div key={config.level}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-400">
                            Nível {config.level} ({levelStats.count})
                          </span>
                          <span className={cn('text-sm font-medium', config.textColor)}>
                            {formatCurrencyShort(levelStats.volume)}
                          </span>
                        </div>
                        <Progress
                          value={progress}
                          className="h-2 bg-[#1e2a3a]"
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Commissions History */}
        <Card className="bg-[#111820] border-[#1e2a3a]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <History className="h-5 w-5 text-teal-400" />
              Histórico de Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <DollarSign className="h-10 w-10 text-gray-600 mb-3" />
                <p className="text-gray-400 text-sm">
                  Nenhuma comissão recebida ainda
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Suas comissões aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {commissions.map((commission) => {
                  const levelConfig = LEVEL_CONFIG.find((l) => l.level === commission.level);
                  return (
                    <div
                      key={commission.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#0a0f14]"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', levelConfig?.bgColor || 'bg-gray-500/20')}>
                          <span className={cn('text-sm font-bold', levelConfig?.textColor || 'text-gray-400')}>
                            {commission.level}º
                          </span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            Nível {commission.level}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <span className="text-green-400 font-medium">
                        +{formatCurrency(commission.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MLMNetwork;
