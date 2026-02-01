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
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        );
      case 'approved':
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

  const pendingDeposits = deposits.filter((d) => d.status === 'pending');
  const processedDeposits = deposits.filter((d) => d.status !== 'pending');

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
        <h1 className="text-2xl font-bold text-foreground">Aprovar Depósitos</h1>
        <p className="text-muted-foreground">
          {pendingDeposits.length} depósito(s) pendente(s)
        </p>
      </div>

      {/* Pending Deposits */}
      {pendingDeposits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Depósitos Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingDeposits.map((deposit) => (
              <div
                key={deposit.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
                    <ArrowDownCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">{deposit.profile?.full_name || 'Usuário'}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(deposit.created_at), "dd/MM/yy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xl font-bold">{formatCurrency(deposit.amount)}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setSelectedDeposit(deposit)}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedDeposit(deposit);
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

      {/* Processed Deposits */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Depósitos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {processedDeposits.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum depósito processado ainda
            </p>
          ) : (
            processedDeposits.map((deposit) => (
              <div
                key={deposit.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <ArrowDownCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{deposit.profile?.full_name || 'Usuário'}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(deposit.created_at), "dd/MM/yy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold">{formatCurrency(deposit.amount)}</p>
                  {getStatusBadge(deposit.status)}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Process Dialog */}
      <Dialog open={!!selectedDeposit} onOpenChange={() => setSelectedDeposit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Processar Depósito</DialogTitle>
            <DialogDescription>
              Depósito de {formatCurrency(selectedDeposit?.amount || 0)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
            <Button variant="outline" onClick={() => setSelectedDeposit(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => processDeposit(false)}
              disabled={isProcessing}
            >
              Recusar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => processDeposit(true)}
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

export default AdminDeposits;
