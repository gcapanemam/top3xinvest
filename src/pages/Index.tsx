import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { QuickNavCards } from "@/components/landing/QuickNavCards";
import { AboutSection } from "@/components/landing/AboutSection";
import { ProfitSection } from "@/components/landing/ProfitSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { StepsSection } from "@/components/landing/StepsSection";
import { AdvantagesSection } from "@/components/landing/AdvantagesSection";
import { PartnersSection } from "@/components/landing/PartnersSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#0a0f14]">
      <LandingHeader />
      <HeroSection />
      <QuickNavCards />
      <AboutSection />
      <ProfitSection />
      <SecuritySection />
      <StepsSection />
      <AdvantagesSection />
      <PartnersSection />
      <LandingFooter />
    </div>
  );
};

export default Index;
