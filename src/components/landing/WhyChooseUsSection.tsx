import { Check, Zap, Shield, Clock, Users, Headphones } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Interface Intuitiva",
    description: "Plataforma simples e fácil de usar, mesmo para iniciantes",
    highlight: true,
  },
  {
    icon: Headphones,
    title: "Suporte 24/7",
    description: "Equipe dedicada pronta para ajudar a qualquer momento",
    highlight: false,
  },
  {
    icon: Clock,
    title: "Saques Rápidos",
    description: "Processamento de saques em até 24 horas úteis",
    highlight: true,
  },
  {
    icon: Shield,
    title: "100% Seguro",
    description: "Criptografia avançada e autenticação em duas etapas",
    highlight: false,
  },
  {
    icon: Check,
    title: "Sem Conhecimento Técnico",
    description: "Você não precisa entender de trading para lucrar",
    highlight: true,
  },
  {
    icon: Users,
    title: "Comunidade Ativa",
    description: "Milhares de investidores compartilhando resultados",
    highlight: false,
  },
];

const comparisons = [
  { feature: "Investimento mínimo", us: "$1.00", others: "$100+" },
  { feature: "Lucro diário", us: "0.3% - 3%", others: "0.1% - 0.5%" },
  { feature: "Suporte", us: "24/7", others: "Horário comercial" },
  { feature: "Saques", us: "Até 24h", others: "3-7 dias" },
  { feature: "Taxa de plataforma", us: "0%", others: "2-5%" },
];

export const WhyChooseUsSection = () => {
  return (
    <section className="py-20 bg-[#0a0f14] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Por que{" "}
            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              nos escolher?
            </span>
          </h2>
          <p className="text-gray-400 text-lg">
            Descubra as vantagens que fazem a diferença
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                feature.highlight
                  ? "bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border-teal-500/20"
                  : "bg-[#111820] border-white/5 hover:border-white/10"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  feature.highlight
                    ? "bg-gradient-to-br from-teal-500 to-cyan-500"
                    : "bg-white/5"
                }`}
              >
                <feature.icon
                  className={`w-6 h-6 ${feature.highlight ? "text-white" : "text-teal-400"}`}
                />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-white text-center mb-6">
            Comparativo com outras plataformas
          </h3>
          <div className="bg-[#111820] rounded-2xl border border-white/5 overflow-hidden">
            <div className="grid grid-cols-3 gap-4 p-4 bg-white/5 border-b border-white/5">
              <div className="text-gray-400 text-sm font-medium">Recurso</div>
              <div className="text-center">
                <span className="text-teal-400 font-bold">Top3x</span>
              </div>
              <div className="text-center text-gray-500 text-sm">Outros</div>
            </div>
            {comparisons.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-3 gap-4 p-4 border-b border-white/5 last:border-0"
              >
                <div className="text-gray-300 text-sm">{item.feature}</div>
                <div className="text-center">
                  <span className="text-teal-400 font-medium">{item.us}</span>
                </div>
                <div className="text-center text-gray-500 text-sm">{item.others}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
