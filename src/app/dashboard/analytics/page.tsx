"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  Clock,
  Loader2,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";

const EquityChart = dynamic(() => import("@/components/dashboard/equity-chart"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted/10 rounded-lg animate-pulse">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});
import { useAnalyticsQuery } from "@/lib/hooks/use-queries";
import { useAuth } from "@/lib/auth/auth-context";
import { formatMistakeLabel } from "@/lib/utils";
import Link from "next/link";
import { LockedFeatureCard } from "@/components/paywall/locked-feature-card";

const stagger = {
  container: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } },
};

// Helper to calculate holding time difference in minutes
function getHoldTimeInMinutes(entryTime: string | null, exitTime: string | null): number | null {
  if (!entryTime || !exitTime) return null;
  const [h1, m1] = entryTime.split(":").map(Number);
  const [h2, m2] = exitTime.split(":").map(Number);
  if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return null;
  
  // Assumes intraday trades (same day)
  const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  return diff >= 0 ? diff : null;
}

export default function AnalyticsPage() {
  const { loading: authLoading } = useAuth();
  const { data, isLoading } = useAnalyticsQuery();
  const [dateFilter, setDateFilter] = useState<string>("week");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if ((isLoading && !data) || authLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allTrades = data?.allTrades || [];
  
  // Filter trades based on date selection
  const filteredTrades = allTrades.filter((t: { created_at: string }) => {
    const tradeDate = new Date(t.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateFilter === "today") {
      const tradeDateOnly = new Date(tradeDate);
      tradeDateOnly.setHours(0, 0, 0, 0);
      return tradeDateOnly.getTime() === today.getTime();
    } else if (dateFilter === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return tradeDate >= weekAgo;
    } else if (dateFilter === "month") {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return tradeDate >= monthAgo;
    }
    return true; // "all"
  });

  // 1. Basic Metrics
  const totalPnl = filteredTrades.reduce((sum: number, t: { pnl?: number }) => sum + (t.pnl || 0), 0);
  const winningTrades = filteredTrades.filter((t: { pnl?: number }) => (t.pnl || 0) > 0);
  const losingTrades = filteredTrades.filter((t: { pnl?: number }) => (t.pnl || 0) < 0);
  const closedTrades = filteredTrades.filter((t: { exit_price?: number | null }) => t.exit_price !== null && t.exit_price !== undefined);
  const winRate = closedTrades.length > 0 ? Math.round((winningTrades.length / closedTrades.length) * 100) : 0;
  const tradeCount = filteredTrades.length;
  const rulesFollowedCount = filteredTrades.filter((t: { followed_plan?: boolean }) => t.followed_plan).length;
  const ruleAdherence = filteredTrades.length > 0 ? Math.round((rulesFollowedCount / filteredTrades.length) * 100) : 0;

  // 1.5. Advanced Quantitative Metrics (Industry-Grade)
  // Sort trades chronologically to build equity path
  const chronoTrades = [...filteredTrades].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Gross Profits and Losses
  const grossProfits = filteredTrades.reduce((sum: number, t: { pnl?: number }) => {
    const val = t.pnl || 0;
    return val > 0 ? sum + val : sum;
  }, 0);
  const grossLosses = filteredTrades.reduce((sum: number, t: { pnl?: number }) => {
    const val = t.pnl || 0;
    return val < 0 ? sum + Math.abs(val) : sum;
  }, 0);

  const profitFactor = grossLosses > 0 ? Math.round((grossProfits / grossLosses) * 100) / 100 : grossProfits > 0 ? 99.9 : 0.0;
  const expectancy = tradeCount > 0 ? Math.round((totalPnl / tradeCount) * 100) / 100 : 0.0;

  // Max Drawdown (Peak to trough) calculation
  const capital = data?.tradingCapital || 100000;
  let peak = capital;
  let maxDrawdown = 0;
  let currentEquity = capital;

  chronoTrades.forEach((t: { pnl?: number }) => {
    currentEquity += t.pnl || 0;
    if (currentEquity > peak) {
      peak = currentEquity;
    }
    const dd = peak - currentEquity;
    if (dd > maxDrawdown) {
      maxDrawdown = dd;
    }
  });

  const maxDrawdownPct = capital > 0 ? Math.round((maxDrawdown / capital) * 1000) / 10 : 0;

  // Streaks
  let currentWinStreak = 0;
  let maxWinStreak = 0;
  let currentLossStreak = 0;
  let maxLossStreak = 0;

  chronoTrades.forEach((t: { pnl?: number }) => {
    const pnl = t.pnl || 0;
    if (pnl > 0) {
      currentWinStreak++;
      currentLossStreak = 0;
      if (currentWinStreak > maxWinStreak) {
        maxWinStreak = currentWinStreak;
      }
    } else if (pnl < 0) {
      currentLossStreak++;
      currentWinStreak = 0;
      if (currentLossStreak > maxLossStreak) {
        maxLossStreak = currentLossStreak;
      }
    }
  });

  // Cumulative Equity Curve data
  let runningPnl = 0;
  const equityCurveData = [
    { name: "Start", equity: capital, pnl: 0 },
    ...chronoTrades.map((t: { stock?: string; created_at: string; pnl?: number }, idx) => {
      runningPnl += t.pnl || 0;
      const dateLabel = new Date(t.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      return {
        name: `${dateLabel} (${t.stock || `T${idx + 1}`})`,
        equity: capital + runningPnl,
        pnl: runningPnl,
        symbol: t.stock
      };
    })
  ];

  // 2. Disposition Effect Calculation
  let totalWinMinutes = 0;
  let winHoldCount = 0;
  let totalLossMinutes = 0;
  let lossHoldCount = 0;

  filteredTrades.forEach((t: { pnl?: number; entry_time?: string | null; exit_time?: string | null }) => {
    const minutes = getHoldTimeInMinutes(t.entry_time || null, t.exit_time || null);
    if (minutes !== null) {
      if ((t.pnl || 0) > 0) {
        totalWinMinutes += minutes;
        winHoldCount++;
      } else if ((t.pnl || 0) < 0) {
        totalLossMinutes += minutes;
        lossHoldCount++;
      }
    }
  });

  const avgWinHold = winHoldCount > 0 ? Math.round(totalWinMinutes / winHoldCount) : 0;
  const avgLossHold = lossHoldCount > 0 ? Math.round(totalLossMinutes / lossHoldCount) : 0;
  const dispositionRatio = avgWinHold > 0 ? Math.round((avgLossHold / avgWinHold) * 100) / 100 : 0;

  // 3. Hourly Distribution Calculation
  const hourlyStats: Record<number, { pnl: number; wins: number; total: number }> = {};
  filteredTrades.forEach((t: { pnl?: number; entry_time?: string | null; created_at: string }) => {
    let hour = 10; // Default
    if (t.entry_time && t.entry_time.includes(":")) {
      hour = parseInt(t.entry_time.split(":")[0]);
    } else {
      hour = new Date(t.created_at).getHours();
    }

    if (!hourlyStats[hour]) {
      hourlyStats[hour] = { pnl: 0, wins: 0, total: 0 };
    }
    hourlyStats[hour].pnl += t.pnl || 0;
    hourlyStats[hour].total += 1;
    if ((t.pnl || 0) > 0) {
      hourlyStats[hour].wins += 1;
    }
  });

  const hoursRange = [9, 10, 11, 12, 13, 14, 15];
  const hourlyChartData = hoursRange.map((hr) => {
    const stat = hourlyStats[hr] || { pnl: 0, wins: 0, total: 0 };
    const label = hr === 9 ? "9:15-10:00" : `${hr}:00-${hr + 1}:00`;
    return {
      hourLabel: label,
      pnl: Math.round(stat.pnl),
      winRate: stat.total > 0 ? Math.round((stat.wins / stat.total) * 100) : 0,
      total: stat.total,
    };
  });

  const observationsList = ["holding_losers_too_long", "early_profit_booking", "always_apply_sl"];

  // 4. Cognitive Bias / Mistake counts from filtered trades
  const mistakeCounts: Record<string, number> = {};
  filteredTrades.forEach((t: { mistakes?: string[] | null }) => {
    if (t.mistakes) {
      t.mistakes
        .filter((m) => !observationsList.includes(m))
        .forEach((m: string) => {
          const clean = m.replace(/^🔴\s*/, "").split(" (")[0];
          mistakeCounts[clean] = (mistakeCounts[clean] || 0) + 1;
        });
    }
  });

  const biasData = Object.entries(mistakeCounts)
    .map(([bias, count]) => ({ bias, count }))
    .sort((a, b) => b.count - a.count);

  // 5. Emotion vs Plan Correlation Grid
  const emotionStats: Record<string, { followed: number; total: number }> = {};
  filteredTrades.forEach((t: { emotion_before?: string | null; followed_plan?: boolean | null }) => {
    const emotion = t.emotion_before || "Unspecified";
    if (!emotionStats[emotion]) {
      emotionStats[emotion] = { followed: 0, total: 0 };
    }
    emotionStats[emotion].total += 1;
    if (t.followed_plan) {
      emotionStats[emotion].followed += 1;
    }
  });

  const correlationData = Object.entries(emotionStats).map(([emotion, stat]) => ({
    emotion,
    adherence: Math.round((stat.followed / stat.total) * 100),
    total: stat.total,
  }));

  // Simple Performance Metrics: Weekly Loss, Daily Loss, Mistakes Count & Recommendations (Point 19)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyLoss = allTrades
    .filter((t: { created_at: string; pnl?: number }) => new Date(t.created_at) >= oneWeekAgo && (t.pnl || 0) < 0)
    .reduce((sum: number, t: { pnl?: number }) => sum + (t.pnl || 0), 0);

  const todayDateOnly = new Date();
  todayDateOnly.setHours(0, 0, 0, 0);
  const dailyLoss = allTrades
    .filter((t: { created_at: string; pnl?: number }) => {
      const tradeDate = new Date(t.created_at);
      tradeDate.setHours(0, 0, 0, 0);
      return tradeDate.getTime() === todayDateOnly.getTime() && (t.pnl || 0) < 0;
    })
    .reduce((sum: number, t: { pnl?: number }) => sum + (t.pnl || 0), 0);

  const totalMistakesCount = filteredTrades.reduce((sum: number, t: { mistakes?: string[] | null }) => {
    const actualMistakes = (t.mistakes || []).filter((m) => !observationsList.includes(m));
    return sum + actualMistakes.length;
  }, 0);

  // Derive simple action plan recommendations based on the top biases or default rules
  const simpleRecommendations: React.ReactNode[] = [];
  if (biasData.length > 0) {
    biasData.slice(0, 3).forEach((item) => {
      if (item.bias.toLowerCase().includes("stop")) {
        simpleRecommendations.push(
          <span key={item.bias}>
            Always enter stop-loss orders in your terminal immediately at trade execution. Use the{" "}
            <Link href="/dashboard/calculator" className="text-success underline hover:text-success/80 font-bold">
              Position Sizer
            </Link>{" "}
            to pre-calculate safety targets.
          </span>
        );
      } else if (item.bias.toLowerCase().includes("revenge") || item.bias.toLowerCase().includes("over")) {
        simpleRecommendations.push(
          <span key={item.bias}>
            Strictly block new entries once you reach your max daily limit (5 trades or 3% drawdown).
          </span>
        );
      } else {
        simpleRecommendations.push(
          <span key={item.bias}>
            Address {item.bias}: Review your entry setup parameters before placing execution orders.
          </span>
        );
      }
    });
  }

  // Explicitly check for holding losers too long observation to add dynamic sizer suggestion
  const holdingLoserTrades = filteredTrades.filter((t: any) => {
    const obs = Array.isArray(t.observations) ? t.observations : [];
    const mis = Array.isArray(t.mistakes) ? t.mistakes : [];
    return obs.includes("holding_losers_too_long") || mis.includes("holding_losers_too_long");
  });
  if (holdingLoserTrades.length > 0) {
    let maxMins = 86;
    holdingLoserTrades.forEach((t: any) => {
      const mins = getHoldTimeInMinutes(t.entry_time, t.exit_time);
      if (mins !== null && mins > maxMins) {
        maxMins = mins;
      }
    });
    simpleRecommendations.push(
      <span key="holding_losers">
        Address holding losers too long: Review your entry setup parameters before placing execution orders. Use quantity as per{" "}
        <Link href="/dashboard/calculator" className="text-success underline hover:text-success/80 font-bold">
          position sizer rule
        </Link>{" "}
        to control risk. Note: the trade lasted for {maxMins} mins.
      </span>
    );
  }

  if (simpleRecommendations.length === 0) {
    simpleRecommendations.push(
      <span key="default-alloc">
        Maintain strict capital allocation per trade (limit risk to max 1% of total account balance). Use the{" "}
        <Link href="/dashboard/calculator" className="text-success underline hover:text-success/80 font-bold">
          Position Sizer
        </Link>{" "}
        to control risk.
      </span>
    );
    simpleRecommendations.push(
      <span key="default-emotions">
        Journal pre-trade emotional states to build awareness of boredom or urgency spikes.
      </span>
    );
  }

  const dateFilterLabel = dateFilter === "today" ? "Today" : dateFilter === "week" ? "7 Days" : dateFilter === "month" ? "30 Days" : "All Time";

  // ──── Behavioral Cost Report Computations ────
  const overtradingTrades = filteredTrades.filter((t: any) => (t.mistakes || []).includes("overtrading"));
  const revengeTrades = filteredTrades.filter((t: any) => (t.mistakes || []).includes("revenge_trading"));
  const fomoTrades = filteredTrades.filter((t: any) => (t.mistakes || []).includes("fomo") || (t.mistakes || []).includes("fomo_entry"));
  const riskViolationTrades = filteredTrades.filter((t: any) => {
    const m = t.mistakes || [];
    return m.includes("risk_breached") || m.includes("single_loss_breached") || m.includes("daily_loss_breached") || m.includes("over_risk");
  });

  const overtradingCost = overtradingTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
  const revengeCost = revengeTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
  const fomoCost = fomoTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
  const riskViolationCost = riskViolationTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);

  // Total Behavioral Mistake Cost = sum of losses of unique trades with mistakes
  const uniqueMistakeTrades = filteredTrades.filter((t: any) => {
    const m = t.mistakes || [];
    return m.includes("overtrading") || m.includes("revenge_trading") || m.includes("fomo") || m.includes("fomo_entry") ||
      m.includes("risk_breached") || m.includes("single_loss_breached") || m.includes("daily_loss_breached") || m.includes("over_risk");
  });
  const totalBehavioralCost = uniqueMistakeTrades.reduce((sum: number, t: any) => sum + Math.abs((t.pnl || 0) < 0 ? (t.pnl || 0) : 0), 0);
  const disciplineAdjustedPnl = totalPnl + totalBehavioralCost;

  if (!data?.isPro) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading">Advanced Performance Analytics</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Quantitative behavioral feedback and bias radar</p>
          </div>
        </div>

        <LockedFeatureCard
          title="Advanced Trading Analytics is a Pro Feature"
          description="Upgrade to INTROSPECT™ Pro to access cumulative equity curves, drawdown metrics, behavioral cost reports, and bias radar analysis."
          featureName="Analytics"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="h-24 rounded-2xl bg-card border border-border p-4" />
            <div className="h-24 rounded-2xl bg-card border border-border p-4" />
            <div className="h-24 rounded-2xl bg-card border border-border p-4" />
            <div className="h-24 rounded-2xl bg-card border border-border p-4" />
          </div>
          <div className="h-64 rounded-2xl bg-card border border-border p-6" />
        </LockedFeatureCard>
      </div>
    );
  }

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Advanced Performance Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Quantitative behavioral feedback and bias radar</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold focus:outline-none focus:border-success/40 cursor-pointer"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Behavioral Cost Report Card */}
      <motion.div variants={stagger.item} className="rounded-2xl border border-border bg-card p-5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/40 pb-3 gap-2">
          <div>
            <h3 className="font-heading text-sm font-bold flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-destructive" />
              Behavioral Cost Report ({dateFilterLabel})
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Quantifying the exact cost of discipline mistakes</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Mistake Cost:</span>
            <span className="text-sm font-bold font-mono text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded-lg">
              ₹{totalBehavioralCost.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* P&L Comparison Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/20 p-4 rounded-xl border border-border/40">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Actual P&L</span>
            <p className={`text-lg font-bold font-mono ${totalPnl >= 0 ? "text-success" : "text-destructive"}`}>
              {totalPnl >= 0 ? "+" : ""}₹{totalPnl.toLocaleString("en-IN")}
            </p>
            <span className="text-[9px] text-muted-foreground block">Net result with rules deviated</span>
          </div>
          <div className="space-y-1 border-t md:border-t-0 md:border-l border-border/40 pt-3 md:pt-0 md:pl-4">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Behavioral Cost</span>
            <p className="text-lg font-bold font-mono text-destructive">
              -₹{totalBehavioralCost.toLocaleString("en-IN")}
            </p>
            <span className="text-[9px] text-muted-foreground block">Incurred due to undisciplined trades</span>
          </div>
          <div className="space-y-1 border-t md:border-t-0 md:border-l border-border/40 pt-3 md:pt-0 md:pl-4">
            <span className="text-[10px] text-success uppercase tracking-wider font-bold block">Discipline-Adjusted P&L</span>
            <p className={`text-lg font-bold font-mono ${disciplineAdjustedPnl >= 0 ? "text-success" : "text-destructive"}`}>
              {disciplineAdjustedPnl >= 0 ? "+" : ""}₹{disciplineAdjustedPnl.toLocaleString("en-IN")}
            </p>
            <span className="text-[9px] text-success block font-semibold font-sans">Had you followed your rules, this would be your P&L!</span>
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Overtrading */}
          <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-foreground block">Overtrading</span>
              <span className="text-[10px] text-muted-foreground block">{overtradingTrades.length} trades identified</span>
            </div>
            <div className="space-y-1 pt-2 border-t border-border/40">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">Net impact:</span>
                <span className={overtradingCost >= 0 ? "text-success" : "text-destructive"}>
                  {overtradingCost >= 0 ? "+" : ""}₹{overtradingCost.toLocaleString("en-IN")}
                </span>
              </div>
              {overtradingCost < 0 && (
                <div className="text-[9px] text-success font-semibold">
                  If avoided: Account would be +₹{Math.abs(overtradingCost).toLocaleString("en-IN")}
                </div>
              )}
            </div>
          </div>

          {/* Revenge Trading */}
          <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-foreground block">Revenge Trading</span>
              <span className="text-[10px] text-muted-foreground block">{revengeTrades.length} instances detected</span>
            </div>
            <div className="space-y-1 pt-2 border-t border-border/40">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">Net impact:</span>
                <span className={revengeCost >= 0 ? "text-success" : "text-destructive"}>
                  {revengeCost >= 0 ? "+" : ""}₹{revengeCost.toLocaleString("en-IN")}
                </span>
              </div>
              {revengeCost < 0 && (
                <div className="text-[9px] text-success font-semibold">
                  If avoided: Account would be +₹{Math.abs(revengeCost).toLocaleString("en-IN")}
                </div>
              )}
            </div>
          </div>

          {/* FOMO Entries */}
          <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-foreground block">FOMO Entries</span>
              <span className="text-[10px] text-muted-foreground block">{fomoTrades.length} instances detected</span>
            </div>
            <div className="space-y-1 pt-2 border-t border-border/40">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">Net impact:</span>
                <span className={fomoCost >= 0 ? "text-success" : "text-destructive"}>
                  {fomoCost >= 0 ? "+" : ""}₹{fomoCost.toLocaleString("en-IN")}
                </span>
              </div>
              {fomoCost < 0 && (
                <div className="text-[9px] text-success font-semibold">
                  If avoided: Account would be +₹{Math.abs(fomoCost).toLocaleString("en-IN")}
                </div>
              )}
            </div>
          </div>

          {/* Risk Violation 1% or daylimit */}
          <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-foreground block">Risk Violations</span>
              <span className="text-[10px] text-muted-foreground block">{riskViolationTrades.length} instances detected</span>
            </div>
            <div className="space-y-1 pt-2 border-t border-border/40">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">Net impact:</span>
                <span className={riskViolationCost >= 0 ? "text-success" : "text-destructive"}>
                  {riskViolationCost >= 0 ? "+" : ""}₹{riskViolationCost.toLocaleString("en-IN")}
                </span>
              </div>
              {riskViolationCost < 0 && (
                <div className="text-[9px] text-success font-semibold">
                  If avoided: Account would be +₹{Math.abs(riskViolationCost).toLocaleString("en-IN")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Recommendations */}
        <div className="p-4 rounded-xl bg-success/5 border border-success/10 space-y-2">
          <span className="text-[10px] text-success uppercase tracking-wider font-bold block">Central Safeguard Recommendations</span>
          <ul className="list-disc pl-4 text-xs space-y-1 text-muted-foreground">
            {simpleRecommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div variants={stagger.item} className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total P&L ({dateFilterLabel})</p>
          <p className={`text-xl font-bold font-mono ${totalPnl >= 0 ? "text-success" : "text-destructive"}`}>
            {totalPnl >= 0 ? "+" : ""}₹{totalPnl.toLocaleString("en-IN")}
          </p>
        </motion.div>
        <motion.div variants={stagger.item} className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Win Rate</p>
          <p className="text-xl font-bold">{winRate}%</p>
        </motion.div>
        <motion.div variants={stagger.item} className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Trades</p>
          <p className="text-xl font-bold">{tradeCount}</p>
        </motion.div>
        <motion.div variants={stagger.item} className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Rule Adherence</p>
          <p className={`text-xl font-bold ${ruleAdherence >= 80 ? "text-success" : "text-amber-500"}`}>{ruleAdherence}%</p>
        </motion.div>
      </div>

      {/* Equity Curve & Advanced Quantitative Metrics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cumulative Equity Curve Chart */}
        <motion.div variants={stagger.item} className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading text-base font-bold">Cumulative Equity Curve</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Chronological capital progression across trades</p>
            </div>
            <div className="text-right">
              <span className={`text-sm font-semibold ${totalPnl >= 0 ? "text-success" : "text-destructive"}`}>
                {totalPnl >= 0 ? "Profit" : "Drawdown"}: {totalPnl >= 0 ? "+" : ""}₹{totalPnl.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <div className="h-[250px] min-h-[260px] min-w-0 -ml-2">
            {filteredTrades.length > 0 ? (
              <EquityChart data={equityCurveData} />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No trades recorded for this period.
              </div>
            )}
          </div>
        </motion.div>

        {/* Advanced Quantitative Metrics Card */}
        <motion.div variants={stagger.item} className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-heading text-base font-bold mb-1">Quantitative Metrics</h3>
            <p className="text-xs text-muted-foreground mb-4">Industry-grade trading statistics</p>

            <div className="space-y-4">
              {/* Expectancy */}
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <div>
                  <p className="text-xs font-semibold text-foreground">Expectancy Score</p>
                  <p className="text-[10px] text-muted-foreground">Expected profit/loss per trade</p>
                </div>
                <p className={`font-mono text-sm font-bold ${expectancy >= 0 ? "text-success" : "text-destructive"}`}>
                  ₹{expectancy.toLocaleString("en-IN")}
                </p>
              </div>

              {/* Profit Factor */}
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <div>
                  <p className="text-xs font-semibold text-foreground">Profit Factor</p>
                  <p className="text-[10px] text-muted-foreground">Gross Profits / Gross Losses</p>
                </div>
                <p className={`font-mono text-sm font-bold ${profitFactor >= 1.5 ? "text-success" : profitFactor >= 1.0 ? "text-amber-500" : "text-destructive"}`}>
                  {profitFactor}x
                </p>
              </div>

              {/* Max Drawdown */}
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <div>
                  <p className="text-xs font-semibold text-foreground">Max Drawdown</p>
                  <p className="text-[10px] text-muted-foreground">Peak-to-trough drop</p>
                </div>
                <p className="font-mono text-sm font-bold text-destructive">
                  ₹{maxDrawdown.toLocaleString("en-IN")} ({maxDrawdownPct}%)
                </p>
              </div>

              {/* Streaks */}
              <div className="flex items-center justify-between pb-2">
                <div>
                  <p className="text-xs font-semibold text-foreground">Win / Loss Streaks</p>
                  <p className="text-[10px] text-muted-foreground">Max consecutive wins / losses</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-semibold text-success">{maxWinStreak}W</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="font-mono text-xs font-semibold text-destructive">{maxLossStreak}L</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border/40 flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              These stats are calculated using your actual capital size (₹{capital.toLocaleString("en-IN")}) from your profile settings.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Grid: Cognitive Bias Frequency + Emotion Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cognitive Bias Frequencies */}
        <motion.div variants={stagger.item} className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-heading text-sm font-bold mb-1">Cognitive Bias Radar</h3>
          <p className="text-[11px] text-muted-foreground mb-4">Total occurrences of logged trading mistakes</p>
          
          <div className="space-y-4">
            {biasData.length > 0 ? (
              biasData.map((item) => (
                <div key={item.bias} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-foreground">{formatMistakeLabel(item.bias)}</span>
                    <span className="text-muted-foreground">{item.count} occurrences</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-destructive/80 rounded-full"
                      style={{
                        width: `${Math.min((item.count / (tradeCount || 1)) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No logged mistakes or bias triggers recorded. Excellent execution structure!
              </div>
            )}
          </div>
        </motion.div>

        {/* Emotion vs Plan Adherence Correlation Grid */}
        <motion.div variants={stagger.item} className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-heading text-sm font-bold mb-1">Emotion-Plan Adherence Correlation</h3>
          <p className="text-[11px] text-muted-foreground mb-4">Plan adherence rate mapped against emotional states before entry</p>

          <div className="space-y-3.5">
            {correlationData.length > 0 ? (
              correlationData.map((item) => (
                <div key={item.emotion} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-foreground w-24 shrink-0 capitalize">{item.emotion}</span>
                  <div className="flex-1 h-5 bg-muted rounded-lg overflow-hidden relative flex items-center px-2">
                    <div
                      className={`h-full absolute left-0 top-0 transition-all ${
                        item.adherence >= 80 ? "bg-success/20" : item.adherence >= 50 ? "bg-amber-500/20" : "bg-destructive/20"
                      }`}
                      style={{ width: `${item.adherence}%` }}
                    />
                    <span className="text-[10px] font-bold z-10 font-mono">
                      {item.adherence}% adherence ({item.total} trades)
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground">
                Log trades with pre-trade emotional states to view plan correlation.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
