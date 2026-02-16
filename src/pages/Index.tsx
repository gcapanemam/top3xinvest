import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { QuickNavCards } from "@/components/landing/QuickNavCards";
import { FundraisingSection } from "@/components/landing/FundraisingSection";

import { AboutSection } from "@/components/landing/AboutSection";
import { ProfitSection } from "@/components/landing/ProfitSection";
import { WhyChooseUsSection } from "@/components/landing/WhyChooseUsSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { StepsSection } from "@/components/landing/StepsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { AdvantagesSection } from "@/components/landing/AdvantagesSection";
import { PartnersSection } from "@/components/landing/PartnersSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#0a0f14]">
      <LandingHeader />
      <HeroSection />
      <QuickNavCards />
      <FundraisingSection />
      <AboutSection />
      <ProfitSection />
      <WhyChooseUsSection />
      <SecuritySection />
      <StepsSection />
      <TestimonialsSection />
      <AdvantagesSection />
      <PartnersSection />
      <FAQSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
};

export default Index;
