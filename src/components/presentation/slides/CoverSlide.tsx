import { Bot, TrendingUp, Shield, Users } from "lucide-react";

const CoverSlide = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center relative">
      {/* Big logo */}
      <div className="text-8xl font-black tracking-tight mb-8" style={{ color: "hsl(190, 95%, 50%)" }}>
        N3X<span className="text-white">PRIME</span>
      </div>

      <h1 className="text-5xl font-bold text-white mb-4 max-w-[1200px] leading-tight">
        Smart Crypto-Bots Gerando{" "}
        <span style={{ color: "hsl(190, 95%, 50%)" }}>Lucros Diários</span>
      </h1>

      <p className="text-2xl text-white/60 mb-16 max-w-[900px]">
        Tecnologia de ponta em trading automatizado de criptomoedas com inteligência artificial
      </p>

      {/* Stats row */}
      <div className="flex gap-12">
        {[
          { icon: Bot, label: "Robôs Ativos", value: "6+" },
          { icon: TrendingUp, label: "Rentabilidade", value: "Até 4.15%/dia" },
          { icon: Shield, label: "Segurança", value: "100%" },
          { icon: Users, label: "Investidores", value: "Global" },
        ].map((stat, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-3 p-8 rounded-2xl border"
            style={{ background: "rgba(17, 24, 32, 0.8)", borderColor: "rgba(30, 42, 58, 0.6)" }}
          >
            <stat.icon size={40} style={{ color: "hsl(190, 95%, 50%)" }} />
            <div className="text-3xl font-bold text-white">{stat.value}</div>
            <div className="text-lg text-white/50">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoverSlide;
