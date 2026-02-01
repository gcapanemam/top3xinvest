import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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

  const toggleRobotStatus = async (robot: Robot) => {
    await supabase
      .from('robots')
      .update({ is_active: !robot.is_active })
      .eq('id', robot.id);

    fetchData();
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Robôs</h1>
          <p className="text-muted-foreground">Crie e gerencie robôs de investimento</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Robô
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRobot ? 'Editar Robô' : 'Criar Novo Robô'}</DialogTitle>
              <DialogDescription>
                Configure os parâmetros do robô de investimento
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Robô *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Bot BTC Agressivo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crypto">Criptomoeda</Label>
                  <Select
                    value={formData.cryptocurrency_id}
                    onValueChange={(v) => setFormData({ ...formData, cryptocurrency_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptos.map((crypto) => (
                        <SelectItem key={crypto.id} value={crypto.id}>
                          {crypto.symbol} - {crypto.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o robô..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profit">Rentabilidade (%) *</Label>
                  <Input
                    id="profit"
                    type="number"
                    step="0.01"
                    value={formData.profit_percentage}
                    onChange={(e) => setFormData({ ...formData, profit_percentage: e.target.value })}
                    placeholder="Ex: 15"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period">Período (dias)</Label>
                  <Input
                    id="period"
                    type="number"
                    value={formData.profit_period_days}
                    onChange={(e) => setFormData({ ...formData, profit_period_days: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lock">Período Lock (dias)</Label>
                  <Input
                    id="lock"
                    type="number"
                    value={formData.lock_period_days}
                    onChange={(e) => setFormData({ ...formData, lock_period_days: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min">Mín. Investimento (R$)</Label>
                  <Input
                    id="min"
                    type="number"
                    step="0.01"
                    value={formData.min_investment}
                    onChange={(e) => setFormData({ ...formData, min_investment: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max">Máx. Investimento (R$)</Label>
                  <Input
                    id="max"
                    type="number"
                    step="0.01"
                    value={formData.max_investment}
                    onChange={(e) => setFormData({ ...formData, max_investment: e.target.value })}
                    placeholder="Sem limite"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Robô ativo</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {robots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Nenhum robô cadastrado</h3>
            <p className="text-muted-foreground">Crie seu primeiro robô</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {robots.map((robot) => (
            <Card key={robot.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{robot.name}</h3>
                        {robot.cryptocurrency && (
                          <Badge variant="secondary">{robot.cryptocurrency.symbol}</Badge>
                        )}
                        {robot.is_active ? (
                          <Badge className="bg-green-500/20 text-green-600">Ativo</Badge>
                        ) : (
                          <Badge variant="outline">Inativo</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{robot.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Rentabilidade</p>
                      <p className="font-bold text-green-600">
                        {robot.profit_percentage}% / {robot.profit_period_days}d
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Min. Invest.</p>
                      <p className="font-medium">{formatCurrency(robot.min_investment)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Lock</p>
                      <p className="font-medium">{robot.lock_period_days} dias</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(robot)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteRobot(robot.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRobots;
