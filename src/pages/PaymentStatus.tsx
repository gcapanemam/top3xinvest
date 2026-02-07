import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  Loader2, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  ArrowLeft,
  Copy,
  Wallet,
  RotateCcw
} from 'lucide-react';

interface Deposit {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  oxapay_track_id: string | null;
  oxapay_pay_link: string | null;
}

interface OxaPayStatus {
  status: string;
  amount: number;
  payAmount?: number;
  payCurrency?: string;
  network?: string;
  address?: string;
  txID?: string;
  expiredAt?: number;
}

type PaymentStatusType = 'New' | 'Waiting' | 'Confirming' | 'Paid' | 'Expired' | 'Failed';

const STATUS_CONFIG: Record<PaymentStatusType, { 
  icon: React.ElementType; 
  color: string; 
  bgColor: string;
  message: string;
  step: number;
}> = {
  New: { 
    icon: Clock, 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-500/20',
    message: 'Aguardando pagamento',
    step: 1
  },
  Waiting: { 
    icon: Loader2, 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/20',
    message: 'Pagamento detectado',
    step: 2
  },
  Confirming: { 
    icon: RefreshCw, 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500/20',
    message: 'Confirmando transação',
    step: 3
  },
  Paid: { 
    icon: CheckCircle, 
    color: 'text-green-400', 
    bgColor: 'bg-green-500/20',
    message: 'Pagamento confirmado!',
    step: 4
  },
  Expired: { 
    icon: XCircle, 
    color: 'text-red-400', 
    bgColor: 'bg-red-500/20',
    message: 'Pagamento expirado',
    step: 0
  },
  Failed: { 
    icon: AlertTriangle, 
    color: 'text-red-400', 
    bgColor: 'bg-red-500/20',
    message: 'Falha no pagamento',
    step: 0
  },
};

const STEPS = ['Criado', 'Aguardando', 'Confirmando', 'Pago'];

const PaymentStatus = () => {
  const { depositId } = useParams<{ depositId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [oxaPayStatus, setOxaPayStatus] = useState<OxaPayStatus | null>(null);
  const [currentStatus, setCurrentStatus] = useState<PaymentStatusType>('New');
  const [timeLeft, setTimeLeft] = useState<number>(3600); // 60 minutes
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch deposit from database
  const fetchDeposit = useCallback(async () => {
    if (!depositId || !user) return;

    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .eq('id', depositId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      toast({
        title: 'Erro',
        description: 'Depósito não encontrado',
        variant: 'destructive',
      });
      navigate('/deposits');
      return;
    }

    setDeposit(data);
    
    // If already approved, show success
    if (data.status === 'approved') {
      setCurrentStatus('Paid');
    }
    
    // Calculate time left based on creation time (60 min expiration)
    const createdAt = new Date(data.created_at).getTime();
    const expiresAt = createdAt + (60 * 60 * 1000); // 60 minutes
    const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    setTimeLeft(remaining);
    
    setIsLoading(false);
  }, [depositId, user, navigate, toast]);

  // Regenerate payment link
  const regeneratePaymentLink = useCallback(async () => {
    if (!deposit || !user) return;

    setIsRegenerating(true);

    try {
      // Validate session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: 'Sessão expirada',
          description: 'Faça login novamente para continuar',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      const { data: invoiceData, error: invoiceError } = await supabase.functions.invoke(
        'oxapay-create-invoice',
        {
          body: {
            amount: deposit.amount,
            depositId: deposit.id,
            returnUrl: window.location.origin + '/deposits',
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      // Handle 401
      if (invoiceError?.message?.includes('401') || invoiceData?.error?.includes('Sessão expirada')) {
        toast({
          title: 'Sessão expirada',
          description: 'Faça login novamente para continuar',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      if (invoiceError || !invoiceData?.payLink) {
        const errorMessage = invoiceData?.error || invoiceError?.message || 'Erro ao gerar link de pagamento';
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Link gerado!',
        description: 'O link de pagamento foi gerado com sucesso',
      });

      // Refetch deposit to get updated pay link
      await fetchDeposit();
    } catch (error) {
      console.error('Error regenerating payment link:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar link de pagamento',
        variant: 'destructive',
      });
    } finally {
      setIsRegenerating(false);
    }
  }, [deposit, user, fetchDeposit, navigate, toast]);

  // Check status from OxaPay
  const checkStatus = useCallback(async () => {
    if (!deposit?.oxapay_track_id || currentStatus === 'Paid' || currentStatus === 'Expired') {
      return;
    }

    setIsChecking(true);

    try {
      // Validate session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: 'Sessão expirada',
          description: 'Faça login novamente para continuar',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('oxapay-check-status', {
        body: { 
          trackId: deposit.oxapay_track_id, 
          depositId: deposit.id 
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      // Handle 401
      if (error?.message?.includes('401') || data?.error?.includes('Sessão expirada')) {
        console.error('Session expired during status check');
        toast({
          title: 'Sessão expirada',
          description: 'Faça login novamente para continuar',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      if (error) {
        console.error('Error checking status:', error);
        return;
      }

      if (data?.status) {
        setOxaPayStatus(data);
        
        // Map OxaPay status to our status
        const statusMap: Record<string, PaymentStatusType> = {
          'New': 'New',
          'Waiting': 'Waiting',
          'Confirming': 'Confirming',
          'Paid': 'Paid',
          'Expired': 'Expired',
          'Failed': 'Failed',
        };
        
        const newStatus = statusMap[data.status] || 'New';
        setCurrentStatus(newStatus);

        // If paid, show success and redirect
        if (newStatus === 'Paid') {
          toast({
            title: 'Pagamento Confirmado!',
            description: 'Seu depósito foi processado com sucesso.',
          });
          
          // Refetch deposit to get updated status
          await fetchDeposit();
          
          setTimeout(() => {
            navigate('/deposits');
          }, 3000);
        }

        // Update time left from OxaPay response
        if (data.expiredAt) {
          const remaining = Math.max(0, Math.floor((data.expiredAt * 1000 - Date.now()) / 1000));
          setTimeLeft(remaining);
        }
      }
    } catch (error) {
      console.error('Error in checkStatus:', error);
    } finally {
      setIsChecking(false);
    }
  }, [deposit, currentStatus, fetchDeposit, navigate, toast]);

  // Initial fetch
  useEffect(() => {
    fetchDeposit();
  }, [fetchDeposit]);

  // Polling every 10 seconds
  useEffect(() => {
    if (!deposit?.oxapay_track_id || currentStatus === 'Paid' || currentStatus === 'Expired') {
      return;
    }

    // Initial check
    checkStatus();

    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [deposit?.oxapay_track_id, currentStatus, checkStatus]);

  // Countdown timer
  useEffect(() => {
    if (currentStatus === 'Paid' || currentStatus === 'Expired') {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          setCurrentStatus('Expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: 'Copiado!',
        description: 'Link copiado para a área de transferência',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link',
        variant: 'destructive',
      });
    }
  };

  const statusConfig = STATUS_CONFIG[currentStatus];
  const StatusIcon = statusConfig.icon;
  const progressValue = (statusConfig.step / 4) * 100;

  // Check if payment link is missing for pending deposit
  const needsPaymentLinkRegeneration = deposit?.status === 'pending' && !deposit?.oxapay_pay_link;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <Skeleton className="h-8 w-48 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-4">
        {/* Back Link */}
        <Link 
          to="/deposits" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Depósitos
        </Link>

        <Card className="overflow-hidden">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Wallet className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">Acompanhe seu Pagamento</CardTitle>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {deposit && formatCurrency(deposit.amount)}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Regenerate Payment Link Button - shown when link is missing */}
            {needsPaymentLinkRegeneration && (
              <div className="p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <p className="text-yellow-400 font-medium">Link de pagamento não gerado</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Houve um erro ao gerar o link de pagamento. Clique abaixo para tentar novamente.
                </p>
                <Button 
                  onClick={regeneratePaymentLink}
                  disabled={isRegenerating}
                  className="w-full"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Gerar Link de Pagamento
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Status Icon and Message */}
            {!needsPaymentLinkRegeneration && (
              <div className={`flex flex-col items-center justify-center p-6 rounded-xl ${statusConfig.bgColor}`}>
                <div className={`p-4 rounded-full ${statusConfig.bgColor} mb-3`}>
                  <StatusIcon 
                    className={`h-12 w-12 ${statusConfig.color} ${
                      currentStatus === 'Confirming' || currentStatus === 'Waiting' ? 'animate-spin' : ''
                    }`} 
                  />
                </div>
                <p className={`text-lg font-semibold ${statusConfig.color}`}>
                  {statusConfig.message}
                </p>
                {isChecking && currentStatus !== 'Paid' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Verificando status...
                  </p>
                )}
              </div>
            )}

            {/* Progress Steps */}
            {currentStatus !== 'Expired' && currentStatus !== 'Failed' && !needsPaymentLinkRegeneration && (
              <div className="space-y-3">
                <Progress value={progressValue} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  {STEPS.map((step, index) => (
                    <span 
                      key={step}
                      className={index + 1 <= statusConfig.step ? 'text-primary font-medium' : ''}
                    >
                      {step}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Timer */}
            {currentStatus !== 'Paid' && currentStatus !== 'Expired' && !needsPaymentLinkRegeneration && (
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground mb-1">Tempo restante</p>
                <p className={`text-3xl font-mono font-bold ${
                  timeLeft < 300 ? 'text-red-400' : 'text-foreground'
                }`}>
                  {formatTime(timeLeft)}
                </p>
              </div>
            )}

            {/* Payment Details */}
            {oxaPayStatus?.address && currentStatus !== 'Paid' && (
              <div className="space-y-2 p-4 rounded-lg bg-muted/20 border border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rede:</span>
                  <span className="font-medium">{oxaPayStatus.network}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Moeda:</span>
                  <span className="font-medium">{oxaPayStatus.payCurrency}</span>
                </div>
                {oxaPayStatus.payAmount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor a pagar:</span>
                    <span className="font-medium">{oxaPayStatus.payAmount} {oxaPayStatus.payCurrency}</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {currentStatus !== 'Paid' && currentStatus !== 'Expired' && deposit?.oxapay_pay_link && (
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => window.open(deposit.oxapay_pay_link!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ir para Pagamento
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => copyToClipboard(deposit.oxapay_pay_link!)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copiado!' : 'Copiar Link de Pagamento'}
                </Button>
              </div>
            )}

            {/* Success Message */}
            {currentStatus === 'Paid' && (
              <div className="text-center space-y-2">
                <p className="text-green-400 font-medium">
                  Seu saldo será atualizado em instantes!
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirecionando para seus depósitos...
                </p>
              </div>
            )}

            {/* Expired Message */}
            {currentStatus === 'Expired' && (
              <div className="text-center space-y-4">
                <p className="text-red-400">
                  O tempo para pagamento expirou.
                </p>
                <Button onClick={() => navigate('/deposits')}>
                  Criar Novo Depósito
                </Button>
              </div>
            )}

            {/* Manual Refresh */}
            {currentStatus !== 'Paid' && currentStatus !== 'Expired' && deposit?.oxapay_track_id && (
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground"
                onClick={checkStatus}
                disabled={isChecking}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                Atualizar Status
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground">
          Após realizar o pagamento, aguarde a confirmação automática.
          <br />
          O status será atualizado em tempo real.
        </p>
      </div>
    </div>
  );
};

export default PaymentStatus;
