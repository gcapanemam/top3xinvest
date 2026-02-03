import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Percent, TrendingUp, Gift } from "lucide-react";

const levels = [
  { level: 1, percentage: "5%", color: "from-teal-500 to-cyan-500" },
  { level: 2, percentage: "3%", color: "from-cyan-500 to-blue-500" },
  { level: 3, percentage: "2%", color: "from-blue-500 to-violet-500" },
  { level: 4, percentage: "1%", color: "from-violet-500 to-purple-500" },
];

export const PartnersSection = () => {
  return (
    <section id="parceiros" className="py-20 bg-[#0a0f14] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Programa de <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Parceiros</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Ganhe comissões indicando amigos para a plataforma
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left - Info */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Ganhe com sua rede</h3>
                <p className="text-gray-400">
                  Receba comissões sobre todos os investimentos feitos pela sua rede de indicados, 
                  até 4 níveis de profundidade.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Sem limite de indicações</h3>
                <p className="text-gray-400">
                  Convide quantos amigos quiser. Quanto maior sua rede, maior seu potencial de ganhos passivos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Comissões recorrentes</h3>
                <p className="text-gray-400">
                  Receba comissões toda vez que seus indicados realizarem novos investimentos na plataforma.
                </p>
              </div>
            </div>
          </div>

          {/* Right - Levels */}
          <div className="bg-[#111820] rounded-3xl border border-white/5 p-8">
            <h3 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
              <Percent className="w-5 h-5 text-teal-400" />
              Comissões por Nível
            </h3>

            <div className="space-y-4">
              {levels.map((item) => (
                <div key={item.level} className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold`}>
                    {item.level}º
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-400 text-sm">Nível {item.level}</span>
                      <span className="text-white font-bold">{item.percentage}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${item.color}`}
                        style={{ width: item.percentage }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/auth" className="block mt-8">
              <Button className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                Torne-se um Parceiro
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
