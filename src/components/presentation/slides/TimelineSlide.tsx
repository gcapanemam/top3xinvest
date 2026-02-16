const TimelineSlide = () => {
  const events = [
    { year: "2024 Q1", title: "Fundação", desc: "Início do desenvolvimento da plataforma e algoritmos de trading" },
    { year: "2024 Q2", title: "Primeiro Robô", desc: "Lançamento do S-BOT com operações automatizadas" },
    { year: "2024 Q3", title: "Expansão", desc: "Lançamento de 5 novos robôs especializados" },
    { year: "2024 Q4", title: "Plataforma 2.0", desc: "Dashboard completo, programa de indicação multinível" },
    { year: "2025 Q1", title: "Crescimento Global", desc: "Expansão internacional e novos mercados" },
    { year: "2025 Q2", title: "IA Avançada", desc: "Implementação de modelos preditivos de próxima geração" },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-5xl font-bold text-white mb-2">
        Nossa <span style={{ color: "hsl(190, 95%, 50%)" }}>Evolução</span>
      </h2>
      <div className="w-24 h-1 rounded-full mb-12" style={{ background: "hsl(190, 95%, 50%)" }} />

      <div className="flex-1 flex items-center">
        <div className="relative w-full">
          {/* Horizontal line */}
          <div className="absolute top-[60px] left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, transparent, hsl(190 95% 45%), hsl(262 83% 58%), transparent)" }} />

          <div className="flex justify-between">
            {events.map((e, i) => (
              <div key={i} className="flex flex-col items-center w-[260px]">
                {/* Dot */}
                <div className="w-5 h-5 rounded-full border-2 mb-4 z-10" style={{ borderColor: "hsl(190, 95%, 50%)", background: i <= 3 ? "hsl(190, 95%, 50%)" : "#0a0f14", marginTop: "50px" }} />
                {/* Card */}
                <div className="p-6 rounded-xl border text-center mt-4" style={{ background: "rgba(17, 24, 32, 0.8)", borderColor: "rgba(30, 42, 58, 0.6)" }}>
                  <div className="text-lg font-bold mb-2" style={{ color: "hsl(190, 95%, 50%)" }}>{e.year}</div>
                  <div className="text-xl font-bold text-white mb-2">{e.title}</div>
                  <div className="text-base text-white/50">{e.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineSlide;
