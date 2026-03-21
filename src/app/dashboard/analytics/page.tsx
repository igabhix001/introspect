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
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAnalyticsQuery } from "@/lib/hooks/use-queries";
import { useAuth } from "@/lib/auth/auth-context";

const stagger = {
  container: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } },
};

export default function AnalyticsPage() {
  const { loading: authLoading } = useAuth();
  const { data, isLoading } = useAnalyticsQuery();
  const [dateFilter, setDateFilter] = useState<string>("today");

  // Show loading only on initial load
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Filter trades based on date selection
  const allTrades = data?.allTrades || [];
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

  // Calculate metrics from filtered trades
  const totalPnl = filteredTrades.reduce((sum: number, t: { pnl?: number }) => sum + (t.pnl || 0), 0);
  const winningTrades = filteredTrades.filter((t: { pnl?: number }) => (t.pnl || 0) > 0);
  const winRate = filteredTrades.length > 0 ? Math.round((winningTrades.length / filteredTrades.length) * 100) : 0;
  const tradeCount = filteredTrades.length;
  const rulesFollowedCount = filteredTrades.filter((t: { followed_plan?: boolean }) => t.followed_plan).length;
  const ruleAdherence = filteredTrades.length > 0 ? Math.round((rulesFollowedCount / filteredTrades.length) * 100) : 0;
  
  // Use pre-calculated weekly data for chart (always shows last 7 days)
  const weeklyPnl = data?.weeklyPnl || [];
  
  // Get weekly mistakes and insights from daily reports
  const weeklyMistakeData = data?.weeklyMistakeData || [];
  const weeklyAreasToImprove = data?.weeklyAreasToImprove || [];
  const weeklySuggestions = data?.weeklySuggestions || [];
  
  // Calculate mistake breakdown from filtered trades
  const mistakeCounts: Record<string, number> = {};
  filteredTrades.forEach((t: { mistakes?: string[] }) => {
    if (t.mistakes && t.mistakes.length > 0) {
      t.mistakes.forEach((m: string) => {
        mistakeCounts[m] = (mistakeCounts[m] || 0) + 1;
      });
    }
  });
  const totalMistakes = Object.values(mistakeCounts).reduce((a, b) => a + b, 0);
  const mistakeColors: Record<string, string> = {
    "FOMO": "#f59e0b",
    "Revenge Trade": "#ef4444",
    "Overtrading": "#f97316",
    "No SL": "#dc2626",
    "Over-leveraged": "#a855f7",
  };
  const mistakeData = Object.entries(mistakeCounts).map(([name, count]) => ({
    name,
    value: totalMistakes > 0 ? Math.round((count / totalMistakes) * 100) : 0,
    color: mistakeColors[name] || "#6b7280",
  }));

  const dateFilterLabel = dateFilter === "today" ? "Today" : dateFilter === "week" ? "7 Days" : dateFilter === "month" ? "30 Days" : "All Time";

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-6">
      {/* Date Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading">Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Deep behavioral insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background/50 border border-border text-xs font-medium focus:outline-none focus:border-success/40 transition-all cursor-pointer appearance-none"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div variants={stagger.item} className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total P&L ({dateFilterLabel})</p>
          <p className={`text-lg font-bold font-mono ${totalPnl >= 0 ? "text-success" : "text-destructive"}`}>
            {totalPnl >= 0 ? "+" : ""}₹{Math.abs(totalPnl).toLocaleString("en-IN")}
          </p>
        </motion.div>
        <motion.div variants={stagger.item} className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Win Rate</p>
          <p className="text-lg font-bold">{winRate}%</p>
        </motion.div>
        <motion.div variants={stagger.item} className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Trades</p>
          <p className="text-lg font-bold">{tradeCount}</p>
        </motion.div>
        <motion.div variants={stagger.item} className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Rule Adherence</p>
          <p className={`text-lg font-bold ${ruleAdherence >= 80 ? "text-success" : "text-amber-500"}`}>{ruleAdherence}%</p>
        </motion.div>
      </div>

      {/* Weekly P&L Chart */}
      <motion.div variants={stagger.item} className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-heading text-base font-bold">Weekly P&L Breakdown</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Performance by day of week</p>
          </div>
          <div className={`flex items-center gap-1 text-xs font-semibold ${totalPnl >= 0 ? "text-success" : "text-destructive"}`}>
            {totalPnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {totalPnl >= 0 ? "+" : ""}₹{Math.abs(totalPnl).toLocaleString("en-IN")}
          </div>
        </div>
        <div className="h-[250px]">
          {weeklyPnl.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyPnl} barCategoryGap="25%">
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `₹${v > 0 ? "+" : ""}${v}`} width={65} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px", color: "var(--foreground)" }}
                  formatter={(value) => { const num = Number(value); return [`₹${num > 0 ? "+" : ""}${num.toLocaleString("en-IN")}`, "P&L"]; }}
                  cursor={{ fill: "var(--muted)" }}
                />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]} fill="var(--success)">
                  {weeklyPnl.map((entry: { day: string; pnl: number }, index: number) => (
                    <Cell key={index} fill={entry.pnl >= 0 ? "var(--success)" : "var(--destructive)"} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No trade data yet. Log trades to see your weekly P&L.
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mistake Breakdown - Shows weekly mistakes from daily reports */}
        <motion.div variants={stagger.item} className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-heading text-sm font-bold mb-4">Weekly Mistake Breakdown</h3>
          {weeklyMistakeData.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="w-[140px] h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={weeklyMistakeData} dataKey="value" innerRadius={35} outerRadius={65} paddingAngle={3} strokeWidth={0}>
                      {weeklyMistakeData.map((entry: { name: string; value: number; color: string }, index: number) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5 flex-1">
                {weeklyMistakeData.map((item: { name: string; value: number; color: string }) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-semibold">{item.value}x</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">
              No mistakes detected this week. Keep following your rules!
            </p>
          )}
        </motion.div>

        {/* Key Insights - Shows areas to improve from weekly daily reports */}
        <motion.div variants={stagger.item} className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-heading text-sm font-bold mb-4">Key Insights (This Week)</h3>
          <div className="space-y-3">
            {weeklyAreasToImprove.length > 0 ? (
              <>
                {weeklyAreasToImprove.slice(0, 4).map((area: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-destructive/20 bg-destructive/5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-destructive/10">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {area}
                    </p>
                  </div>
                ))}
                {weeklySuggestions.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Suggestions</p>
                    {weeklySuggestions.slice(0, 2).map((sug: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 text-xs text-muted-foreground">
                        <Target className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <span className="leading-relaxed">{sug}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-start gap-3 p-3 rounded-xl border border-success/20 bg-success/5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-success/10">
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {winRate >= 60 ? `Win rate is ${winRate}% — excellent consistency!` : `Win rate is ${winRate}%. Focus on quality setups.`}
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl border border-border/50">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-500/10">
                    <Clock className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {ruleAdherence >= 80 ? `Rule adherence is ${ruleAdherence}% — outstanding discipline!` : `Rule adherence is ${ruleAdherence}%. Every broken rule costs money.`}
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl border border-border/50">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-purple-500/10">
                    <Brain className="h-4 w-4 text-purple-500" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tradeCount > 0 ? `${tradeCount} trades taken. Stay selective and disciplined.` : "Log trades to get personalized insights."}
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
