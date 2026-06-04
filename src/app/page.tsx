import dynamic from "next/dynamic";
import { Metadata } from "next";

import HeroSection from "@/components/homepage/hero";
import { LazySection } from "@/components/ui/lazy-section";

function SectionSkeleton() {
  return (
    <div className="w-full min-h-[450px] py-20 flex items-center animate-pulse" aria-hidden="true">
      <div className="mx-auto max-w-6xl px-4 w-full">
        <div className="h-10 w-1/3 bg-muted/20 rounded-lg mb-6" />
        <div className="h-6 w-2/3 bg-muted/15 rounded-lg mb-4" />
        <div className="h-6 w-1/2 bg-muted/10 rounded-lg" />
      </div>
    </div>
  );
}

const TrustBarSection = dynamic(() => import("@/components/homepage/trust-bar"), {
  loading: () => <SectionSkeleton />,
});
const RealProblemSection = dynamic(() => import("@/components/homepage/real-problem"), {
  loading: () => <SectionSkeleton />,
});
const CoreSystemsSection = dynamic(() => import("@/components/homepage/core-systems"), {
  loading: () => <SectionSkeleton />,
});
const AiPsychologySection = dynamic(() => import("@/components/homepage/ai-psychology"), {
  loading: () => <SectionSkeleton />,
});
const VisualShowcaseSection = dynamic(() => import("@/components/homepage/visual-showcase"), {
  loading: () => <SectionSkeleton />,
});
const BeforeAfterSection = dynamic(() => import("@/components/homepage/before-after"), {
  loading: () => <SectionSkeleton />,
});
const WhoItIsForSection = dynamic(() => import("@/components/homepage/who-it-is-for"), {
  loading: () => <SectionSkeleton />,
});
const SocialProofSection = dynamic(() => import("@/components/homepage/social-proof"), {
  loading: () => <SectionSkeleton />,
});
const PricingSection = dynamic(() => import("@/components/homepage/pricing"), {
  loading: () => <SectionSkeleton />,
});
const FinalCtaSection = dynamic(() => import("@/components/homepage/final-cta"), {
  loading: () => <SectionSkeleton />,
});

export const metadata: Metadata = {
  title: "Stop Blowing Accounts | INTROSPECT™ AI Trading Companion",
  description: "Improve your trading discipline with INTROSPECT™. A behavioral trading companion that tracks execution habits, calculates ATR-based sizes, and prevents emotional errors.",
  keywords: ["trading discipline", "trading psychology", "behavioral journal", "stop blowing accounts", "intraday options trading", "Nifty options", "capital protection"],
};

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      <HeroSection />
      
      <LazySection fallback={<SectionSkeleton />}><TrustBarSection /></LazySection>
      <LazySection fallback={<SectionSkeleton />}><RealProblemSection /></LazySection>
      <LazySection fallback={<SectionSkeleton />}><CoreSystemsSection /></LazySection>
      <LazySection fallback={<SectionSkeleton />}><AiPsychologySection /></LazySection>
      <LazySection fallback={<SectionSkeleton />}><VisualShowcaseSection /></LazySection>
      <LazySection fallback={<SectionSkeleton />}><BeforeAfterSection /></LazySection>
      <LazySection fallback={<SectionSkeleton />}><WhoItIsForSection /></LazySection>
      <LazySection fallback={<SectionSkeleton />}><SocialProofSection /></LazySection>
      <LazySection fallback={<SectionSkeleton />}><PricingSection /></LazySection>
      <LazySection fallback={<SectionSkeleton />}><FinalCtaSection /></LazySection>
    </div>
  );
}
