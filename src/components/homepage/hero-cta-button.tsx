"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { trackCtaClick } from "@/lib/analytics/track-events";

export function HeroCtaButton() {
  return (
    <Link
      href="/auth/signup"
      prefetch={false}
      onClick={() => trackCtaClick('hero_signup')}
      className="w-full sm:w-auto inline-flex items-center justify-center bg-success hover:bg-success/90 text-success-foreground font-bold text-base px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_50px_rgba(34,197,94,0.4)] hover:scale-[1.02] transition-all duration-300 cursor-pointer"
    >
      Start Your 7-Day Free Trial
      <ArrowRight className="ml-2 h-5 w-5" />
    </Link>
  );
}
