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
import { Plus, Copy, ArrowDownCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Deposit {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  processed_at: string | null;
  admin_notes: string | null;
}

const Deposits = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PIX data (would be configured by admin)
  const pixKey = 'invest-hub@exemplo.com';
  const pixName = 'Invest Hub Ltda';

  useEffect(() => {
    if (user) {
      fetchDeposits();
    }
  }, [user]);

  const fetchDeposits = async () => {
    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) {
      setDeposits(data);
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

    if (numAmount < 50) {
      toast({
        title: 'Erro',
        description: 'Valor mínimo para depósito é R$ 50,00',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from('deposits').insert({
      user_id: user!.id,
      amount: numAmount,
      status: 'pending',
    });

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao solicitar depósito',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Depósito solicitado!',
        description: 'Faça o pagamento via PIX e aguarde a aprovação',
      });
      setAmount('');
      setIsDialogOpen(false);
      fetchDeposits();
    }

    setIsSubmitting(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Chave PIX copiada para a área de transferência',
    });
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium text-sm md:text-base transition-all hover:shadow-lg hover:shadow-teal-500/25 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Novo Depósito
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[#111820] border-[#1e2a3a] text-white max-w-[95vw] md:max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Solicitar Depósito</DialogTitle>
              <DialogDescription className="text-gray-400">
                Informe o valor e faça o pagamento via PIX
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-gray-300">Valor do depósito</Label>
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
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-[#1e2a3a] text-gray-300 hover:bg-[#1e2a3a] hover:text-white">
                Cancelar
              </Button>
              <button 
                onClick={handleDeposit} 
                disabled={isSubmitting}
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10">
                    <ArrowDownCircle className="h-5 w-5 text-teal-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{formatCurrency(deposit.amount)}</p>
                    <p className="text-sm text-gray-400">
                      {format(new Date(deposit.created_at), "dd 'de' MMM 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
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
