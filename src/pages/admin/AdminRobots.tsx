import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Bot, 
  Edit, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Calendar, 
  CheckCircle, 
  Users,
  Loader2,
  X,
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';
import { createAuditLog } from '@/lib/auditLog';
import { format, subDays } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { ptBR } from 'date-fns/locale';

interface Robot {
  id: string;
  name: string;
  description: string | null;
  cryptocurrency_id: string | null;
  profit_percentage: number;
  profit_period_days: number;
  lock_period_days: number;
  min_investment: number;
  max_investment: number | null;
  is_active: boolean;
  cryptocurrency?: { symbol: string; name: string } | null;
}

interface Cryptocurrency {
  id: string;
  symbol: string;
  name: string;
}

interface RobotStats {
  activeInvestments: number;
  totalVolume: number;
}

interface InvestorData {
  id: string;
  user_id: string;
  amount: number;
  profit_accumulated: number;
  status: string;
  created_at: string;
  full_name?: string | null;
}

interface OperationData {
  id: string;
  cryptocurrency_symbol: string;
  operation_type: string;
  entry_price: number;
  exit_price: number | null;
  profit_percentage: number | null;
  status: string;
  created_at: string;
  closed_at: string | null;
}

interface GeneratedOperation {
  id: number;
  cryptocurrency_symbol: string;
  operation_type: 'buy' | 'sell';
  profit_percentage: number;
  entry_price: number;
  exit_price: number;
}

const CRYPTO_PAIRS = [
  'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT',
  'ADA/USDT', 'DOGE/USDT', 'DOT/USDT', 'MATIC/USDT', 'LINK/USDT'
];

const AdminRobots = () => {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [robots, setRobots] = useState<Robot[]>([]);
  const [cryptos, setCryptos] = useState<Cryptocurrency[]>([]);
  const [robotStats, setRobotStats] = useState<Record<string, RobotStats>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRobot, setEditingRobot] = useState<Robot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Credit Profit Dialog State
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [selectedRobotForCredit, setSelectedRobotForCredit] = useState<Robot | null>(null);
  const [creditPercentage, setCreditPercentage] = useState('');
  const [isCreditingProfit, setIsCreditingProfit] = useState(false);

  // Stats Dialog State
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedRobotForStats, setSelectedRobotForStats] = useState<Robot | null>(null);
  const [statsTab, setStatsTab] = useState<string>('operations');
  const [robotInvestors, setRobotInvestors] = useState<InvestorData[]>([]);
  const [robotOperations, setRobotOperations] = useState<OperationData[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // New Operation Form
  const [newOperation, setNewOperation] = useState({
    cryptocurrency_symbol: 'BNB/USDT',
    operation_type: 'buy',
    entry_price: '',
    exit_price: '',
    profit_percentage: '',
    operation_date: format(new Date(), 'yyyy-MM-dd'),
  });
  const [isAddingOperation, setIsAddingOperation] = useState(false);

  // Auto-generate state
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);
  const [autoGenConfig, setAutoGenConfig] = useState({
    operationCount: 5,
    minProfit: 0.1,
    maxProfit: 0.5,
    allowNegative: false,
    negativeChance: 10,
    selectedPairs: ['BNB/USDT', 'ETH/USDT', 'BTC/USDT'],
    operationDate: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
  });
  const [generatedOperations, setGeneratedOperations] = useState<GeneratedOperation[]>([]);
  const [selectedOperations, setSelectedOperations] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingBulk, setIsAddingBulk] = useState(false);

  // Details dialog state
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRobotForDetails, setSelectedRobotForDetails] = useState<Robot | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cryptocurrency_id: '',
    profit_percentage: '',
    profit_period_days: '30',
    lock_period_days: '7',
    min_investment: '100',
    max_investment: '',
    is_active: true,
  });

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // Auto-calculate profit percentage
  useEffect(() => {
    const entryPrice = parseFloat(newOperation.entry_price);
    const exitPrice = parseFloat(newOperation.exit_price);
    
    if (!isNaN(entryPrice) && !isNaN(exitPrice) && entryPrice > 0) {
      const profit = ((exitPrice - entryPrice) / entryPrice) * 100;
      setNewOperation(prev => ({
        ...prev,
        profit_percentage: profit.toFixed(2)
      }));
    }
  }, [newOperation.entry_price, newOperation.exit_price]);

  const fetchData = async () => {
    const { data: robotsData } = await supabase
      .from('robots')
      .select('*, cryptocurrency:cryptocurrencies(symbol, name)')
      .order('created_at', { ascending: false });

    if (robotsData) {
      setRobots(robotsData as Robot[]);
      
      // Fetch stats for each robot
      const stats: Record<string, RobotStats> = {};
      for (const robot of robotsData) {
        const { data: investmentsData } = await supabase
          .from('investments')
          .select('amount')
          .eq('robot_id', robot.id)
          .eq('status', 'active');
        
        stats[robot.id] = {
          activeInvestments: investmentsData?.length || 0,
          totalVolume: investmentsData?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0,
        };
      }
      setRobotStats(stats);
    }

    const { data: cryptosData } = await supabase
      .from('cryptocurrencies')
      .select('id, symbol, name')
      .eq('is_active', true);

    if (cryptosData) {
      setCryptos(cryptosData);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      cryptocurrency_id: '',
      profit_percentage: '',
      profit_period_days: '30',
      lock_period_days: '7',
      min_investment: '100',
      max_investment: '',
      is_active: true,
    });
    setEditingRobot(null);
  };

  const openEditDialog = (robot: Robot) => {
    setEditingRobot(robot);
    setFormData({
      name: robot.name,
      description: robot.description || '',
      cryptocurrency_id: robot.cryptocurrency_id || '',
      profit_percentage: robot.profit_percentage.toString(),
      profit_period_days: robot.profit_period_days.toString(),
      lock_period_days: robot.lock_period_days.toString(),
      min_investment: robot.min_investment.toString(),
      max_investment: robot.max_investment?.toString() || '',
      is_active: robot.is_active,
    });
    setIsDialogOpen(true);
  };

  const openCreditDialog = (robot: Robot) => {
    setSelectedRobotForCredit(robot);
    setCreditPercentage('');
    setCreditDialogOpen(true);
  };

  const openStatsDialog = async (robot: Robot) => {
    setSelectedRobotForStats(robot);
    setStatsDialogOpen(true);
    setStatsTab('operations');
    setIsLoadingStats(true);

    try {
      // Fetch investors
      const { data: investments } = await supabase
        .from('investments')
        .select('*')
        .eq('robot_id', robot.id)
        .order('created_at', { ascending: false });

      // Fetch profile names for investors
      const investorsWithNames: InvestorData[] = [];
      if (investments && investments.length > 0) {
        const userIds = [...new Set(investments.map(inv => inv.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        
        for (const inv of investments) {
          investorsWithNames.push({
            ...inv,
            full_name: profileMap.get(inv.user_id) || null,
          });
        }
      }

      // Fetch operations
      const { data: operations } = await supabase
        .from('robot_operations')
        .select('*')
        .eq('robot_id', robot.id)
        .order('created_at', { ascending: false });

      setRobotInvestors(investorsWithNames);
      setRobotOperations((operations as OperationData[]) || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleAddOperation = async () => {
    if (!selectedRobotForStats) return;

    if (!newOperation.profit_percentage) {
      toast({
        title: 'Erro',
        description: 'Informe o percentual de lucro',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingOperation(true);

    try {
      const operationDate = new Date(newOperation.operation_date);
      
      const { error } = await supabase.from('robot_operations').insert({
        robot_id: selectedRobotForStats.id,
        cryptocurrency_symbol: newOperation.cryptocurrency_symbol,
        operation_type: newOperation.operation_type,
        entry_price: parseFloat(newOperation.entry_price) || 0,
        exit_price: parseFloat(newOperation.exit_price) || null,
        profit_percentage: parseFloat(newOperation.profit_percentage),
        status: 'closed',
        created_at: operationDate.toISOString(),
        closed_at: operationDate.toISOString(),
      });

      if (error) throw error;

      toast({
        title: 'Operação adicionada!',
        description: `${newOperation.cryptocurrency_symbol} +${newOperation.profit_percentage}%`,
      });

      // Reload operations
      const { data: operations } = await supabase
        .from('robot_operations')
        .select('*')
        .eq('robot_id', selectedRobotForStats.id)
        .order('created_at', { ascending: false });

      setRobotOperations((operations as OperationData[]) || []);
      setStatsTab('operations');

      // Reset form
      setNewOperation({
        cryptocurrency_symbol: 'BNB/USDT',
        operation_type: 'buy',
        entry_price: '',
        exit_price: '',
        profit_percentage: '',
        operation_date: format(new Date(), 'yyyy-MM-dd'),
      });
    } catch (error: any) {
      console.error('Error adding operation:', error);
      toast({
        title: 'Erro ao adicionar operação',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAddingOperation(false);
    }
  };

  const deleteOperation = async (operationId: string) => {
    if (!confirm('Deseja excluir esta operação?')) return;

    try {
      const { error } = await supabase
        .from('robot_operations')
        .delete()
        .eq('id', operationId);

      if (error) throw error;

      setRobotOperations(prev => prev.filter(op => op.id !== operationId));
      toast({ title: 'Operação excluída' });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Generate random operations
  const generateOperations = () => {
    setIsGenerating(true);
    
    const operations: GeneratedOperation[] = [];
    
    for (let i = 0; i < autoGenConfig.operationCount; i++) {
      const pair = autoGenConfig.selectedPairs[
        Math.floor(Math.random() * autoGenConfig.selectedPairs.length)
      ];
      
      const isNegative = autoGenConfig.allowNegative && 
        Math.random() * 100 < autoGenConfig.negativeChance;
      
      let profit = autoGenConfig.minProfit + 
        Math.random() * (autoGenConfig.maxProfit - autoGenConfig.minProfit);
      
      if (isNegative) {
        profit = -profit * 0.5;
      }
      
      const type: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell';
      const entryPrice = 100 + Math.random() * 900;
      const exitPrice = entryPrice * (1 + profit / 100);
      
      operations.push({
        id: i,
        cryptocurrency_symbol: pair,
        operation_type: type,
        profit_percentage: parseFloat(profit.toFixed(2)),
        entry_price: parseFloat(entryPrice.toFixed(2)),
        exit_price: parseFloat(exitPrice.toFixed(2)),
      });
    }
    
    setGeneratedOperations(operations);
    setSelectedOperations(new Set(
      operations
        .filter(op => op.profit_percentage >= 0)
        .map(op => op.id)
    ));
    
    setIsGenerating(false);
  };

  // Toggle operation selection
  const toggleOperationSelection = (id: number) => {
    setSelectedOperations(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Add selected operations in bulk
  const handleAddSelectedOperations = async () => {
    if (!selectedRobotForStats || selectedOperations.size === 0) return;
    
    setIsAddingBulk(true);
    
    try {
      const operationsToAdd = generatedOperations
        .filter(op => selectedOperations.has(op.id));
      
      const insertData = operationsToAdd.map(op => ({
        robot_id: selectedRobotForStats.id,
        cryptocurrency_symbol: op.cryptocurrency_symbol,
        operation_type: op.operation_type,
        entry_price: op.entry_price,
        exit_price: op.exit_price,
        profit_percentage: op.profit_percentage,
        status: 'closed',
        created_at: new Date(autoGenConfig.operationDate).toISOString(),
        closed_at: new Date(autoGenConfig.operationDate).toISOString(),
      }));
      
      const { error } = await supabase
        .from('robot_operations')
        .insert(insertData);
      
      if (error) throw error;
      
      toast({
        title: 'Operações adicionadas!',
        description: `${insertData.length} operação(ões) inserida(s) com sucesso`,
      });
      
      // Reload operations
      const { data: operations } = await supabase
        .from('robot_operations')
        .select('*')
        .eq('robot_id', selectedRobotForStats.id)
        .order('created_at', { ascending: false });
      
      setRobotOperations((operations as OperationData[]) || []);
      setShowAutoGenerate(false);
      setGeneratedOperations([]);
      setStatsTab('operations');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAddingBulk(false);
    }
  };

  // Calculate selected operations total profit
  const getSelectedTotalProfit = () => {
    return generatedOperations
      .filter(op => selectedOperations.has(op.id))
      .reduce((sum, op) => sum + op.profit_percentage, 0);
  };

  // Group operations by date
  const groupOperationsByDate = (operations: OperationData[]) => {
    return operations.reduce((groups, op) => {
      const date = format(new Date(op.created_at), 'dd/MM/yyyy');
      if (!groups[date]) {
        groups[date] = { operations: [], totalProfit: 0 };
      }
      groups[date].operations.push(op);
      groups[date].totalProfit += op.profit_percentage || 0;
      return groups;
    }, {} as Record<string, { operations: OperationData[]; totalProfit: number }>);
  };

  // Calculate stats
  const getStatsMetrics = () => {
    const uniqueDates = new Set(robotOperations.map(op => 
      format(new Date(op.created_at), 'yyyy-MM-dd')
    ));
    const totalDays = uniqueDates.size;
    const totalTrades = robotOperations.length;
    const totalProfit = robotOperations.reduce((sum, op) => sum + (op.profit_percentage || 0), 0);

    return { totalDays, totalTrades, totalProfit };
  };

  const handleCreditProfit = async () => {
    if (!selectedRobotForCredit || !creditPercentage) {
      toast({
        title: 'Erro',
        description: 'Informe o percentual de lucro',
        variant: 'destructive',
      });
      return;
    }

    const percentage = parseFloat(creditPercentage);
    if (isNaN(percentage) || percentage <= 0) {
      toast({
        title: 'Erro',
        description: 'O percentual deve ser maior que zero',
        variant: 'destructive',
      });
      return;
    }

    setIsCreditingProfit(true);

    try {
      const { data, error } = await supabase.rpc('credit_robot_profits', {
        p_robot_id: selectedRobotForCredit.id,
        p_profit_percentage: percentage,
      });

      if (error) throw error;

      const processedCount = data as number;

      // Create audit log
      await createAuditLog({
        action: 'robot_profit_credited',
        entityType: 'robot',
        entityId: selectedRobotForCredit.id,
        details: {
          robot_name: selectedRobotForCredit.name,
          percentage: percentage,
          processed_investments: processedCount,
          estimated_total: estimatedProfit,
        },
      });
      
      toast({
        title: 'Lucro creditado com sucesso!',
        description: `${processedCount} investimento(s) processado(s). Comissões MLM distribuídas automaticamente.`,
      });

      setCreditDialogOpen(false);
      setCreditPercentage('');
      setSelectedRobotForCredit(null);
      fetchData();
    } catch (error: any) {
      console.error('Error crediting profit:', error);
      toast({
        title: 'Erro ao creditar lucro',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setIsCreditingProfit(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.profit_percentage) {
      toast({
        title: 'Erro',
        description: 'Preencha os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const robotData = {
      name: formData.name,
      description: formData.description || null,
      cryptocurrency_id: formData.cryptocurrency_id || null,
      profit_percentage: parseFloat(formData.profit_percentage),
      profit_period_days: parseInt(formData.profit_period_days),
      lock_period_days: parseInt(formData.lock_period_days),
      min_investment: parseFloat(formData.min_investment),
      max_investment: formData.max_investment ? parseFloat(formData.max_investment) : null,
      is_active: formData.is_active,
    };

    let error;

    if (editingRobot) {
      const { error: updateError } = await supabase
        .from('robots')
        .update(robotData)
        .eq('id', editingRobot.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('robots').insert(robotData);
      error = insertError;
    }

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar robô',
        variant: 'destructive',
      });
    } else {
      // Create audit log
      await createAuditLog({
        action: editingRobot ? 'robot_edited' : 'robot_created',
        entityType: 'robot',
        entityId: editingRobot?.id,
        details: {
          robot_name: formData.name,
          profit_percentage: parseFloat(formData.profit_percentage),
          is_active: formData.is_active,
        },
      });

      toast({
        title: 'Sucesso',
        description: editingRobot ? 'Robô atualizado!' : 'Robô criado!',
      });
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    }

    setIsSubmitting(false);
  };

  const deleteRobot = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este robô?')) return;

    const robotToDelete = robots.find(r => r.id === id);

    await supabase.from('robots').delete().eq('id', id);

    // Create audit log
    await createAuditLog({
      action: 'robot_deleted',
      entityType: 'robot',
      entityId: id,
      details: {
        robot_name: robotToDelete?.name,
      },
    });

    fetchData();
    toast({
      title: 'Robô excluído',
      description: 'O robô foi removido com sucesso',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calculate estimated profit for dialog
  const estimatedProfit = selectedRobotForCredit && creditPercentage
    ? (robotStats[selectedRobotForCredit.id]?.totalVolume || 0) * (parseFloat(creditPercentage) / 100)
    : 0;

  const { totalDays, totalTrades, totalProfit } = getStatsMetrics();
  const groupedOperations = groupOperationsByDate(robotOperations);

  if (isLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gerenciar Robôs</h1>
          <p className="text-gray-400">Crie e gerencie robôs de investimento</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-teal-500/25">
              <Plus className="h-4 w-4" />
              Novo Robô
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-[#111820] border-[#1e2a3a] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">{editingRobot ? 'Editar Robô' : 'Criar Novo Robô'}</DialogTitle>
              <DialogDescription className="text-gray-400">
                Configure os parâmetros do robô de investimento
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">Nome do Robô *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Bot BTC Agressivo"
                    className="bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crypto" className="text-gray-300">Criptomoeda</Label>
                  <Select
                    value={formData.cryptocurrency_id}
                    onValueChange={(v) => setFormData({ ...formData, cryptocurrency_id: v })}
                  >
                    <SelectTrigger className="bg-[#0a0f14] border-[#1e2a3a] text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111820] border-[#1e2a3a]">
                      {cryptos.map((crypto) => (
                        <SelectItem key={crypto.id} value={crypto.id} className="text-white hover:bg-[#1e2a3a]">
                          {crypto.symbol} - {crypto.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o robô..."
                  className="bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profit" className="text-gray-300">Rentabilidade (%) *</Label>
                  <Input
                    id="profit"
                    type="number"
                    step="0.01"
                    value={formData.profit_percentage}
                    onChange={(e) => setFormData({ ...formData, profit_percentage: e.target.value })}
                    placeholder="Ex: 15"
                    className="bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period" className="text-gray-300">Período (dias)</Label>
                  <Input
                    id="period"
                    type="number"
                    value={formData.profit_period_days}
                    onChange={(e) => setFormData({ ...formData, profit_period_days: e.target.value })}
                    className="bg-[#0a0f14] border-[#1e2a3a] text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lock" className="text-gray-300">Período Lock (dias)</Label>
                  <Input
                    id="lock"
                    type="number"
                    value={formData.lock_period_days}
                    onChange={(e) => setFormData({ ...formData, lock_period_days: e.target.value })}
                    className="bg-[#0a0f14] border-[#1e2a3a] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min" className="text-gray-300">Mín. Investimento (R$)</Label>
                  <Input
                    id="min"
                    type="number"
                    step="0.01"
                    value={formData.min_investment}
                    onChange={(e) => setFormData({ ...formData, min_investment: e.target.value })}
                    className="bg-[#0a0f14] border-[#1e2a3a] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max" className="text-gray-300">Máx. Investimento (R$)</Label>
                  <Input
                    id="max"
                    type="number"
                    step="0.01"
                    value={formData.max_investment}
                    onChange={(e) => setFormData({ ...formData, max_investment: e.target.value })}
                    placeholder="Sem limite"
                    className="bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label className="text-gray-300">Robô ativo</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-[#1e2a3a] text-gray-300 hover:bg-[#1e2a3a] hover:text-white">
                Cancelar
              </Button>
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-teal-500/25 disabled:opacity-50"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Credit Profit Dialog */}
      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent className="max-w-md bg-[#111820] border-[#1e2a3a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Creditar Lucro
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedRobotForCredit?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="creditPercent" className="text-gray-300">Percentual de lucro (%)</Label>
              <Input
                id="creditPercent"
                type="number"
                step="0.01"
                min="0"
                value={creditPercentage}
                onChange={(e) => setCreditPercentage(e.target.value)}
                placeholder="Ex: 2.5"
                className="bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500">Sobre o valor investido de cada usuário</p>
            </div>

            <div className="rounded-lg bg-[#0a0f14] border border-[#1e2a3a] p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Investimentos ativos:</span>
                <span className="text-white font-medium">
                  {robotStats[selectedRobotForCredit?.id || '']?.activeInvestments || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Volume total:</span>
                <span className="text-white font-medium">
                  {formatCurrency(robotStats[selectedRobotForCredit?.id || '']?.totalVolume || 0)}
                </span>
              </div>
              <div className="border-t border-[#1e2a3a] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Lucro estimado:</span>
                  <span className="text-green-400 font-bold text-lg">
                    {formatCurrency(estimatedProfit)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3">
              <p className="text-yellow-400 text-sm">
                <strong>Atenção:</strong> Esta ação distribuirá comissões MLM automaticamente para os 4 níveis da rede de indicação (100%, 50%, 25%, 10%).
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCreditDialogOpen(false)} 
              className="border-[#1e2a3a] text-gray-300 hover:bg-[#1e2a3a] hover:text-white"
            >
              Cancelar
            </Button>
            <button 
              onClick={handleCreditProfit} 
              disabled={isCreditingProfit || !creditPercentage}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              {isCreditingProfit ? 'Processando...' : 'Confirmar Crédito'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#111820] border-[#1e2a3a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              Estatísticas de Trading
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              <div className="flex items-center gap-2">
                <span>{selectedRobotForStats?.name}</span>
                {selectedRobotForStats?.is_active ? (
                  <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                    Ativo
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 text-xs font-medium">
                    Inativo
                  </span>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          {isLoadingStats ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl bg-white/5 border border-[#1e2a3a] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm font-medium">DIAS:</span>
                    <Calendar className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-white">{totalDays}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-[#1e2a3a] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm font-medium">TRADES:</span>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-white">{totalTrades}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-[#1e2a3a] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm font-medium">PROFIT:</span>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-500">+{totalProfit.toFixed(2)}%</p>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={statsTab} onValueChange={setStatsTab}>
                <TabsList className="grid w-full grid-cols-3 bg-[#0a0f14]">
                  <TabsTrigger value="operations" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Operações
                  </TabsTrigger>
                  <TabsTrigger value="investors" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
                    <Users className="h-4 w-4 mr-2" />
                    Investidores ({robotInvestors.length})
                  </TabsTrigger>
                  <TabsTrigger value="new" className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Operação
                  </TabsTrigger>
                </TabsList>

                {/* Operations Tab */}
                <TabsContent value="operations" className="mt-4">
                  {Object.keys(groupedOperations).length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma operação registrada</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupedOperations).map(([date, data]) => (
                        <div key={date}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-white">{date}</h4>
                            <span className="text-green-400 font-bold">
                              +{data.totalProfit.toFixed(2)}%
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {data.operations.map((op) => (
                              <div 
                                key={op.id}
                                className="relative rounded-xl overflow-hidden group"
                                style={{
                                  background: (op.profit_percentage || 0) >= 0
                                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)'
                                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'
                                }}
                              >
                                {/* Delete button */}
                                <button
                                  onClick={() => deleteOperation(op.id)}
                                  className="absolute top-2 right-2 p-1 rounded bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                                >
                                  <X className="h-3 w-3 text-white" />
                                </button>

                                {/* Tag do par */}
                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/30 rounded text-xs text-white font-medium">
                                  {op.cryptocurrency_symbol}
                                </div>

                                {/* Percentual */}
                                <div className="pt-8 pb-4 px-4 text-center">
                                  <p className="text-2xl font-bold text-white">
                                    {(op.profit_percentage || 0) >= 0 ? '+' : ''}{op.profit_percentage?.toFixed(2)}%
                                  </p>

                                  {/* Tipo: BUY/SELL */}
                                  <span className="inline-block mt-2 px-4 py-1 rounded-full text-sm font-bold bg-black/30 text-white">
                                    {op.operation_type.toUpperCase()}
                                  </span>

                                  {/* Hora */}
                                  <p className="mt-2 text-white/60 text-xs">
                                    {format(new Date(op.created_at), 'HH:mm')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Investors Tab */}
                <TabsContent value="investors" className="mt-4">
                  {robotInvestors.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum investidor neste robô</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {robotInvestors.map((investor) => (
                        <div 
                          key={investor.id} 
                          className="flex items-center justify-between p-4 rounded-lg bg-[#0a0f14] border border-[#1e2a3a]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center">
                              <span className="text-white font-bold">
                                {investor.full_name?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {investor.full_name || 'Usuário'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {format(new Date(investor.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">
                              {formatCurrency(investor.amount)}
                            </p>
                            <p className="text-xs text-green-400">
                              +{formatCurrency(investor.profit_accumulated)}
                            </p>
                          </div>
                          <div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              investor.status === 'active' 
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {investor.status === 'active' ? 'Ativo' : investor.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* New Operation Tab */}
                <TabsContent value="new" className="mt-4">
                  <div className="rounded-lg bg-[#0a0f14] border border-[#1e2a3a] p-6">
                    <h4 className="font-medium text-white mb-4">Nova Operação</h4>
                    
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-gray-300">Par</Label>
                          <Select
                            value={newOperation.cryptocurrency_symbol}
                            onValueChange={(v) => setNewOperation({ ...newOperation, cryptocurrency_symbol: v })}
                          >
                            <SelectTrigger className="bg-[#111820] border-[#1e2a3a] text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#111820] border-[#1e2a3a]">
                              {CRYPTO_PAIRS.map((pair) => (
                                <SelectItem key={pair} value={pair} className="text-white hover:bg-[#1e2a3a]">
                                  {pair}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-300">Tipo</Label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setNewOperation({ ...newOperation, operation_type: 'buy' })}
                              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                                newOperation.operation_type === 'buy'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-[#1e2a3a] text-gray-400 hover:text-white'
                              }`}
                            >
                              BUY
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewOperation({ ...newOperation, operation_type: 'sell' })}
                              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                                newOperation.operation_type === 'sell'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-[#1e2a3a] text-gray-400 hover:text-white'
                              }`}
                            >
                              SELL
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-gray-300">Preço Entrada</Label>
                          <Input
                            type="number"
                            step="0.00000001"
                            value={newOperation.entry_price}
                            onChange={(e) => setNewOperation({ ...newOperation, entry_price: e.target.value })}
                            placeholder="0.00"
                            className="bg-[#111820] border-[#1e2a3a] text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-300">Preço Saída</Label>
                          <Input
                            type="number"
                            step="0.00000001"
                            value={newOperation.exit_price}
                            onChange={(e) => setNewOperation({ ...newOperation, exit_price: e.target.value })}
                            placeholder="0.00"
                            className="bg-[#111820] border-[#1e2a3a] text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-300">% Lucro</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newOperation.profit_percentage}
                            onChange={(e) => setNewOperation({ ...newOperation, profit_percentage: e.target.value })}
                            placeholder="0.00"
                            className="bg-[#111820] border-[#1e2a3a] text-white"
                          />
                          <p className="text-xs text-gray-500">Auto-calculado ou edite</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-300">Data da Operação</Label>
                        <Input
                          type="date"
                          value={newOperation.operation_date}
                          onChange={(e) => setNewOperation({ ...newOperation, operation_date: e.target.value })}
                          className="bg-[#111820] border-[#1e2a3a] text-white"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setStatsTab('operations')} 
                          className="border-[#1e2a3a] text-gray-300 hover:bg-[#1e2a3a] hover:text-white"
                        >
                          Cancelar
                        </Button>
                        <button 
                          onClick={handleAddOperation} 
                          disabled={isAddingOperation || !newOperation.profit_percentage}
                          className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-teal-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isAddingOperation ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          Adicionar Operação
                        </button>
                      </div>

                      {/* Separador */}
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-[#1e2a3a]"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-[#0a0f14] px-4 text-sm text-gray-500">
                            ou
                          </span>
                        </div>
                      </div>

                      {/* Botão Gerar Automaticamente */}
                      <Button
                        variant="outline"
                        onClick={() => setShowAutoGenerate(true)}
                        className="w-full border-dashed border-[#1e2a3a] text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar Operações Automaticamente
                      </Button>
                    </div>
                  </div>

                  {/* Modal de Geração Automática */}
                  {showAutoGenerate && (
                    <div className="mt-4 rounded-lg bg-[#0a0f14] border border-cyan-500/30 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-white flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-cyan-400" />
                          Gerar Operações Automáticas
                        </h4>
                        <button
                          onClick={() => {
                            setShowAutoGenerate(false);
                            setGeneratedOperations([]);
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Configurações */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-gray-300">Quantidade</Label>
                            <Input
                              type="number"
                              min="1"
                              max="20"
                              value={autoGenConfig.operationCount}
                              onChange={(e) => setAutoGenConfig({ ...autoGenConfig, operationCount: parseInt(e.target.value) || 5 })}
                              className="bg-[#111820] border-[#1e2a3a] text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">Data das Operações</Label>
                            <Input
                              type="date"
                              value={autoGenConfig.operationDate}
                              onChange={(e) => setAutoGenConfig({ ...autoGenConfig, operationDate: e.target.value })}
                              className="bg-[#111820] border-[#1e2a3a] text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-gray-300">Lucro Min (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={autoGenConfig.minProfit}
                              onChange={(e) => setAutoGenConfig({ ...autoGenConfig, minProfit: parseFloat(e.target.value) || 0.1 })}
                              className="bg-[#111820] border-[#1e2a3a] text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300">Lucro Max (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={autoGenConfig.maxProfit}
                              onChange={(e) => setAutoGenConfig({ ...autoGenConfig, maxProfit: parseFloat(e.target.value) || 0.5 })}
                              className="bg-[#111820] border-[#1e2a3a] text-white"
                            />
                          </div>
                        </div>

                        {/* Opção de operações negativas */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="allowNegative"
                              checked={autoGenConfig.allowNegative}
                              onCheckedChange={(checked) => setAutoGenConfig({ ...autoGenConfig, allowNegative: !!checked })}
                            />
                            <Label htmlFor="allowNegative" className="text-gray-300 cursor-pointer">
                              Permitir operações negativas
                            </Label>
                          </div>
                          {autoGenConfig.allowNegative && (
                            <div className="flex items-center gap-2">
                              <Label className="text-gray-400 text-sm">Chance:</Label>
                              <Input
                                type="number"
                                min="1"
                                max="50"
                                value={autoGenConfig.negativeChance}
                                onChange={(e) => setAutoGenConfig({ ...autoGenConfig, negativeChance: parseInt(e.target.value) || 10 })}
                                className="bg-[#111820] border-[#1e2a3a] text-white w-20"
                              />
                              <span className="text-gray-400 text-sm">%</span>
                            </div>
                          )}
                        </div>

                        {/* Seleção de pares */}
                        <div className="space-y-2">
                          <Label className="text-gray-300">Pares a Incluir</Label>
                          <div className="flex flex-wrap gap-2">
                            {CRYPTO_PAIRS.slice(0, 6).map((pair) => (
                              <button
                                key={pair}
                                onClick={() => {
                                  const isSelected = autoGenConfig.selectedPairs.includes(pair);
                                  setAutoGenConfig({
                                    ...autoGenConfig,
                                    selectedPairs: isSelected
                                      ? autoGenConfig.selectedPairs.filter(p => p !== pair)
                                      : [...autoGenConfig.selectedPairs, pair],
                                  });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                  autoGenConfig.selectedPairs.includes(pair)
                                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                    : 'bg-[#1e2a3a] text-gray-400 border border-transparent hover:text-white'
                                }`}
                              >
                                {pair}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Botão Gerar */}
                        <Button
                          onClick={generateOperations}
                          disabled={isGenerating || autoGenConfig.selectedPairs.length === 0}
                          className="w-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30"
                        >
                          {isGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Gerar Sugestões
                        </Button>

                        {/* Operações Geradas */}
                        {generatedOperations.length > 0 && (
                          <div className="space-y-3 pt-4 border-t border-[#1e2a3a]">
                            <Label className="text-gray-300">Operações Geradas (selecione as desejadas)</Label>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {generatedOperations.map((op) => (
                                <div
                                  key={op.id}
                                  onClick={() => toggleOperationSelection(op.id)}
                                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                                    selectedOperations.has(op.id)
                                      ? 'bg-cyan-500/10 border border-cyan-500/50'
                                      : 'bg-[#111820] border border-[#1e2a3a] hover:border-gray-600'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={selectedOperations.has(op.id)}
                                      onCheckedChange={() => toggleOperationSelection(op.id)}
                                    />
                                    <span className="text-white font-medium">{op.cryptocurrency_symbol}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                      op.operation_type === 'buy'
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                      {op.operation_type.toUpperCase()}
                                    </span>
                                  </div>
                                  <span className={`font-bold ${
                                    op.profit_percentage >= 0 ? 'text-green-400' : 'text-red-400'
                                  }`}>
                                    {op.profit_percentage >= 0 ? '+' : ''}{op.profit_percentage.toFixed(2)}%
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Resumo e Ação */}
                            <div className="flex items-center justify-between pt-3 border-t border-[#1e2a3a]">
                              <div className="text-sm text-gray-400">
                                Total selecionado:{' '}
                                <span className={`font-bold ${getSelectedTotalProfit() >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {getSelectedTotalProfit() >= 0 ? '+' : ''}{getSelectedTotalProfit().toFixed(2)}%
                                </span>
                              </div>
                              <Button
                                onClick={handleAddSelectedOperations}
                                disabled={isAddingBulk || selectedOperations.size === 0}
                                className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                              >
                                {isAddingBulk ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Plus className="h-4 w-4 mr-2" />
                                )}
                                Adicionar {selectedOperations.size} Operação(ões)
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {robots.length === 0 ? (
        <div className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-12 text-center">
          <Bot className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-white">Nenhum robô cadastrado</h3>
          <p className="text-gray-400">Crie seu primeiro robô</p>
        </div>
      ) : (
        <div className="space-y-4">
          {robots.map((robot) => (
            <div key={robot.id} className="rounded-xl bg-[#111820] border border-[#1e2a3a] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20">
                    <Bot className="h-6 w-6 text-teal-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{robot.name}</h3>
                      {robot.cryptocurrency && (
                        <span className="px-2 py-0.5 rounded-full bg-[#1e2a3a] text-cyan-400 text-xs font-medium">
                          {robot.cryptocurrency.symbol}
                        </span>
                      )}
                      {robot.is_active ? (
                        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 text-xs font-medium">
                          Inativo
                        </span>
                      )}
                      {robot.description && (
                        <button
                          onClick={() => {
                            setSelectedRobotForDetails(robot);
                            setDetailsDialogOpen(true);
                          }}
                          className="p-1 rounded-md bg-[#1e2a3a] hover:bg-teal-500/20 text-gray-400 hover:text-teal-400 transition-all"
                          title="Ver detalhes"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {robotStats[robot.id] && (
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-gray-500">
                          {robotStats[robot.id].activeInvestments} investimento(s) ativo(s)
                        </span>
                        <span className="text-xs text-gray-500">
                          Volume: {formatCurrency(robotStats[robot.id].totalVolume)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Rentabilidade</p>
                    <p className="font-bold text-green-400">
                      {robot.profit_percentage}% / {robot.profit_period_days}d
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Min. Invest.</p>
                    <p className="font-medium text-white">{formatCurrency(robot.min_investment)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Lock</p>
                    <p className="font-medium text-white">{robot.lock_period_days} dias</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all"
                      onClick={() => openStatsDialog(robot)}
                      title="Ver Estatísticas"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </button>
                    <button 
                      className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-all"
                      onClick={() => openCreditDialog(robot)}
                      title="Creditar Lucro"
                    >
                      <DollarSign className="h-4 w-4" />
                    </button>
                    <button 
                      className="p-2 rounded-lg hover:bg-[#1e2a3a] text-gray-400 hover:text-white transition-all"
                      onClick={() => openEditDialog(robot)}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                      onClick={() => deleteRobot(robot.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg bg-[#111820] border-[#1e2a3a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Info className="h-5 w-5 text-teal-400" />
              Detalhes do Robô
            </DialogTitle>
          </DialogHeader>
          {selectedRobotForDetails && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20">
                  <Bot className="h-6 w-6 text-teal-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">{selectedRobotForDetails.name}</h3>
                  {selectedRobotForDetails.cryptocurrency && (
                    <span className="px-2 py-0.5 rounded-full bg-[#1e2a3a] text-cyan-400 text-xs font-medium">
                      {selectedRobotForDetails.cryptocurrency.symbol}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 bg-[#0a0f14] rounded-xl border border-[#1e2a3a]">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {selectedRobotForDetails.description}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDetailsDialogOpen(false)}
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

export default AdminRobots;
