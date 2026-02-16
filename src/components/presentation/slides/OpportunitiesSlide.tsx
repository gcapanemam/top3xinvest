import { Lightbulb, Handshake, HeadphonesIcon, Settings } from "lucide-react";

const OpportunitiesSlide = () => {
  const items = [
    { icon: Lightbulb, title: "Oportunidades de Investimento", desc: "Escolha entre diferentes robôs com perfis de risco e retorno variados, desde $10 até investimentos premium." },
    { icon: Settings, title: "Papel da Empresa", desc: "Desenvolvemos, monitoramos e otimizamos os algoritmos de trading. Você investe, nós operamos." },
    { icon: Handshake, title: "Programa de Parceria", desc: "Indique amigos e ganhe comissões em até 4 níveis da sua rede. Construa sua equipe e multiplique seus ganhos." },
    { icon: HeadphonesIcon, title: "Suporte Dedicado", desc: "Equipe especializada disponível para ajudar com qualquer dúvida sobre investimentos e plataforma." },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-5xl font-bold text-white mb-2">
        Ferramentas para o <span style={{ color: "hsl(190, 95%, 50%)" }}>Sucesso</span>
      </h2>
      <div className="w-24 h-1 rounded-full mb-10" style={{ background: "hsl(190, 95%, 50%)" }} />

      <div className="flex-1 flex items-center">
        <div className="grid grid-cols-2 gap-8 w-full">
          {items.map((item, i) => (
            <div
              key={i}
              className="p-10 rounded-2xl border flex gap-6 items-start"
              style={{ background: "rgba(17, 24, 32, 0.8)", borderColor: "rgba(30, 42, 58, 0.6)" }}
            >
              <div className="p-4 rounded-xl shrink-0" style={{ background: "rgba(0, 200, 200, 0.1)" }}>
                <item.icon size={40} style={{ color: "hsl(190, 95%, 50%)" }} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-3">{item.title}</div>
                <div className="text-lg text-white/60 leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OpportunitiesSlide;
