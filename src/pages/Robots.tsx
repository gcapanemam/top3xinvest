import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, TrendingUp, Clock, DollarSign } from 'lucide-react';

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Robôs de Investimento</h1>
        <p className="text-muted-foreground">
          Escolha um robô e comece a investir agora
        </p>
      </div>

      {robots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Nenhum robô disponível</h3>
            <p className="text-muted-foreground">
              Novos robôs serão disponibilizados em breve
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {robots.map((robot) => (
            <Card key={robot.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  {robot.cryptocurrency && (
                    <Badge variant="secondary">{robot.cryptocurrency.symbol}</Badge>
                  )}
                </div>
                <CardTitle className="mt-4">{robot.name}</CardTitle>
                <CardDescription>{robot.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <div className="flex items-center gap-3 rounded-lg bg-green-500/10 p-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Rentabilidade</p>
                    <p className="text-lg font-bold text-green-600">
                      {robot.profit_percentage}% / {robot.profit_period_days} dias
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">Período Lock</span>
                    </div>
                    <p className="mt-1 font-medium">{robot.lock_period_days} dias</p>
                  </div>

                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-xs">Mín. Investimento</span>
                    </div>
                    <p className="mt-1 font-medium">{formatCurrency(robot.min_investment)}</p>
                  </div>
                </div>

                {robot.max_investment && (
                  <p className="text-sm text-muted-foreground">
                    Máximo: {formatCurrency(robot.max_investment)}
                  </p>
                )}
              </CardContent>

              <CardFooter>
                <Button className="w-full">Investir Agora</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Robots;
