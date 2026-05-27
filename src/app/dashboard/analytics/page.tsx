"use client";

import { useState } from "react";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { useAnalyticsQuery } from "@/lib/hooks/use-queries";
import { useAuth } from "@/lib/auth/auth-context";

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
  const winRate = filteredTrades.length > 0 ? Math.round((winningTrades.length / filteredTrades.length) * 100) : 0;
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

  // 4. Cognitive Bias / Mistake counts from filtered trades
  const mistakeCounts: Record<string, number> = {};
  filteredTrades.forEach((t: { mistakes?: string[] | null }) => {
    if (t.mistakes) {
      t.mistakes.forEach((m: string) => {
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

  const dateFilterLabel = dateFilter === "today" ? "Today" : dateFilter === "week" ? "7 Days" : dateFilter === "month" ? "30 Days" : "All Time";

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
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurveData}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px", color: "var(--foreground)" }}
                    formatter={(value: any) => [`₹${value.toLocaleString("en-IN")}`, "Account Balance"]}
                  />
                  <Area type="monotone" dataKey="equity" stroke="var(--success)" strokeWidth={2} fill="url(#equityGradient)" dot={{ r: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
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

      {/* Disposition Effect Metric Card */}
      <motion.div variants={stagger.item} className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-sm font-bold text-foreground">
                Disposition Effect: Cutting Winners vs Letting Losers Run
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                dispositionRatio > 1.5 ? "bg-destructive/10 text-destructive" : dispositionRatio > 1.0 ? "bg-amber-500/10 text-amber-500" : "bg-success/10 text-success"
              }`}>
                {dispositionRatio > 1.5 ? "🔴 Critical Leak" : dispositionRatio > 1.0 ? "🟡 Warnings" : "🟢 Balanced"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Calculates your relative average holding time. An industry-standard ratio of &gt; 1.0 indicates that you let losers run while rushing out of winning positions.
            </p>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-muted/30 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Avg Win Hold</p>
                <p className="text-lg font-bold mt-1 text-success">{avgWinHold} mins</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Avg Loss Hold</p>
                <p className="text-lg font-bold mt-1 text-destructive">{avgLossHold} mins</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Hold Ratio</p>
                <p className="text-lg font-bold mt-1 text-foreground">{dispositionRatio}x</p>
              </div>
            </div>

            {dispositionRatio > 1.5 && (
              <div className="flex items-center gap-2 mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded-xl text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>You hold losing trades {dispositionRatio}x longer than winners. Implement a hard stop-loss and trailing stops to fix this gap.</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Hourly Distribution of Performance (Fatigue Analysis) */}
      <motion.div variants={stagger.item} className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading text-base font-bold">Hourly Performance & Fatigue Radar</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Win rate and Net P&L mapped by the hour of entry</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-success rounded-sm opacity-80" /> P&L</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-px border-t-2 border-primary" /> Win Rate</span>
          </div>
        </div>
        <div className="h-[300px] min-h-[260px] min-w-0">
          {filteredTrades.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="hourLabel" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `₹${v}`} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px", color: "var(--foreground)" }}
                  formatter={(value, name) => {
                    if (name === "pnl") return [`₹${value}`, "Net P&L"];
                    return [`${value}%`, "Win Rate"];
                  }}
                />
                <Bar yAxisId="left" dataKey="pnl" fill="var(--success)" radius={[4, 4, 0, 0]} opacity={0.6} />
                <Line yAxisId="right" type="monotone" dataKey="winRate" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No trade data available to plot hourly performance.
            </div>
          )}
        </div>
      </motion.div>

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
                    <span className="text-foreground">{item.bias}</span>
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
