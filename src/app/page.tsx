import dynamic from "next/dynamic";
import { Metadata } from "next";

import TrustBarSection from "@/components/homepage/trust-bar";
import RealProblemSection from "@/components/homepage/real-problem";
import CoreSystemsSection from "@/components/homepage/core-systems";
import BeforeAfterSection from "@/components/homepage/before-after";
import WhoItIsForSection from "@/components/homepage/who-it-is-for";
import SocialProofSection from "@/components/homepage/social-proof";
import PricingSection from "@/components/homepage/pricing";
import FinalCtaSection from "@/components/homepage/final-cta";

// Dynamic imports for heavy dynamic/client-side animated elements
const HeroSection = dynamic(() => import("@/components/homepage/hero"));
const AiPsychologySection = dynamic(() => import("@/components/homepage/ai-psychology"));
const VisualShowcaseSection = dynamic(() => import("@/components/homepage/visual-showcase"));

export const metadata: Metadata = {
  title: "Stop Blowing Accounts | INTROSPECT™ AI Trading Companion",
  description: "Improve your trading discipline with INTROSPECT™. A behavioral trading companion that tracks execution habits, calculates ATR-based sizes, and prevents emotional errors.",
  keywords: ["trading discipline", "trading psychology", "behavioral journal", "stop blowing accounts", "intraday options trading", "Nifty options", "capital protection"],
};

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      <HeroSection />
      <TrustBarSection />
      <RealProblemSection />
      <CoreSystemsSection />
      <AiPsychologySection />
      <VisualShowcaseSection />
      <BeforeAfterSection />
      <WhoItIsForSection />
      <SocialProofSection />
      <PricingSection />
      <FinalCtaSection />
    </div>
  );
}
