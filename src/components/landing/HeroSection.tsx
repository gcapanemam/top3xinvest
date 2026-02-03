import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { FloatingCards } from "./FloatingCards";

export const HeroSection = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[#0a0f14]">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span className="text-sm text-gray-300">Plataforma Líder em Trading Automatizado</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-white">Smart Crypto-Bots </span>
              <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Gerando Lucros Diários
              </span>
              <span className="text-white"> de 0.3% a 3%</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-xl">
              Mergulhe no mundo dos investimentos com robôs automatizados. 
              <span className="text-white font-medium"> Simples, Emocionante e Lucrativo!</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/25 text-base px-8"
                >
                  Comece Agora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#sobre">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto border-white/20 text-white hover:bg-white/5 text-base px-8"
                >
                  Saiba Mais
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
              <div>
                <p className="text-2xl md:text-3xl font-bold text-white">$2M+</p>
                <p className="text-sm text-gray-500">Volume Total</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-white">15k+</p>
                <p className="text-sm text-gray-500">Usuários Ativos</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-white">99.9%</p>
                <p className="text-sm text-gray-500">Uptime</p>
              </div>
            </div>
          </div>

          {/* Right Content - Floating Cards */}
          <div className="hidden lg:block">
            <FloatingCards />
          </div>
        </div>
      </div>
    </section>
  );
};
