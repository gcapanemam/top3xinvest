import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, ArrowDownCircle, Clock, CheckCircle, XCircle, Bitcoin, Wallet, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Deposit {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  processed_at: string | null;
  admin_notes: string | null;
  payment_method: string | null;
  network_name: string | null;
  cryptocurrency?: { symbol: string; name: string } | null;
}

const Deposits = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDeposits();
    }
  }, [user]);

  const fetchDeposits = async () => {
    const { data, error } = await supabase
      .from('deposits')
      .select(`
        *,
        cryptocurrency:cryptocurrencies(symbol, name)
      `)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) {
      setDeposits(data as unknown as Deposit[]);
    }
    setIsLoading(false);
  };

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: 'Erro',
        description: 'Informe um valor válido',
        variant: 'destructive',
      });
      return;
    }

    if (numAmount < 1) {
      toast({
        title: 'Erro',
        description: 'Valor mínimo para depósito é $1.00',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Validate session before proceeding
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: 'Sessão expirada',
          description: 'Faça login novamente para continuar',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        navigate('/auth');
        return;
      }

      // 2. Create deposit record
      const { data: depositData, error: depositError } = await supabase
        .from('deposits')
        .insert({
          user_id: user!.id,
          amount: numAmount,
          status: 'pending' as const,
          payment_method: 'oxapay',
        })
        .select()
        .single();

      if (depositError || !depositData) {
        console.error('Error creating deposit:', depositError);
        toast({
          title: 'Erro',
          description: 'Erro ao criar depósito',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // 3. Create invoice on OxaPay with explicit Authorization header
      const { data: invoiceData, error: invoiceError } = await supabase.functions.invoke(
        'oxapay-create-invoice',
        {
          body: {
            amount: numAmount,
            depositId: depositData.id,
            returnUrl: window.location.origin + '/deposits',
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      // Handle 401 specifically
      if (invoiceError?.message?.includes('401') || invoiceData?.error?.includes('Sessão expirada')) {
        toast({
          title: 'Sessão expirada',
          description: 'Faça login novamente para continuar',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        navigate('/auth');
        return;
      }

      if (invoiceError || !invoiceData?.payLink) {
        console.error('Error creating OxaPay invoice:', invoiceError, invoiceData);
        // Show specific error message from backend if available
        const errorMessage = invoiceData?.error || invoiceError?.message || 'Erro ao gerar link de pagamento';
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        });
        // Still navigate to status page so user can retry
        navigate(`/deposit/status/${depositData.id}`);
        setIsSubmitting(false);
        return;
      }

      // 4. Redirect to payment status page
      toast({
        title: 'Depósito criado!',
        description: 'Acompanhe o status do seu pagamento',
      });

      setIsDialogOpen(false);
      setAmount('');
      navigate(`/deposit/status/${depositData.id}`);
    } catch (error) {
      console.error('Error in handleDeposit:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao processar depósito',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 text-muted-foreground text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  const getPaymentMethodBadge = (deposit: Deposit) => {
    if (deposit.payment_method === 'oxapay') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/20 text-primary text-xs">
          <Wallet className="h-3 w-3" />
          OxaPay
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-xs">
        <Bitcoin className="h-3 w-3" />
        {deposit.cryptocurrency?.symbol || 'Crypto'} {deposit.network_name ? `- ${deposit.network_name}` : ''}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Depósitos</h1>
          <p className="text-sm md:text-base text-muted-foreground">Adicione saldo à sua conta</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setAmount('');
          }
        }}>
          <DialogTrigger asChild>
            <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-cyan-500 text-primary-foreground font-medium text-sm md:text-base transition-all hover:shadow-lg hover:shadow-primary/25 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Novo Depósito
            </button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground max-w-[95vw] md:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Depositar via Criptomoeda</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Informe o valor e você será redirecionado para escolher a criptomoeda
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Info about OxaPay */}
              <div className="rounded-lg border border-border p-4 space-y-2 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <h4 className="font-medium text-foreground">Pagamento via OxaPay</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Você será redirecionado para escolher entre diversas criptomoedas (BTC, ETH, USDT, etc.) e completar o pagamento de forma segura.
                </p>
              </div>

              {/* Amount in USD */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Valor em USD</Label>
                <Input
                  type="number"
                  placeholder="$ 0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={1}
                  step={0.01}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">Mínimo: $1.00</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-border">
                Cancelar
              </Button>
              <button
                onClick={handleDeposit}
                disabled={isSubmitting || !amount || parseFloat(amount) < 1}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-cyan-500 text-primary-foreground font-medium transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50"
              >
                {isSubmitting ? 'Processando...' : 'Continuar para Pagamento'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Deposits List */}
      {deposits.length === 0 ? (
        <div className="rounded-xl bg-card border border-border p-12 text-center">
          <ArrowDownCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-foreground">Nenhum depósito ainda</h3>
          <p className="text-muted-foreground">
            Clique no botão acima para fazer seu primeiro depósito
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-card border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Histórico de Depósitos</h2>
            <p className="text-sm text-muted-foreground">Todos os seus depósitos e status de aprovação</p>
          </div>
          <div className="p-6 space-y-4">
            {deposits.map((deposit) => (
              <div
                key={deposit.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-4 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{formatCurrency(deposit.amount)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(deposit.created_at), "dd 'de' MMM 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                      {getPaymentMethodBadge(deposit)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {deposit.status === 'pending' && deposit.payment_method === 'oxapay' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/deposit/status/${deposit.id}`)}
                      className="gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      Ver Status
                    </Button>
                  )}
                  <div className="text-right">
                    {getStatusBadge(deposit.status)}
                    {deposit.admin_notes && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {deposit.admin_notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Deposits;
