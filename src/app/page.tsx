import dynamic from "next/dynamic";
import { Hero } from "@/components/home/hero";
import { Stats } from "@/components/home/stats";

// Lazy load below-the-fold components for faster initial load
const Features8 = dynamic(() => import("@/components/home/features-8").then(m => m.Features8), {
  loading: () => <div className="h-96 animate-pulse bg-muted/10" />,
});
const CyberneticBentoGrid = dynamic(() => import("@/components/ui/cybernetic-bento-grid").then(m => m.CyberneticBentoGrid), {
  loading: () => <div className="h-96 animate-pulse bg-muted/10" />,
});
const HowItWorks = dynamic(() => import("@/components/home/how-it-works").then(m => m.HowItWorks), {
  loading: () => <div className="h-64 animate-pulse bg-muted/10" />,
});
const PricingSection = dynamic(() => import("@/components/home/pricing-section").then(m => m.PricingSection), {
  loading: () => <div className="h-96 animate-pulse bg-muted/10" />,
});
const Testimonials = dynamic(() => import("@/components/home/testimonials").then(m => m.Testimonials), {
  loading: () => <div className="h-64 animate-pulse bg-muted/10" />,
});
const ChallengeCTA = dynamic(() => import("@/components/home/challenge-cta").then(m => m.ChallengeCTA), {
  loading: () => <div className="h-48 animate-pulse bg-muted/10" />,
});
const ServicesSection = dynamic(() => import("@/components/home/services-section").then(m => m.ServicesSection), {
  loading: () => <div className="h-64 animate-pulse bg-muted/10" />,
});
const VideoSection = dynamic(() => import("@/components/home/video-section").then(m => m.VideoSection), {
  loading: () => <div className="h-96 animate-pulse bg-muted/10" />,
});
const ReportPreview = dynamic(() => import("@/components/home/report-preview").then(m => m.ReportPreview), {
  loading: () => <div className="h-96 animate-pulse bg-muted/10" />,
});
const YouTubeChannel = dynamic(() => import("@/components/home/youtube-channel").then(m => m.YouTubeChannel), {
  loading: () => <div className="h-64 animate-pulse bg-muted/10" />,
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <VideoSection />
      <ReportPreview />
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <Features8 />
        </div>
      </section>
      <CyberneticBentoGrid />
      <HowItWorks />
      <YouTubeChannel />
      <Testimonials />
      <ServicesSection />
      <PricingSection />
      <ChallengeCTA />
    </>
  );
}
