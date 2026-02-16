import { Rocket, ArrowRight, Mail, Globe } from "lucide-react";

const CTASlide = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-10" style={{ background: "rgba(0, 200, 200, 0.15)" }}>
        <Rocket size={48} style={{ color: "hsl(190, 95%, 50%)" }} />
      </div>

      <h2 className="text-6xl font-bold text-white mb-6 max-w-[1200px]">
        Comece a Lucrar com{" "}
        <span style={{ color: "hsl(190, 95%, 50%)" }}>Crypto-Bots</span> Hoje
      </h2>

      <p className="text-2xl text-white/60 mb-12 max-w-[800px]">
        Junte-se a milhares de investidores que já estão utilizando a tecnologia N3XPRIME para gerar rendimentos diários automatizados.
      </p>

      <a
        href="/auth"
        className="inline-flex items-center gap-3 px-12 py-5 rounded-xl text-2xl font-bold text-white transition-all hover:scale-105"
        style={{ background: "linear-gradient(135deg, hsl(190 95% 45%), hsl(190 95% 35%))" }}
      >
        Criar Conta Grátis
        <ArrowRight size={28} />
      </a>

      <div className="flex gap-12 mt-16">
        <div className="flex items-center gap-3 text-white/40 text-lg">
          <Globe size={20} />
          www.n3xprime.com
        </div>
        <div className="flex items-center gap-3 text-white/40 text-lg">
          <Mail size={20} />
          contato@n3xprime.com
        </div>
      </div>

      <div className="mt-16 text-7xl font-black tracking-tight" style={{ color: "hsl(190, 95%, 50%)", opacity: 0.15 }}>
        N3XPRIME
      </div>
    </div>
  );
};

export default CTASlide;
