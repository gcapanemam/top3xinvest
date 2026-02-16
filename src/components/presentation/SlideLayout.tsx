import React from "react";

interface SlideLayoutProps {
  children: React.ReactNode;
  slideNumber: number;
  totalSlides: number;
}

const SlideLayout = ({ children, slideNumber, totalSlides }: SlideLayoutProps) => {
  return (
    <div className="w-[1920px] h-[1080px] relative overflow-hidden" style={{ background: "#0a0f14" }}>
      {/* Background gradient effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, hsl(190 95% 45%), transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full opacity-8" style={{ background: "radial-gradient(circle, hsl(262 83% 58%), transparent 70%)" }} />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-[80px] flex items-center justify-between px-16 z-10">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-black tracking-tight" style={{ color: "hsl(190, 95%, 50%)" }}>
            N3X<span className="text-white">PRIME</span>
          </div>
        </div>
        <div className="text-white/40 text-lg font-medium">
          {slideNumber}/{totalSlides}
        </div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 pt-[80px] pb-[60px] px-16">
        {children}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 h-[60px] flex items-center justify-between px-16 z-10">
        <div className="text-white/30 text-sm">www.n3xprime.com</div>
        <div className="text-white/30 text-sm">© 2025 N3XPRIME — Todos os direitos reservados</div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, hsl(190 95% 45%), hsl(262 83% 58%), hsl(190 95% 45%))" }} />
    </div>
  );
};

export default SlideLayout;
