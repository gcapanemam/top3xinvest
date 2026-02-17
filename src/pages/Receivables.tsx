import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CalendarIcon, Filter } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StatementRow {
  date: string;
  bonus1: number;
  bonus2: number;
  bonus3: number;
  bonus4: number;
  robotProfits: number;
  total: number;
}

const Receivables = () => {
  const { effectiveUserId } = useAuth();
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [statement, setStatement] = useState<StatementRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const fetchStatement = useCallback(async () => {
    if (!effectiveUserId) return;
    setIsLoading(true);

    const start = startOfDay(startDate).toISOString();
    const end = endOfDay(endDate).toISOString();

    // Fetch commissions and investments in parallel
    const [commissionsRes, investmentsRes] = await Promise.all([
      supabase
        .from('referral_commissions')
        .select('amount, level, created_at')
        .eq('user_id', effectiveUserId)
        .gte('created_at', start)
        .lte('created_at', end),
      supabase
        .from('investments')
        .select('id, amount, robot_id, created_at')
        .eq('user_id', effectiveUserId)
        .eq('status', 'active'),
    ]);

    const commissions = commissionsRes.data || [];
    const investments = investmentsRes.data || [];

    // Fetch robot operations if user has investments
    const robotIds = [...new Set(investments.filter(i => i.robot_id).map(i => i.robot_id!))];
    let operations: { robot_id: string; profit_percentage: number | null; closed_at: string | null }[] = [];

    if (robotIds.length > 0) {
      const { data } = await supabase
        .from('robot_operations')
        .select('robot_id, profit_percentage, closed_at')
        .in('robot_id', robotIds)
        .eq('status', 'closed')
        .gte('closed_at', start)
        .lte('closed_at', end);
      operations = data || [];
    }

    // Group by date
    const grouped: Record<string, StatementRow> = {};

    const getOrCreate = (dateStr: string): StatementRow => {
      if (!grouped[dateStr]) {
        grouped[dateStr] = { date: dateStr, bonus1: 0, bonus2: 0, bonus3: 0, bonus4: 0, robotProfits: 0, total: 0 };
      }
      return grouped[dateStr];
    };

    commissions.forEach(c => {
      const dateStr = c.created_at.slice(0, 10);
      const row = getOrCreate(dateStr);
      const key = `bonus${c.level}` as 'bonus1' | 'bonus2' | 'bonus3' | 'bonus4';
      if (key in row) {
        row[key] += c.amount;
      }
    });

    // For each investment, filter operations that happened AFTER the investment was created
    investments.forEach(inv => {
      if (!inv.robot_id) return;
      const invCreatedAt = new Date(inv.created_at);

      operations
        .filter(op => op.robot_id === inv.robot_id && new Date(op.closed_at!) >= invCreatedAt)
        .forEach(op => {
          if (!op.closed_at || op.profit_percentage == null) return;
          const dateStr = op.closed_at!.slice(0, 10);
          const row = getOrCreate(dateStr);
          row.robotProfits += (inv.amount * op.profit_percentage) / 100;
        });
    });

    // Calculate totals and sort
    const rows = Object.values(grouped)
      .map(r => ({ ...r, total: r.bonus1 + r.bonus2 + r.bonus3 + r.bonus4 + r.robotProfits }))
      .sort((a, b) => b.date.localeCompare(a.date));

    setStatement(rows);
    setIsLoading(false);
  }, [effectiveUserId, startDate, endDate]);

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  const totals = statement.reduce(
    (acc, r) => ({
      bonus1: acc.bonus1 + r.bonus1,
      bonus2: acc.bonus2 + r.bonus2,
      bonus3: acc.bonus3 + r.bonus3,
      bonus4: acc.bonus4 + r.bonus4,
      robotProfits: acc.robotProfits + r.robotProfits,
      total: acc.total + r.total,
    }),
    { bonus1: 0, bonus2: 0, bonus3: 0, bonus4: 0, robotProfits: 0, total: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Extrato de Recebimentos</h1>
        <p className="text-sm md:text-base text-gray-400">
          Acompanhe seus recebimentos de bônus e rendimentos
        </p>
      </div>

      <div className="rounded-xl bg-[#111820] border border-[#1e2a3a]">
        {/* Filters */}
        <div className="p-6 border-b border-[#1e2a3a] flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <span className="text-xs text-gray-400">Data início</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[140px] justify-start text-left font-normal bg-[#0a0f14] border-[#1e2a3a] text-white hover:bg-[#1e2a3a] hover:text-white text-xs">
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {format(startDate, 'dd/MM/yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#111820] border-[#1e2a3a]">
                <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} locale={ptBR} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-gray-400">Data fim</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[140px] justify-start text-left font-normal bg-[#0a0f14] border-[#1e2a3a] text-white hover:bg-[#1e2a3a] hover:text-white text-xs">
                  <CalendarIcon className="mr-2 h-3 w-3" />
                  {format(endDate, 'dd/MM/yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#111820] border-[#1e2a3a]">
                <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} locale={ptBR} />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            onClick={fetchStatement}
            disabled={isLoading}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs hover:shadow-lg hover:shadow-teal-500/25"
          >
            <Filter className="h-3 w-3 mr-1" />
            Filtrar
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1e2a3a] hover:bg-transparent">
                <TableHead className="text-gray-400">Data</TableHead>
                <TableHead className="text-gray-400 text-right">Bônus 1º Nível</TableHead>
                <TableHead className="text-gray-400 text-right">Bônus 2º Nível</TableHead>
                <TableHead className="text-gray-400 text-right">Bônus 3º Nível</TableHead>
                <TableHead className="text-gray-400 text-right">Bônus 4º Nível</TableHead>
                <TableHead className="text-gray-400 text-right">Rend. Robôs</TableHead>
                <TableHead className="text-gray-400 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-[#1e2a3a]">
                  <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : statement.length === 0 ? (
                <TableRow className="border-[#1e2a3a]">
                  <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                    Nenhum recebimento no período
                  </TableCell>
                </TableRow>
              ) : (
                statement.map((row) => (
                  <TableRow key={row.date} className="border-[#1e2a3a] hover:bg-[#1e2a3a]/50">
                    <TableCell className="text-white font-medium">
                      {format(new Date(row.date + 'T00:00:00'), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-right text-gray-300">{formatCurrency(row.bonus1)}</TableCell>
                    <TableCell className="text-right text-gray-300">{formatCurrency(row.bonus2)}</TableCell>
                    <TableCell className="text-right text-gray-300">{formatCurrency(row.bonus3)}</TableCell>
                    <TableCell className="text-right text-gray-300">{formatCurrency(row.bonus4)}</TableCell>
                    <TableCell className="text-right text-gray-300">{formatCurrency(row.robotProfits)}</TableCell>
                    <TableCell className="text-right text-teal-400 font-semibold">{formatCurrency(row.total)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {statement.length > 0 && (
              <TableFooter className="bg-[#0a0f14] border-[#1e2a3a]">
                <TableRow className="border-[#1e2a3a] hover:bg-[#0a0f14]">
                  <TableCell className="text-white font-bold">Total</TableCell>
                  <TableCell className="text-right text-gray-300 font-medium">{formatCurrency(totals.bonus1)}</TableCell>
                  <TableCell className="text-right text-gray-300 font-medium">{formatCurrency(totals.bonus2)}</TableCell>
                  <TableCell className="text-right text-gray-300 font-medium">{formatCurrency(totals.bonus3)}</TableCell>
                  <TableCell className="text-right text-gray-300 font-medium">{formatCurrency(totals.bonus4)}</TableCell>
                  <TableCell className="text-right text-gray-300 font-medium">{formatCurrency(totals.robotProfits)}</TableCell>
                  <TableCell className="text-right text-teal-400 font-bold">{formatCurrency(totals.total)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Receivables;
