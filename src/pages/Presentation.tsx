import { useState, useEffect, useCallback, useRef } from "react";
import SlideLayout from "@/components/presentation/SlideLayout";
import CoverSlide from "@/components/presentation/slides/CoverSlide";
import AboutSlide from "@/components/presentation/slides/AboutSlide";
import OpportunitiesSlide from "@/components/presentation/slides/OpportunitiesSlide";
import RobotsSlide from "@/components/presentation/slides/RobotsSlide";
import BotVsTraderSlide from "@/components/presentation/slides/BotVsTraderSlide";
import WhyChooseSlide from "@/components/presentation/slides/WhyChooseSlide";

import StepsSlide from "@/components/presentation/slides/StepsSlide";
import DepositsSlide from "@/components/presentation/slides/DepositsSlide";
import CTASlide from "@/components/presentation/slides/CTASlide";
import { ChevronLeft, ChevronRight, Maximize, Minimize } from "lucide-react";

const slides = [
  CoverSlide, AboutSlide, OpportunitiesSlide, RobotsSlide,
  BotVsTraderSlide, WhyChooseSlide, StepsSlide,
  DepositsSlide, CTASlide,
];

const Presentation = () => {
  const [current, setCurrent] = useState(0);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const total = slides.length;

  const updateScale = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setScale(Math.min(w / 1920, h / 1080));
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [updateScale]);

  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= total) return;
    setFadeIn(false);
    setTimeout(() => {
      setCurrent(idx);
      setFadeIn(true);
    }, 150);
  }, [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goTo(current + 1);
      else if (e.key === "ArrowLeft") goTo(current - 1);
      else if (e.key === "Escape" && isFullscreen) document.exitFullscreen();
      else if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, goTo, isFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(current + (diff > 0 ? 1 : -1));
  };

  const SlideComponent = slides[current];

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen overflow-hidden relative select-none"
      style={{ background: "#0a0f14" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 z-50">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${((current + 1) / total) * 100}%`,
            background: "linear-gradient(90deg, hsl(190 95% 45%), hsl(262 83% 58%))",
          }}
        />
      </div>

      {/* Scaled slide */}
      <div
        className="absolute"
        style={{
          width: 1920, height: 1080,
          left: "50%", top: "50%",
          marginLeft: -960, marginTop: -540,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          opacity: fadeIn ? 1 : 0,
          transition: "opacity 150ms ease-in-out",
        }}
      >
        <SlideLayout slideNumber={current + 1} totalSlides={total}>
          <SlideComponent />
        </SlideLayout>
      </div>

      {/* Navigation buttons */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
        <button
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Dots */}
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                background: i === current ? "hsl(190, 95%, 50%)" : "rgba(255,255,255,0.2)",
                transform: i === current ? "scale(1.3)" : "scale(1)",
              }}
            />
          ))}
        </div>

        <button
          onClick={() => goTo(current + 1)}
          disabled={current === total - 1}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all z-50"
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>
    </div>
  );
};

export default Presentation;
