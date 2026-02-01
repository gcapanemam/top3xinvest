import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, TrendingUp, Calendar, Lock, Unlock } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Investment {
  id: string;
  amount: number;
  profit_accumulated: number;
  status: string;
  lock_until: string;
  created_at: string;
  robot: {
    name: string;
    profit_percentage: number;
    profit_period_days: number;
  } | null;
}

const Investments = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInvestments();
    }
  }, [user]);

  const fetchInvestments = async () => {
    const { data, error } = await supabase
      .from('investments')
      .select('*, robot:robots(name, profit_percentage, profit_period_days)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) {
      setInvestments(data as Investment[]);
    }
    setIsLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string, lockUntil: string) => {
    const isUnlocked = isPast(new Date(lockUntil));

    if (status === 'active' && isUnlocked) {
      return <Badge className="bg-green-500">Disponível</Badge>;
    }

    switch (status) {
      case 'active':
        return <Badge variant="secondary">Em Lock</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Finalizado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
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

  const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalProfit = investments.reduce((sum, inv) => sum + Number(inv.profit_accumulated), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meus Investimentos</h1>
        <p className="text-muted-foreground">
          Acompanhe seus investimentos e lucros
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Investido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lucro Acumulado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{formatCurrency(totalProfit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Investimentos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {investments.filter((i) => i.status === 'active').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investments List */}
      {investments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Nenhum investimento ainda</h3>
            <p className="text-muted-foreground">
              Escolha um robô e faça seu primeiro investimento
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {investments.map((investment) => {
            const isUnlocked = isPast(new Date(investment.lock_until));

            return (
              <Card key={investment.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Bot className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {investment.robot?.name || 'Robô'}
                          </h3>
                          {getStatusBadge(investment.status, investment.lock_until)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {investment.robot?.profit_percentage}% /{' '}
                          {investment.robot?.profit_period_days} dias
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Investido</p>
                        <p className="font-medium">{formatCurrency(investment.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Lucro</p>
                        <p className="font-medium text-green-600">
                          +{formatCurrency(investment.profit_accumulated)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Início</p>
                        <p className="font-medium">
                          {format(new Date(investment.created_at), 'dd/MM/yy', {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          {isUnlocked ? (
                            <Unlock className="h-3 w-3" />
                          ) : (
                            <Lock className="h-3 w-3" />
                          )}
                          Liberação
                        </p>
                        <p className="font-medium">
                          {format(new Date(investment.lock_until), 'dd/MM/yy', {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Investments;
