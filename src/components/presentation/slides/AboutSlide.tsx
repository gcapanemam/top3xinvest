import { Globe, Cpu, BarChart3, Wallet } from "lucide-react";

const AboutSlide = () => {
  const products = [
    { icon: Cpu, title: "Robôs de Trading", desc: "Algoritmos avançados operando 24/7 nos mercados de criptomoedas" },
    { icon: BarChart3, title: "Gestão de Ativos", desc: "Portfólio diversificado com estratégias automatizadas" },
    { icon: Wallet, title: "Plataforma Digital", desc: "Dashboard completo para acompanhar seus investimentos em tempo real" },
    { icon: Globe, title: "Alcance Global", desc: "Operações em múltiplas exchanges internacionais" },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-5xl font-bold text-white mb-2">
        Quem <span style={{ color: "hsl(190, 95%, 50%)" }}>Somos</span>
      </h2>
      <div className="w-24 h-1 rounded-full mb-10" style={{ background: "hsl(190, 95%, 50%)" }} />

      <div className="flex gap-12 flex-1">
        {/* Left */}
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-2xl text-white/80 leading-relaxed mb-8">
            A <span className="text-white font-bold">N3XPRIME</span> é uma empresa de tecnologia financeira especializada em 
            <span style={{ color: "hsl(190, 95%, 50%)" }}> trading automatizado de criptomoedas</span>. 
            Utilizamos robôs de alta performance com inteligência artificial para gerar rendimentos consistentes.
          </p>
          <p className="text-xl text-white/60 leading-relaxed mb-8">
            Nossa missão é democratizar o acesso a ferramentas profissionais de trading, permitindo que qualquer pessoa 
            possa lucrar com o mercado cripto de forma segura e automatizada.
          </p>
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold" style={{ color: "hsl(190, 95%, 50%)" }}>2024</div>
              <div className="text-white/50 text-lg">Fundação</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold" style={{ color: "hsl(190, 95%, 50%)" }}>6+</div>
              <div className="text-white/50 text-lg">Robôs</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold" style={{ color: "hsl(190, 95%, 50%)" }}>24/7</div>
              <div className="text-white/50 text-lg">Operação</div>
            </div>
          </div>
        </div>

        {/* Right - products */}
        <div className="flex-1 grid grid-cols-2 gap-6 content-center">
          {products.map((p, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl border flex flex-col gap-4"
              style={{ background: "rgba(17, 24, 32, 0.8)", borderColor: "rgba(30, 42, 58, 0.6)" }}
            >
              <p.icon size={36} style={{ color: "hsl(190, 95%, 50%)" }} />
              <div className="text-xl font-bold text-white">{p.title}</div>
              <div className="text-base text-white/50">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutSlide;
