import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bot } from "lucide-react";

interface Robot {
  name: string;
  profit_percentage_min: number;
  profit_percentage_max: number;
  min_investment: number;
  lock_period_days: number;
}

const fallbackRobots: Robot[] = [
  { name: "S-BOT (Starter Bot)", profit_percentage_min: 0.30, profit_percentage_max: 3.35, min_investment: 10, lock_period_days: 30 },
  { name: "CP-Bot (Crypto Pulse)", profit_percentage_min: 0.30, profit_percentage_max: 3.45, min_investment: 100, lock_period_days: 45 },
  { name: "CC-Bot (Coin Craft)", profit_percentage_min: 0.55, profit_percentage_max: 3.55, min_investment: 1000, lock_period_days: 60 },
  { name: "PT-Bot (Pro Trade)", profit_percentage_min: 0.75, profit_percentage_max: 3.50, min_investment: 2500, lock_period_days: 60 },
  { name: "BW-Bot (Bit Wise)", profit_percentage_min: 1.05, profit_percentage_max: 3.95, min_investment: 15000, lock_period_days: 60 },
  { name: "CM-Bot (Crypto Master)", profit_percentage_min: 1.15, profit_percentage_max: 4.15, min_investment: 25000, lock_period_days: 50 },
];

const RobotsSlide = () => {
  const [robots, setRobots] = useState<Robot[]>(fallbackRobots);

  useEffect(() => {
    supabase
      .from("robots")
      .select("name, profit_percentage_min, profit_percentage_max, min_investment, lock_period_days")
      .eq("is_active", true)
      .order("min_investment", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setRobots(data);
      });
  }, []);

  const fmt = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(v);

  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-5xl font-bold text-white mb-2">
        Nossos <span style={{ color: "hsl(190, 95%, 50%)" }}>Robôs</span>
      </h2>
      <div className="w-24 h-1 rounded-full mb-10" style={{ background: "hsl(190, 95%, 50%)" }} />

      <div className="flex-1 flex items-center">
        <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}>
          <thead>
            <tr>
              {["Robô", "Rent. Mínima", "Rent. Máxima", "Investimento Mín.", "Lock Period"].map((h) => (
                <th key={h} className="text-left text-lg font-semibold px-8 py-4" style={{ color: "hsl(190, 95%, 50%)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {robots.map((r, i) => (
              <tr
                key={i}
                className="rounded-xl"
                style={{ background: "rgba(17, 24, 32, 0.8)" }}
              >
                <td className="px-8 py-5 text-xl font-bold text-white rounded-l-xl">
                  <div className="flex items-center gap-3">
                    <Bot size={24} style={{ color: "hsl(190, 95%, 50%)" }} />
                    {r.name}
                  </div>
                </td>
                <td className="px-8 py-5 text-xl text-white/80">{r.profit_percentage_min.toFixed(2)}%/dia</td>
                <td className="px-8 py-5 text-xl font-bold" style={{ color: "hsl(145, 80%, 50%)" }}>{r.profit_percentage_max.toFixed(2)}%/dia</td>
                <td className="px-8 py-5 text-xl text-white/80">{fmt(r.min_investment)}</td>
                <td className="px-8 py-5 text-xl text-white/60 rounded-r-xl">{r.lock_period_days} dias</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RobotsSlide;
