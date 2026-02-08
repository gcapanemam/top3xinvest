import { useMemo } from 'react';
import { cn } from '@/lib/utils';

// Exchange data with brand colors
const EXCHANGES = [
  { name: 'Binance', color: '#F0B90B', textColor: '#000000' },
  { name: 'Coinbase', color: '#0052FF', textColor: '#FFFFFF' },
  { name: 'Upbit', color: '#093687', textColor: '#FFFFFF' },
  { name: 'OKX', color: '#FFFFFF', textColor: '#000000' },
  { name: 'Bybit', color: '#F7A600', textColor: '#000000' },
  { name: 'Bitget', color: '#00F0FF', textColor: '#000000' },
  { name: 'Gate', color: '#2354E6', textColor: '#FFFFFF' },
  { name: 'KuCoin', color: '#24AE8F', textColor: '#FFFFFF' },
  { name: 'MEXC', color: '#2A54DB', textColor: '#FFFFFF' },
  { name: 'HTX', color: '#1C89E5', textColor: '#FFFFFF' },
];

interface TradingSimulationProps {
  isActive: boolean;
}

// Green pulsing dot component
const GreenDot = ({ animate = true }: { animate?: boolean }) => (
  <span 
    className={cn(
      "w-2 h-2 rounded-full bg-green-500 shrink-0",
      animate && "animate-pulse"
    )} 
  />
);

// Exchange logo component with initials
const ExchangeLogo = ({ name, color, textColor }: { name: string; color: string; textColor: string }) => (
  <div
    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shadow-sm shrink-0"
    style={{ backgroundColor: color, color: textColor }}
  >
    {name.slice(0, 2).toUpperCase()}
  </div>
);

// Circular spinner component
const Spinner = ({ animate = true }: { animate?: boolean }) => (
  <div className="relative w-8 h-8 shrink-0">
    <div className="absolute inset-0 rounded-full border-2 border-green-500/20" />
    <div 
      className={cn(
        "absolute inset-0 rounded-full border-2 border-transparent border-t-green-500",
        animate && "animate-spin"
      )} 
    />
  </div>
);

export const TradingSimulation = ({ isActive }: TradingSimulationProps) => {
  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  if (!isActive) return null;

  const shouldAnimate = !prefersReducedMotion;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Title */}
      <p className="text-sm text-gray-400 font-medium">Corretoras conectadas:</p>
      
      {/* Exchange grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {EXCHANGES.map((exchange) => (
          <div 
            key={exchange.name} 
            className="flex items-center gap-2 bg-[#0a0f14]/50 rounded-lg px-2 py-1.5"
          >
            <GreenDot animate={shouldAnimate} />
            <ExchangeLogo 
              name={exchange.name} 
              color={exchange.color} 
              textColor={exchange.textColor}
            />
            <span className="text-xs text-gray-300 truncate">{exchange.name}</span>
          </div>
        ))}
      </div>
      
      {/* Operation indicator */}
      <div className="flex items-center gap-3 pt-2">
        <Spinner animate={shouldAnimate} />
        <span className="text-sm text-green-400 font-medium">Robô em operação</span>
      </div>
    </div>
  );
};

export default TradingSimulation;
