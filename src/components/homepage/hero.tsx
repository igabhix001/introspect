"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, TrendingUp, Target, Brain, Trophy, FileText, Check, Sparkles, ArrowRight } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { ParticleField } from "@/components/ui/particle-field";
import { HeroCtaButton } from "./hero-cta-button";



export default function HeroSection() {
  const [monthlyPrice, setMonthlyPrice] = useState<number>(499);

  useEffect(() => {
    fetch("/api/pricing")
      .then((res) => res.json())
      .then((data) => {
        if (data.pricing?.monthly?.amount) {
          setMonthlyPrice(data.pricing.monthly.amount);
        }
      })
      .catch((err) => console.warn("Failed to fetch dynamic monthly price:", err));
  }, []);

  return (
    <AuroraBackground>
      <section className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden">
        <ParticleField count={60} />
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-success/[0.07] rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/[0.05] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Left: Content */}
            <div className="max-w-2xl">
              <div>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                  </span>
                  The Discipline Infrastructure for Intraday Traders
                </span>
              </div>

              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.05] mt-8 mb-4">
                Stop Blowing
                <br />
                <span className="gradient-text">Accounts</span>
              </h1>

              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-success mb-6 font-heading">
                INTROSPECT™ — AI Companion for Disciplined Trading
              </h2>

              <div className="mb-8">
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg mb-6">
                  An AI-powered trading companion that combines market sentiment, risk management, behavioral intelligence, and discipline coaching. Log your trades, identify psychological leaks, and build consistency—without connecting your broker.
                </p>

                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  {[
                    { icon: Shield, label: "Behavioural Risk Detection" },
                    { icon: Brain, label: "Emotional Mistake Tracking" },
                    { icon: Target, label: "Position Size Calculator" },
                    { icon: TrendingUp, label: "Market Sentiment Engine" },
                    { icon: Trophy, label: "Discipline Challenges" },
                    { icon: FileText, label: "Trade Journal & Analytics" }
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                        <Icon className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex flex-col gap-3 w-full">
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                    <HeroCtaButton />
                    <Link
                      href="/dashboard"
                      prefetch={false}
                      className="w-full sm:w-auto inline-flex items-center justify-center font-medium text-base px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.03] backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 cursor-pointer text-muted-foreground hover:text-foreground"
                    >
                      See Dashboard Demo
                    </Link>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] text-muted-foreground/90 font-mono tracking-tight flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span>100% Free Forever Plan Included • No credit card required</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span>Includes Sizer, Sentiment, Score & 50 Journal Entries. </span>
                      <Link href="/pricing" className="text-success hover:text-success/90 font-semibold transition-colors inline-flex items-center gap-1 group/pricing">
                        View all plans
                        <span className="inline-block transition-transform group-hover/pricing:translate-x-0.5">→</span>
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Forever Free Options Catchy Card */}
            <div
              className="relative animate-entry-mockup-custom lg:pl-6"
              style={{ perspective: "1200px", animationDelay: "0.3s", animationFillMode: "both" }}
            >
              {/* Glow background behind card */}
              <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-success/20 to-emerald-500/10 opacity-30 blur-2xl group-hover:opacity-40 transition duration-300" />
              
              <div className="relative rounded-[2rem] border border-success/30 bg-card/45 backdrop-blur-xl shadow-2xl p-6 sm:p-8 space-y-6 hover:border-success/50 transition-all duration-300 group">
                <div className="absolute -top-3 left-6">
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-success/20 text-success border border-success/30 uppercase tracking-wider">
                    100% Free Forever
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                    Starter Free
                    <Sparkles className="h-5 w-5 text-success animate-pulse" />
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Essential psychological utilities to build trading discipline. No credit card required.
                  </p>
                </div>

                <div className="flex items-baseline gap-2 py-4 border-y border-border/50">
                  <span className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">₹0</span>
                  <span className="text-sm text-muted-foreground font-mono">/ forever free</span>
                </div>

                <div className="space-y-4 py-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                    What&apos;s Included Free:
                  </p>
                  <ul className="grid grid-cols-1 gap-3.5">
                    {[
                      { text: "Position Sizer & ATR Calculator", desc: "Risk control on every trade size" },
                      { text: "Live Market Sentiment Engine", desc: "Check current Nifty breadth indices" },
                      { text: "Basic Assessment Score", desc: "Know your initial discipline archetype" },
                      { text: "Today's EOD Daily Report", desc: "Daily feedback on your trading rules" },
                      { text: "Trade Journal (Up to 50 entries/mo)", desc: "Monthly reset capacity for journaling" },
                      { text: "30-Day Discipline Challenge", desc: "Start building consistent habits today" }
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-success/15 border border-success/30 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-success" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground leading-none">{item.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  <Link
                    href="/auth/signup"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-success text-success-foreground font-bold text-base hover:bg-success/90 transition-all shadow-lg shadow-success/10 hover:shadow-success/20 cursor-pointer group/btn"
                  >
                    Get Started Free Forever
                    <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AuroraBackground>
  );
}
