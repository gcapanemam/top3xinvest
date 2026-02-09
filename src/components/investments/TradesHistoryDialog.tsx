import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Operation {
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

interface TradesHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  robotName: string;
  operations: Operation[];
  isLoading: boolean;
}

interface DaySummary {
  date: string;
  operations: Operation[];
  totalProfit: number;
  accumulatedProfit: number;
}

export const TradesHistoryDialog = ({
  open,
  onOpenChange,
  robotName,
  operations,
  isLoading,
}: TradesHistoryDialogProps) => {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const dailySummaries: DaySummary[] = useMemo(() => {
    if (!operations.length) return [];

    // Group by day
    const grouped = operations.reduce((acc, op) => {
      const day = format(new Date(op.created_at), 'yyyy-MM-dd');
      if (!acc[day]) acc[day] = [];
      acc[day].push(op);
      return acc;
    }, {} as Record<string, Operation[]>);

    // Sort ascending for accumulated calculation
    const sorted = Object.entries(grouped)
      .map(([date, ops]) => ({
        date,
        operations: ops,
        totalProfit: ops.reduce((sum, op) => sum + (op.profit_percentage || 0), 0),
        accumulatedProfit: 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate accumulated
    let accumulated = 0;
    for (const day of sorted) {
      accumulated += day.totalProfit;
      day.accumulatedProfit = accumulated;
    }

    // Return descending
    return sorted.reverse();
  }, [operations]);

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-[#111820] border-[#1e2a3a] text-white flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <History className="h-5 w-5 text-green-400" />
            Histórico de Trades - {robotName}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {operations.length} operação(ões) realizada(s)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
            </div>
          ) : dailySummaries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Nenhuma operação registrada ainda
            </div>
          ) : (
            dailySummaries.map((day) => {
              const isExpanded = expandedDays.has(day.date);
              return (
                <div key={day.date} className="rounded-xl bg-[#0a0f14] border border-[#1e2a3a] overflow-hidden">
                  {/* Day header */}
                  <button
                    onClick={() => toggleDay(day.date)}
                    className="w-full flex items-center justify-between p-4 hover:bg-[#1e2a3a]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-gray-400 transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}
                      />
                      <span className="font-medium text-white">
                        {format(new Date(day.date + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      <span className="text-xs text-gray-400">
                        {day.operations.length} trade(s)
                      </span>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "font-bold text-sm",
                          day.totalProfit >= 0 ? "text-green-400" : "text-red-400"
                        )}
                      >
                        {day.totalProfit >= 0 ? '+' : ''}
                        {day.totalProfit.toFixed(2)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        Acumulado: {day.accumulatedProfit >= 0 ? '+' : ''}
                        {day.accumulatedProfit.toFixed(2)}%
                      </p>
                    </div>
                  </button>

                  {/* Expanded trades grid */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-[#1e2a3a]">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
                        {day.operations.map((op) => (
                          <div
                            key={op.id}
                            className={cn(
                              "rounded-xl p-4 flex flex-col items-center gap-2",
                              (op.profit_percentage || 0) >= 0
                                ? "bg-green-500"
                                : "bg-red-500"
                            )}
                          >
                            <span className="text-xs font-bold text-white bg-black/20 px-2 py-0.5 rounded">
                              {op.cryptocurrency_symbol}
                            </span>
                            <span className="text-2xl font-bold text-white">
                              {(op.profit_percentage || 0) >= 0 ? '+' : ''}
                              {op.profit_percentage?.toFixed(2)}%
                            </span>
                            <span className="text-xs font-bold text-white bg-black/20 px-3 py-1 rounded-full">
                              {op.operation_type.toUpperCase()}
                            </span>
                            <span className="text-xs text-white/80">
                              {format(new Date(op.created_at), 'HH:mm')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
