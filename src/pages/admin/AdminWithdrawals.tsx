import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowUpCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createAuditLog } from '@/lib/auditLog';

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  pix_key: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  profile?: { full_name: string | null; email: string | null; balance: number } | null;
}

const AdminWithdrawals = () => {
  const { isAdmin, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchWithdrawals();
    }
  }, [isAdmin]);

  const fetchWithdrawals = async () => {
    const { data } = await supabase
      .from('withdrawals')
      .select(`
        *,
        profile:profiles!withdrawals_user_id_fkey(full_name, email, balance)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setWithdrawals(data as unknown as Withdrawal[]);
    }
  };

  const processWithdrawal = async (approve: boolean) => {
    if (!selectedWithdrawal || !user) return;

    setIsProcessing(true);

    const newStatus = approve ? 'approved' : 'rejected';

    // If approving, check if user has enough balance
    if (approve) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('balance')
        .eq('user_id', selectedWithdrawal.user_id)
        .single();

      if (!profileData || profileData.balance < selectedWithdrawal.amount) {
        toast({
          title: 'Erro',
          description: 'Usuário não tem saldo suficiente',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }

      // Deduct balance
      await supabase
        .from('profiles')
        .update({
          balance: profileData.balance - selectedWithdrawal.amount,
        })
        .eq('user_id', selectedWithdrawal.user_id);

      // Create transaction record
      await supabase.from('transactions').insert({
        user_id: selectedWithdrawal.user_id,
        type: 'withdrawal',
        amount: -selectedWithdrawal.amount,
        description: 'Saque aprovado',
        reference_id: selectedWithdrawal.id,
      });
    }

    // Update withdrawal status
    const { error: withdrawalError } = await supabase
      .from('withdrawals')
      .update({
        status: newStatus,
        admin_notes: adminNotes || null,
        processed_by: user.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', selectedWithdrawal.id);

    if (withdrawalError) {
      toast({
        title: 'Erro',
        description: 'Erro ao processar saque',
        variant: 'destructive',
      });
      setIsProcessing(false);
      return;
    }

    // Create notification for user
    await supabase.from('notifications').insert({
      user_id: selectedWithdrawal.user_id,
      title: approve ? 'Saque Aprovado!' : 'Saque Recusado',
      message: approve
        ? `Seu saque de R$ ${selectedWithdrawal.amount.toFixed(2)} foi aprovado e será enviado para o PIX informado.`
        : `Seu saque de R$ ${selectedWithdrawal.amount.toFixed(2)} foi recusado. ${adminNotes || ''}`,
      type: approve ? 'info' : 'alert',
    });

    // Create audit log
    await createAuditLog({
      action: approve ? 'withdrawal_approved' : 'withdrawal_rejected',
      entityType: 'withdrawal',
      entityId: selectedWithdrawal.id,
      details: {
        user_id: selectedWithdrawal.user_id,
        amount: selectedWithdrawal.amount,
        pix_key: selectedWithdrawal.pix_key,
        admin_notes: adminNotes || null,
      },
    });

    toast({
      title: 'Sucesso',
      description: approve ? 'Saque aprovado!' : 'Saque recusado!',
    });

    setSelectedWithdrawal(null);
    setAdminNotes('');
    setIsProcessing(false);
    fetchWithdrawals();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
            <Clock className="h-3 w-3" />
            Pendente
          </span>
        );
      case 'approved':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            Aprovado
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
            <XCircle className="h-3 w-3" />
            Recusado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');
  const processedWithdrawals = withdrawals.filter((w) => w.status !== 'pending');

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
        <h1 className="text-2xl font-bold text-white">Aprovar Saques</h1>
        <p className="text-gray-400">
          {pendingWithdrawals.length} saque(s) pendente(s)
        </p>
      </div>

      {/* Pending Withdrawals */}
      {pendingWithdrawals.length > 0 && (
        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a]">
          <div className="p-6 border-b border-[#1e2a3a]">
            <h2 className="text-lg font-semibold text-white">Saques Pendentes</h2>
          </div>
          <div className="p-6 space-y-4">
            {pendingWithdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="flex items-center justify-between rounded-lg border border-[#1e2a3a] p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
                    <ArrowUpCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{withdrawal.profile?.full_name || 'Usuário'}</p>
                    {withdrawal.profile?.email && (
                      <p className="text-sm text-cyan-400">{withdrawal.profile.email}</p>
                    )}
                    <p className="text-sm text-gray-400">
                      PIX: <span className="text-cyan-400">{withdrawal.pix_key}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Saldo: {formatCurrency(withdrawal.profile?.balance || 0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xl font-bold text-white">{formatCurrency(withdrawal.amount)}</p>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium flex items-center gap-1 hover:bg-green-500/30 transition-all"
                      onClick={() => setSelectedWithdrawal(withdrawal)}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aprovar
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium flex items-center gap-1 hover:bg-red-500/30 transition-all"
                      onClick={() => {
                        setSelectedWithdrawal(withdrawal);
                        setAdminNotes('');
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                      Recusar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed Withdrawals */}
      <div className="rounded-xl bg-[#111820] border border-[#1e2a3a]">
        <div className="p-6 border-b border-[#1e2a3a]">
          <h2 className="text-lg font-semibold text-white">Histórico de Saques</h2>
        </div>
        <div className="p-6 space-y-4">
          {processedWithdrawals.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              Nenhum saque processado ainda
            </p>
          ) : (
            processedWithdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="flex items-center justify-between rounded-lg border border-[#1e2a3a] p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e2a3a]">
                    <ArrowUpCircle className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{withdrawal.profile?.full_name || 'Usuário'}</p>
                    {withdrawal.profile?.email && (
                      <p className="text-sm text-cyan-400">{withdrawal.profile.email}</p>
                    )}
                    <p className="text-sm text-gray-400">
                      {format(new Date(withdrawal.created_at), "dd/MM/yy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-white">{formatCurrency(withdrawal.amount)}</p>
                  {getStatusBadge(withdrawal.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Process Dialog */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent className="bg-[#111820] border-[#1e2a3a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Processar Saque</DialogTitle>
            <DialogDescription className="text-gray-400">
              Saque de {formatCurrency(selectedWithdrawal?.amount || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-[#0a0f14] p-3 border border-[#1e2a3a]">
              <p className="text-sm text-gray-400">Chave PIX</p>
              <p className="font-medium text-cyan-400">{selectedWithdrawal?.pix_key}</p>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-2">Observações (opcional)</p>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Adicione uma observação..."
                className="bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedWithdrawal(null)} className="border-[#1e2a3a] text-gray-300 hover:bg-[#1e2a3a] hover:text-white">
              Cancelar
            </Button>
            <button
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition-all disabled:opacity-50"
              onClick={() => processWithdrawal(false)}
              disabled={isProcessing}
            >
              Recusar
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 font-medium hover:bg-green-500/30 transition-all disabled:opacity-50"
              onClick={() => processWithdrawal(true)}
              disabled={isProcessing}
            >
              Aprovar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawals;
