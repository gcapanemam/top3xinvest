import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { addDays } from 'date-fns';
import { Bot, TrendingUp, Clock, DollarSign, Sparkles, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Robot {
  id: string;
  name: string;
  description: string | null;
  profit_percentage_min: number;
  profit_percentage_max: number;
  profit_period_days: number;
  lock_period_days: number;
  min_investment: number;
  max_investment: number | null;
  is_active: boolean;
  cryptocurrency: {
    symbol: string;
    name: string;
  } | null;
  robot_cryptocurrencies?: Array<{
    cryptocurrency: { symbol: string; name: string };
  }>;
}

const Robots = () => {
  const { user, effectiveUserId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [robots, setRobots] = useState<Robot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Investment dialog state
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [isInvesting, setIsInvesting] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);
  
  // Details dialog state
  const [detailsRobot, setDetailsRobot] = useState<Robot | null>(null);
  const [hiddenRobotIds, setHiddenRobotIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRobots();
  }, [effectiveUserId]);

  useEffect(() => {
    if (effectiveUserId) {
      fetchUserBalance();
    }
  }, [effectiveUserId]);

  const fetchRobots = async () => {
    // Fetch all robots (active and inactive)
    const { data, error } = await supabase
      .from('robots')
      .select(`
        *,
        cryptocurrency:cryptocurrencies(symbol, name),
        robot_cryptocurrencies(
          cryptocurrency:cryptocurrencies(symbol, name)
        )
      `)
      .order('profit_percentage_max', { ascending: false });

    if (data) {
      // If user is logged in, check which inactive robots they have investments in
      let userActiveRobotIds = new Set<string>();
      if (effectiveUserId) {
        const { data: userInvestments } = await supabase
          .from('investments')
          .select('robot_id')
          .eq('user_id', effectiveUserId)
          .eq('status', 'active');
        
        userActiveRobotIds = new Set(
          userInvestments?.map(i => i.robot_id).filter(Boolean) as string[]
        );
      }

      // Filter: show active robots + inactive robots only if user has active investment
      const filtered = data.filter((r: any) => 
        r.is_active || userActiveRobotIds.has(r.id)
      );
      
      // Track which robots are hidden (inactive)
      const hidden = new Set<string>(
        filtered.filter((r: any) => !r.is_active).map((r: any) => r.id)
      );
      setHiddenRobotIds(hidden);
      
      setRobots(filtered as Robot[]);
    }
    setIsLoading(false);
  };

  const fetchUserBalance = async () => {
    if (!effectiveUserId) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('balance')
      .eq('user_id', effectiveUserId)
      .single();
    
    if (data) {
      setUserBalance(data.balance);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Função para exibir símbolos de criptomoedas
  const getCryptoDisplay = (robot: Robot) => {
    if (robot.robot_cryptocurrencies && robot.robot_cryptocurrencies.length > 0) {
      const symbols = robot.robot_cryptocurrencies.map(rc => rc.cryptocurrency.symbol);
      if (symbols.length <= 3) {
        return symbols.join(' / ');
      }
      return `${symbols.slice(0, 3).join(' / ')} +${symbols.length - 3}`;
    }
    return robot.cryptocurrency?.symbol || 'Multi';
  };

  const handleOpenInvestDialog = (robot: Robot) => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para investir',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }
    setSelectedRobot(robot);
    setInvestmentAmount(robot.min_investment.toString());
  };

  const handleInvest = async () => {
    if (!selectedRobot || !effectiveUserId || !investmentAmount) return;
    
    setIsInvesting(true);
    
    const amount = parseFloat(investmentAmount.replace(',', '.'));
    
    // Validations
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Erro',
        description: 'Digite um valor válido',
        variant: 'destructive',
      });
      setIsInvesting(false);
      return;
    }
    
    if (amount < selectedRobot.min_investment) {
      toast({
        title: 'Erro',
        description: `O investimento mínimo é ${formatCurrency(selectedRobot.min_investment)}`,
        variant: 'destructive',
      });
      setIsInvesting(false);
      return;
    }
    
    if (selectedRobot.max_investment && amount > selectedRobot.max_investment) {
      toast({
        title: 'Erro',
        description: `O investimento máximo é ${formatCurrency(selectedRobot.max_investment)}`,
        variant: 'destructive',
      });
      setIsInvesting(false);
      return;
    }
    
    if (amount > userBalance) {
      toast({
        title: 'Saldo insuficiente',
        description: 'Você não tem saldo suficiente para este investimento',
        variant: 'destructive',
      });
      setIsInvesting(false);
      return;
    }
    
    // Calculate lock date
    const lockUntil = addDays(new Date(), selectedRobot.lock_period_days);
    
    // Create investment
    const { error: investError } = await supabase
      .from('investments')
      .insert({
        user_id: effectiveUserId,
        robot_id: selectedRobot.id,
        amount: amount,
        lock_until: lockUntil.toISOString(),
        status: 'active',
      });
    
    if (investError) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o investimento',
        variant: 'destructive',
      });
      setIsInvesting(false);
      return;
    }
    
    // Update user balance
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ balance: userBalance - amount })
      .eq('user_id', effectiveUserId);
    
    if (balanceError) {
      toast({
        title: 'Aviso',
        description: 'Investimento criado mas houve erro ao atualizar saldo',
        variant: 'destructive',
      });
      setIsInvesting(false);
      return;
    }
    
    toast({
      title: 'Investimento realizado!',
      description: `Você investiu ${formatCurrency(amount)} no robô ${selectedRobot.name}`,
    });
    
    setSelectedRobot(null);
    setInvestmentAmount('');
    setIsInvesting(false);
    
    // Redirect to investments page
    navigate('/investments');
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
        <h1 className="text-xl md:text-2xl font-bold text-white">Robôs de Investimento</h1>
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
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {robots.map((robot) => (
            <div 
              key={robot.id} 
              className="group flex flex-col rounded-2xl bg-[#111820] border border-[#1e2a3a] overflow-hidden transition-all duration-300 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/5"
            >
              {/* Gradient top border */}
              <div className="h-1.5 bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-500" />
              
              <div className="p-5 md:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/25 transition-transform duration-300 group-hover:scale-110">
                    <Bot className="h-7 w-7 text-white" />
                  </div>
                  {(robot.robot_cryptocurrencies && robot.robot_cryptocurrencies.length > 0) || robot.cryptocurrency ? (
                    <span className="px-3 py-1.5 rounded-full bg-[#1e2a3a]/80 border border-cyan-500/20 text-cyan-400 text-sm font-semibold backdrop-blur-sm">
                      {getCryptoDisplay(robot)}
                    </span>
                  ) : null}
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-bold text-white group-hover:text-teal-400 transition-colors duration-300">{robot.name}</h3>
                </div>
              </div>

              <div className="px-5 md:px-6 pb-5 md:pb-6 flex-1 space-y-4">
                {/* Profitability highlight */}
                <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-5 shadow-lg shadow-green-500/20">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white/70 font-medium">Rentabilidade Diária</p>
                      <p className="text-2xl font-extrabold text-white tracking-tight">
                        {robot.profit_percentage_min} - {robot.profit_percentage_max}% <span className="text-sm font-normal opacity-80">/ dia</span>
                      </p>
                    </div>
                    <Sparkles className="h-5 w-5 text-white/50 animate-[pulse_3s_ease-in-out_infinite]" />
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/15">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-white/60 font-medium uppercase tracking-wider">Rentabilidade do Período</p>
                      <p className="text-lg font-bold text-white">
                        {(robot.profit_percentage_min * robot.lock_period_days).toFixed(1)} - {(robot.profit_percentage_max * robot.lock_period_days).toFixed(1)}%
                        <span className="text-xs font-normal opacity-70 ml-1">/ {robot.lock_period_days}d</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#0a0f14] border border-white/5 p-4 transition-all duration-200 hover:border-teal-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-teal-400" />
                      <span className="text-xs text-gray-500 font-medium">Período Lock</span>
                    </div>
                    <p className="text-lg font-bold text-white">{robot.lock_period_days} dias</p>
                  </div>

                  <div className="rounded-2xl bg-[#0a0f14] border border-white/5 p-4 transition-all duration-200 hover:border-teal-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-teal-400" />
                      <span className="text-xs text-gray-500 font-medium">Investimento</span>
                    </div>
                    <p className="text-lg font-bold text-white">{formatCurrency(robot.min_investment)}</p>
                    {robot.max_investment && (
                      <p className="text-xs text-gray-500 mt-1">Máx: {formatCurrency(robot.max_investment)}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-6 pt-0 flex gap-2">
                <button
                  onClick={() => setDetailsRobot(robot)}
                  className="flex-1 py-3 rounded-xl border border-[#1e2a3a] text-gray-300 font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:border-teal-500/50 hover:text-teal-400 hover:bg-teal-500/5"
                >
                  <Info className="h-4 w-4" />
                  Detalhes
                </button>
                {hiddenRobotIds.has(robot.id) ? (
                  <div className="flex-1 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-medium flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4" />
                    Encerrado
                  </div>
                ) : (
                  <button 
                    onClick={() => handleOpenInvestDialog(robot)}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/30 hover:brightness-110"
                  >
                    <Sparkles className="h-4 w-4" />
                    Investir Agora
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Investment Dialog */}
      <Dialog open={!!selectedRobot} onOpenChange={() => { setSelectedRobot(null); setInvestmentAmount(''); }}>
        <DialogContent className="bg-[#111820] border-[#1e2a3a] max-w-[95vw] md:max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Bot className="h-5 w-5 text-teal-400" />
              Investir em {selectedRobot?.name}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure o valor do seu investimento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Robot info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#0a0f14] p-3 rounded-lg">
                <p className="text-xs text-gray-500">Rentabilidade</p>
                <p className="text-lg font-bold text-green-400">
                  {selectedRobot?.profit_percentage_min} - {selectedRobot?.profit_percentage_max}% / {selectedRobot?.profit_period_days} dias
                </p>
              </div>
              <div className="bg-[#0a0f14] p-3 rounded-lg">
                <p className="text-xs text-gray-500">Período Lock</p>
                <p className="text-lg font-bold text-white">{selectedRobot?.lock_period_days} dias</p>
              </div>
            </div>
            
            {/* User balance */}
            <div className="flex items-center justify-between p-3 bg-[#0a0f14] rounded-lg">
              <span className="text-gray-400">Seu saldo disponível</span>
              <span className="text-xl font-bold text-white">{formatCurrency(userBalance)}</span>
            </div>
            
            {/* Amount input */}
            <div className="space-y-2">
              <Label className="text-gray-300">Valor do investimento</Label>
              <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="text"
                  placeholder="0,00"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  className="pl-10 bg-[#0a0f14] border-[#1e2a3a] text-white text-lg"
                />
              </div>
              <p className="text-xs text-gray-500">
                Mín: {formatCurrency(selectedRobot?.min_investment || 0)}
                {selectedRobot?.max_investment && ` | Máx: ${formatCurrency(selectedRobot.max_investment)}`}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSelectedRobot(null)}
              className="border-[#1e2a3a] text-gray-300 hover:bg-[#1e2a3a]"
            >
              Cancelar
            </Button>
            <button
              onClick={handleInvest}
              disabled={isInvesting || !investmentAmount}
              className="h-10 px-6 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {isInvesting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Confirmar Investimento
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={!!detailsRobot} onOpenChange={() => setDetailsRobot(null)}>
        <DialogContent className="bg-[#111820] border-[#1e2a3a] max-w-[95vw] md:max-w-lg mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Bot className="h-5 w-5 text-teal-400" />
              {detailsRobot?.name}
            </DialogTitle>
          </DialogHeader>
          {detailsRobot && (
            <div className="divide-y divide-[#1e2a3a]">
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-400 text-sm">Preço do Bot</span>
                <span className="text-white font-semibold">
                  {formatCurrency(detailsRobot.min_investment)}
                  {detailsRobot.max_investment && ` - ${formatCurrency(detailsRobot.max_investment)}`}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-400 text-sm">Período de Funcionamento</span>
                <span className="text-white font-semibold">{detailsRobot.lock_period_days} dias</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-400 text-sm">Lucro Diário</span>
                <span className="text-green-400 font-semibold">
                  {detailsRobot.profit_percentage_min}% - {detailsRobot.profit_percentage_max}%
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-400 text-sm">Rentabilidade do Período</span>
                <span className="text-green-400 font-semibold">
                  {(detailsRobot.profit_percentage_min * detailsRobot.lock_period_days).toFixed(1)}% - {(detailsRobot.profit_percentage_max * detailsRobot.lock_period_days).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-400 text-sm">Período de Lucro</span>
                <span className="text-white font-semibold">{detailsRobot.profit_period_days} dias</span>
              </div>
              {(detailsRobot.robot_cryptocurrencies && detailsRobot.robot_cryptocurrencies.length > 0) && (
                <div className="flex items-center justify-between py-3 gap-4">
                  <span className="text-gray-400 text-sm shrink-0">Pares de Negociação</span>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {detailsRobot.robot_cryptocurrencies.map((rc, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-[#1e2a3a] text-cyan-400 text-xs font-medium">
                        {rc.cryptocurrency.symbol}/USDT
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {detailsRobot.description && (
                <div className="py-3">
                  <span className="text-gray-400 text-sm block mb-2">Estratégia</span>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {detailsRobot.description}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDetailsRobot(null)}
              className="border-[#1e2a3a] text-gray-300 hover:bg-[#1e2a3a] hover:text-white"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Robots;
