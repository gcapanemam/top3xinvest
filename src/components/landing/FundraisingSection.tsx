import { useEffect, useRef, useState } from "react";
import { Target } from "lucide-react";

const GOAL = 300000;
const RAISED = 26850;
const PERCENTAGE = (RAISED / GOAL) * 100;

export const FundraisingSection = () => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 2000;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.floor(eased * RAISED));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started]);

  return (
    <section ref={ref} className="py-20 bg-[#0a0f14]">
      <div className="container mx-auto px-4 max-w-3xl text-center space-y-8">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 mx-auto">
          <Target className="w-7 h-7 text-white" />
        </div>

        {/* Animated value */}
        <div>
          <p className="text-5xl md:text-6xl font-bold text-white tracking-tight">
            ${count.toLocaleString("en-US")}
          </p>
          <p className="text-gray-400 mt-2 text-lg">
            Arrecadado — e crescendo a cada dia.
          </p>
        </div>

        {/* Progress bar */}
        <div className="relative w-full h-5 rounded-full bg-white/5 border border-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-[1500ms] ease-out relative"
            style={{ width: started ? `${PERCENTAGE}%` : "0%" }}
          >
            {/* Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
          </div>
        </div>

        {/* Goal text */}
        <div className="space-y-2">
          <p className="text-white font-semibold text-lg">
            Meta do 1º Ciclo:{" "}
            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              ${GOAL.toLocaleString("en-US")}
            </span>
          </p>
          <p className="text-gray-500 text-sm">
            A N3XPRIME cresce a cada dia, com participantes do mundo inteiro.
          </p>
        </div>
      </div>
    </section>
  );
};
