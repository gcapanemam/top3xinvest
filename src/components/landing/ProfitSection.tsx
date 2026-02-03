import { useState } from "react";
import { Calculator, TrendingUp } from "lucide-react";

export const ProfitSection = () => {
  const [investment, setInvestment] = useState(1000);
  const dailyRate = 0.015; // 1.5% average

  const profit7Days = investment * dailyRate * 7;
  const profit30Days = investment * dailyRate * 30;

  return (
    <section id="robos" className="py-20 bg-[#0a0f14] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            De <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">0.3% a 3%</span> de lucro líquido por dia!
          </h2>
          <p className="text-gray-400 text-lg">
            Maximize seu potencial de investimento! Ative seu robô e veja seu portfólio crescer.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Calculator */}
          <div className="bg-[#111820] rounded-3xl border border-white/5 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg">Simulador de Lucros</h3>
            </div>

            <div className="mb-8">
              <label className="text-gray-400 text-sm mb-2 block">Valor do Investimento (USD)</label>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={investment}
                onChange={(e) => setInvestment(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <div className="flex justify-between mt-2">
                <span className="text-gray-500 text-sm">$100</span>
                <span className="text-2xl font-bold text-white">${investment.toLocaleString()}</span>
                <span className="text-gray-500 text-sm">$10,000</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-2xl p-6 border border-teal-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-teal-400" />
                  <span className="text-gray-400 text-sm">Lucro em 7 dias</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  ${profit7Days.toFixed(2)}
                </p>
                <p className="text-emerald-400 text-sm mt-1">+{((profit7Days / investment) * 100).toFixed(1)}%</p>
              </div>

              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl p-6 border border-cyan-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <span className="text-gray-400 text-sm">Lucro em 30 dias</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  ${profit30Days.toFixed(2)}
                </p>
                <p className="text-emerald-400 text-sm mt-1">+{((profit30Days / investment) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm">
            * Valores estimados baseados em taxa média de 1.5% ao dia. Resultados podem variar.
          </p>
        </div>
      </div>
    </section>
  );
};
