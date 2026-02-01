import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bot, TrendingUp, Clock, DollarSign, Sparkles } from 'lucide-react';

interface Robot {
  id: string;
  name: string;
  description: string | null;
  profit_percentage: number;
  profit_period_days: number;
  lock_period_days: number;
  min_investment: number;
  max_investment: number | null;
  is_active: boolean;
  cryptocurrency: {
    symbol: string;
    name: string;
  } | null;
}

const Robots = () => {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRobots();
  }, []);

  const fetchRobots = async () => {
    const { data, error } = await supabase
      .from('robots')
      .select('*, cryptocurrency:cryptocurrencies(symbol, name)')
      .eq('is_active', true)
      .order('profit_percentage', { ascending: false });

    if (data) {
      setRobots(data as Robot[]);
    }
    setIsLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/25 animate-pulse">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <p className="text-gray-400">Carregando robôs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Robôs de Investimento</h1>
        <p className="text-gray-400">
          Escolha um robô e comece a investir agora
        </p>
      </div>

      {robots.length === 0 ? (
        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1e2a3a] mx-auto">
            <Bot className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-white">Nenhum robô disponível</h3>
          <p className="text-gray-400">
            Novos robôs serão disponibilizados em breve
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {robots.map((robot) => (
            <div 
              key={robot.id} 
              className="group flex flex-col rounded-xl bg-[#111820] border border-[#1e2a3a] overflow-hidden transition-all hover:border-teal-500/50"
            >
              {/* Gradient top border */}
              <div className="h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />
              
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/25">
                    <Bot className="h-7 w-7 text-white" />
                  </div>
                  {robot.cryptocurrency && (
                    <span className="px-3 py-1 rounded-full bg-[#1e2a3a] text-cyan-400 text-sm font-semibold">
                      {robot.cryptocurrency.symbol}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white group-hover:text-teal-400 transition-colors">{robot.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{robot.description}</p>
              </div>

              <div className="px-6 pb-6 flex-1 space-y-4">
                {/* Profitability highlight */}
                <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 p-4 shadow-lg shadow-green-500/25">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80">Rentabilidade</p>
                    <p className="text-xl font-bold text-white">
                      {robot.profit_percentage}% <span className="text-sm font-normal">/ {robot.profit_period_days} dias</span>
                    </p>
                  </div>
                  <Sparkles className="ml-auto h-5 w-5 text-white/60 animate-pulse" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#1e2a3a] p-3 transition-all hover:border-teal-500/30">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">Período Lock</span>
                    </div>
                    <p className="mt-1 font-semibold text-white">{robot.lock_period_days} dias</p>
                  </div>

                  <div className="rounded-xl border border-[#1e2a3a] p-3 transition-all hover:border-teal-500/30">
                    <div className="flex items-center gap-2 text-gray-400">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-xs">Mín. Investimento</span>
                    </div>
                    <p className="mt-1 font-semibold text-white">{formatCurrency(robot.min_investment)}</p>
                  </div>
                </div>

                {robot.max_investment && (
                  <p className="text-sm text-gray-400">
                    Máximo: {formatCurrency(robot.max_investment)}
                  </p>
                )}
              </div>

              <div className="p-6 pt-0">
                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-teal-500/25">
                  <Sparkles className="h-4 w-4" />
                  Investir Agora
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Robots;
