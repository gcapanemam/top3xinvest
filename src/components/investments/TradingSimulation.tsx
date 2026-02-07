import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, Zap, CheckCircle, Search } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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

interface AnimationStep {
  id: string;
  text: string;
  duration: number;
  progress: number;
  showExchange?: boolean;
  icon: React.ReactNode;
}

const ANIMATION_STEPS: AnimationStep[] = [
  { 
    id: 'analyzing', 
    text: 'Analisando o mercado...', 
    duration: 2500, 
    progress: 25, 
    icon: <Search className="h-4 w-4" /> 
  },
  { 
    id: 'connecting', 
    text: 'Conectando na {exchange}...', 
    duration: 3000, 
    progress: 50, 
    showExchange: true,
    icon: <TrendingUp className="h-4 w-4" /> 
  },
  { 
    id: 'executing', 
    text: 'Executando operações...', 
    duration: 2500, 
    progress: 75,
    icon: <Zap className="h-4 w-4" /> 
  },
  { 
    id: 'finalizing', 
    text: 'Finalizando...', 
    duration: 1500, 
    progress: 100,
    icon: <CheckCircle className="h-4 w-4" /> 
  },
];

interface TradingSimulationProps {
  isActive: boolean;
  compact?: boolean;
}

// Exchange logo component with initials
const ExchangeLogo = ({ name, color, textColor }: { name: string; color: string; textColor: string }) => (
  <div
    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg transition-transform hover:scale-110"
    style={{ backgroundColor: color, color: textColor }}
  >
    {name.slice(0, 2).toUpperCase()}
  </div>
);

export const TradingSimulation = ({ isActive, compact = false }: TradingSimulationProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentExchange, setCurrentExchange] = useState(() => 
    EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)]
  );
  const [displayedProgress, setDisplayedProgress] = useState(0);

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (!isActive || prefersReducedMotion) return;

    const currentStep = ANIMATION_STEPS[currentStepIndex];
    
    // Animate progress smoothly
    const progressInterval = setInterval(() => {
      setDisplayedProgress((prev) => {
        const target = currentStep.progress;
        const diff = target - prev;
        if (Math.abs(diff) < 1) return target;
        return prev + diff * 0.1;
      });
    }, 50);

    // Move to next step after duration
    const stepTimeout = setTimeout(() => {
      const nextIndex = (currentStepIndex + 1) % ANIMATION_STEPS.length;
      
      // Pick new random exchange when restarting cycle
      if (nextIndex === 0) {
        setCurrentExchange(EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)]);
        setDisplayedProgress(0);
      }
      
      setCurrentStepIndex(nextIndex);
    }, currentStep.duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimeout);
    };
  }, [isActive, currentStepIndex, prefersReducedMotion]);

  if (!isActive) return null;

  // For reduced motion, show static state
  if (prefersReducedMotion) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-400">
        <Zap className="h-4 w-4" />
        <span>Operando...</span>
      </div>
    );
  }

  const currentStep = ANIMATION_STEPS[currentStepIndex];
  const displayText = currentStep.text.replace('{exchange}', currentExchange.name);

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-400">
        <div className="animate-spin-slow">
          {currentStep.icon}
        </div>
        <span className="truncate max-w-[150px]">{displayText}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Status line */}
      <div className="flex items-center gap-3">
        {/* Animated icon or exchange logo */}
        <div className={cn(
          "flex items-center justify-center",
          currentStep.showExchange ? "" : "text-green-400"
        )}>
          {currentStep.showExchange ? (
            <ExchangeLogo 
              name={currentExchange.name} 
              color={currentExchange.color} 
              textColor={currentExchange.textColor}
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <div className="animate-pulse">
                {currentStep.icon}
              </div>
            </div>
          )}
        </div>
        
        {/* Text with fade animation */}
        <span 
          key={currentStep.id + currentExchange.name}
          className="text-sm text-gray-300 animate-fade-in"
        >
          {displayText}
        </span>
      </div>

      {/* Progress bar */}
      <Progress 
        value={displayedProgress} 
        className="h-1.5 bg-[#1e2a3a]"
      />
    </div>
  );
};

export default TradingSimulation;
