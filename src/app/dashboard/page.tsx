"use client";

import { motion, type Variants } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle2,
  Flame,
  ArrowUpRight,
  Clock,
  BookOpen,
  Zap,
  ChevronRight,
  Loader2,
  Info,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { useDashboardQuery, useMarketQuery } from "@/lib/hooks/use-queries";
import { useAuth } from "@/lib/auth/auth-context";

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function MarketZoneWidget() {
  const { data: marketData, isLoading } = useMarketQuery();
  const zone = marketData?.market_zone || null;

  const zoneMap: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
    BULLISH: { label: "Bullish", color: "text-success", bg: "bg-success/[0.07]", emoji: "🟢" },
    BEARISH: { label: "Bearish", color: "text-destructive", bg: "bg-destructive/[0.07]", emoji: "🔴" },
    NO_TRADE: { label: "No Trade", color: "text-muted-foreground", bg: "bg-muted/30", emoji: "⚪" },
  };
  const z = zone ? zoneMap[zone] || zoneMap.NO_TRADE : null;

  return (
    <motion.div
      variants={staggerItem}
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 group"
    >
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl transition-all ${z?.bg || "bg-muted/30"}`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Nifty 50 Sentiment
          </p>
          <Link href="/dashboard/sentiment" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            Details →
          </Link>
        </div>
        {z ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{z.emoji}</span>
              <span className={`text-3xl font-bold font-heading ${z.color}`}>{z.label}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Market zone • <span className="text-foreground font-medium">Nifty 50 (India)</span>
            </p>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Loading...</span>
        )}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboardQuery();
  const { user, profile, isAdmin, hasActiveSubscription, loading: authLoading } = useAuth();

  // Show loading only during initial load, not during background refetches
  if (authLoading || (isLoading && !data)) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Subscription gate — unpaid non-admin users see payment wall
  if (!isAdmin && hasActiveSubscription === false) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center p-8 rounded-2xl border border-border bg-card">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-success" />
          </div>
          <h2 className="font-heading text-2xl font-bold mb-3">Activate Your Account</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Subscribe to INTROSPECT™ to unlock your personalized risk assessment, trading rules, journal, challenges, and more.
          </p>
          <Link
            href="/dashboard/payments"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-success hover:bg-success/90 text-success-foreground font-semibold transition-colors shadow-lg shadow-success/20"
          >
            Choose a Plan
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-muted-foreground mt-4">Starting at just ₹333/month • All inclusive</p>
        </div>
      </div>
    );
  }

  const disciplineScore = data?.disciplineScore || 0;
  const todayPnl = data?.todayPnl || 0;
  const todayTradeCount = data?.todayTrades || 0;
  const maxTrades = data?.maxTrades || 3;
  const currentStreak = data?.currentStreak || 0;
  const rulesFollowed = data?.rulesFollowed || 0;
  const totalRules = data?.totalRules || 0;
  const disciplineData = data?.disciplineTrend || [];
  const todaysRules = data?.tradingRules || [];
  const recentTrades = data?.recentTrades || [];
  const hasNoAssessment = disciplineScore === 0;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome Banner - shown when no assessment done yet */}
      {hasNoAssessment && (
        <motion.div
          variants={staggerItem}
          className="relative overflow-hidden rounded-2xl border-2 border-success/30 bg-gradient-to-r from-success/5 via-success/[0.03] to-transparent p-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
              <Zap className="h-6 w-6 text-success" />
            </div>
            <div className="flex-1">
              <h2 className="font-heading text-lg font-bold mb-1">
                Welcome to INTROSPECT™!
              </h2>
              <p className="text-sm text-muted-foreground">
                Start <span className="text-success font-semibold">Step 1: Risk Assessment</span> to unlock your personalized trading rules, discipline score, and risk report.
              </p>
            </div>
            <Link
              href="/dashboard/assessment"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-success hover:bg-success/90 text-success-foreground text-sm font-semibold transition-colors shadow-lg shadow-success/20"
            >
              Start Assessment
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Discipline Score + Share Card */}
        <motion.div
          variants={staggerItem}
          className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 group"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-success/[0.07] rounded-full blur-2xl transition-all group-hover:bg-success/[0.12]" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Discipline Score
              </p>
              <div className="flex items-center gap-1 text-success text-xs font-semibold">
                <ArrowUpRight className="h-3 w-3" />
                +12%
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold font-heading text-foreground">
                {disciplineScore}
              </span>
              <span className="text-sm text-muted-foreground mb-1">/100</span>
            </div>
            <div className="mt-3 w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-success rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${disciplineScore}%` }}
                transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
              />
            </div>
            {/* Share Card buttons per client share card doc */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  const referralCode = profile?.referral_code || user?.id?.slice(0, 8) || "";
                  const text = `My Trading Discipline Score\n\nINTROSPECT Score: ${disciplineScore}/100\n\nImproving my trading psychology and risk discipline.\n\nJoin INTROSPECT here:\nhttps://www.intradaymindview.com/auth/signup?ref=${referralCode}\n\nPowered by INTROSPECT\nwww.intradaymindview.com`;
                  navigator.clipboard.writeText(text);
                }}
                className="text-[10px] font-medium text-muted-foreground hover:text-success px-2 py-1 rounded-md border border-border hover:border-success/30 transition-all cursor-pointer"
              >
                Copy Share Text
              </button>
            </div>
          </div>
        </motion.div>

        {/* Today's P&L */}
        <motion.div
          variants={staggerItem}
          className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 group"
        >
          <div
            className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl transition-all ${
              todayPnl >= 0
                ? "bg-success/[0.07] group-hover:bg-success/[0.12]"
                : "bg-destructive/[0.07] group-hover:bg-destructive/[0.12]"
            }`}
          />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Today&apos;s P&L
              </p>
              <div
                className={`flex items-center gap-1 text-xs font-semibold ${
                  todayPnl >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                {todayPnl >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {todayTradeCount} trades
              </div>
            </div>
            <span
              className={`text-3xl font-bold font-heading ${
                todayPnl >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {todayPnl >= 0 ? "+" : ""}₹{Math.abs(todayPnl).toLocaleString("en-IN")}
            </span>
            <p className="text-xs text-muted-foreground mt-1.5">
              Win rate: <span className="text-foreground font-medium">67%</span>
            </p>
          </div>
        </motion.div>

        {/* Market Sentiment - only bullish/bearish/no trade */}
        <MarketZoneWidget />

        {/* Streak */}
        <motion.div
          variants={staggerItem}
          className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 group"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-orange-500/[0.07] rounded-full blur-2xl transition-all group-hover:bg-orange-500/[0.12]" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Discipline Streak
              </p>
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <div className="flex items-end gap-1.5">
              <span className="text-3xl font-bold font-heading text-foreground">
                {currentStreak}
              </span>
              <span className="text-sm text-muted-foreground mb-1">days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Best: <span className="text-foreground font-medium">18 days</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Middle Row: Chart + Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Discipline Chart */}
        <motion.div
          variants={staggerItem}
          className="lg:col-span-2 rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-heading text-sm font-semibold">
                Discipline Trend
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your weekly score progression
              </p>
            </div>
            <Link
              href="/dashboard/analytics"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              View all
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="h-[200px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={disciplineData}>
                <defs>
                  <linearGradient
                    id="disciplineGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--success)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--success)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  dy={8}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    padding: "8px 12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    color: "var(--foreground)",
                  }}
                  labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                  itemStyle={{ color: "var(--success)" }}
                  formatter={(value) => [`${value}/100`, "Score"]}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="var(--success)"
                  strokeWidth={2.5}
                  fill="url(#disciplineGradient)"
                  dot={{
                    r: 4,
                    fill: "var(--card)",
                    stroke: "var(--success)",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: "var(--success)",
                    stroke: "var(--card)",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Today's Rules */}
        <motion.div
          variants={staggerItem}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading text-sm font-semibold">
                Today&apos;s Rules
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {rulesFollowed}/{todaysRules.length} followed
              </p>
            </div>
            <div
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                rulesFollowed === todaysRules.length
                  ? "bg-success/10 text-success"
                  : "bg-amber-500/10 text-amber-500"
              }`}
            >
              {Math.round((rulesFollowed / Math.max(totalRules, 1)) * 100)}%
            </div>
          </div>

          <div className="space-y-2.5">
            {todaysRules.map((rule: { text: string; followed: boolean }, i: number) => (
              <div
                key={i}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-colors ${
                  rule.followed
                    ? "border-success/20 bg-success/[0.04]"
                    : "border-amber-500/20 bg-amber-500/[0.04]"
                }`}
              >
                {rule.followed ? (
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                <span
                  className={`text-xs font-medium ${
                    rule.followed
                      ? "text-foreground"
                      : "text-amber-500 dark:text-amber-300"
                  }`}
                >
                  {rule.text}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Recent Trades + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Trades */}
        <motion.div
          variants={staggerItem}
          className="lg:col-span-2 rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading text-sm font-semibold">
                Recent Trades
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Today&apos;s activity
              </p>
            </div>
            <Link
              href="/dashboard/journal"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              View all
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-3 pb-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            <div className="col-span-3">Symbol</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2 text-right">Entry</div>
            <div className="col-span-2 text-right">Exit</div>
            <div className="col-span-2 text-right">P&L</div>
            <div className="col-span-1 text-center">Rules</div>
          </div>

          <div className="space-y-1.5">
            {recentTrades.map((trade: { id: string; stock_index: string; direction: string; entry_price: number; exit_price: number; pnl: number; followed_plan: boolean; created_at: string }) => (
              <div
                key={trade.id}
                className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-xl hover:bg-muted/30 transition-colors text-sm"
              >
                <div className="col-span-3">
                  <span className="font-medium text-foreground">
                    {trade.stock_index}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">
                    {new Date(trade.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      trade.direction === "long"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {trade.direction === "long" ? "BUY" : "SELL"}
                  </span>
                </div>
                <div className="col-span-2 text-right text-muted-foreground text-xs font-mono">
                  ₹{trade.entry_price.toLocaleString("en-IN")}
                </div>
                <div className="col-span-2 text-right text-muted-foreground text-xs font-mono">
                  ₹{trade.exit_price.toLocaleString("en-IN")}
                </div>
                <div
                  className={`col-span-2 text-right text-xs font-bold font-mono ${
                    trade.pnl >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {trade.pnl >= 0 ? "+" : ""}₹
                  {Math.abs(trade.pnl).toLocaleString("en-IN")}
                </div>
                <div className="col-span-1 flex justify-center">
                  {trade.followed_plan ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              </div>
            ))}
            {recentTrades.length === 0 && (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No trades logged today. Start by logging your first trade.
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={staggerItem}
          className="rounded-2xl border border-border bg-card p-5 space-y-3"
        >
          <h3 className="font-heading text-sm font-semibold mb-4">
            Quick Actions
          </h3>

          <Link
            href="/dashboard/journal?new=true"
            className="flex items-center gap-3 w-full p-3 rounded-xl border border-border hover:border-success/30 hover:bg-success/[0.03] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0 group-hover:bg-success/20 transition-colors">
              <BookOpen className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium group-hover:text-success transition-colors">
                Log a Trade
              </p>
              <p className="text-[11px] text-muted-foreground">
                Record your latest entry
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/calculator"
            className="flex items-center gap-3 w-full p-3 rounded-xl border border-border hover:border-blue-500/30 hover:bg-blue-500/[0.03] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
              <Target className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium group-hover:text-blue-500 transition-colors">
                Position Calculator
              </p>
              <p className="text-[11px] text-muted-foreground">
                Size your next trade
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/assessment"
            className="flex items-center gap-3 w-full p-3 rounded-xl border border-border hover:border-purple-500/30 hover:bg-purple-500/[0.03] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition-colors">
              <Zap className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium group-hover:text-purple-500 transition-colors">
                Take Assessment
              </p>
              <p className="text-[11px] text-muted-foreground">
                Update your risk profile
              </p>
            </div>
          </Link>

          {/* Mistake Detector Alert */}
          <div className="mt-2 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.06]">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-500">
                  Mistake Detector
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  You broke a rule on your last trade. Consider pausing and reviewing before the next entry.
                </p>
              </div>
            </div>
          </div>

          {/* Services & Enquiries */}
          <div className="mt-4 relative rounded-xl border border-success/20 bg-success/[0.06] p-4 overflow-hidden group">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-success/10 rounded-full blur-xl group-hover:bg-success/20 transition-colors" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-success" />
                <span className="text-xs font-semibold text-success">
                  Services & Support
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                Click here for demat, automation, training, counseling and enquiries.
              </p>
              <a
                href="https://intradaymindview.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-success hover:text-success/80 transition-colors"
              >
                Contact Us
                <TrendingUp className="h-3 w-3" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Risk Management Disclaimer (Client requirement Sec 3.3.8) */}
      <motion.div
        variants={staggerItem}
        className="rounded-2xl border border-border bg-card/50 p-4"
      >
        <div className="flex items-start gap-2.5">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <strong>INTROSPECT</strong> is a risk management tool, not a trading strategy.
            It helps you protect capital, track discipline, and avoid common mistakes.
            Your entry, exit, and strategy decisions are yours alone.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

