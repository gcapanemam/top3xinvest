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
import { Plus, Bot, Edit, Trash2 } from 'lucide-react';

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

const AdminRobots = () => {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [robots, setRobots] = useState<Robot[]>([]);
  const [cryptos, setCryptos] = useState<Cryptocurrency[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRobot, setEditingRobot] = useState<Robot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const fetchData = async () => {
    const { data: robotsData } = await supabase
      .from('robots')
      .select('*, cryptocurrency:cryptocurrencies(symbol, name)')
      .order('created_at', { ascending: false });

    if (robotsData) {
      setRobots(robotsData as Robot[]);
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

    await supabase.from('robots').delete().eq('id', id);
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
                    </div>
                    <p className="text-sm text-gray-400">{robot.description}</p>
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
    </div>
  );
};

export default AdminRobots;
