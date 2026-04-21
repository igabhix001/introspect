"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Shield,
  Lock,
  ArrowRight,
  Target,
  Brain,
  Flame,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const VISIBLE_SCORE = 72;
const VISIBLE_RISK = "Moderate";

const lockedCategories = [
  { name: "Stop-Loss Discipline", score: 68, band: "Medium" },
  { name: "After Profits Behavior", score: 42, band: "High" },
  { name: "Risk Planning", score: 81, band: "Low" },
  { name: "Impulse Control", score: 55, band: "Medium" },
  { name: "Rule Consistency", score: 77, band: "Low" },
];

const lockedRules = [
  { icon: Shield, text: "Maximum 1% risk per trade", severity: "critical" },
  { icon: Target, text: "Daily loss limit: ₹2,000", severity: "critical" },
  { icon: Flame, text: "10-min cooldown after a loss", severity: "warning" },
  { icon: Brain, text: "Journal every trade emotionally", severity: "info" },
  { icon: CheckCircle2, text: "Maximum 5 trades per day", severity: "warning" },
  { icon: AlertTriangle, text: "Mandatory stop-loss on every trade", severity: "critical" },
];

function BlurredRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="select-none pointer-events-none" style={{ filter: "blur(5px)", userSelect: "none" }} aria-hidden="true">
        {children}
      </div>
    </div>
  );
}

export function ReportPreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative py-20 sm:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-success/[0.02] to-background pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-success/10 border border-success/20 text-success text-xs font-semibold mb-5">
            <Shield className="h-3.5 w-3.5" />
            Your Risk Report Preview
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.15] mb-4">
            See What Your Report
            <br />
            <span className="gradient-text">Reveals About You</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Take the assessment to get your full personalized risk report. Here&apos;s a glimpse — the complete breakdown is waiting for you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Score Card (visible) + locked extras */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="space-y-4"
          >
            {/* VISIBLE: Discipline Score */}
            <div className="rounded-2xl border border-success/30 bg-success/5 p-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-semibold">Discipline Score</p>
              <div className="flex items-center gap-5">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="var(--muted)" strokeWidth="7" />
                    <motion.circle
                      cx="48" cy="48" r="40" fill="none" stroke="var(--success)" strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                      animate={isInView ? { strokeDashoffset: 2 * Math.PI * 40 * (1 - VISIBLE_SCORE / 100) } : {}}
                      transition={{ duration: 1.4, delay: 0.4, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold font-heading text-success">{VISIBLE_SCORE}</span>
                    <span className="text-[9px] text-muted-foreground">/100</span>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold text-success mb-1">{VISIBLE_SCORE}/100</p>
                  <p className="text-sm text-muted-foreground">Room to improve — your rules need tightening.</p>
                  <div className="mt-2 h-1.5 w-48 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-success rounded-full"
                      initial={{ width: 0 }}
                      animate={isInView ? { width: `${VISIBLE_SCORE}%` } : {}}
                      transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* VISIBLE: Risk Level */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-semibold">Risk Level</p>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 font-bold text-lg">
                  <Shield className="h-5 w-5" />
                  {VISIBLE_RISK} Risk
                </span>
                <p className="text-sm text-muted-foreground">You are taking more risk than recommended.</p>
              </div>
            </div>

            {/* LOCKED: Category Scores */}
            <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 pt-5 pb-2 border-b border-border/50 flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category Breakdown</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted/60 px-2 py-1 rounded-full">
                  <Lock className="h-2.5 w-2.5" /> Locked
                </span>
              </div>
              <div className="p-4 space-y-3">
                {lockedCategories.map((cat) => (
                  <BlurredRow key={cat.name}>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{cat.name}</span>
                        <span className="font-mono font-medium">{cat.score}/100</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cat.score >= 75 ? "bg-success" : cat.score >= 55 ? "bg-amber-500" : "bg-destructive"}`}
                          style={{ width: `${cat.score}%` }}
                        />
                      </div>
                    </div>
                  </BlurredRow>
                ))}
              </div>
              {/* Lock overlay */}
              <div className="absolute inset-0 top-[52px] flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px]">
                <Lock className="h-7 w-7 text-muted-foreground/50 mb-2" />
                <p className="text-xs text-muted-foreground font-medium">Complete assessment to unlock</p>
              </div>
            </div>
          </motion.div>

          {/* Right: Locked rules + CTA */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.25 }}
            className="space-y-4"
          >
            {/* LOCKED: Personalized Rules */}
            <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 pt-5 pb-2 border-b border-border/50 flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Personalized Rules</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted/60 px-2 py-1 rounded-full">
                  <Lock className="h-2.5 w-2.5" /> Locked
                </span>
              </div>
              <div className="p-4 space-y-3">
                {lockedRules.map((rule, i) => (
                  <BlurredRow key={i}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        rule.severity === "critical" ? "bg-destructive/10 text-destructive" :
                        rule.severity === "warning" ? "bg-amber-500/10 text-amber-500" :
                        "bg-blue-500/10 text-blue-500"
                      }`}>
                        <rule.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{rule.text}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          rule.severity === "critical" ? "bg-destructive/10 text-destructive" :
                          rule.severity === "warning" ? "bg-amber-500/10 text-amber-500" :
                          "bg-blue-500/10 text-blue-500"
                        }`}>
                          {rule.severity === "critical" ? "Critical" : rule.severity === "warning" ? "Important" : "Suggested"}
                        </span>
                      </div>
                    </div>
                  </BlurredRow>
                ))}
              </div>
              {/* Lock overlay */}
              <div className="absolute inset-0 top-[52px] flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px]">
                <Lock className="h-7 w-7 text-muted-foreground/50 mb-2" />
                <p className="text-xs text-muted-foreground font-medium">Rules generated after assessment</p>
              </div>
            </div>

            {/* CTA Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="relative rounded-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-success/20 via-success/10 to-blue-500/10" />
              <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
              <div className="relative px-6 py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-success/20 border border-success/30 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-success" />
                </div>
                <h3 className="font-heading text-xl font-bold mb-2">Get Your Full Report</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                  Unlock your complete risk breakdown, all 5 category scores, and 100+ personalized trading rules.
                </p>
                <Link
                  href="/dashboard/assessment"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-success hover:bg-success/90 text-success-foreground font-bold text-sm shadow-lg shadow-success/25 hover:shadow-success/35 transition-all duration-300 group"
                >
                  Start Your Assessment
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <p className="text-[11px] text-muted-foreground mt-4">Free • Takes 2 minutes • No credit card needed</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
