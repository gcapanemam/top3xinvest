import { Shield, FileSearch, Lock, AlertTriangle } from "lucide-react";

const securityFeatures = [
  {
    icon: Shield,
    title: "Criptografia de Dados",
    description: "Seus dados protegidos com criptografia de ponta",
  },
  {
    icon: FileSearch,
    title: "Auditorias Regulares",
    description: "Verificações constantes de segurança",
  },
  {
    icon: Lock,
    title: "Controle de Acesso",
    description: "Autenticação em duas etapas disponível",
  },
  {
    icon: AlertTriangle,
    title: "Proteção Anti-Phishing",
    description: "Sistemas avançados contra fraudes",
  },
];

export const SecuritySection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-[#0d1117] to-[#0a0f14]">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Sua <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Segurança</span> é Nossa Prioridade
          </h2>
          <p className="text-gray-400 text-lg">
            Investimos constantemente em tecnologia para proteger seu capital
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {securityFeatures.map((feature, index) => (
            <div 
              key={feature.title}
              className="group text-center p-6 rounded-2xl bg-[#111820] border border-white/5 hover:border-teal-500/30 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-8 h-8 text-teal-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
