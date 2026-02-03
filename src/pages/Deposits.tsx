import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Copy, ArrowDownCircle, Clock, CheckCircle, XCircle, Wallet, Bitcoin } from 'lucide-react';
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

interface DepositWallet {
  id: string;
  cryptocurrency_id: string;
  network_name: string;
  wallet_address: string;
  is_active: boolean;
  cryptocurrency?: { symbol: string; name: string };
}

const Deposits = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Crypto deposit states
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'crypto'>('pix');
  const [depositWallets, setDepositWallets] = useState<DepositWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<DepositWallet | null>(null);

  // PIX data (would be configured by admin)
  const pixKey = 'invest-hub@exemplo.com';
  const pixName = 'Invest Hub Ltda';

  useEffect(() => {
    if (user) {
      fetchDeposits();
      fetchDepositWallets();
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

  const fetchDepositWallets = async () => {
    const { data } = await supabase
      .from('deposit_wallets')
      .select(`
        *,
        cryptocurrency:cryptocurrencies(symbol, name)
      `)
      .eq('is_active', true);

    if (data) {
      setDepositWallets(data as unknown as DepositWallet[]);
    }
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

    if (numAmount < 50) {
      toast({
        title: 'Erro',
        description: paymentMethod === 'pix' ? 'Valor mínimo para depósito é R$ 50,00' : 'Valor mínimo para depósito é $50.00',
        variant: 'destructive',
      });
      return;
    }

    if (paymentMethod === 'crypto' && !selectedWallet) {
      toast({
        title: 'Erro',
        description: 'Selecione uma carteira para depósito',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const depositData = {
      user_id: user!.id,
      amount: numAmount,
      status: 'pending' as const,
      payment_method: paymentMethod,
      cryptocurrency_id: paymentMethod === 'crypto' ? selectedWallet?.cryptocurrency_id : null,
      network_name: paymentMethod === 'crypto' ? selectedWallet?.network_name : null,
      wallet_address: paymentMethod === 'crypto' ? selectedWallet?.wallet_address : null,
    };

    const { error } = await supabase.from('deposits').insert(depositData);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao solicitar depósito',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Depósito solicitado!',
        description: paymentMethod === 'pix' 
          ? 'Faça o pagamento via PIX e aguarde a aprovação'
          : 'Envie o valor para o endereço informado e aguarde a aprovação',
      });
      setAmount('');
      setSelectedWallet(null);
      setPaymentMethod('pix');
      setIsDialogOpen(false);
      fetchDeposits();
    }

    setIsSubmitting(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Endereço copiado para a área de transferência',
    });
  };

  const formatCurrency = (value: number, method?: string | null) => {
    if (method === 'crypto') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    }
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

  const getPaymentMethodBadge = (deposit: Deposit) => {
    if (deposit.payment_method === 'crypto') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-xs">
          <Bitcoin className="h-3 w-3" />
          {deposit.cryptocurrency?.symbol} - {deposit.network_name}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">
        PIX
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Depósitos</h1>
          <p className="text-sm md:text-base text-gray-400">Adicione saldo à sua conta</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setPaymentMethod('pix');
            setSelectedWallet(null);
            setAmount('');
          }
        }}>
          <DialogTrigger asChild>
            <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium text-sm md:text-base transition-all hover:shadow-lg hover:shadow-teal-500/25 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Novo Depósito
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[#111820] border-[#1e2a3a] text-white max-w-[95vw] md:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Solicitar Depósito</DialogTitle>
              <DialogDescription className="text-gray-400">
                Escolha o método de pagamento e informe o valor
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Payment Method Tabs */}
              <div className="flex gap-2">
                <button
                  type="button"
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
                    paymentMethod === 'pix'
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                      : "bg-[#1e2a3a] text-gray-400 hover:text-white"
                  )}
                  onClick={() => {
                    setPaymentMethod('pix');
                    setSelectedWallet(null);
                  }}
                >
                  <Wallet className="h-4 w-4" />
                  PIX
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
                    paymentMethod === 'crypto'
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                      : "bg-[#1e2a3a] text-gray-400 hover:text-white"
                  )}
                  onClick={() => setPaymentMethod('crypto')}
                >
                  <Bitcoin className="h-4 w-4" />
                  Cripto
                </button>
              </div>

              {paymentMethod === 'pix' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-gray-300">Valor do depósito (R$)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="R$ 0,00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min={50}
                      step={0.01}
                      className="bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500"
                    />
                    <p className="text-xs text-gray-400">Mínimo: R$ 50,00</p>
                  </div>

                  <div className="rounded-lg border border-[#1e2a3a] p-4 space-y-3 bg-[#0a0f14]">
                    <h4 className="font-medium text-white">Dados para PIX</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Chave PIX:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-cyan-400">{pixKey}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-white hover:bg-[#1e2a3a]"
                            onClick={() => copyToClipboard(pixKey)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Nome:</span>
                        <span className="text-sm font-medium text-white">{pixName}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Crypto Wallet Selection */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Selecione a Criptomoeda</Label>
                    {depositWallets.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 border border-[#1e2a3a] rounded-lg bg-[#0a0f14]">
                        <Bitcoin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma carteira disponível</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {depositWallets.map((wallet) => (
                          <div
                            key={wallet.id}
                            onClick={() => setSelectedWallet(wallet)}
                            className={cn(
                              "p-3 rounded-lg border cursor-pointer transition-all",
                              selectedWallet?.id === wallet.id
                                ? "border-teal-500 bg-teal-500/10"
                                : "border-[#1e2a3a] hover:border-teal-500/50 bg-[#0a0f14]"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20">
                                <Bitcoin className="h-4 w-4 text-orange-400" />
                              </div>
                              <div>
                                <span className="font-bold text-teal-400">
                                  {wallet.cryptocurrency?.symbol}
                                </span>
                                <span className="text-gray-400 mx-2">-</span>
                                <span className="text-white">{wallet.network_name}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Amount in USD */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Valor em USD</Label>
                    <Input
                      type="number"
                      placeholder="$ 0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min={50}
                      step={0.01}
                      className="bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500"
                    />
                    <p className="text-xs text-gray-400">Mínimo: $50.00</p>
                  </div>

                  {/* Selected Wallet Address */}
                  {selectedWallet && (
                    <div className="rounded-lg border border-[#1e2a3a] p-4 space-y-3 bg-[#0a0f14]">
                      <h4 className="font-medium text-white flex items-center gap-2">
                        <Bitcoin className="h-4 w-4 text-orange-400" />
                        Envie para este endereço
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Rede:</span>
                          <span className="text-sm text-white font-medium">{selectedWallet.network_name}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400 block mb-1">Endereço:</span>
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-cyan-400 bg-[#111820] px-2 py-1.5 rounded flex-1 break-all">
                              {selectedWallet.wallet_address}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-gray-400 hover:text-white hover:bg-[#1e2a3a]"
                              onClick={() => copyToClipboard(selectedWallet.wallet_address)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-[#1e2a3a] text-gray-300 hover:bg-[#1e2a3a] hover:text-white">
                Cancelar
              </Button>
              <button
                onClick={handleDeposit}
                disabled={isSubmitting || (paymentMethod === 'crypto' && !selectedWallet)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-teal-500/25 disabled:opacity-50"
              >
                {isSubmitting ? 'Enviando...' : 'Confirmar Depósito'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Deposits List */}
      {deposits.length === 0 ? (
        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-12 text-center">
          <ArrowDownCircle className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-white">Nenhum depósito ainda</h3>
          <p className="text-gray-400">
            Clique no botão acima para fazer seu primeiro depósito
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a]">
          <div className="p-6 border-b border-[#1e2a3a]">
            <h2 className="text-lg font-semibold text-white">Histórico de Depósitos</h2>
            <p className="text-sm text-gray-400">Todos os seus depósitos e status de aprovação</p>
          </div>
          <div className="p-6 space-y-4">
            {deposits.map((deposit) => (
              <div
                key={deposit.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#1e2a3a] p-4 hover:border-teal-500/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    deposit.payment_method === 'crypto' ? "bg-orange-500/10" : "bg-teal-500/10"
                  )}>
                    {deposit.payment_method === 'crypto' ? (
                      <Bitcoin className="h-5 w-5 text-orange-400" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5 text-teal-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{formatCurrency(deposit.amount, deposit.payment_method)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-400">
                        {format(new Date(deposit.created_at), "dd 'de' MMM 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                      {getPaymentMethodBadge(deposit)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(deposit.status)}
                  {deposit.admin_notes && (
                    <p className="mt-1 text-xs text-gray-400">
                      {deposit.admin_notes}
                    </p>
                  )}
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
