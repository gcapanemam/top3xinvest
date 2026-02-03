import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Bot, TrendingUp, Lock, Unlock } from 'lucide-react';
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
    profit_percentage_min: number;
    profit_percentage_max: number;
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
      .select('*, robot:robots(name, profit_percentage_min, profit_percentage_max, profit_period_days)')
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
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
          Disponível
        </span>
      );
    }

    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
            Em Lock
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
            Finalizado
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
            Cancelado
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

  const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalProfit = investments.reduce((sum, inv) => sum + Number(inv.profit_accumulated), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Meus Investimentos</h1>
        <p className="text-gray-400">
          Acompanhe seus investimentos e lucros
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-4 md:p-6">
          <p className="text-sm font-medium text-gray-400 mb-2">Total Investido</p>
          <div className="text-xl md:text-2xl font-bold text-white">{formatCurrency(totalInvested)}</div>
        </div>

        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-4 md:p-6">
          <p className="text-sm font-medium text-gray-400 mb-2">Lucro Acumulado</p>
          <div className="text-xl md:text-2xl font-bold text-green-400">
            +{formatCurrency(totalProfit)}
          </div>
        </div>

        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-4 md:p-6">
          <p className="text-sm font-medium text-gray-400 mb-2">Investimentos Ativos</p>
          <div className="text-xl md:text-2xl font-bold text-white">
            {investments.filter((i) => i.status === 'active').length}
          </div>
        </div>
      </div>

      {/* Investments List */}
      {investments.length === 0 ? (
        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-12 text-center">
          <Bot className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-white">Nenhum investimento ainda</h3>
          <p className="text-gray-400">
            Escolha um robô e faça seu primeiro investimento
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {investments.map((investment) => {
            const isUnlocked = isPast(new Date(investment.lock_until));

            return (
              <div key={investment.id} className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20">
                      <Bot className="h-6 w-6 text-teal-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">
                          {investment.robot?.name || 'Robô'}
                        </h3>
                        {getStatusBadge(investment.status, investment.lock_until)}
                      </div>
                      <p className="text-sm text-gray-400">
                        {investment.robot?.profit_percentage_min} - {investment.robot?.profit_percentage_max}% /{' '}
                        {investment.robot?.profit_period_days} dias
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-xs text-gray-400">Investido</p>
                      <p className="font-medium text-white">{formatCurrency(investment.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Lucro</p>
                      <p className="font-medium text-green-400">
                        +{formatCurrency(investment.profit_accumulated)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Início</p>
                      <p className="font-medium text-white">
                        {format(new Date(investment.created_at), 'dd/MM/yy', {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="flex items-center gap-1 text-xs text-gray-400">
                        {isUnlocked ? (
                          <Unlock className="h-3 w-3 text-green-400" />
                        ) : (
                          <Lock className="h-3 w-3 text-yellow-400" />
                        )}
                        Liberação
                      </p>
                      <p className="font-medium text-white">
                        {format(new Date(investment.lock_until), 'dd/MM/yy', {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Investments;
