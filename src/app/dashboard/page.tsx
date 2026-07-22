"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle2,
  Flame,
  ArrowUpRight,
  BookOpen,
  Zap,
  ChevronRight,
  Loader2,
  Info,
  Activity,
  RefreshCw,
  X,
  AlertOctagon,
  Lightbulb,
  Sparkles,
  Lock,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { PreMarketRoutineRow } from "@/components/dashboard/pre-market-routine-row";

const DisciplineChart = dynamic(() => import("@/components/dashboard/discipline-chart"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted/10 rounded-lg animate-pulse">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});
import { useDashboardQuery, useMarketQuery } from "@/lib/hooks/use-queries";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/client";

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
  const { data: marketData, isLoading, refetch } = useMarketQuery();
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const zone = marketData?.market_zone || null;
  const marketStatus = marketData?.market_status as "OPEN" | "CLOSED" | undefined;

  const handleRefresh = async () => {
    setLoadingMarket(true);
    try {
      await refetch();
    } finally {
      setLoadingMarket(false);
    }
  };

  const zoneMap: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
    "Positive Market Bias": { label: "Positive Market Bias", color: "text-success", bg: "bg-success/[0.07]", emoji: "🟢" },
    "Negative Market Bias": { label: "Negative Market Bias", color: "text-destructive", bg: "bg-destructive/[0.07]", emoji: "🔴" },
    "Neutral Market Bias": { label: "Neutral Market Bias", color: "text-muted-foreground", bg: "bg-muted/30", emoji: "⚪" },
  };
  const z = zone ? zoneMap[zone] || zoneMap["Neutral Market Bias"] : null;

  return (
    <>
      <motion.div
        variants={staggerItem}
        className="relative overflow-hidden rounded-2xl border border-border bg-card hover:border-border/85 transition-all p-5 group"
      >
        <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl transition-all ${z?.bg || "bg-muted/30"}`} />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Nifty 50 Sentiment
              </p>
              {/* Market Status Indicator */}
              {marketStatus && (
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                  marketStatus === "OPEN" 
                    ? "bg-success/10 text-success" 
                    : "bg-amber-500/10 text-amber-500"
                }`}>
                  {marketStatus === "OPEN" ? (
                    <>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
                      </span>
                      LIVE
                    </>
                  ) : (
                    "CLOSED"
                  )}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsMarketOpen(true)}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Details →
            </button>
          </div>
          {z ? (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl">{z.emoji}</span>
                <span className={`text-3xl font-bold font-heading ${z.color}`}>{z.label}</span>
                {marketData?.zone_status === "WATCH" && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-500 uppercase tracking-wider animate-pulse border border-amber-500/20">
                    STABILIZING ({marketData?.confirmation_count}/3)
                  </span>
                )}
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

      {/* Interactive Modal Popup Overlay */}
      <AnimatePresence>
        {isMarketOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-primary" />
                  <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-foreground">
                    Market Intelligence
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={loadingMarket || isLoading}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                    title="Refresh Data"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingMarket || isLoading ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={() => setIsMarketOpen(false)}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {isLoading && !marketData ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
                </div>
              ) : marketData ? (
                <div className="space-y-5">
                  {/* Zone status banner */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Market Bias</span>
                    <div className="flex items-center gap-2">
                      {marketData.failsafe_mode ? (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-destructive/15 text-destructive animate-pulse uppercase">
                          FAIL-SAFE ACTIVE
                        </span>
                      ) : marketData.zone_status === "WATCH" ? (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500 animate-pulse uppercase">
                          WATCH ({marketData.confirmation_count}/3)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-success/15 text-success uppercase">
                          CONFIRMED
                        </span>
                      )}
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider border uppercase ${
                        marketData.market_zone === "Positive Market Bias" 
                          ? "bg-success/20 text-success border-success/30 shadow-[0_0_12px_rgba(34,197,94,0.15)]" 
                          : marketData.market_zone === "Negative Market Bias" 
                          ? "bg-destructive/20 text-destructive border-destructive/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]" 
                          : "bg-amber-500/20 text-amber-500 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                      }`}>
                        {marketData.market_zone}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/30 pt-2 text-xs">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className={`font-bold uppercase ${
                      marketData.confidence === "HIGH" ? "text-success" :
                      marketData.confidence === "MODERATE" ? "text-amber-500" :
                      "text-muted-foreground"
                    }`}>
                      {marketData.confidence || "LOW"}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3.5 rounded-xl border border-border/40">
                    {marketData.market_zone === "Positive Market Bias" && (
                      "Current market indicators show positive directional alignment. Market conditions may be supportive of bullish market behavior."
                    )}
                    {marketData.market_zone === "Negative Market Bias" && (
                      "Current market indicators show negative directional alignment. Market conditions may be supportive of bearish market behavior."
                    )}
                    {marketData.market_zone === "Neutral Market Bias" && (
                      "Current market indicators are mixed or lack directional confirmation. Current conditions do not indicate a strong directional market bias."
                    )}
                  </div>

                  {/* Watch State Progress Bar */}
                  {marketData.zone_status === "WATCH" && !marketData.failsafe_mode && (
                    <div className="rounded-lg bg-amber-500/[0.03] border border-amber-500/10 p-3 space-y-1.5 animate-pulse">
                      <div className="flex items-center justify-between text-[10px] text-amber-500 font-semibold">
                        <span>Stabilizing Bias...</span>
                        <span>{marketData.confirmation_count} / 3 Confirmations</span>
                      </div>
                      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full transition-all duration-300"
                          style={{ width: `${(marketData.confirmation_count / 3) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Persistence Timer */}
                  {marketData.zone_status === "CONFIRMED" && marketData.stability_duration && !marketData.failsafe_mode && (
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground bg-muted/20 border border-border/30 px-3 py-1.5 rounded-lg">
                      <span>Bias Stability:</span>
                      <span className="text-foreground font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-success animate-ping" />
                        Stable for {marketData.stability_duration}
                      </span>
                    </div>
                  )}

                  {/* Momentum score */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-muted-foreground">Momentum Score</span>
                      <span className="text-foreground">{marketData.radar_score}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          marketData.radar_score >= 65 ? "bg-success" : marketData.radar_score >= 40 ? "bg-amber-500" : "bg-destructive"
                        }`}
                        style={{ width: `${marketData.radar_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Snapshot Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold mb-0.5">Nifty 50</span>
                      <span className="font-mono font-bold text-foreground text-sm">₹{marketData.nifty_price?.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold mb-0.5">India VIX</span>
                      <span className="font-mono font-bold text-foreground text-sm">{marketData.vix}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold mb-0.5">Put-Call Ratio</span>
                      <span className="font-mono font-bold text-foreground text-sm">{marketData.pcr}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold mb-0.5">Advances/Declines</span>
                      <span className="font-mono font-bold text-foreground text-sm">{marketData.advances} : {marketData.declines}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold mb-0.5">Market Regime</span>
                      <span className={`font-mono font-bold text-sm ${
                        marketData.regime === "TREND_DAY" ? "text-success" : marketData.regime === "VOLATILE" ? "text-destructive" : marketData.regime === "COMPRESSION" ? "text-amber-500" : "text-foreground"
                      }`}>
                        {marketData.regime?.replace("_", " ")}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold mb-0.5">Zone Stability</span>
                      <span className={`font-mono font-bold text-sm ${
                        marketData.stability === "STABLE" ? "text-success" : marketData.stability === "WATCH" ? "text-amber-500" : "text-destructive"
                      }`}>
                        {marketData.stability}
                      </span>
                    </div>
                  </div>

                  {/* Insights list */}
                  {marketData.reasons && marketData.reasons.length > 0 && (
                    <div className="space-y-1.5 border-t border-border/40 pt-3.5">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-bold">Insights Summary</span>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {marketData.reasons.map((reason: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                            <span className="text-primary mt-1">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Sources & SEBI Disclaimer (Client requirement Sec 3.3.8 / compliance) */}
                  <div className="border-t border-border/30 pt-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-white/80 font-mono">
                      <span>Source: Third-party data providers</span>
                      {marketData.market_status && (
                        <span className="capitalize">Market: {marketData.market_status.toLowerCase()}</span>
                      )}
                    </div>
                    <p className="text-[9px] text-white/70 leading-normal text-justify">
                      This assessment is generated using quantitative market indicators and is provided for informational and educational purposes only. It does not constitute investment advice, a recommendation, research report, or a solicitation to buy or sell any security. Users should exercise independent judgment before making trading decisions.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-6">No live market data available.</p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}



function DisciplineGauge({ score }: { score: number }) {
  const radius = 36;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius; // Full circle
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#22c55e" : score >= 55 ? "#eab308" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
          style={{
            stroke: color,
            filter: `drop-shadow(0 0 4px ${color}80)`
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold font-heading text-foreground leading-none">{score}</span>
        <span className="text-[8px] text-muted-foreground uppercase font-semibold tracking-wider mt-1 scale-90">Score</span>
      </div>
    </div>
  );
}

function RiskLimitStatusBar({ todayTradeCount, todayPnl, capitalUsed }: { todayTradeCount: number; todayPnl: number; capitalUsed: number }) {
  const maxTrades = 5;
  const maxDrawdownPct = 2; // 2% daily limit
  
  // Daily Trades progress
  const tradePercent = Math.min(100, (todayTradeCount / maxTrades) * 100);
  
  // Drawdown exposure
  const currentDrawdownPct = todayPnl < 0 ? Math.min(100, (Math.abs(todayPnl) / capitalUsed) * 100) : 0;
  const drawdownLimitProgress = Math.min(100, (currentDrawdownPct / maxDrawdownPct) * 100);
  
  // Capital at risk
  const capitalAtRiskPct = Math.round((todayTradeCount > 0 ? 1.2 : 0) * 10) / 10;

  return (
    <motion.div
      variants={staggerItem}
      className="rounded-2xl border border-border bg-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4.5 w-4.5 text-success" />
          <h3 className="font-heading text-xs font-bold uppercase tracking-wider">
            Risk Limit Status Controls
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Daily Trades Tracker */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Daily Trades Limit</span>
            <span className="font-mono text-foreground font-semibold">{todayTradeCount} / {maxTrades} trades</span>
          </div>
          <div className="flex gap-1.5 h-2">
            {Array.from({ length: maxTrades }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm transition-all duration-300 ${
                  i < todayTradeCount
                    ? todayTradeCount > maxTrades
                      ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                      : "bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                    : "bg-muted/40"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>Safe Zone</span>
            {todayTradeCount > maxTrades && <span className="text-destructive font-semibold">Limit Exceeded!</span>}
          </div>
        </div>

        {/* Drawdown Exposure */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Daily Drawdown (Max {maxDrawdownPct}%)</span>
            <span className="font-mono text-foreground font-semibold">
              {todayPnl < 0 ? `-₹${Math.abs(todayPnl).toLocaleString("en-IN")}` : "₹0"} ({currentDrawdownPct.toFixed(2)}%)
            </span>
          </div>
          <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                currentDrawdownPct >= maxDrawdownPct
                  ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                  : currentDrawdownPct >= maxDrawdownPct * 0.8
                  ? "bg-amber-500"
                  : "bg-success"
              }`}
              style={{ width: `${drawdownLimitProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>0% Exposure</span>
            <span>{maxDrawdownPct}% Cap</span>
          </div>
        </div>

        {/* Capital at Risk */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Active SL Capital-at-Risk</span>
            <span className="font-mono text-foreground font-semibold">{capitalAtRiskPct}% of capital</span>
          </div>
          <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${(capitalAtRiskPct / 5) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>0% Locked</span>
            <span>5% Hard Limit</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Inner component that uses useSearchParams - must be wrapped in Suspense
function DashboardContent() {
  const { data, isLoading, isError } = useDashboardQuery();
  const { user, profile, isAdmin, hasActiveSubscription, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [subscriptionVerified, setSubscriptionVerified] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scoreCopied, setScoreCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle payment success redirect - verify subscription directly from DB
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    
    if (paymentStatus === "success" && user && !subscriptionVerified) {
      setVerifying(true);
      
      // Poll for subscription status (webhook may take a moment)
      const checkSubscription = async (attempts = 0): Promise<void> => {
        const supabase = createClient();
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("id, status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .gte("current_period_end", new Date().toISOString())
          .limit(1)
          .maybeSingle();

        if (sub) {
          setSubscriptionVerified(true);
          setVerifying(false);
          // Clean URL without causing navigation
          window.history.replaceState({}, "", "/dashboard");
        } else if (attempts < 5) {
          // Retry up to 5 times with 1.5s delay (total ~7.5s wait for webhook)
          setTimeout(() => checkSubscription(attempts + 1), 1500);
        } else {
          // Give up after 5 attempts - show dashboard anyway, webhook will sync later
          setSubscriptionVerified(true);
          setVerifying(false);
          window.history.replaceState({}, "", "/dashboard");
        }
      };

      checkSubscription();
    }
  }, [searchParams, user, subscriptionVerified]);

  // Show loading only during initial load, not during background refetches
  // Also check authLoading to prevent infinite loading when switching dashboards
  if ((isLoading && !data) || authLoading || verifying) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
          {verifying && (
            <p className="text-sm text-muted-foreground">Activating your subscription...</p>
          )}
        </div>
      </div>
    );
  }

  // Dashboard is open to all users (subscribed and non-subscribed). Selected features like the detailed Risk Report are gated inside their respective pages.

  const disciplineScore = data?.disciplineScore || 0;
  const hasJournaledToday = data?.hasJournaledToday || false;
  const hasTodayReport = data?.hasTodayReport || false;
  const todayPnl = data?.todayPnl || 0;
  const todayTradeCount = data?.todayTrades || 0;
  const maxTrades = data?.maxTrades || 3;
  const currentStreak = data?.currentStreak || 0;
  const rulesFollowed = data?.rulesFollowed || 0;
  const totalRules = data?.totalRules || 4;
  const disciplineData = data?.disciplineTrend || [];
  const todaysRules = data?.tradingRules || [];
  const recentTrades = data?.recentTrades || [];
  const todayMistakesCount = data?.todayMistakesCount || 0;
  const todayMistakeTags = (data?.todayMistakeTags || []) as any[];
  const todayAreasToImprove = (data?.todayAreasToImprove || []) as string[];
  const hasEverTraded = data?.hasEverTraded || false;
  const hasAssessment = data?.hasAssessment || false;
  const winRate = data?.winRate || 0;
  const dailyReports = data?.dailyReports || [];
  // Show welcome banner only for truly new users who have never traded or done assessment
  const hasNoAssessment = !hasEverTraded && !hasAssessment;
  const isPro = hasActiveSubscription === true;

  // Helper to format date for Consistency Heatmap tooltips
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Construct past 30 days for Consistency Heatmap
  const last30Days = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split("T")[0];
    const report = dailyReports.find((r: { date: string }) => r.date === dateStr);
    const score = report ? (report as { discipline_score: number }).discipline_score : null;
    return {
      date: d,
      dateStr,
      score,
    };
  });

  // Calculate Cognitive Triggers from real trade records
  const isRevenge = todayMistakeTags.some(t => t.tag?.includes("REVENGE") || t.tag?.includes("revenge"));
  const isFOMO = todayMistakeTags.some(t => t.tag?.includes("FOMO") || t.tag?.includes("fomo"));
  const isSizeViolation = todayMistakeTags.some(t => t.tag?.includes("SIZE") || t.tag?.includes("size"));

  const triggers = {
    frustration: isRevenge ? 100 : Math.min(100, todayMistakesCount * 25),
    overconfidence: todayPnl > 0 && todayMistakesCount === 0 && todayTradeCount >= 3 ? 80 : todayPnl > 0 ? Math.min(100, todayTradeCount * 20) : 10,
    boredom: todayMistakeTags.some(t => t.tag?.includes("Overtrading")) ? 70 : 10,
    urgency: isFOMO || isSizeViolation ? 90 : 20,
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Smart Money Filter Message */}
      <motion.div
        variants={staggerItem}
        className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Target className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-500 mb-0.5">Smart Money Filter</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Patience is a trading edge. Let the market prove its direction first.
            </p>
          </div>
        </div>
      </motion.div>

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
        {/* Discipline Score Card */}
        <motion.div
          variants={staggerItem}
          className="relative overflow-hidden rounded-2xl border border-border bg-card hover:border-border/85 transition-all p-5 group"
        >
          <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl transition-all ${hasJournaledToday ? "bg-success/[0.07] group-hover:bg-success/[0.12]" : "bg-muted/30"}`} />
          <div className="relative flex flex-col justify-between h-full min-h-[140px]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Discipline Score
              </p>
              {hasJournaledToday && hasTodayReport ? (
                <div className="flex items-center gap-1 text-success text-xs font-semibold">
                  <ArrowUpRight className="h-3 w-3" />
                  Today
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Overall</span>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 mt-2">
              <div className="flex-1">
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold font-heading text-foreground">{disciplineScore}</span>
                  <span className="text-xs text-muted-foreground mb-1">/100</span>
                </div>
                {/* Share button */}
                <button
                  onClick={() => {
                    const referralCode = profile?.referral_code || user?.id?.slice(0, 8) || "";
                    const text = `My Trading Discipline Score\n\nINTROSPECT Score: ${disciplineScore}/100\n\nImproving my trading psychology and risk discipline.\n\nJoin INTROSPECT here:\nhttps://www.intradaymindview.com/auth/signup?ref=${referralCode}\n\nPowered by INTROSPECT\nwww.intradaymindview.com`;
                    navigator.clipboard.writeText(text);
                    setScoreCopied(true);
                    setTimeout(() => setScoreCopied(false), 2000);
                  }}
                  className="text-[9px] font-semibold text-muted-foreground hover:text-success px-2 py-1 rounded border border-border hover:border-success/30 transition-all mt-2.5 block text-center w-full"
                >
                  {scoreCopied ? "Copied!" : "Copy Share Card"}
                </button>
              </div>
              <div className="shrink-0">
                <DisciplineGauge score={disciplineScore} />
              </div>
            </div>

            {!hasJournaledToday && (
              <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">No trades logged today</span>
                <Link
                  href="/dashboard/journal?new=true"
                  className="inline-flex items-center gap-1 font-semibold text-success hover:text-success/80 transition-colors"
                >
                  <BookOpen className="h-3 w-3" />
                  Import / Log trade
                </Link>
              </div>
            )}
          </div>
        </motion.div>


        {/* Today's P&L */}
        <motion.div
          variants={staggerItem}
          className="relative overflow-hidden rounded-2xl border border-border bg-card hover:border-border/85 transition-all p-5 group"
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
              Win rate: <span className="text-foreground font-medium">{winRate}%</span>
            </p>
          </div>
        </motion.div>

        {/* Market Sentiment - only bullish/bearish/no trade */}
        <MarketZoneWidget />

        {/* Streak */}
        <motion.div
          variants={staggerItem}
          className="relative overflow-hidden rounded-2xl border border-border bg-card hover:border-border/85 transition-all p-5 group"
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

      <RiskLimitStatusBar todayTradeCount={todayTradeCount} todayPnl={todayPnl} capitalUsed={data?.capitalUsed || 100000} />

      {/* Consistency Heatmap Card */}
      <motion.div
        variants={staggerItem}
        className="relative rounded-2xl border border-border bg-card p-5 space-y-4 overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <div className="flex items-center gap-2">
            <Flame className="h-4.5 w-4.5 text-success" />
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider">
              Discipline Consistency Heatmap (Last 30 Days)
            </h3>
          </div>
          <span className="text-[10px] text-muted-foreground">Hover blocks for daily score detail</span>
        </div>

        <div className="relative">
          <div className={`flex flex-col space-y-4 ${!isPro ? "blur-[6px] pointer-events-none select-none opacity-40" : ""}`}>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none snap-x justify-start md:justify-between">
              {last30Days.map((day) => {
                let colorClass = "bg-muted/30 border border-border hover:border-border/70";
                let glowColor = "";
                if (day.score !== null) {
                  if (day.score >= 75) {
                    colorClass = "bg-success border border-success/30";
                    glowColor = "shadow-[0_0_8px_rgba(34,197,94,0.35)]";
                  } else if (day.score >= 55) {
                    colorClass = "bg-amber-500 border border-amber-500/30";
                    glowColor = "shadow-[0_0_8px_rgba(245,158,11,0.35)]";
                  } else {
                    colorClass = "bg-destructive border border-destructive/30";
                    glowColor = "shadow-[0_0_8px_rgba(239,68,68,0.35)]";
                  }
                }
                return (
                  <div key={day.dateStr} className="relative group snap-center shrink-0" title={`${formatDate(day.date)}: ${day.score !== null ? `Score: ${day.score}/100` : "No trades logged"}`}>
                    <div className={`w-8 h-8 rounded-lg transition-all duration-200 cursor-pointer ${colorClass} ${glowColor} hover:scale-105`} />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block pointer-events-none bg-zinc-900 text-zinc-100 text-[10px] rounded-lg px-2.5 py-1.5 shadow-xl border border-zinc-800 whitespace-nowrap z-30 font-sans">
                      <p className="font-semibold text-zinc-100">{formatDate(day.date)}</p>
                      <p className="text-zinc-400 mt-0.5">
                        {day.score !== null ? (
                          <>
                            Score: <span className="font-mono font-bold text-zinc-100">{day.score}</span>/100
                          </>
                        ) : (
                          "No trades logged"
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 flex-wrap text-[10px] text-muted-foreground pt-1 border-t border-border/50">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-muted/40 border border-border" />
                No Trades
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-destructive border border-destructive/30 shadow-[0_0_6px_rgba(239,68,68,0.2)]" />
                Uncontrolled (&lt;55)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-500 border border-amber-500/30 shadow-[0_0_6px_rgba(245,158,11,0.2)]" />
                Moderate (55-74)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-success border border-success/30 shadow-[0_0_6px_rgba(34,197,94,0.2)]" />
                Disciplined (75+)
              </span>
            </div>
          </div>

          {!isPro && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <div className="w-9 h-9 rounded-xl bg-success/15 border border-success/30 flex items-center justify-center mb-2 animate-bounce-slow">
                <Lock className="h-4.5 w-4.5 text-success" />
              </div>
              <p className="text-sm font-heading font-bold text-foreground">Discipline Consistency Heatmap</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2.5">Unlock 30-day streak consistency analytics</p>
              <Link
                href="/dashboard/payments"
                className="px-3 py-1.5 rounded-lg bg-success text-success-foreground font-bold text-xs hover:bg-success/90 transition-all flex items-center gap-1 cursor-pointer"
              >
                Upgrade to Pro
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      {/* Middle Row: Chart + Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Discipline Chart */}
        <motion.div
          variants={staggerItem}
          className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 relative overflow-hidden"
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
            {isPro && (
              <Link
                href="/dashboard/analytics"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                View all
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          <div className="relative">
            <div className={`h-[260px] min-h-[260px] min-w-0 -ml-2 ${!isPro ? "blur-[6px] pointer-events-none select-none opacity-30" : ""}`}>
              <DisciplineChart data={disciplineData} />
            </div>
            {!isPro && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <div className="w-9 h-9 rounded-xl bg-success/15 border border-success/30 flex items-center justify-center mb-2 animate-bounce-slow">
                  <Lock className="h-4.5 w-4.5 text-success" />
                </div>
                <p className="text-sm font-heading font-bold text-foreground">Discipline Trend Chart</p>
                <p className="text-xs text-muted-foreground mt-0.5 mb-2.5">Unlock weekly performance trajectory & insights</p>
                <Link
                  href="/dashboard/payments"
                  className="px-3 py-1.5 rounded-lg bg-success text-success-foreground font-bold text-xs hover:bg-success/90 transition-all flex items-center gap-1 cursor-pointer"
                >
                  Upgrade to Pro
                </Link>
              </div>
            )}
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

        <div className="space-y-4">
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
                <p className="text-sm font-medium group-hover:text-success transition-colors flex items-center gap-1.5 flex-wrap">
                  Log / Import Trades
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-success/15 text-success uppercase tracking-wider animate-pulse border border-success/20">
                    Easy Import
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Upload broker CSV in 60s or log manually
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

            {/* Mistake Detector Alert - Shows actual mistakes from today's report */}
            {hasTodayReport && todayMistakesCount > 0 ? (
              <div className="mt-2 p-3.5 rounded-xl border border-destructive/30 bg-destructive/[0.06]">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-destructive">
                      Mistake Detector ({todayMistakesCount} issue{todayMistakesCount > 1 ? "s" : ""})
                    </p>
                    <ul className="text-[11px] text-muted-foreground mt-1.5 space-y-1">
                      {todayAreasToImprove.slice(0, 3).map((area: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-destructive">•</span>
                          <span>{area.replace(/^⚠️\s*/, "")}</span>
                        </li>
                      ))}
                    </ul>
                    <Link 
                      href="/dashboard/daily-report" 
                      className="text-[10px] text-destructive hover:underline mt-2 inline-block"
                    >
                      View full report →
                    </Link>
                  </div>
                </div>
              </div>
            ) : hasTodayReport && todayMistakesCount === 0 ? (
              <div className="mt-2 p-3.5 rounded-xl border border-success/30 bg-success/[0.06]">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-success">
                      Clean Trading Day! ✓
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      No rule violations detected. Keep up the discipline!
                    </p>
                  </div>
                </div>
              </div>
            ) : hasJournaledToday ? (
              <div className="mt-2 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.06]">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-500">
                      Generate Report
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      Generate your daily report to see mistake analysis.
                    </p>
                    <Link 
                      href="/dashboard/daily-report" 
                      className="text-[10px] text-amber-500 hover:underline mt-1 inline-block"
                    >
                      Go to Daily Report →
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}

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

          {/* Cognitive Trigger Map */}
          <motion.div
            variants={staggerItem}
            className="relative rounded-2xl border border-border bg-card p-5 space-y-4 overflow-hidden"
          >
            <div>
              <h3 className="font-heading text-sm font-semibold">
                Cognitive Trigger Map
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time monitoring of trading bias risks
              </p>
            </div>

            <div className="relative">
              <div className={`space-y-3.5 ${!isPro ? "blur-[6px] pointer-events-none select-none opacity-30" : ""}`}>
                {/* Urgency */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium flex items-center gap-1.5 text-foreground">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                      Urgency (FOMO)
                    </span>
                    <span className="font-mono font-semibold text-muted-foreground">
                      {triggers.urgency}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
                      style={{ width: `${triggers.urgency}%` }}
                    />
                  </div>
                </div>

                {/* Frustration */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium flex items-center gap-1.5 text-foreground">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                      Frustration (Revenge)
                    </span>
                    <span className="font-mono font-semibold text-muted-foreground">
                      {triggers.frustration}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-500"
                      style={{ width: `${triggers.frustration}%` }}
                    />
                  </div>
                </div>

                {/* Overconfidence */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium flex items-center gap-1.5 text-foreground">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                      Overconfidence
                    </span>
                    <span className="font-mono font-semibold text-muted-foreground">
                      {triggers.overconfidence}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                      style={{ width: `${triggers.overconfidence}%` }}
                    />
                  </div>
                </div>

                {/* Boredom */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium flex items-center gap-1.5 text-foreground">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                      Boredom (Overtrading)
                    </span>
                    <span className="font-mono font-semibold text-muted-foreground">
                      {triggers.boredom}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${triggers.boredom}%` }}
                    />
                  </div>
                </div>
              </div>

              {!isPro && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  <div className="w-9 h-9 rounded-xl bg-success/15 border border-success/30 flex items-center justify-center mb-2 animate-bounce-slow">
                    <Lock className="h-4.5 w-4.5 text-success" />
                  </div>
                  <p className="text-sm font-heading font-bold text-foreground">Cognitive Trigger Map</p>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2.5">Unlock real-time monitoring of trading bias risks</p>
                  <Link
                    href="/dashboard/payments"
                    className="px-3 py-1.5 rounded-lg bg-success text-success-foreground font-bold text-xs hover:bg-success/90 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Upgrade to Pro
                  </Link>
                </div>
              )}
            </div>

            <div className={`pt-2.5 border-t border-border flex items-start gap-2 ${!isPro ? "opacity-30" : ""}`}>
              <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Triggers are calculated dynamically from your logged mistakes, trade count, and P&L activity today.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Pre-Market Routine checklist */}
      <PreMarketRoutineRow />

      {/* Risk Management Disclaimer (Client requirement Sec 3.3.8) */}
      <motion.div
        variants={staggerItem}
        className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm p-4"
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

// Export with Suspense wrapper for useSearchParams
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
