"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Flame, ArrowRight, CheckCircle2 } from "lucide-react";

const challengeFeatures = [
  "Stop-loss on every trade",
  "Risk ≤ 1% per trade",
  "No revenge trading",
  "Daily loss limit respected",
  "Max trades per day followed",
  "Journal every trade",
];

export function ChallengeCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-24 overflow-hidden">
      <div ref={ref} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-success/15 via-success/5 to-blue-500/10" />
          <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />

          {/* Glow spots */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-success/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative px-6 py-16 sm:px-12 sm:py-20 md:px-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-success/10 border border-success/20 text-success text-xs font-semibold mb-6">
                  <Flame className="h-3.5 w-3.5" />
                  30-Day Challenge
                </div>

                <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-[1.15]">
                  Begin Your 30-Day Challenge.
                  <br />
                  <span className="gradient-text">
                    Turn Discipline Into Habit.
                  </span>
                </h2>

                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
                  It takes 30 days to build a foundation, 60 days for
                  consistency, and 90 days for mastery. Start your journey
                  today and transform your trading forever.
                </p>

                <Link
                  href="/dashboard/assessment"
                  className="inline-flex items-center bg-success hover:bg-success/90 text-success-foreground font-bold text-base px-8 py-4 rounded-xl shadow-lg shadow-success/25 hover:shadow-xl hover:shadow-success/35 transition-all duration-300 group cursor-pointer"
                >
                  Start the Challenge
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Right Content - Challenge Rules */}
              <div className="relative">
                <div className="bg-card/50 glass-card rounded-2xl border border-border/50 p-6 sm:p-8">
                  <h3 className="font-heading text-lg font-bold mb-6 flex items-center gap-2">
                    <Flame className="h-5 w-5 text-success" />
                    Daily Challenge Rules
                  </h3>
                  <ul className="space-y-4">
                    {challengeFeatures.map((feature, i) => (
                      <motion.li
                        key={feature}
                        initial={{ opacity: 0, x: 20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                        className="flex items-center gap-3"
                      >
                        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                        <span className="text-sm sm:text-base">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* Progress preview */}
                  <div className="mt-8 pt-6 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        Day Progress
                      </span>
                      <span className="font-semibold text-success">
                        30 / 30
                      </span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={isInView ? { width: "100%" } : {}}
                        transition={{ duration: 2, delay: 0.8, ease: "easeOut" }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-success to-emerald-400 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Complete all 30 days → Unlock 60-Day Challenge
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
