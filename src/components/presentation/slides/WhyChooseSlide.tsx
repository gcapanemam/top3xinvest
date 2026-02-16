import { Sparkles, Eye, Shield, Sliders, Check, X } from "lucide-react";

const WhyChooseSlide = () => {
  const advantages = [
    { icon: Sparkles, title: "Inovação", desc: "Algoritmos de última geração com IA" },
    { icon: Eye, title: "Transparência", desc: "Acompanhe tudo em tempo real" },
    { icon: Shield, title: "Segurança", desc: "Fundos protegidos e criptografados" },
    { icon: Sliders, title: "Flexibilidade", desc: "Planos a partir de $10" },
  ];

  const comparison = [
    { feature: "Trading Automatizado 24/7", us: true, others: false },
    { feature: "Múltiplos Robôs Especializados", us: true, others: false },
    { feature: "A partir de $10", us: true, others: false },
    { feature: "Programa de Indicação Multinível", us: true, others: false },
    { feature: "Dashboard em Tempo Real", us: true, others: true },
    { feature: "Saques Rápidos", us: true, others: false },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-5xl font-bold text-white mb-2">
        Por que Escolher a <span style={{ color: "hsl(190, 95%, 50%)" }}>N3XPRIME</span>
      </h2>
      <div className="w-24 h-1 rounded-full mb-8" style={{ background: "hsl(190, 95%, 50%)" }} />

      <div className="flex gap-10 flex-1">
        {/* Left - advantages */}
        <div className="flex-1 grid grid-cols-2 gap-5 content-center">
          {advantages.map((a, i) => (
            <div key={i} className="p-7 rounded-2xl border flex flex-col gap-3" style={{ background: "rgba(17, 24, 32, 0.8)", borderColor: "rgba(30, 42, 58, 0.6)" }}>
              <a.icon size={32} style={{ color: "hsl(190, 95%, 50%)" }} />
              <div className="text-xl font-bold text-white">{a.title}</div>
              <div className="text-base text-white/50">{a.desc}</div>
            </div>
          ))}
        </div>

        {/* Right - comparison table */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="rounded-2xl border overflow-hidden" style={{ background: "rgba(17, 24, 32, 0.8)", borderColor: "rgba(30, 42, 58, 0.6)" }}>
            <div className="flex px-6 py-4" style={{ background: "rgba(0, 200, 200, 0.1)" }}>
              <div className="flex-1 text-lg font-bold text-white">Recurso</div>
              <div className="w-32 text-center text-lg font-bold" style={{ color: "hsl(190, 95%, 50%)" }}>N3XPRIME</div>
              <div className="w-32 text-center text-lg font-bold text-white/40">Outros</div>
            </div>
            {comparison.map((c, i) => (
              <div key={i} className="flex px-6 py-4 border-t" style={{ borderColor: "rgba(30, 42, 58, 0.4)" }}>
                <div className="flex-1 text-lg text-white/80">{c.feature}</div>
                <div className="w-32 flex justify-center">
                  <Check size={24} style={{ color: "hsl(145, 80%, 50%)" }} />
                </div>
                <div className="w-32 flex justify-center">
                  {c.others ? <Check size={24} className="text-white/30" /> : <X size={24} className="text-red-400/60" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhyChooseSlide;
