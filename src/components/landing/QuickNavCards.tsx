import { Play, Bot, Users, Info } from "lucide-react";

const cards = [
  {
    icon: Play,
    title: "Vídeo Apresentação",
    description: "Conheça o Invest Hub",
    color: "from-rose-500 to-pink-500",
    href: "#video",
  },
  {
    icon: Bot,
    title: "Robôs",
    description: "Aumente seu capital em até 89%/mês",
    color: "from-teal-500 to-cyan-500",
    href: "#robos",
  },
  {
    icon: Users,
    title: "Parceiros",
    description: "Ganhe com sua rede de indicados",
    color: "from-violet-500 to-purple-500",
    href: "#parceiros",
  },
  {
    icon: Info,
    title: "Sobre Nós",
    description: "Conheça mais detalhes",
    color: "from-amber-500 to-orange-500",
    href: "#sobre",
  },
];

export const QuickNavCards = () => {
  return (
    <section className="py-16 bg-[#0a0f14]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {cards.map((card, index) => (
            <a
              key={card.title}
              href={card.href}
              className="group relative p-6 rounded-2xl bg-[#111820] border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div 
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-1">{card.title}</h3>
              <p className="text-gray-500 text-sm">{card.description}</p>
              
              {/* Hover glow */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
