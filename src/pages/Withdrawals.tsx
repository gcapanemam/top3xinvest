import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
        description: 'Valor mínimo para saque é R$ 20,00',
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
      case 'processing':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processando
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saques</h1>
          <p className="text-muted-foreground">
            Saldo disponível: {formatCurrency(profile?.balance || 0)}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={!profile || profile.balance < 20}>
              <Plus className="h-4 w-4" />
              Solicitar Saque
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar Saque</DialogTitle>
              <DialogDescription>
                Informe o valor e sua chave PIX para receber
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground">Saldo disponível</p>
                <p className="text-xl font-bold">
                  {formatCurrency(profile?.balance || 0)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor do saque</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="R$ 0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  max={profile?.balance || 0}
                  min={20}
                  step={0.01}
                />
                <p className="text-xs text-muted-foreground">Mínimo: R$ 20,00</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pix">Chave PIX</Label>
                <Input
                  id="pix"
                  type="text"
                  placeholder="CPF, email, telefone ou chave aleatória"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleWithdrawal} disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Confirmar Saque'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Withdrawals List */}
      {withdrawals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ArrowUpCircle className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Nenhum saque ainda</h3>
            <p className="text-muted-foreground">
              Seus saques aparecerão aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Saques</CardTitle>
            <CardDescription>
              Todas as suas solicitações de saque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <ArrowUpCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{formatCurrency(withdrawal.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(withdrawal.created_at), "dd 'de' MMM 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(withdrawal.status)}
                    {withdrawal.pix_key && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        PIX: {withdrawal.pix_key}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Withdrawals;
