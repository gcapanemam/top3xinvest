import { Cpu, Zap, Target, Heart } from "lucide-react";

const advantages = [
  {
    icon: Cpu,
    title: "Trading Automático",
    description: "Processos totalmente automatizados sem necessidade de intervenção manual",
  },
  {
    icon: Zap,
    title: "Eficiência e Velocidade",
    description: "Execução rápida de ordens em milissegundos para aproveitar oportunidades",
  },
  {
    icon: Target,
    title: "Precisão e Consistência",
    description: "Algoritmos que minimizam riscos e maximizam resultados de forma constante",
  },
  {
    icon: Heart,
    title: "Estabilidade Emocional",
    description: "Sem medo ou ganância - decisões baseadas apenas em dados e estatísticas",
  },
];

export const AdvantagesSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-[#0a0f14] to-[#0d1117]">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Vantagens dos <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Robôs de Trading</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Confiabilidade, Velocidade e Investimentos Sem Erros
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {advantages.map((advantage, index) => (
            <div 
              key={advantage.title}
              className="group p-8 rounded-2xl bg-[#111820] border border-white/5 hover:border-teal-500/30 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <advantage.icon className="w-7 h-7 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{advantage.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{advantage.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
