import type { Metadata } from "next";
import Link from "next/link";
import { ChallengeCTA } from "@/components/home/challenge-cta";
import { BookOpen, Trophy, Star, Shield, Gift, Zap, Target, BarChart3, Calendar, Award, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "How to Use",
  description:
    "Learn how to use INTROSPECT™ in 3 simple steps. Start your assessment, get personalized rules, and track your discipline.",
};

const platformSteps = [
  { 
    step: "1", 
    title: "Assessment – Diagnose Your Risk Profile", 
    icon: Target,
    description: "Answer behavioral questions honestly to get your Discipline Score, behavioral bias indicators, and personalized trading rules.",
    actions: ["Complete the risk assessment", "Review your Trader Personality Profile", "Get your Risk DNA analysis"]
  },
  { 
    step: "2", 
    title: "Risk Report – Your Personalized Rules", 
    icon: Shield,
    description: "Get maximum risk per trade, daily loss limits, max trades per day, and discipline guidelines.",
    actions: ["Review rules before trading each day", "Follow position sizing limits", "Respect daily loss caps"]
  },
  { 
    step: "3", 
    title: "Position Sizer – Calculate Lot Size", 
    icon: BarChart3,
    description: "Input your capital, stop-loss distance, and risk per trade to get recommended position size.",
    actions: ["Use before every trade", "Maintain proper risk control", "Never exceed calculated size"]
  },
  { 
    step: "4", 
    title: "Market Sentiment – Understand Context", 
    icon: Award,
    description: "View market bias, volatility conditions, and momentum signals. Informational only, not a trading signal.",
    actions: ["Check market conditions", "Understand volatility levels", "Use as context, not signals"]
  },
  { 
    step: "5", 
    title: "Trade Journal – Log Every Trade", 
    icon: BookOpen,
    description: "Record entry/exit prices, stop loss, reasoning, and emotional state to identify decision-making patterns.",
    actions: ["Log every trade immediately", "Record emotional state", "Review patterns weekly"]
  },
  { 
    step: "6", 
    title: "Analytics – Behavioral Insights", 
    icon: BarChart3,
    description: "Analyze discipline score, rule violations, behavioral trends, and performance insights.",
    actions: ["Review analytics weekly", "Identify improvement areas", "Track progress over time"]
  },
  { 
    step: "7", 
    title: "Challenges – Build Discipline", 
    icon: Trophy,
    description: "Complete 30/60/90-day structured programs to build consistent habits and psychological resilience.",
    actions: ["Start with 30-day challenge", "Follow daily requirements", "Earn points on completion"]
  },
  { 
    step: "8", 
    title: "Loyalty Portal – Earn Rewards", 
    icon: Gift,
    description: "Earn points by renewing, completing challenges, journaling, and referring traders. Redeem for free months.",
    actions: ["Track your points balance", "Complete challenges for rewards", "Refer other traders"]
  },
];

const loyaltyRewards = [
  { action: "Monthly Subscription Renewal", points: "10", icon: Zap, color: "text-blue-500", bg: "bg-blue-500/10", why: "Long-term commitment" },
  { action: "Yearly Subscription Renewal", points: "150", icon: Star, color: "text-amber-500", bg: "bg-amber-500/10", why: "Long-term growth" },
  { action: "Referral – Friend Joins & Pays", points: "25", icon: Gift, color: "text-purple-500", bg: "bg-purple-500/10", why: "Build community" },
  { action: "30-Day Discipline Challenge", points: "30", icon: Trophy, color: "text-success", bg: "bg-success/10", why: "1 pt/day" },
  { action: "60-Day Consistency Challenge", points: "65", icon: Trophy, color: "text-success", bg: "bg-success/10", why: "60 + 5 bonus" },
  { action: "90-Day Elite Challenge", points: "100", icon: Trophy, color: "text-success", bg: "bg-success/10", why: "90 + 10 bonus" },
  { action: "Trade Journal Entry", points: "1", icon: Shield, color: "text-indigo-500", bg: "bg-indigo-500/10", why: "1 pt per entry" },
  { action: "Birthday Bonus", points: "10", icon: Star, color: "text-pink-500", bg: "bg-pink-500/10", why: "Celebrate journey" },
];

// Quick start steps for new users
const quickStartSteps = [
  {
    step: "1",
    title: "Take the Assessment",
    description: "Answer honest questions about your trading behavior. Takes 2 minutes.",
    time: "2 min",
  },
  {
    step: "2", 
    title: "Get Your Rules",
    description: "Receive personalized risk limits, position sizing, and daily loss caps.",
    time: "Instant",
  },
  {
    step: "3",
    title: "Track & Improve",
    description: "Log trades, follow rules, and watch your discipline score improve.",
    time: "Daily",
  },
];

export default function HowToUsePage() {
  return (
    <>
      <section className="relative pt-32 pb-16 overflow-hidden min-h-screen">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-success/10 rounded-full blur-[100px] opacity-70 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Quick Start Section */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-success/10 border border-success/20 text-success text-xs font-semibold mb-6">
              <Zap className="h-3.5 w-3.5" />
              Start in 2 Minutes
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
              3 Simple Steps to <br />
              <span className="gradient-text">Better Discipline</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8">
              No complex setup. No learning curve. Just start.
            </p>
          </div>

          {/* Quick Start Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            {quickStartSteps.map((item) => (
              <Card key={item.step} className="bg-gradient-to-br from-success/5 to-transparent border border-success/20 text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-success">{item.step}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                  <span className="inline-block px-3 py-1 rounded-full bg-success/10 text-success text-xs font-semibold">
                    {item.time}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mb-20">
            <Link
              href="/dashboard/assessment"
              className="inline-flex items-center bg-success hover:bg-success/90 text-success-foreground font-bold px-8 py-4 rounded-xl shadow-lg shadow-success/20 transition-all cursor-pointer"
            >
              Check Your Discipline Score
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          {/* Advanced Workflow Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/50 border border-border text-muted-foreground text-xs font-semibold mb-6">
              <BookOpen className="h-3.5 w-3.5" />
              Advanced Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Complete Platform Guide
            </h2>
            <p className="text-lg text-muted-foreground">
              Once you&apos;re ready, explore all 8 features to maximize your discipline journey.
            </p>
          </div>

          {/* Platform User Guide */}
          <div className="mb-24 max-w-6xl mx-auto">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-4 text-center">Platform Walkthrough</h2>
              <p className="text-center text-muted-foreground text-lg mb-2">
                Follow these steps to build discipline and improve your trading behavior
              </p>
              <p className="text-center text-sm text-muted-foreground italic">
                INTROSPECT is not a signal service — it's designed to improve discipline, risk management, and consistency.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {platformSteps.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.step} className="bg-card/40 border-border/50 backdrop-blur-sm hover:border-success/30 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                          <Icon className="w-6 h-6 text-success" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-success">STEP {item.step}</span>
                          </div>
                          <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                          <ul className="space-y-1.5">
                            {item.actions.map((action, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Daily Workflow */}
            <Card className="bg-gradient-to-br from-success/5 to-transparent border border-success/20">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-success" />
                  Recommended Daily Workflow
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold text-sm text-success mb-2">Morning</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Check Market Sentiment</li>
                      <li>• Review Risk Rules</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-success mb-2">Before Trade</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Use Position Sizer</li>
                      <li>• Verify risk limits</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-success mb-2">After Trade / End of Day</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Log trade in Journal</li>
                      <li>• Review analytics & discipline score</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rewards Program Guide */}
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">🎯 INTROSPECT Rewards Program</h2>
              <p className="text-muted-foreground text-lg mb-3">
                <strong>Trade Better. Earn Rewards. Stay Disciplined.</strong>
              </p>
              <p className="text-muted-foreground">
                At INTROSPECT, disciplined traders get rewarded. Earn points for positive trading behaviors and convert them into subscription rewards.
              </p>
            </div>

            {/* How It Works */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-card/40 border-border/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">1️⃣</span>
                  </div>
                  <h3 className="font-bold mb-2">Earn Points</h3>
                  <p className="text-sm text-muted-foreground">Complete actions that improve your trading discipline</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">2️⃣</span>
                  </div>
                  <h3 className="font-bold mb-2">Build Your Tier</h3>
                  <p className="text-sm text-muted-foreground">More lifetime points unlock higher status</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">3️⃣</span>
                  </div>
                  <h3 className="font-bold mb-2">Redeem Rewards</h3>
                  <p className="text-sm text-muted-foreground">Convert points into free subscription months</p>
                </CardContent>
              </Card>
            </div>

            {/* Rewards Table */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-6 text-center">Rewards for Every Action</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {loyaltyRewards.map((reward, idx) => {
                  const Icon = reward.icon;
                  return (
                    <Card key={idx} className="bg-card/40 border-border/50 backdrop-blur-sm hover:border-success/30 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${reward.bg}`}>
                              <Icon className={`w-5 h-5 ${reward.color}`} />
                            </div>
                            <span className="font-medium text-foreground">{reward.action}</span>
                          </div>
                          <span className="font-bold text-success font-mono text-lg whitespace-nowrap">+{reward.points}</span>
                        </div>
                        <p className="text-xs text-muted-foreground ml-13">{reward.why}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Redemption & Tiers Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {/* Redemption Table */}
              <Card className="bg-gradient-to-br from-success/5 to-transparent border border-success/20">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-success" />
                    Redeem Your Points
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-success/10 border border-success/20">
                      <div>
                        <span className="font-bold text-lg">150 Points</span>
                        <p className="text-xs text-muted-foreground">Valid for 24 months</p>
                      </div>
                      <span className="font-bold text-success">1 Free Month</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-success/10 border border-success/20">
                      <div>
                        <span className="font-bold text-lg">400 Points</span>
                        <p className="text-xs text-muted-foreground">Valid for 24 months</p>
                      </div>
                      <span className="font-bold text-success">3 Free Months</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tier Details */}
              <Card className="bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/20">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    Trader Status Tiers
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-card/50">
                      <div>
                        <span className="font-bold block text-orange-400">Bronze</span>
                        <span className="text-xs text-muted-foreground">0 - 299 Points</span>
                      </div>
                      <span className="text-2xl">🟫</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-card/50">
                      <div>
                        <span className="font-bold block text-slate-300">Silver</span>
                        <span className="text-xs text-muted-foreground">300 - 599 Points</span>
                      </div>
                      <span className="text-2xl">⚪</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-card/50">
                      <div>
                        <span className="font-bold block text-amber-400">Gold</span>
                        <span className="text-xs text-muted-foreground">600 - 899 Points</span>
                      </div>
                      <span className="text-2xl">🟡</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-card/50">
                      <div>
                        <span className="font-bold block text-cyan-300">Platinum</span>
                        <span className="text-xs text-muted-foreground">900+ Points</span>
                      </div>
                      <span className="text-2xl">💎</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 text-center">Higher tiers unlock recognition and leaderboard visibility</p>
                </CardContent>
              </Card>
            </div>

            {/* Why This Matters */}
            <Card className="bg-gradient-to-br from-purple-500/5 to-transparent border border-purple-500/20 mb-12">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4">Why This Matters for Traders</h3>
                <p className="text-muted-foreground mb-4">Most traders fail because of <strong>poor discipline</strong>, not strategy.</p>
                <p className="text-muted-foreground mb-4">The INTROSPECT reward system helps you:</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span>Build consistent habits</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span>Track trading discipline</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span>Stay accountable</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span>Reduce impulsive trading</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    <span>Improve long-term performance</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-6 italic text-center">Good behavior compounds. Just like profits.</p>
              </CardContent>
            </Card>

            {/* Example Journey */}
            <Card className="bg-card/40 border-border/50">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-6 text-center">Example: How Traders Earn Free Months</h3>
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-success/5">
                    <span className="text-sm">Week 1: Journal regularly</span>
                    <span className="font-bold text-success">+5 pts</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-success/5">
                    <span className="text-sm">Month 1: Complete 30-day challenge</span>
                    <span className="font-bold text-success">+50 pts</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-success/5">
                    <span className="text-sm">Refer 2 friends</span>
                    <span className="font-bold text-success">+50 pts</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-success/5">
                    <span className="text-sm">Monthly renewal</span>
                    <span className="font-bold text-success">+10 pts</span>
                  </div>
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-success text-xl">115 points</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">Almost a <strong>free month already.</strong></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <ChallengeCTA />
    </>
  );
}
