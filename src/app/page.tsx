import { Hero } from "@/components/home/hero";
import { Stats } from "@/components/home/stats";
import { Features8 } from "@/components/home/features-8";
import { CyberneticBentoGrid } from "@/components/ui/cybernetic-bento-grid";
import { HowItWorks } from "@/components/home/how-it-works";
import { PricingSection } from "@/components/home/pricing-section";
import { Testimonials } from "@/components/home/testimonials";
import { ChallengeCTA } from "@/components/home/challenge-cta";
import { ServicesSection } from "@/components/home/services-section";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <Features8 />
        </div>
      </section>
      <CyberneticBentoGrid />
      <HowItWorks />
      <Testimonials />
      <ServicesSection />
      <PricingSection />
      <ChallengeCTA />
    </>
  );
}
