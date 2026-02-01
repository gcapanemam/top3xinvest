import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, Save } from 'lucide-react';

interface Cryptocurrency {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  is_active: boolean;
}

const AdminPrices = () => {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cryptos, setCryptos] = useState<Cryptocurrency[]>([]);
  const [editedPrices, setEditedPrices] = useState<Record<string, { price: string; change: string }>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchCryptos();
    }
  }, [isAdmin]);

  const fetchCryptos = async () => {
    const { data } = await supabase
      .from('cryptocurrencies')
      .select('*')
      .order('symbol');

    if (data) {
      setCryptos(data);
      const prices: Record<string, { price: string; change: string }> = {};
      data.forEach((crypto) => {
        prices[crypto.id] = {
          price: crypto.current_price.toString(),
          change: crypto.price_change_24h.toString(),
        };
      });
      setEditedPrices(prices);
    }
  };

  const handlePriceChange = (id: string, field: 'price' | 'change', value: string) => {
    setEditedPrices((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const saveAllPrices = async () => {
    setIsSaving(true);

    for (const crypto of cryptos) {
      const edited = editedPrices[crypto.id];
      if (!edited) continue;

      const newPrice = parseFloat(edited.price);
      const newChange = parseFloat(edited.change);

      if (isNaN(newPrice) || isNaN(newChange)) continue;

      // Only update if changed
      if (
        newPrice !== crypto.current_price ||
        newChange !== crypto.price_change_24h
      ) {
        await supabase
          .from('cryptocurrencies')
          .update({
            current_price: newPrice,
            price_change_24h: newChange,
          })
          .eq('id', crypto.id);

        // Record price history
        await supabase.from('crypto_price_history').insert({
          cryptocurrency_id: crypto.id,
          price: newPrice,
        });
      }
    }

    toast({
      title: 'Sucesso',
      description: 'Cotações atualizadas!',
    });

    setIsSaving(false);
    fetchCryptos();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: value < 1 ? 6 : 2,
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
          <h1 className="text-2xl font-bold text-white">Gerenciar Cotações</h1>
          <p className="text-gray-400">
            Defina os preços das criptomoedas exibidos na plataforma
          </p>
        </div>
        <button 
          onClick={saveAllPrices} 
          disabled={isSaving} 
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-teal-500/25 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="rounded-xl bg-[#111820] border border-[#1e2a3a]">
        <div className="p-6 border-b border-[#1e2a3a]">
          <h2 className="text-lg font-semibold text-white">Criptomoedas</h2>
          <p className="text-sm text-gray-400">Edite os preços e a variação de 24h de cada criptomoeda</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e2a3a]">
                <th className="text-left p-4 text-gray-400 font-medium">Criptomoeda</th>
                <th className="text-left p-4 text-gray-400 font-medium">Preço Atual (USD)</th>
                <th className="text-left p-4 text-gray-400 font-medium">Variação 24h (%)</th>
                <th className="text-left p-4 text-gray-400 font-medium">Prévia</th>
              </tr>
            </thead>
            <tbody>
              {cryptos.map((crypto) => {
                const edited = editedPrices[crypto.id];
                const change = parseFloat(edited?.change || '0');

                return (
                  <tr key={crypto.id} className="border-b border-[#1e2a3a] hover:bg-[#0a0f14]/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20 font-bold text-teal-400">
                          {crypto.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{crypto.name}</p>
                          <p className="text-sm text-gray-400">{crypto.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Input
                        type="number"
                        step="0.00000001"
                        value={edited?.price || ''}
                        onChange={(e) => handlePriceChange(crypto.id, 'price', e.target.value)}
                        className="w-40 bg-[#0a0f14] border-[#1e2a3a] text-white"
                      />
                    </td>
                    <td className="p-4">
                      <Input
                        type="number"
                        step="0.01"
                        value={edited?.change || ''}
                        onChange={(e) => handlePriceChange(crypto.id, 'change', e.target.value)}
                        className="w-28 bg-[#0a0f14] border-[#1e2a3a] text-white"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {formatCurrency(parseFloat(edited?.price || '0'))}
                        </span>
                        <span
                          className={`flex items-center text-sm ${
                            change >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {change >= 0 ? (
                            <TrendingUp className="mr-1 h-4 w-4" />
                          ) : (
                            <TrendingDown className="mr-1 h-4 w-4" />
                          )}
                          {Math.abs(change).toFixed(2)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPrices;
