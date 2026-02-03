import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ClipboardList,
  Search,
  ChevronDown,
  ChevronUp,
  User,
  ArrowDownCircle,
  ArrowUpCircle,
  Bot,
  Coins,
  Bell,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  KeyRound,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getActionDisplayName, getEntityTypeDisplayName, type ActionType, type EntityType } from '@/lib/auditLog';

interface AuditLog {
  id: string;
  admin_id: string;
  action: ActionType;
  entity_type: EntityType;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  admin_name?: string;
}

const ITEMS_PER_PAGE = 20;

const AdminAuditLogs = () => {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin, currentPage, actionFilter, entityFilter]);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    
    let query = supabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (actionFilter !== 'all') {
      query = query.eq('action', actionFilter);
    }

    if (entityFilter !== 'all') {
      query = query.eq('entity_type', entityFilter);
    }

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching logs:', error);
      setIsLoadingLogs(false);
      return;
    }

    if (data) {
      // Fetch admin names
      const adminIds = [...new Set(data.map(log => log.admin_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', adminIds);

      const adminNameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      const logsWithNames = data.map(log => ({
        ...log,
        admin_name: adminNameMap.get(log.admin_id) || 'Admin',
      }));

      setLogs(logsWithNames as AuditLog[]);
      setTotalCount(count || 0);
    }

    setIsLoadingLogs(false);
  };

  const toggleExpand = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const getActionIcon = (action: ActionType) => {
    const iconClass = "h-4 w-4";
    switch (action) {
      case 'user_blocked':
        return <Ban className={`${iconClass} text-red-400`} />;
      case 'user_unblocked':
        return <CheckCircle className={`${iconClass} text-green-400`} />;
      case 'user_admin_granted':
        return <Shield className={`${iconClass} text-purple-400`} />;
      case 'user_admin_revoked':
        return <Shield className={`${iconClass} text-orange-400`} />;
      case 'user_edited':
        return <Edit className={`${iconClass} text-blue-400`} />;
      case 'user_deleted':
        return <Trash2 className={`${iconClass} text-red-400`} />;
      case 'user_password_reset_sent':
        return <KeyRound className={`${iconClass} text-yellow-400`} />;
      case 'deposit_approved':
        return <CheckCircle className={`${iconClass} text-green-400`} />;
      case 'deposit_rejected':
        return <XCircle className={`${iconClass} text-red-400`} />;
      case 'withdrawal_approved':
        return <CheckCircle className={`${iconClass} text-green-400`} />;
      case 'withdrawal_rejected':
        return <XCircle className={`${iconClass} text-red-400`} />;
      case 'robot_created':
        return <Bot className={`${iconClass} text-teal-400`} />;
      case 'robot_edited':
        return <Edit className={`${iconClass} text-blue-400`} />;
      case 'robot_deleted':
        return <Trash2 className={`${iconClass} text-red-400`} />;
      case 'robot_profit_credited':
        return <TrendingUp className={`${iconClass} text-green-400`} />;
      case 'crypto_price_updated':
        return <Coins className={`${iconClass} text-yellow-400`} />;
      case 'notification_sent':
        return <Bell className={`${iconClass} text-cyan-400`} />;
      default:
        return <ClipboardList className={`${iconClass} text-gray-400`} />;
    }
  };

  const getEntityIcon = (entityType: EntityType) => {
    const iconClass = "h-4 w-4 text-gray-400";
    switch (entityType) {
      case 'user':
        return <User className={iconClass} />;
      case 'deposit':
        return <ArrowDownCircle className={iconClass} />;
      case 'withdrawal':
        return <ArrowUpCircle className={iconClass} />;
      case 'robot':
        return <Bot className={iconClass} />;
      case 'cryptocurrency':
        return <Coins className={iconClass} />;
      case 'notification':
        return <Bell className={iconClass} />;
      default:
        return <ClipboardList className={iconClass} />;
    }
  };

  const getActionBadgeColor = (action: ActionType): string => {
    if (action.includes('approved') || action.includes('granted') || action.includes('unblocked') || action === 'robot_created') {
      return 'bg-green-500/20 text-green-400';
    }
    if (action.includes('rejected') || action.includes('blocked') || action.includes('deleted') || action.includes('revoked')) {
      return 'bg-red-500/20 text-red-400';
    }
    if (action.includes('edited') || action.includes('updated')) {
      return 'bg-blue-500/20 text-blue-400';
    }
    if (action.includes('reset') || action.includes('credited')) {
      return 'bg-yellow-500/20 text-yellow-400';
    }
    return 'bg-gray-500/20 text-gray-400';
  };

  const filteredLogs = searchQuery
    ? logs.filter(log => {
        const searchLower = searchQuery.toLowerCase();
        return (
          log.admin_name?.toLowerCase().includes(searchLower) ||
          getActionDisplayName(log.action).toLowerCase().includes(searchLower) ||
          JSON.stringify(log.details).toLowerCase().includes(searchLower)
        );
      })
    : logs;

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (isLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20">
            <ClipboardList className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Logs de Auditoria</h1>
            <p className="text-gray-400">Histórico de todas as ações administrativas</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por admin, ação ou detalhes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex gap-3">
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px] bg-[#0a0f14] border-[#1e2a3a] text-white">
                <SelectValue placeholder="Todas as ações" />
              </SelectTrigger>
              <SelectContent className="bg-[#111820] border-[#1e2a3a]">
                <SelectItem value="all" className="text-white hover:bg-[#1e2a3a]">Todas as ações</SelectItem>
                <SelectItem value="user_edited" className="text-white hover:bg-[#1e2a3a]">Usuário editado</SelectItem>
                <SelectItem value="user_blocked" className="text-white hover:bg-[#1e2a3a]">Usuário bloqueado</SelectItem>
                <SelectItem value="user_unblocked" className="text-white hover:bg-[#1e2a3a]">Usuário desbloqueado</SelectItem>
                <SelectItem value="user_admin_granted" className="text-white hover:bg-[#1e2a3a]">Admin concedido</SelectItem>
                <SelectItem value="user_admin_revoked" className="text-white hover:bg-[#1e2a3a]">Admin removido</SelectItem>
                <SelectItem value="user_deleted" className="text-white hover:bg-[#1e2a3a]">Usuário excluído</SelectItem>
                <SelectItem value="deposit_approved" className="text-white hover:bg-[#1e2a3a]">Depósito aprovado</SelectItem>
                <SelectItem value="deposit_rejected" className="text-white hover:bg-[#1e2a3a]">Depósito rejeitado</SelectItem>
                <SelectItem value="withdrawal_approved" className="text-white hover:bg-[#1e2a3a]">Saque aprovado</SelectItem>
                <SelectItem value="withdrawal_rejected" className="text-white hover:bg-[#1e2a3a]">Saque rejeitado</SelectItem>
                <SelectItem value="robot_created" className="text-white hover:bg-[#1e2a3a]">Robô criado</SelectItem>
                <SelectItem value="robot_edited" className="text-white hover:bg-[#1e2a3a]">Robô editado</SelectItem>
                <SelectItem value="robot_profit_credited" className="text-white hover:bg-[#1e2a3a]">Lucro creditado</SelectItem>
                <SelectItem value="crypto_price_updated" className="text-white hover:bg-[#1e2a3a]">Cotação atualizada</SelectItem>
                <SelectItem value="notification_sent" className="text-white hover:bg-[#1e2a3a]">Notificação enviada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px] bg-[#0a0f14] border-[#1e2a3a] text-white">
                <SelectValue placeholder="Todas as entidades" />
              </SelectTrigger>
              <SelectContent className="bg-[#111820] border-[#1e2a3a]">
                <SelectItem value="all" className="text-white hover:bg-[#1e2a3a]">Todas</SelectItem>
                <SelectItem value="user" className="text-white hover:bg-[#1e2a3a]">Usuários</SelectItem>
                <SelectItem value="deposit" className="text-white hover:bg-[#1e2a3a]">Depósitos</SelectItem>
                <SelectItem value="withdrawal" className="text-white hover:bg-[#1e2a3a]">Saques</SelectItem>
                <SelectItem value="robot" className="text-white hover:bg-[#1e2a3a]">Robôs</SelectItem>
                <SelectItem value="cryptocurrency" className="text-white hover:bg-[#1e2a3a]">Criptos</SelectItem>
                <SelectItem value="notification" className="text-white hover:bg-[#1e2a3a]">Notificações</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="rounded-xl bg-[#111820] border border-[#1e2a3a]">
        <div className="p-6 border-b border-[#1e2a3a]">
          <h2 className="text-lg font-semibold text-white">
            Atividade Recente
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({totalCount} registros)
            </span>
          </h2>
        </div>

        {isLoadingLogs ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <ClipboardList className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>Nenhum log encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1e2a3a]">
            {filteredLogs.map((log) => (
              <Collapsible
                key={log.id}
                open={expandedLogs.has(log.id)}
                onOpenChange={() => toggleExpand(log.id)}
              >
                <div className="p-4 hover:bg-[#0a0f14]/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e2a3a] shrink-0">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${getActionBadgeColor(log.action)} border-0`}>
                            {getActionDisplayName(log.action)}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {getEntityIcon(log.entity_type)}
                            <span>{getEntityTypeDisplayName(log.entity_type)}</span>
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-400">
                          Por: <span className="text-white">{log.admin_name}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                          {' • '}
                          {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-gray-400 hover:text-white"
                      >
                        {expandedLogs.has(log.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent className="mt-4">
                    <div className="rounded-lg bg-[#0a0f14] border border-[#1e2a3a] p-4 ml-13">
                      <p className="text-xs text-gray-400 mb-2">Detalhes da ação:</p>
                      {log.details ? (
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Sem detalhes adicionais</p>
                      )}
                      {log.entity_id && (
                        <p className="mt-3 text-xs text-gray-500">
                          ID da entidade: <code className="text-gray-400">{log.entity_id}</code>
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[#1e2a3a]">
            <p className="text-sm text-gray-400">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-[#1e2a3a] text-gray-300 hover:bg-[#1e2a3a] hover:text-white disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-[#1e2a3a] text-gray-300 hover:bg-[#1e2a3a] hover:text-white disabled:opacity-50"
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLogs;
