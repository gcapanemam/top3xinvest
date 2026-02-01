import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
          <div className="relative">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow animate-pulse-soft">
              <Bot className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-muted-foreground">Carregando robôs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-foreground">Robôs de Investimento</h1>
        <p className="text-muted-foreground">
          Escolha um robô e comece a investir agora
        </p>
      </div>

      {robots.length === 0 ? (
        <Card className="animate-fade-in-up">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Nenhum robô disponível</h3>
            <p className="text-muted-foreground">
              Novos robôs serão disponibilizados em breve
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {robots.map((robot, index) => (
            <Card 
              key={robot.id} 
              className="group flex flex-col animate-fade-in-up hover-lift overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient top border */}
              <div className="h-1 gradient-primary" />
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow group-hover:shadow-glow-lg transition-shadow duration-300">
                    <Bot className="h-7 w-7 text-white" />
                  </div>
                  {robot.cryptocurrency && (
                    <Badge variant="secondary" className="font-semibold">
                      {robot.cryptocurrency.symbol}
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-4 group-hover:text-primary transition-colors">{robot.name}</CardTitle>
                <CardDescription>{robot.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                {/* Profitability highlight */}
                <div className="flex items-center gap-3 rounded-xl gradient-success p-4 shadow-glow-success">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80">Rentabilidade</p>
                    <p className="text-xl font-bold text-white">
                      {robot.profit_percentage}% <span className="text-sm font-normal">/ {robot.profit_period_days} dias</span>
                    </p>
                  </div>
                  <Sparkles className="ml-auto h-5 w-5 text-white/60 animate-pulse-soft" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/50 p-3 transition-all hover:border-primary/30">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">Período Lock</span>
                    </div>
                    <p className="mt-1 font-semibold">{robot.lock_period_days} dias</p>
                  </div>

                  <div className="rounded-xl border border-border/50 p-3 transition-all hover:border-primary/30">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-xs">Mín. Investimento</span>
                    </div>
                    <p className="mt-1 font-semibold">{formatCurrency(robot.min_investment)}</p>
                  </div>
                </div>

                {robot.max_investment && (
                  <p className="text-sm text-muted-foreground">
                    Máximo: {formatCurrency(robot.max_investment)}
                  </p>
                )}
              </CardContent>

              <CardFooter>
                <Button variant="gradient" className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Investir Agora
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Robots;
