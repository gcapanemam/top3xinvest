import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, TrendingUp, Shield } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="py-20 bg-[#0a0f14] relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Main CTA Card */}
          <div className="relative rounded-3xl overflow-hidden">
            {/* Gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-500 opacity-20" />
            
            <div className="relative m-[1px] rounded-3xl bg-gradient-to-br from-[#111820] via-[#0a0f14] to-[#111820] p-8 md:p-12">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-6">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span className="text-sm text-teal-400 font-medium">Comece gratuitamente</span>
                </div>

                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                  Pronto para começar a{" "}
                  <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                    lucrar?
                  </span>
                </h2>

                <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-8">
                  Junte-se a milhares de investidores que já estão gerando renda passiva
                  com nossos robôs de trading automatizado
                </p>

                {/* Stats row */}
                <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-10">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-400" />
                    <span className="text-white font-medium">15,000+ usuários</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <span className="text-white font-medium">$2.5M+ pagos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <span className="text-white font-medium">100% seguro</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Link to="/auth">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/25 text-lg px-10 py-6 h-auto hover:scale-105 transition-transform"
                  >
                    Criar Conta Grátis
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>

                <p className="text-gray-500 text-sm mt-4">
                  Sem taxas ocultas • Depósito mínimo de $1.00 • Suporte 24/7
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
