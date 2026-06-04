import Link from "next/link";
import { Shield, TrendingUp, Target, Brain, Trophy, FileText, Check, AlertTriangle } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { ParticleField } from "@/components/ui/particle-field";
import { HeroCtaButton } from "./hero-cta-button";

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

export default function HeroSection() {
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
                    <p className="text-[11px] text-muted-foreground/80 font-mono tracking-tight">
                      🔒 No credit card required to start • Set up in 2 minutes
                    </p>
                    <p className="text-sm">
                      <Link href="/pricing" className="text-success hover:text-success/90 font-semibold transition-colors inline-flex items-center gap-1 group/pricing">
                        See pricing plans starting at ₹499/month 
                        <span className="inline-block transition-transform group-hover/pricing:translate-x-0.5">→</span>
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Floating Dashboard Mockup */}
            <div
              className="relative hidden lg:block animate-entry-mockup-custom"
              style={{ perspective: "1200px", animationDelay: "0.3s", animationFillMode: "both" }}
            >
              <div className="relative animate-float-custom">
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
                      <div
                        key={metric.label}
                        className="p-4 bg-card/90 animate-fade-up-custom"
                        style={{ animationDelay: `${0.35 + i * 0.05}s`, animationFillMode: "both" }}
                      >
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">{metric.label}</p>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-xl font-bold ${metric.color}`}>{metric.value}</span>
                          <span className="text-[10px] text-success/60">{metric.trend}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Rules checklist */}
                  <div className="p-5 bg-card/80">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-3 font-semibold">
                      Today&apos;s Rules
                    </p>
                    <div className="space-y-2.5">
                      {rules.map((rule, i) => (
                        <div
                          key={rule.text}
                          className="flex items-center gap-2.5 animate-fade-up-custom"
                          style={{ animationDelay: `${0.4 + i * 0.05}s`, animationFillMode: "both" }}
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
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mini chart */}
                  <div className="px-5 pb-5 bg-card/80">
                    <div className="h-16 rounded-lg bg-muted/30 border border-border/50 flex items-end justify-between px-3 pb-2 gap-1">
                      {[40, 60, 35, 80, 55, 70, 45, 90, 75, 85, 60, 95].map((h, i) => (
                        <div
                          key={i}
                          style={{ height: `${h}%` }}
                          className={`w-full rounded-sm transition-all duration-500 origin-bottom ${h >= 70 ? "bg-success/50" : h >= 50 ? "bg-blue-400/40" : "bg-amber-400/30"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating mini card */}
                <div
                  className="absolute -bottom-6 -left-8 px-4 py-3 rounded-xl border border-border bg-card/90 backdrop-blur-xl shadow-xl animate-fade-up-custom animate-float-custom"
                  style={{ animationDelay: "0.5s", animationFillMode: "both" }}
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
                </div>

                {/* Floating notification */}
                <div
                  className="absolute -top-4 -right-4 px-4 py-2.5 rounded-xl border border-success/30 bg-success/10 backdrop-blur-xl shadow-xl animate-fade-up-custom animate-float-custom"
                  style={{ animationDelay: "0.6s", animationFillMode: "both" }}
                >
                  <p className="text-xs font-medium text-success flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    Rule followed! +5 pts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AuroraBackground>
  );
}
