"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, TrendingUp, Target, Check, AlertTriangle, BarChart3 } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { ParticleField } from "@/components/ui/particle-field";
import { TextReveal, TypewriterText } from "@/components/ui/text-animations";
import { trackCtaClick } from "@/lib/analytics/track-events";

const dashboardMetrics = [
  { label: "Discipline Score", value: "78", color: "text-success", trend: "+12%" },
  { label: "Risk Level", value: "Moderate", color: "text-amber-400", trend: "↓ improving" },
  { label: "Win Rate", value: "64%", color: "text-blue-400", trend: "+8%" },
];

const rules = [
  { text: "Stop-loss on every trade", done: true },
  { text: "Risk ≤ 1% per trade", done: true },
  { text: "No revenge trading", done: true },
  { text: "Daily loss limit respected", done: false },
];

export function Hero() {
  return (
    <AuroraBackground>
      <section className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden">
        {/* Particle Background */}
        <ParticleField count={60} />

        {/* Radial gradient overlays */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-success/[0.07] rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/[0.05] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left: Content */}
            <div className="max-w-2xl">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                  </span>
                  The Risk Guardian for Intraday Traders
                </span>
              </motion.div>

              {/* Heading with text reveal - New headline per client request */}
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.05] mt-8 mb-6">
                <TextReveal text="Traders Fail Due to Discipline," delay={0.3} />
                <br />
                <span className="gradient-text">
                  <TextReveal text="Not Strategy." delay={0.6} />
                </span>
              </h1>

              {/* Dynamic subtitle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="mb-8"
              >
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
                  INTROSPECT™ analyzes your trading behavior and builds{" "}
                  <TypewriterText
                    texts={[
                      "personalized risk rules",
                      "daily discipline habits",
                      "data-driven consistency",
                      "emotional awareness",
                    ]}
                    className="text-foreground font-medium"
                  />
                </p>
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="flex flex-col sm:flex-row items-start gap-4 mb-4"
              >
                <Link
                  href="/dashboard/assessment"
                  onClick={() => trackCtaClick('hero_assessment')}
                  className="group inline-flex items-center justify-center bg-success hover:bg-success/90 text-success-foreground font-bold text-base px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_50px_rgba(34,197,94,0.4)] transition-all duration-300 cursor-pointer"
                >
                  Check Your Discipline Score
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/how-to-use"
                  className="group inline-flex items-center justify-center font-medium text-base px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.03] backdrop-blur-sm transition-all duration-300 cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  Watch Demo
                </Link>
              </motion.div>

              {/* Free trial note */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 1.3 }}
                className="text-xs text-muted-foreground mb-8"
              >
                ✨ <span className="text-success font-medium">One free assessment</span> to check your Discipline Score — no signup required
              </motion.p>

              {/* Universal Trading Psychology Message */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.4 }}
                className="mb-6 p-3 rounded-xl bg-success/5 border border-success/20"
              >
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="text-success font-semibold">Risk management and trading psychology is universal and a must for all traders.</span>
                  {" "}INTROSPECT™ is built for that.
                </p>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.5 }}
                className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground/70"
              >
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-success/70" />
                  <span>Risk-First Framework</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-success/70" />
                  <span>5 Risk Categories</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-success/70" />
                  <span>30-Day Challenge</span>
                </div>
              </motion.div>
            </div>

            {/* Right: Floating Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotateY: -10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
              className="relative hidden lg:block"
              style={{ perspective: "1200px" }}
            >
              <motion.div
                animate={{ y: [-8, 8, -8] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                {/* Main dashboard card */}
                <div className="relative rounded-2xl border border-border bg-card/70 backdrop-blur-xl shadow-2xl dark:shadow-black/40 overflow-hidden">
                  {/* Card header */}
                  <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-success/80" />
                    </div>
                    <span className="text-xs text-muted-foreground/50 font-mono">INTROSPECT™ Dashboard</span>
                  </div>

                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-px bg-border/50 border-b border-border/50">
                    {dashboardMetrics.map((metric, i) => (
                      <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 + i * 0.15 }}
                        className="p-4 bg-card/90"
                      >
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">{metric.label}</p>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-xl font-bold ${metric.color}`}>{metric.value}</span>
                          <span className="text-[10px] text-success/60">{metric.trend}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Rules checklist */}
                  <div className="p-5 bg-card/80">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-3 font-semibold">
                      Today&apos;s Rules
                    </p>
                    <div className="space-y-2.5">
                      {rules.map((rule, i) => (
                        <motion.div
                          key={rule.text}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.5 + i * 0.12 }}
                          className="flex items-center gap-2.5"
                        >
                          {rule.done ? (
                            <div className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-success" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                              <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />
                            </div>
                          )}
                          <span className={`text-xs ${rule.done ? "text-muted-foreground" : "text-amber-500/90 dark:text-amber-300/80"}`}>
                            {rule.text}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Mini chart */}
                  <div className="px-5 pb-5 bg-card/80">
                    <div className="h-16 rounded-lg bg-muted/30 border border-border/50 flex items-end justify-between px-3 pb-2 gap-1">
                      {[40, 60, 35, 80, 55, 70, 45, 90, 75, 85, 60, 95].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 2 + i * 0.05, duration: 0.4, ease: "easeOut" }}
                          className={`w-full rounded-sm ${h >= 70 ? "bg-success/50" : h >= 50 ? "bg-blue-400/40" : "bg-amber-400/30"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating mini card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, y: [-4, 4, -4] }}
                  transition={{
                    opacity: { delay: 2 },
                    scale: { delay: 2 },
                    y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2.5 },
                  }}
                  className="absolute -bottom-6 -left-8 px-4 py-3 rounded-xl border border-border bg-card/90 backdrop-blur-xl shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Streak</p>
                      <p className="text-sm font-bold text-foreground">12 Days 🔥</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating notification */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, y: [4, -4, 4] }}
                  transition={{
                    opacity: { delay: 2.3 },
                    scale: { delay: 2.3 },
                    y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 3 },
                  }}
                  className="absolute -top-4 -right-4 px-4 py-2.5 rounded-xl border border-success/30 bg-success/10 backdrop-blur-xl shadow-xl"
                >
                  <p className="text-xs font-medium text-success flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    Rule followed! Streak preserved
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </AuroraBackground>
  );
}
