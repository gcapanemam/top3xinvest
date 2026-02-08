import { useState } from "react";
import { Calculator, TrendingUp, PiggyBank } from "lucide-react";

export const ProfitSection = () => {
  const [investment, setInvestment] = useState(1000);
  const dailyRate = 0.015; // 1.5% average

  const profit7Days = investment * dailyRate * 7;
  const profit30Days = investment * dailyRate * 30;
  const profit90Days = investment * dailyRate * 90;
  const profit365Days = investment * dailyRate * 365;

  // CDI anual aproximado (11% ao ano)
  const cdiAnnual = investment * 0.11;
  // Poupança anual aproximada (6% ao ano)
  const savingsAnnual = investment * 0.06;

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

            {/* Projections Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-2xl p-4 border border-teal-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                  <span className="text-gray-400 text-xs">7 dias</span>
                </div>
                <p className="text-xl font-bold text-white">${profit7Days.toFixed(2)}</p>
                <p className="text-emerald-400 text-xs mt-1">+{((profit7Days / investment) * 100).toFixed(1)}%</p>
              </div>

              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl p-4 border border-cyan-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span className="text-gray-400 text-xs">30 dias</span>
                </div>
                <p className="text-xl font-bold text-white">${profit30Days.toFixed(2)}</p>
                <p className="text-emerald-400 text-xs mt-1">+{((profit30Days / investment) * 100).toFixed(1)}%</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500/10 to-violet-500/10 rounded-2xl p-4 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-400 text-xs">90 dias</span>
                </div>
                <p className="text-xl font-bold text-white">${profit90Days.toFixed(2)}</p>
                <p className="text-emerald-400 text-xs mt-1">+{((profit90Days / investment) * 100).toFixed(1)}%</p>
              </div>

              <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-2xl p-4 border border-violet-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                  <span className="text-gray-400 text-xs">1 ano</span>
                </div>
                <p className="text-xl font-bold text-white">${profit365Days.toFixed(2)}</p>
                <p className="text-emerald-400 text-xs mt-1">+{((profit365Days / investment) * 100).toFixed(1)}%</p>
              </div>
            </div>

            {/* Comparison with traditional investments */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <PiggyBank className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300 font-medium">Comparativo anual (investindo ${investment.toLocaleString()})</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Poupança</p>
                  <p className="text-gray-400 font-medium">${savingsAnnual.toFixed(2)}</p>
                  <p className="text-gray-500 text-xs">6% ao ano</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">CDI</p>
                  <p className="text-gray-400 font-medium">${cdiAnnual.toFixed(2)}</p>
                  <p className="text-gray-500 text-xs">11% ao ano</p>
                </div>
                <div className="bg-teal-500/10 rounded-xl p-2 -m-2 border border-teal-500/20">
                  <p className="text-teal-400 text-xs mb-1 font-medium">Top3x</p>
                  <p className="text-teal-400 font-bold">${profit365Days.toFixed(2)}</p>
                  <p className="text-teal-400/70 text-xs">547% ao ano</p>
                </div>
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
