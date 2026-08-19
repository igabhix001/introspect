"use client";

import Image from "next/image";
import { Brain, Star, FileText, Mic, Sparkles, Check } from "lucide-react";

export default function AiPsychologySection() {
  return (
    <section className="py-24 bg-background relative overflow-hidden" id="ai">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: AI Cards and Illustration */}
          <div className="relative order-2 lg:order-1 flex flex-col items-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full relative z-10">
              {[
                {
                  icon: Brain,
                  title: "AI Behavioural Analysis",
                  desc: "Real-time algorithmic monitoring of your decision patterns."
                },
                {
                  icon: Star,
                  title: "AI Trade Review",
                  desc: "Instant feedback on entry quality and checklist compliance."
                },
                {
                  icon: FileText,
                  title: "AI Discipline Reports",
                  desc: "Weekly reports highlighting your core psychological leaks."
                },
                {
                  icon: Mic,
                  title: "Execution Alerts",
                  desc: "Dynamic notifications warning you when risk limits are close."
                }
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div
                    key={idx}
                    className="bg-card/75 backdrop-blur-sm p-6 rounded-2xl border border-border hover:border-success/30 hover:scale-[1.02] transition-all duration-300"
                  >
                    <Icon className="h-6 w-6 text-success mb-3" />
                    <h4 className="font-bold text-sm text-foreground mb-1">{card.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Bottom Illustration */}
            <div className="w-full max-w-[320px] aspect-square relative mt-8 opacity-95">
              <Image
                src="/Lesson-bro.svg"
                alt="AI Coach Learning"
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                className="object-contain"
                loading="lazy"
              />
            </div>
          </div>

          {/* Right Column: Copy */}
          <div className="space-y-6 order-1 lg:order-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-success/10 text-success border border-success/20">
              <Sparkles className="h-3.5 w-3.5" /> The AI Advantage
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              AI-Powered Trading Psychology
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Our system doesn&apos;t just look at chart candles; it analyzes <em>your execution habits</em>. By mapping your trade entries and exits against real-time market sentiment and your custom rules, INTROSPECT™ acts as a digital trading coach that never sleeps.
            </p>
            
            <ul className="space-y-3.5 pt-4 border-t border-border">
              {[
                "Identifies emotional 'Tilt' and fatigue patterns before you do",
                "Quantifies the actual financial cost of your psychological leaks",
                "Generates a personalized roadmap to rebuild trading discipline step-by-step"
              ].map((bullet, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Check className="h-4.5 w-4.5 text-success shrink-0" />
                  {bullet}
                </li>
              ))}
            </ul>

            {/* Fyers Partner CTA Card */}
            <div className="mt-6 p-4 sm:p-5 rounded-2xl border border-success/20 bg-success/[0.03] backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-success uppercase tracking-wider">Broker Partner</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30">Free Account Opening</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">Trade with Fast Execution & Zero Demat AMC</h4>
                <p className="text-xs text-muted-foreground">Open your Fyers account to trade directly from charts with high-speed execution.</p>
              </div>
              <a
                href="https://fyers.onelink.me/cj1P/c6m75vge"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-success text-success-foreground text-xs font-bold hover:bg-success/90 transition-all shadow-md shadow-success/10 shrink-0 cursor-pointer"
              >
                <span>Open Fyers Account</span>
                <Sparkles className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
