import { TrendingUp, Clock, Target } from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Altos Lucros",
    description: "Retornos consistentes de 0.3% a 3% ao dia",
  },
  {
    icon: Clock,
    title: "Pagamentos Pontuais",
    description: "Saques processados em até 24 horas",
  },
  {
    icon: Target,
    title: "Estratégias Precisas",
    description: "Algoritmos avançados de trading",
  },
];

export const AboutSection = () => {
  return (
    <section id="sobre" className="py-20 bg-gradient-to-b from-[#0a0f14] to-[#0d1117]">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Conheça o <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Invest Hub</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Seu caminho para investimentos de sucesso em cripto trading
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-gray-300 leading-relaxed">
              O Invest Hub é uma plataforma de investimentos automatizados que utiliza robôs 
              de trading de alta performance para operar no mercado de criptomoedas 24 horas 
              por dia, 7 dias por semana.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Nossa tecnologia proprietária analisa milhares de dados em tempo real para 
              identificar as melhores oportunidades de mercado, gerando lucros consistentes 
              para nossos investidores.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Com uma equipe de especialistas em finanças e tecnologia, garantimos 
              transparência, segurança e resultados comprovados para todos os nossos usuários.
            </p>
          </div>

          <div className="grid gap-4">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="flex items-start gap-4 p-6 rounded-2xl bg-[#111820] border border-white/5 hover:border-teal-500/30 transition-colors"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
