import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, DollarSign, Users } from "lucide-react";

const testimonials = [
  { name: "Carlos M.", avatar: "CM", profit: 1250.0, period: "30 dias", robot: "Alpha Trader" },
  { name: "Ana S.", avatar: "AS", profit: 892.5, period: "15 dias", robot: "Beta Scanner" },
  { name: "Pedro L.", avatar: "PL", profit: 3420.0, period: "60 dias", robot: "Gamma Pro" },
  { name: "Julia R.", avatar: "JR", profit: 567.8, period: "7 dias", robot: "Alpha Trader" },
  { name: "Ricardo F.", avatar: "RF", profit: 2100.0, period: "45 dias", robot: "Delta Master" },
  { name: "Mariana C.", avatar: "MC", profit: 1890.0, period: "30 dias", robot: "Beta Scanner" },
];

const stats = [
  { icon: DollarSign, value: "$2.5M+", label: "Pagos aos investidores" },
  { icon: Users, value: "15,000+", label: "Usuários ativos" },
  { icon: TrendingUp, value: "98.5%", label: "Taxa de satisfação" },
];

export const TestimonialsSection = () => {
  const [visibleTestimonials, setVisibleTestimonials] = useState(testimonials.slice(0, 3));
  const [currentIndex, setCurrentIndex] = useState(3);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleTestimonials((prev) => {
        const newTestimonials = [...prev];
        newTestimonials.shift();
        newTestimonials.push(testimonials[currentIndex % testimonials.length]);
        return newTestimonials;
      });
      setCurrentIndex((prev) => prev + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <section className="py-20 bg-[#0a0f14] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Resultados{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Reais
            </span>
          </h2>
          <p className="text-gray-400 text-lg">
            Veja o que nossos investidores estão conquistando
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-4 rounded-2xl bg-[#111820] border border-white/5"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-3">
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {visibleTestimonials.map((testimonial, index) => (
            <div
              key={`${testimonial.name}-${index}`}
              className="bg-[#111820] rounded-2xl border border-white/5 p-6 hover:border-emerald-500/30 transition-all duration-500 animate-fade-in"
            >
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-12 h-12 border-2 border-emerald-500/30">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold">
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium">{testimonial.name}</p>
                  <p className="text-xs text-gray-500">{testimonial.robot}</p>
                </div>
              </div>

              <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                <p className="text-sm text-gray-400 mb-1">Lucro em {testimonial.period}</p>
                <p className="text-2xl font-bold text-emerald-400">
                  +${testimonial.profit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          * Resultados reais de usuários da plataforma. Rendimentos passados não garantem resultados futuros.
        </p>
      </div>
    </section>
  );
};
