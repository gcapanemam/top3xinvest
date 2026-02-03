import { useEffect, useState } from "react";

interface Operation {
  symbol: string;
  percent: string;
  type: "BUY" | "SELL";
  color: string;
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

export const FloatingCards = () => {
  const [visibleCards, setVisibleCards] = useState<number[]>([0, 1, 2, 3, 4]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCards((prev) => {
        const newCards = prev.map((index) => (index + 1) % operations.length);
        return newCards;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
      {/* Glow effect background */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-3xl blur-3xl" />
      
      <div className="relative h-full flex flex-col justify-center items-center gap-3">
        {visibleCards.map((operationIndex, i) => {
          const op = operations[operationIndex];
          const delay = i * 0.15;
          const yOffset = (i - 2) * 70;
          
          return (
            <div
              key={`${op.symbol}-${i}`}
              className="floating-card absolute w-[200px] md:w-[240px] px-4 py-3 rounded-xl border border-white/10 backdrop-blur-sm"
              style={{
                background: "linear-gradient(135deg, rgba(17, 24, 32, 0.9) 0%, rgba(17, 24, 32, 0.7) 100%)",
                transform: `translateY(${yOffset}px)`,
                animationDelay: `${delay}s`,
                boxShadow: op.type === "BUY" 
                  ? "0 4px 20px rgba(16, 185, 129, 0.15)" 
                  : "0 4px 20px rgba(239, 68, 68, 0.15)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: op.color }}
                  >
                    {op.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{op.symbol}</p>
                    <p className={`text-xs font-medium ${op.type === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                      +{op.percent}%
                    </p>
                  </div>
                </div>
                <span 
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    op.type === "BUY" 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {op.type}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
