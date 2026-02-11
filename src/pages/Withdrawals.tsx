import { useEffect, useState } from 'react';
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
import { Plus, ArrowUpCircle, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import ReceivablesStatement from '@/components/withdrawals/ReceivablesStatement';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  pix_key: string | null;
  created_at: string;
  processed_at: string | null;
  admin_notes: string | null;
}

interface Profile {
  balance: number;
}

const Withdrawals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('balance')
      .eq('user_id', user!.id)
      .single();

    if (profileData) {
      setProfile(profileData);
    }

    // Fetch withdrawals
    const { data: withdrawalData } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (withdrawalData) {
      setWithdrawals(withdrawalData);
    }

    setIsLoading(false);
  };

  const handleWithdrawal = async () => {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: 'Erro',
        description: 'Informe um valor válido',
        variant: 'destructive',
      });
      return;
    }

    if (numAmount < 20) {
      toast({
        title: 'Erro',
        description: 'Minimum withdrawal amount is $20.00',
        variant: 'destructive',
      });
      return;
    }

    if (!profile || numAmount > profile.balance) {
      toast({
        title: 'Erro',
        description: 'Saldo insuficiente',
        variant: 'destructive',
      });
      return;
    }

    if (!pixKey.trim()) {
      toast({
        title: 'Erro',
        description: 'Informe sua chave PIX',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from('withdrawals').insert({
      user_id: user!.id,
      amount: numAmount,
      pix_key: pixKey,
      status: 'pending',
    });

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao solicitar saque',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Saque solicitado!',
        description: 'Aguarde a aprovação do administrador',
      });
      setAmount('');
      setPixKey('');
      setIsDialogOpen(false);
      fetchData();
    }

    setIsSubmitting(false);
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
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            Aprovado
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processando
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
          <h1 className="text-xl md:text-2xl font-bold text-white">Saques</h1>
          <p className="text-sm md:text-base text-gray-400">
            Saldo disponível: <span className="text-teal-400 font-semibold">{formatCurrency(profile?.balance || 0)}</span>
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button 
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium text-sm md:text-base transition-all hover:shadow-lg hover:shadow-teal-500/25 w-full sm:w-auto disabled:opacity-50"
              disabled={!profile || profile.balance < 20}
            >
              <Plus className="h-4 w-4" />
              Solicitar Saque
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[#111820] border-[#1e2a3a] text-white max-w-[95vw] md:max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Solicitar Saque</DialogTitle>
              <DialogDescription className="text-gray-400">
                Informe o valor e sua chave PIX para receber
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg bg-[#0a0f14] p-3 border border-[#1e2a3a]">
                <p className="text-sm text-gray-400">Saldo disponível</p>
                <p className="text-xl font-bold text-teal-400">
                  {formatCurrency(profile?.balance || 0)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-gray-300">Valor do saque</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="$0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  max={profile?.balance || 0}
                  min={20}
                  step={0.01}
                  className="bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-400">Minimum: $20.00</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pix" className="text-gray-300">Chave PIX</Label>
                <Input
                  id="pix"
                  type="text"
                  placeholder="CPF, email, telefone ou chave aleatória"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-[#1e2a3a] text-gray-300 hover:bg-[#1e2a3a] hover:text-white">
                Cancelar
              </Button>
              <button 
                onClick={handleWithdrawal} 
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-teal-500/25 disabled:opacity-50"
              >
                {isSubmitting ? 'Enviando...' : 'Confirmar Saque'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Withdrawals List */}
      {withdrawals.length === 0 ? (
        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-12 text-center">
          <ArrowUpCircle className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-white">Nenhum saque ainda</h3>
          <p className="text-gray-400">
            Seus saques aparecerão aqui
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a]">
          <div className="p-6 border-b border-[#1e2a3a]">
            <h2 className="text-lg font-semibold text-white">Histórico de Saques</h2>
            <p className="text-sm text-gray-400">Todas as suas solicitações de saque</p>
          </div>
          <div className="p-6 space-y-4">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#1e2a3a] p-4 hover:border-teal-500/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
                    <ArrowUpCircle className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{formatCurrency(withdrawal.amount)}</p>
                    <p className="text-sm text-gray-400">
                      {format(new Date(withdrawal.created_at), "dd 'de' MMM 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(withdrawal.status)}
                  {withdrawal.pix_key && (
                    <p className="mt-1 text-xs text-gray-400">
                      PIX: {withdrawal.pix_key}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extrato de Recebimentos */}
      <ReceivablesStatement />
    </div>
  );
};

export default Withdrawals;
