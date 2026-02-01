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
import { ArrowDownCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  admin_notes: string | null;
  created_at: string;
  profile?: { full_name: string | null } | null;
}

const AdminDeposits = () => {
  const { isAdmin, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchDeposits();
    }
  }, [isAdmin]);

  const fetchDeposits = async () => {
    const { data } = await supabase
      .from('deposits')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setDeposits(data as unknown as Deposit[]);
    }
  };

  const processDeposit = async (approve: boolean) => {
    if (!selectedDeposit || !user) return;

    setIsProcessing(true);

    const newStatus = approve ? 'approved' : 'rejected';

    // Update deposit status
    const { error: depositError } = await supabase
      .from('deposits')
      .update({
        status: newStatus,
        admin_notes: adminNotes || null,
        processed_by: user.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', selectedDeposit.id);

    if (depositError) {
      toast({
        title: 'Erro',
        description: 'Erro ao processar depósito',
        variant: 'destructive',
      });
      setIsProcessing(false);
      return;
    }

    // If approved, add balance to user
    if (approve) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('balance')
        .eq('user_id', selectedDeposit.user_id)
        .single();

      if (profileData) {
        await supabase
          .from('profiles')
          .update({
            balance: profileData.balance + selectedDeposit.amount,
          })
          .eq('user_id', selectedDeposit.user_id);

        // Create transaction record
        await supabase.from('transactions').insert({
          user_id: selectedDeposit.user_id,
          type: 'deposit',
          amount: selectedDeposit.amount,
          description: 'Depósito aprovado',
          reference_id: selectedDeposit.id,
        });
      }
    }

    // Create notification for user
    await supabase.from('notifications').insert({
      user_id: selectedDeposit.user_id,
      title: approve ? 'Depósito Aprovado!' : 'Depósito Recusado',
      message: approve
        ? `Seu depósito de R$ ${selectedDeposit.amount.toFixed(2)} foi aprovado e o saldo já está disponível.`
        : `Seu depósito de R$ ${selectedDeposit.amount.toFixed(2)} foi recusado. ${adminNotes || ''}`,
      type: approve ? 'info' : 'alert',
    });

    toast({
      title: 'Sucesso',
      description: approve ? 'Depósito aprovado!' : 'Depósito recusado!',
    });

    setSelectedDeposit(null);
    setAdminNotes('');
    setIsProcessing(false);
    fetchDeposits();
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

  const pendingDeposits = deposits.filter((d) => d.status === 'pending');
  const processedDeposits = deposits.filter((d) => d.status !== 'pending');

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
        <h1 className="text-2xl font-bold text-white">Aprovar Depósitos</h1>
        <p className="text-gray-400">
          {pendingDeposits.length} depósito(s) pendente(s)
        </p>
      </div>

      {/* Pending Deposits */}
      {pendingDeposits.length > 0 && (
        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a]">
          <div className="p-6 border-b border-[#1e2a3a]">
            <h2 className="text-lg font-semibold text-white">Depósitos Pendentes</h2>
          </div>
          <div className="p-6 space-y-4">
            {pendingDeposits.map((deposit) => (
              <div
                key={deposit.id}
                className="flex items-center justify-between rounded-lg border border-[#1e2a3a] p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
                    <ArrowDownCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{deposit.profile?.full_name || 'Usuário'}</p>
                    <p className="text-sm text-gray-400">
                      {format(new Date(deposit.created_at), "dd/MM/yy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xl font-bold text-white">{formatCurrency(deposit.amount)}</p>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium flex items-center gap-1 hover:bg-green-500/30 transition-all"
                      onClick={() => setSelectedDeposit(deposit)}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aprovar
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium flex items-center gap-1 hover:bg-red-500/30 transition-all"
                      onClick={() => {
                        setSelectedDeposit(deposit);
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

      {/* Processed Deposits */}
      <div className="rounded-xl bg-[#111820] border border-[#1e2a3a]">
        <div className="p-6 border-b border-[#1e2a3a]">
          <h2 className="text-lg font-semibold text-white">Histórico de Depósitos</h2>
        </div>
        <div className="p-6 space-y-4">
          {processedDeposits.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              Nenhum depósito processado ainda
            </p>
          ) : (
            processedDeposits.map((deposit) => (
              <div
                key={deposit.id}
                className="flex items-center justify-between rounded-lg border border-[#1e2a3a] p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e2a3a]">
                    <ArrowDownCircle className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{deposit.profile?.full_name || 'Usuário'}</p>
                    <p className="text-sm text-gray-400">
                      {format(new Date(deposit.created_at), "dd/MM/yy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-white">{formatCurrency(deposit.amount)}</p>
                  {getStatusBadge(deposit.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Process Dialog */}
      <Dialog open={!!selectedDeposit} onOpenChange={() => setSelectedDeposit(null)}>
        <DialogContent className="bg-[#111820] border-[#1e2a3a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Processar Depósito</DialogTitle>
            <DialogDescription className="text-gray-400">
              Depósito de {formatCurrency(selectedDeposit?.amount || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
            <Button variant="outline" onClick={() => setSelectedDeposit(null)} className="border-[#1e2a3a] text-gray-300 hover:bg-[#1e2a3a] hover:text-white">
              Cancelar
            </Button>
            <button
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition-all disabled:opacity-50"
              onClick={() => processDeposit(false)}
              disabled={isProcessing}
            >
              Recusar
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 font-medium hover:bg-green-500/30 transition-all disabled:opacity-50"
              onClick={() => processDeposit(true)}
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

export default AdminDeposits;
