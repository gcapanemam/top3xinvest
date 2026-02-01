import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  pix_key: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  profile?: { full_name: string | null; balance: number } | null;
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
      .select('*')
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
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        );
      case 'approved':
      case 'completed':
        return (
          <Badge className="gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Aprovado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Recusado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');
  const processedWithdrawals = withdrawals.filter((w) => w.status !== 'pending');

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
        <h1 className="text-2xl font-bold text-foreground">Aprovar Saques</h1>
        <p className="text-muted-foreground">
          {pendingWithdrawals.length} saque(s) pendente(s)
        </p>
      </div>

      {/* Pending Withdrawals */}
      {pendingWithdrawals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saques Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingWithdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
                    <ArrowUpCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">{withdrawal.profile?.full_name || 'Usuário'}</p>
                    <p className="text-sm text-muted-foreground">
                      PIX: {withdrawal.pix_key}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Saldo: {formatCurrency(withdrawal.profile?.balance || 0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xl font-bold">{formatCurrency(withdrawal.amount)}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setSelectedWithdrawal(withdrawal)}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedWithdrawal(withdrawal);
                        setAdminNotes('');
                      }}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Recusar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Processed Withdrawals */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Saques</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {processedWithdrawals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum saque processado ainda
            </p>
          ) : (
            processedWithdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <ArrowUpCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{withdrawal.profile?.full_name || 'Usuário'}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(withdrawal.created_at), "dd/MM/yy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold">{formatCurrency(withdrawal.amount)}</p>
                  {getStatusBadge(withdrawal.status)}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Process Dialog */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Processar Saque</DialogTitle>
            <DialogDescription>
              Saque de {formatCurrency(selectedWithdrawal?.amount || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">Chave PIX</p>
              <p className="font-medium">{selectedWithdrawal?.pix_key}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Observações (opcional)</p>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Adicione uma observação..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedWithdrawal(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => processWithdrawal(false)}
              disabled={isProcessing}
            >
              Recusar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => processWithdrawal(true)}
              disabled={isProcessing}
            >
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawals;
