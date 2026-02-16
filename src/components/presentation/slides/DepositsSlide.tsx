import { Zap, Shield, Clock, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

const DepositsSlide = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-5xl font-bold text-white mb-2">
        Depósitos e <span style={{ color: "hsl(190, 95%, 50%)" }}>Saques</span>
      </h2>
      <div className="w-24 h-1 rounded-full mb-10" style={{ background: "hsl(190, 95%, 50%)" }} />

      <div className="flex-1 flex gap-10 items-center">
        {/* Deposits */}
        <div className="flex-1 p-10 rounded-2xl border" style={{ background: "rgba(17, 24, 32, 0.8)", borderColor: "rgba(30, 42, 58, 0.6)" }}>
          <div className="flex items-center gap-4 mb-8">
            <ArrowDownToLine size={36} style={{ color: "hsl(190, 95%, 50%)" }} />
            <span className="text-3xl font-bold text-white">Depósitos</span>
          </div>
          <div className="space-y-6">
            {[
              { icon: Zap, text: "Processamento instantâneo via criptomoedas" },
              { icon: Shield, text: "Transações criptografadas e seguras" },
              { icon: Clock, text: "Confirmação em minutos na blockchain" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <item.icon size={24} style={{ color: "hsl(190, 95%, 50%)" }} />
                <span className="text-xl text-white/70">{item.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 p-6 rounded-xl text-center" style={{ background: "rgba(0, 200, 200, 0.08)" }}>
            <div className="text-lg text-white/50">Depósito mínimo</div>
            <div className="text-4xl font-bold" style={{ color: "hsl(190, 95%, 50%)" }}>$10</div>
          </div>
        </div>

        {/* Withdrawals */}
        <div className="flex-1 p-10 rounded-2xl border" style={{ background: "rgba(17, 24, 32, 0.8)", borderColor: "rgba(30, 42, 58, 0.6)" }}>
          <div className="flex items-center gap-4 mb-8">
            <ArrowUpFromLine size={36} style={{ color: "hsl(145, 80%, 50%)" }} />
            <span className="text-3xl font-bold text-white">Saques</span>
          </div>
          <div className="space-y-6">
            {[
              { icon: Zap, text: "Processamento rápido e eficiente" },
              { icon: Shield, text: "Verificação de segurança automática" },
              { icon: Clock, text: "Prazo de até 24h para aprovação" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <item.icon size={24} style={{ color: "hsl(145, 80%, 50%)" }} />
                <span className="text-xl text-white/70">{item.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 p-6 rounded-xl text-center" style={{ background: "rgba(0, 200, 100, 0.08)" }}>
            <div className="text-lg text-white/50">Saque disponível</div>
            <div className="text-4xl font-bold" style={{ color: "hsl(145, 80%, 50%)" }}>A qualquer momento</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositsSlide;
