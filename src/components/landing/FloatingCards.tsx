import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Operation {
  symbol: string;
  percent: string;
  type: "BUY" | "SELL";
  color: string;
}

interface CardPosition {
  x: string;
  y: string;
  scale: number;
  delay: number;
  duration: number;
  animationType: "gentle" | "medium" | "strong";
}

const operations: Operation[] = [
  { symbol: "BTC", percent: "0.59", type: "SELL", color: "#F7931A" },
  { symbol: "ETH", percent: "0.94", type: "BUY", color: "#627EEA" },
  { symbol: "XRP", percent: "1.10", type: "BUY", color: "#23292F" },
  { symbol: "BNB", percent: "0.43", type: "SELL", color: "#F3BA2F" },
  { symbol: "SOL", percent: "1.25", type: "BUY", color: "#9945FF" },
  { symbol: "ADA", percent: "0.78", type: "BUY", color: "#0033AD" },
  { symbol: "DOGE", percent: "0.52", type: "SELL", color: "#C2A633" },
];

const cardPositions: CardPosition[] = [
  { x: "5%", y: "8%", scale: 0.9, delay: 0, duration: 4, animationType: "gentle" },
  { x: "55%", y: "5%", scale: 1, delay: 0.5, duration: 3.5, animationType: "medium" },
  { x: "15%", y: "38%", scale: 0.95, delay: 1, duration: 4.5, animationType: "strong" },
  { x: "60%", y: "35%", scale: 1.05, delay: 1.5, duration: 3.8, animationType: "gentle" },
  { x: "8%", y: "68%", scale: 0.85, delay: 2, duration: 5, animationType: "medium" },
  { x: "52%", y: "65%", scale: 0.92, delay: 0.8, duration: 4.2, animationType: "strong" },
];

export const FloatingCards = () => {
  const [operationIndices, setOperationIndices] = useState<number[]>(
    cardPositions.map((_, i) => i % operations.length)
  );
  const [isSwapping, setIsSwapping] = useState<boolean[]>(
    cardPositions.map(() => false)
  );

  useEffect(() => {
    const intervals = cardPositions.map((_, cardIndex) => {
      const baseInterval = 4000 + cardIndex * 800;
      
      return setInterval(() => {
        setIsSwapping((prev) => {
          const newSwapping = [...prev];
          newSwapping[cardIndex] = true;
          return newSwapping;
        });

        setTimeout(() => {
          setOperationIndices((prev) => {
            const newIndices = [...prev];
            newIndices[cardIndex] = (newIndices[cardIndex] + 1) % operations.length;
            return newIndices;
          });

          setTimeout(() => {
            setIsSwapping((prev) => {
              const newSwapping = [...prev];
              newSwapping[cardIndex] = false;
              return newSwapping;
            });
          }, 150);
        }, 200);
      }, baseInterval);
    });

    return () => intervals.forEach(clearInterval);
  }, []);

  const getAnimationClass = (type: CardPosition["animationType"]) => {
    switch (type) {
      case "gentle":
        return "animate-float-gentle";
      case "medium":
        return "animate-float-medium";
      case "strong":
        return "animate-float-strong";
    }
  };

  return (
    <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
      {/* Enhanced glow background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-emerald-500/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-cyan-500/8 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-teal-500/5 rounded-full blur-[60px]" />
      </div>

      {/* Floating Cards */}
      {cardPositions.map((position, index) => {
        const op = operations[operationIndices[index]];
        const swapping = isSwapping[index];

        return (
          <div
            key={index}
            className={`absolute ${getAnimationClass(position.animationType)}`}
            style={{
              left: position.x,
              top: position.y,
              transform: `scale(${position.scale})`,
              animationDelay: `${position.delay}s`,
              animationDuration: `${position.duration}s`,
            }}
          >
            <div
              className={`w-[180px] md:w-[200px] px-4 py-3 rounded-xl border backdrop-blur-md transition-all duration-300 ${
                swapping ? "opacity-0 scale-95" : "opacity-100 scale-100"
              }`}
              style={{
                background: "linear-gradient(135deg, rgba(17, 24, 32, 0.95) 0%, rgba(17, 24, 32, 0.8) 100%)",
                borderColor: op.type === "BUY" 
                  ? "rgba(16, 185, 129, 0.3)" 
                  : "rgba(239, 68, 68, 0.3)",
                boxShadow: op.type === "BUY"
                  ? "0 8px 32px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)"
                  : "0 8px 32px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Crypto icon */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                    style={{ 
                      backgroundColor: op.color,
                      boxShadow: `0 4px 12px ${op.color}40`
                    }}
                  >
                    {op.symbol.slice(0, 2)}
                  </div>
                  
                  <div>
                    <p className="text-white font-semibold text-sm tracking-wide">{op.symbol}</p>
                    <div className="flex items-center gap-1">
                      {op.type === "BUY" ? (
                        <TrendingUp className="w-3 h-3 text-emerald-400 animate-pulse-arrow" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400 animate-pulse-arrow" />
                      )}
                      <p className={`text-sm font-bold ${
                        op.type === "BUY" ? "text-emerald-400" : "text-red-400"
                      }`}>
                        +{op.percent}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Type badge */}
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wider ${
                    op.type === "BUY"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}
                >
                  {op.type}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
