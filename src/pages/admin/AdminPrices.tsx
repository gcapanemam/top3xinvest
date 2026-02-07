import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { createAuditLog } from '@/lib/auditLog';

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
  const [isFetchingReal, setIsFetchingReal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const hasFetchedRef = useRef(false);

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

  // Busca automática de preços reais ao carregar os cryptos
  useEffect(() => {
    if (isAdmin && cryptos.length > 0 && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchAndSaveRealPrices();
    }
  }, [isAdmin, cryptos.length]);

  const fetchCryptos = async () => {
    const { data } = await supabase
      .from('cryptocurrencies')
      .select('*')
      .order('symbol');

    if (data) {
      setCryptos(data);
    }
  };

  const fetchAndSaveRealPrices = async () => {
    if (cryptos.length === 0) return;
    
    setIsFetchingReal(true);

    try {
      const symbols = cryptos.map((c) => c.symbol);

      const { data, error } = await supabase.functions.invoke('fetch-crypto-prices', {
        body: { symbols },
      });

      if (error) throw error;

      // Salvar automaticamente no banco
      for (const crypto of cryptos) {
        if (data[crypto.symbol]) {
          const newPrice = data[crypto.symbol].price;
          const newChange = data[crypto.symbol].change;

          // Só atualiza se houver mudança
          if (newPrice !== crypto.current_price || newChange !== crypto.price_change_24h) {
            await supabase
              .from('cryptocurrencies')
              .update({
                current_price: newPrice,
                price_change_24h: newChange,
              })
              .eq('id', crypto.id);

            // Registrar histórico de preço
            await supabase.from('crypto_price_history').insert({
              cryptocurrency_id: crypto.id,
              price: newPrice,
            });

            // Criar log de auditoria
            await createAuditLog({
              action: 'crypto_price_updated',
              entityType: 'cryptocurrency',
              entityId: crypto.id,
              details: {
                symbol: crypto.symbol,
                previous_price: crypto.current_price,
                new_price: newPrice,
                previous_change: crypto.price_change_24h,
                new_change: newChange,
              },
            });
          }
        }
      }

      setLastUpdated(new Date());
      await fetchCryptos(); // Recarregar dados do banco

      toast({
        title: 'Cotações Atualizadas',
        description: 'Preços sincronizados com o mercado!',
      });
    } catch (error) {
      console.error('Error fetching real prices:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao buscar preços reais',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingReal(false);
    }
  };

  const handleManualRefresh = () => {
    hasFetchedRef.current = false;
    fetchAndSaveRealPrices();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: value < 1 ? 6 : 2,
    }).format(value);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
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
          <h1 className="text-2xl font-bold text-white">Cotações em Tempo Real</h1>
          <p className="text-gray-400">
            Preços atualizados automaticamente do mercado (CoinGecko)
          </p>
          {lastUpdated && (
            <p className="text-sm text-cyan-400 mt-1">
              Última atualização: {formatDateTime(lastUpdated)}
            </p>
          )}
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={isFetchingReal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-teal-500/25 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetchingReal ? 'animate-spin' : ''}`} />
          {isFetchingReal ? 'Atualizando...' : 'Atualizar Agora'}
        </button>
      </div>

      <div className="rounded-xl bg-[#111820] border border-[#1e2a3a]">
        <div className="p-6 border-b border-[#1e2a3a]">
          <h2 className="text-lg font-semibold text-white">Criptomoedas</h2>
          <p className="text-sm text-gray-400">
            Cotações sincronizadas automaticamente com a CoinGecko API
          </p>
        </div>
        
        {isFetchingReal && cryptos.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
              <p className="text-gray-400">Buscando cotações do mercado...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2a3a]">
                  <th className="text-left p-4 text-gray-400 font-medium">Criptomoeda</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Preço (USD)</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Variação 24h</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {cryptos.map((crypto) => {
                  const change = crypto.price_change_24h;

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
                        <span className="font-medium text-white text-lg">
                          {formatCurrency(crypto.current_price)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`flex items-center gap-1 font-medium ${
                            change >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {change >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            crypto.is_active
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {crypto.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPrices;
