import { Bot, User, Zap, Clock, Brain, BarChart3 } from "lucide-react";

const BotVsTraderSlide = () => {
  const comparisons = [
    { aspect: "Processamento de Dados", bot: "Milhões de dados/segundo", trader: "Limitado à capacidade humana", icon: Zap },
    { aspect: "Disponibilidade", bot: "24 horas, 7 dias por semana", trader: "Horário limitado, precisa descansar", icon: Clock },
    { aspect: "Emoções", bot: "Zero influência emocional", trader: "Medo, ganância, ansiedade", icon: Brain },
    { aspect: "Velocidade de Execução", bot: "Milissegundos", trader: "Segundos a minutos", icon: BarChart3 },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-5xl font-bold text-white mb-2">
        Bot vs. <span style={{ color: "hsl(190, 95%, 50%)" }}>Trader Manual</span>
      </h2>
      <div className="w-24 h-1 rounded-full mb-10" style={{ background: "hsl(190, 95%, 50%)" }} />

      {/* Header row */}
      <div className="flex gap-6 mb-6 px-8">
        <div className="flex-1" />
        <div className="w-[400px] text-center flex items-center justify-center gap-3">
          <Bot size={28} style={{ color: "hsl(190, 95%, 50%)" }} />
          <span className="text-2xl font-bold" style={{ color: "hsl(190, 95%, 50%)" }}>Crypto Bot</span>
        </div>
        <div className="w-[400px] text-center flex items-center justify-center gap-3">
          <User size={28} className="text-white/50" />
          <span className="text-2xl font-bold text-white/50">Trader Manual</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {comparisons.map((c, i) => (
          <div key={i} className="flex gap-6 items-stretch">
            <div className="flex-1 flex items-center gap-4 px-8">
              <c.icon size={32} style={{ color: "hsl(190, 95%, 50%)" }} />
              <span className="text-2xl font-semibold text-white">{c.aspect}</span>
            </div>
            <div
              className="w-[400px] p-6 rounded-xl border text-center text-xl text-white font-medium flex items-center justify-center"
              style={{ background: "rgba(0, 200, 200, 0.08)", borderColor: "rgba(0, 200, 200, 0.3)" }}
            >
              {c.bot}
            </div>
            <div
              className="w-[400px] p-6 rounded-xl border text-center text-xl text-white/50 flex items-center justify-center"
              style={{ background: "rgba(17, 24, 32, 0.8)", borderColor: "rgba(30, 42, 58, 0.6)" }}
            >
              {c.trader}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BotVsTraderSlide;
