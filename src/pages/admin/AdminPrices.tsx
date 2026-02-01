import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Coins, TrendingUp, TrendingDown, Save } from 'lucide-react';

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Cotações</h1>
          <p className="text-muted-foreground">
            Defina os preços das criptomoedas exibidos na plataforma
          </p>
        </div>
        <Button onClick={saveAllPrices} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criptomoedas</CardTitle>
          <CardDescription>
            Edite os preços e a variação de 24h de cada criptomoeda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Criptomoeda</TableHead>
                <TableHead>Preço Atual (USD)</TableHead>
                <TableHead>Variação 24h (%)</TableHead>
                <TableHead>Prévia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cryptos.map((crypto) => {
                const edited = editedPrices[crypto.id];
                const change = parseFloat(edited?.change || '0');

                return (
                  <TableRow key={crypto.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                          {crypto.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <p className="font-medium">{crypto.name}</p>
                          <p className="text-sm text-muted-foreground">{crypto.symbol}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.00000001"
                        value={edited?.price || ''}
                        onChange={(e) => handlePriceChange(crypto.id, 'price', e.target.value)}
                        className="w-40"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={edited?.change || ''}
                        onChange={(e) => handlePriceChange(crypto.id, 'change', e.target.value)}
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatCurrency(parseFloat(edited?.price || '0'))}
                        </span>
                        <span
                          className={`flex items-center text-sm ${
                            change >= 0 ? 'text-green-600' : 'text-red-600'
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPrices;
