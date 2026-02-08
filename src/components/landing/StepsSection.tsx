import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserPlus, Bot, Wallet, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Cadastre-se",
    description: "Crie sua conta em menos de 2 minutos com apenas email e senha",
  },
  {
    number: "02",
    icon: Bot,
    title: "Escolha um Robô",
    description: "Explore nossa seleção de robôs e escolha o ideal para você",
  },
  {
    number: "03",
    icon: Wallet,
    title: "Lucre!",
    description: "Aproveite os ganhos diários gerados automaticamente",
  },
  {
    number: "04",
    icon: ArrowRight,
    title: "Saque seus Lucros",
    description: "Retire seus rendimentos a qualquer momento, de forma rápida e segura",
  },
];

export const StepsSection = () => {
  return (
    <section className="py-20 bg-[#0a0f14] relative overflow-hidden">
      {/* Connection lines for desktop */}
      <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 w-[600px] h-0.5 bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">3 Passos Simples</span> para Gerar Lucros
          </h2>
          <p className="text-gray-400 text-lg">
            Comece a investir de forma automatizada em poucos minutos
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          {steps.map((step, index) => (
            <div 
              key={step.number}
              className="relative text-center group"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Step number background */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[120px] font-bold text-white/[0.02] leading-none select-none">
                {step.number}
              </div>

              <div className="relative z-10 p-8 rounded-3xl bg-[#111820] border border-white/5 hover:border-teal-500/30 transition-all duration-300 group-hover:-translate-y-2">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-teal-500/25">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                
                <span className="inline-block px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-medium mb-4">
                  Passo {step.number}
                </span>
                
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/auth">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/25 text-base px-8"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
