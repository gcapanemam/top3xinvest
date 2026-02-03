import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Wallet, Plus, Pencil, Trash2, Copy } from 'lucide-react';
import { createAuditLog } from '@/lib/auditLog';

interface Cryptocurrency {
  id: string;
  symbol: string;
  name: string;
}

interface DepositWallet {
  id: string;
  cryptocurrency_id: string;
  network_name: string;
  wallet_address: string;
  is_active: boolean;
  created_at: string;
  cryptocurrency?: Cryptocurrency;
}

const AdminDepositWallets = () => {
  const { isAdmin, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wallets, setWallets] = useState<DepositWallet[]>([]);
  const [cryptos, setCryptos] = useState<Cryptocurrency[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<DepositWallet | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cryptocurrency_id: '',
    network_name: '',
    wallet_address: '',
    is_active: true,
  });

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchWallets();
      fetchCryptos();
    }
  }, [isAdmin]);

  const fetchWallets = async () => {
    const { data } = await supabase
      .from('deposit_wallets')
      .select(`
        *,
        cryptocurrency:cryptocurrencies(id, symbol, name)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setWallets(data as unknown as DepositWallet[]);
    }
  };

  const fetchCryptos = async () => {
    const { data } = await supabase
      .from('cryptocurrencies')
      .select('id, symbol, name')
      .eq('is_active', true)
      .order('symbol');

    if (data) {
      setCryptos(data);
    }
  };

  const resetForm = () => {
    setFormData({
      cryptocurrency_id: '',
      network_name: '',
      wallet_address: '',
      is_active: true,
    });
    setEditingWallet(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (wallet: DepositWallet) => {
    setEditingWallet(wallet);
    setFormData({
      cryptocurrency_id: wallet.cryptocurrency_id,
      network_name: wallet.network_name,
      wallet_address: wallet.wallet_address,
      is_active: wallet.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.cryptocurrency_id || !formData.network_name || !formData.wallet_address) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    if (editingWallet) {
      // Update
      const { error } = await supabase
        .from('deposit_wallets')
        .update({
          cryptocurrency_id: formData.cryptocurrency_id,
          network_name: formData.network_name,
          wallet_address: formData.wallet_address,
          is_active: formData.is_active,
        })
        .eq('id', editingWallet.id);

      if (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar carteira',
          variant: 'destructive',
        });
      } else {
        await createAuditLog({
          action: 'wallet_updated',
          entityType: 'deposit_wallet',
          entityId: editingWallet.id,
          details: {
            network_name: formData.network_name,
            is_active: formData.is_active,
          },
        });

        toast({
          title: 'Sucesso',
          description: 'Carteira atualizada com sucesso',
        });
        setIsDialogOpen(false);
        resetForm();
        fetchWallets();
      }
    } else {
      // Create
      const { data, error } = await supabase
        .from('deposit_wallets')
        .insert({
          cryptocurrency_id: formData.cryptocurrency_id,
          network_name: formData.network_name,
          wallet_address: formData.wallet_address,
          is_active: formData.is_active,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao criar carteira',
          variant: 'destructive',
        });
      } else {
        await createAuditLog({
          action: 'wallet_created',
          entityType: 'deposit_wallet',
          entityId: data.id,
          details: {
            network_name: formData.network_name,
            wallet_address: formData.wallet_address,
          },
        });

        toast({
          title: 'Sucesso',
          description: 'Carteira criada com sucesso',
        });
        setIsDialogOpen(false);
        resetForm();
        fetchWallets();
      }
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('deposit_wallets')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir carteira',
        variant: 'destructive',
      });
    } else {
      await createAuditLog({
        action: 'wallet_deleted',
        entityType: 'deposit_wallet',
        entityId: id,
        details: {},
      });

      toast({
        title: 'Sucesso',
        description: 'Carteira excluída com sucesso',
      });
      setDeleteConfirm(null);
      fetchWallets();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Endereço copiado para a área de transferência',
    });
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
          <h1 className="text-2xl font-bold text-white">Carteiras de Depósito</h1>
          <p className="text-gray-400">Gerencie os endereços para depósitos em cripto</p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-teal-500/25"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Carteira
        </Button>
      </div>

      {/* Wallets List */}
      <div className="rounded-xl bg-[#111820] border border-[#1e2a3a]">
        <div className="p-6 border-b border-[#1e2a3a]">
          <h2 className="text-lg font-semibold text-white">Carteiras Cadastradas</h2>
          <p className="text-sm text-gray-400">{wallets.length} carteira(s) ativa(s)</p>
        </div>
        <div className="p-6 space-y-4">
          {wallets.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma carteira cadastrada</p>
              <p className="text-sm text-gray-500">Clique em "Nova Carteira" para adicionar</p>
            </div>
          ) : (
            wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="rounded-lg border border-[#1e2a3a] p-4 hover:border-teal-500/30 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500/20 to-yellow-500/20">
                      <Wallet className="h-6 w-6 text-orange-400" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-teal-400">
                          {wallet.cryptocurrency?.symbol}
                        </span>
                        <span className="text-gray-400">-</span>
                        <span className="text-white">{wallet.cryptocurrency?.name}</span>
                        {!wallet.is_active && (
                          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs">
                            Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        Rede: <span className="text-white">{wallet.network_name}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-cyan-400 bg-[#0a0f14] px-2 py-1 rounded truncate max-w-[280px]">
                          {wallet.wallet_address}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-400 hover:text-white hover:bg-[#1e2a3a]"
                          onClick={() => copyToClipboard(wallet.wallet_address)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(wallet)}
                      className="border-[#1e2a3a] text-gray-300 hover:bg-[#1e2a3a] hover:text-white"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirm(wallet.id)}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="bg-[#111820] border-[#1e2a3a] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingWallet ? 'Editar Carteira' : 'Nova Carteira'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure os dados da carteira de depósito
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Criptomoeda *</Label>
              <Select
                value={formData.cryptocurrency_id}
                onValueChange={(value) => setFormData({ ...formData, cryptocurrency_id: value })}
              >
                <SelectTrigger className="bg-[#0a0f14] border-[#1e2a3a] text-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="bg-[#111820] border-[#1e2a3a]">
                  {cryptos.map((crypto) => (
                    <SelectItem
                      key={crypto.id}
                      value={crypto.id}
                      className="text-white hover:bg-[#1e2a3a]"
                    >
                      {crypto.symbol} - {crypto.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Nome da Rede *</Label>
              <Input
                placeholder="Ex: ERC-20, TRC-20, BEP-20, Bitcoin Network"
                value={formData.network_name}
                onChange={(e) => setFormData({ ...formData, network_name: e.target.value })}
                className="bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Endereço da Carteira *</Label>
              <Input
                placeholder="0x... ou bc1... ou T..."
                value={formData.wallet_address}
                onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                className="bg-[#0a0f14] border-[#1e2a3a] text-white placeholder:text-gray-500 font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label className="text-gray-300">Carteira ativa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setIsDialogOpen(false); resetForm(); }}
              className="border-[#1e2a3a] text-gray-300 hover:bg-[#1e2a3a] hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
            >
              {isSubmitting ? 'Salvando...' : editingWallet ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-[#111820] border-[#1e2a3a] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-gray-400">
              Tem certeza que deseja excluir esta carteira? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="border-[#1e2a3a] text-gray-300 hover:bg-[#1e2a3a] hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDepositWallets;
