import { UserPlus, Wallet, Bot, ArrowRight } from "lucide-react";

const StepsSlide = () => {
  const steps = [
    { icon: UserPlus, step: "01", title: "Cadastre-se", desc: "Crie sua conta gratuita em menos de 2 minutos. Simples, rápido e seguro." },
    { icon: Wallet, step: "02", title: "Deposite", desc: "Faça seu primeiro depósito a partir de $10 usando criptomoedas." },
    { icon: Bot, step: "03", title: "Ative seu Bot", desc: "Escolha o robô ideal para o seu perfil e comece a lucrar automaticamente." },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-5xl font-bold text-white mb-2">
        3 Passos para <span style={{ color: "hsl(190, 95%, 50%)" }}>Começar</span>
      </h2>
      <div className="w-24 h-1 rounded-full mb-12" style={{ background: "hsl(190, 95%, 50%)" }} />

      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-8">
              <div
                className="w-[440px] p-12 rounded-2xl border flex flex-col items-center text-center gap-6"
                style={{ background: "rgba(17, 24, 32, 0.8)", borderColor: "rgba(30, 42, 58, 0.6)" }}
              >
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(0, 200, 200, 0.15)" }}>
                  <s.icon size={40} style={{ color: "hsl(190, 95%, 50%)" }} />
                </div>
                <div className="text-6xl font-black" style={{ color: "hsl(190, 95%, 50%)", opacity: 0.2 }}>{s.step}</div>
                <div className="text-3xl font-bold text-white">{s.title}</div>
                <div className="text-lg text-white/50">{s.desc}</div>
              </div>
              {i < 2 && <ArrowRight size={48} style={{ color: "hsl(190, 95%, 50%)", opacity: 0.4 }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepsSlide;
