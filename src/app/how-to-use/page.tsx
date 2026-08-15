import type { Metadata } from "next";
import Link from "next/link";
import { ChallengeCTA } from "@/components/home/challenge-cta";
import { BookOpen, Trophy, Star, Shield, Gift, Zap, Target, BarChart3, Calendar, Award, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "How to Use INTROSPECT™ | Trading Discipline Platform Guide",
  description:
    "Step-by-step guide to using INTROSPECT™ — India's AI trading discipline platform. Complete risk assessments, calculate position sizes, log trades, and build 30-day discipline habits.",
};

const platformSteps = [
  { 
    step: "1", 
    title: "Assessment – Diagnose Your Risk Profile", 
    icon: Target,
    description: "Answer the behavioral assessment honestly to get your Discipline Score and identify psychological biases. (1 free assessment included, Pro unlocks unlimited assessments).",
    actions: ["Complete the risk assessment", "Identify psychological biases", "Pro unlocks unlimited diagnostic runs"]
  },
  { 
    step: "2", 
    title: "Risk Report – Your Personalized Rules", 
    icon: Shield,
    description: "Get personalized risk guidelines, including maximum risk per trade, daily loss caps, and trade counts. (Unlocks with Pro subscription).",
    actions: ["Review rules before trading each day", "Follow position sizing limits", "Respect daily loss caps"]
  },
  { 
    step: "3", 
    title: "Position Sizer – Calculate Lot Size", 
    icon: BarChart3,
    description: "Calculate recommended position sizes based on capital, stop-loss distance, and live ATR. Supports standard indices & custom NSE stock symbols.",
    actions: ["Size standard indices or custom NSE stocks", "ATR-based automatic stop-loss levels", "Check SEBI compliance education box"]
  },
  { 
    step: "4", 
    title: "Market Sentiment – Understand Context", 
    icon: Award,
    description: "Check compliance-mapped bias regimes: Positive, Negative, or Neutral Market Bias. Volatility and momentum signals are informational only.",
    actions: ["Identify Positive/Negative/Neutral market bias", "VIX-based volatility status", "Use strictly as context, not signals"]
  },
  { 
    step: "5", 
    title: "Trade Journal – Friction-Free Broker Import", 
    icon: BookOpen,
    description: "Upload a simple 5-column CSV order book (Symbol, Type, Quantity, Price, Time). INTROSPECT automatically reconstructs completed trades using Weighted Average, matches entries/exits, and tags emotional mistakes.",
    actions: ["Import 5-column CSV order books", "Automatic matching and reversal splitting", "CBT coaching insights on violations"]
  },
  { 
    step: "6", 
    title: "Analytics – Behavioral Insights", 
    icon: BarChart3,
    description: "Analyze rule violations, discipline trends, performance metrics, and net projected P&L (incorporating estimated charges).",
    actions: ["Review analytics weekly", "Identify emotional pitfalls", "Track progress over time"]
  },
  { 
    step: "7", 
    title: "Challenges – Build Discipline", 
    icon: Trophy,
    description: "Complete structured 30/60/90-day discipline challenges. Follow daily parameters and log check-ins to build psychological resilience.",
    actions: ["Start with 30-day challenge", "Log daily check-ins to remain active", "Earn discipline badges on completion"]
  },
  { 
    step: "8", 
    title: "Referral Portal – Refer & Earn", 
    icon: Gift,
    description: "Earn points by referring traders. Accumulate 150 points for a free month. Tiers (Bronze, Silver, Gold, Platinum) build lifetime status.",
    actions: ["Share unique referral link", "Earn 25 points per subscription", "Unlock lifetime status tiers & badges"]
  },
];

const loyaltyRewards = [
  { action: "Referral – Friend Joins & Pays", points: "25", icon: Gift, color: "text-purple-500", bg: "bg-purple-500/10", why: "Earn 25 points when your referred trader signs up for any paid plan. Points are earned only for referrals." },
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

          {/* Referral Program Guide */}
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">🎯 INTROSPECT Referral Program</h2>
              <p className="text-muted-foreground text-lg mb-3">
                <strong>Grow the Community. Earn Free Months. Stay Disciplined.</strong>
              </p>
              <p className="text-muted-foreground">
                At INTROSPECT, you earn points by referring other traders to the platform. Convert these points into free subscription months.
              </p>
            </div>

            {/* How It Works */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-card/40 border-border/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">1️⃣</span>
                  </div>
                  <h3 className="font-bold mb-2">Share Code</h3>
                  <p className="text-sm text-muted-foreground">Share your unique referral link/code with fellow traders</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">2️⃣</span>
                  </div>
                  <h3 className="font-bold mb-2">Friend Subscribes</h3>
                  <p className="text-sm text-muted-foreground">Earn 25 points when they sign up for any paid plan</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">3️⃣</span>
                  </div>
                  <h3 className="font-bold mb-2">Get Free Month</h3>
                  <p className="text-sm text-muted-foreground">Accumulate 150 points to unlock 1 free month</p>
                </CardContent>
              </Card>
            </div>

            {/* Referral Details & Redemption */}
            <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
              {/* Reward Earning Card */}
              {loyaltyRewards.map((reward, idx) => {
                const Icon = reward.icon;
                return (
                  <Card key={idx} className="bg-card/40 border-border/50 backdrop-blur-sm hover:border-success/30 transition-all flex flex-col justify-between">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${reward.color}`} />
                        Earn Points
                      </h3>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-4">
                        <div>
                          <span className="font-medium text-foreground">{reward.action}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">When referred user subscribes</p>
                        </div>
                        <span className="font-bold text-success font-mono text-2xl">
                          +{reward.points}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{reward.why}</p>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Redemption Card */}
              <Card className="bg-gradient-to-br from-success/5 to-transparent border border-success/20 flex flex-col justify-between">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-success" />
                    Redeem Your Points
                  </h3>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-success/10 border border-success/20 mb-4">
                    <div>
                      <span className="font-bold text-lg">150 Points</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Accumulated via referrals</p>
                    </div>
                    <span className="font-bold text-success text-2xl">1 Free Month</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Points are automatically updated when referred users subscribe to any plan. Redeem 150 points for 1 free month.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Lifetime Status Tiers */}
            <div className="mt-12 mb-12 max-w-4xl mx-auto">
              <h3 className="text-xl font-bold mb-3 text-center flex items-center justify-center gap-2">
                <Award className="w-5 h-5 text-success" />
                Lifetime Status Tiers
              </h3>
              <p className="text-center text-sm text-muted-foreground mb-6">
                Your lifetime earned points determine your status tier. Lifetime points never expire.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-card/40 border-amber-700/20 text-center hover:border-amber-700/40 transition-all">
                  <CardContent className="p-4">
                    <span className="text-[10px] font-bold text-amber-700 tracking-wider">BRONZE</span>
                    <p className="text-lg font-extrabold mt-1 text-foreground">0 - 299 pts</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Starting level for all traders</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/40 border-slate-400/20 text-center hover:border-slate-400/40 transition-all">
                  <CardContent className="p-4">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider">SILVER</span>
                    <p className="text-lg font-extrabold mt-1 text-foreground">300 - 599 pts</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Unlocks Silver Status & Badges</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/40 border-yellow-500/20 text-center hover:border-yellow-500/40 transition-all">
                  <CardContent className="p-4">
                    <span className="text-[10px] font-bold text-yellow-500 tracking-wider">GOLD</span>
                    <p className="text-lg font-extrabold mt-1 text-foreground">600 - 899 pts</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Unlocks Gold Status & Badges</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/40 border-cyan-400/20 text-center hover:border-cyan-400/40 transition-all">
                  <CardContent className="p-4">
                    <span className="text-[10px] font-bold text-cyan-400 tracking-wider">PLATINUM</span>
                    <p className="text-lg font-extrabold mt-1 text-foreground">900+ pts</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Unlocks Elite Platinum Trophies</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center max-w-2xl mx-auto">
                <span className="text-xs font-bold text-primary block mb-1">🏅 REFERRAL MILESTONE BADGES</span>
                <p className="text-xs text-muted-foreground">
                  Earn lifetime profile badges as you grow the community: 
                  <span className="text-foreground font-semibold"> Risk Mentor</span> (3 referrals) • 
                  <span className="text-foreground font-semibold"> Discipline Influencer</span> (5 referrals) • 
                  <span className="text-foreground font-semibold"> Community Builder</span> (10 referrals)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      <ChallengeCTA />
    </>
  );
}
