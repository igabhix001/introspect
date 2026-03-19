"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  MinusCircle,
  Shield,
  Activity,
  Zap,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Wifi,
  WifiOff,
  Info,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Gauge,
  Target,
} from "lucide-react";
import { useMarketQuery } from "@/lib/hooks/use-queries";

// ──── Market Intelligence Object (user-facing fields only per client doc) ────
interface MarketIntelligence {
  // Sentiment Zone & Score (Section 3)
  market_zone: "BULLISH" | "BEARISH" | "NO_TRADE";
  radar_score: number;
  // Market Conditions (Section 4)
  confidence: "HIGH" | "MODERATE" | "LOW";
  stability: "STABLE" | "WATCH" | "UNSTABLE";
  momentum: "RISING" | "STEADY" | "WEAKENING";
  regime: "TREND_DAY" | "BALANCED" | "VOLATILE" | "COMPRESSION";
  // Model Insight (Section 6)
  reasons: string[];
  // Market Snapshot (Section 5)
  nifty_price: number;
  vix: number;
  pcr: number;
  advances: number;
  declines: number;
  // Meta
  timestamp: string;
  data_source?: "fyers_live" | "simulated";
  market_status?: "OPEN" | "CLOSED";
}

// ──── Config ────
const CONFIG = {
  DATA_REFRESH_INTERVAL_SECONDS: 5,
};

// ──── UI Config ────
const zoneConfig = {
  BULLISH: {
    label: "Bullish Zone",
    emoji: "🟢",
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    gradient: "from-success/20 via-success/5 to-transparent",
    icon: TrendingUp,
    message: "Momentum conditions currently favor upward movement.",
  },
  BEARISH: {
    label: "Bearish Zone",
    emoji: "🔴",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    gradient: "from-destructive/20 via-destructive/5 to-transparent",
    icon: TrendingDown,
    message: "Momentum conditions currently favor downward movement.",
  },
  NO_TRADE: {
    label: "No Trade Zone",
    emoji: "⚪",
    color: "text-muted-foreground",
    bg: "bg-muted/50",
    border: "border-border",
    gradient: "from-muted/30 via-muted/10 to-transparent",
    icon: MinusCircle,
    message: "Market is range-bound. Directional conviction is unclear.",
  },
};

const confidenceColors = {
  HIGH: "text-success bg-success/10",
  MODERATE: "text-amber-500 bg-amber-500/10",
  LOW: "text-muted-foreground bg-muted/50",
};

const stabilityColors = {
  STABLE: "text-success bg-success/10",
  WATCH: "text-amber-500 bg-amber-500/10",
  UNSTABLE: "text-destructive bg-destructive/10",
};

const momentumColors = {
  RISING: "text-success",
  STEADY: "text-amber-500",
  WEAKENING: "text-destructive",
};

const regimeLabels = {
  TREND_DAY: "Trend Day",
  BALANCED: "Balanced",
  VOLATILE: "Volatile",
  COMPRESSION: "Compression",
};


export default function SentimentEnginePage() {
  const { data: rawData, isLoading, isError, refetch } = useMarketQuery();
  const [isLive, setIsLive] = useState(true);

  // Cast to proper type
  const data = rawData as MarketIntelligence | null;

  // Show loading state
  if (isLoading && !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center max-w-5xl mx-auto">
        <div className="rounded-2xl border border-border bg-card/50 p-8 max-w-lg w-full flex flex-col items-center">
          <div className="relative mb-6">
            <div className="h-12 w-12 rounded-full border-4 border-muted border-t-success animate-spin" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-foreground">Connecting to Market Data...</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Loading real-time market sentiment engine. This may take a moment.
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError || !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center max-w-5xl mx-auto">
        <div className="rounded-2xl border border-border bg-card/50 p-8 max-w-lg w-full flex flex-col items-center">
          <div className="relative mb-6">
            <div className="h-12 w-12 rounded-full border-4 border-muted border-t-success animate-spin" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-foreground">Connecting to Market Data...</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Loading real-time market sentiment engine. This may take a moment.
          </p>
          <button
            onClick={() => refetch()}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const lastUpdate = data.timestamp ? new Date(data.timestamp).toLocaleTimeString("en-IN") : "";

  const zone = zoneConfig[data.market_zone];
  const ZoneIcon = zone.icon;

  const isMarketClosed = data.market_status === "CLOSED";

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Connection Status Bar - mobile responsive */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {isMarketClosed ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium px-2 py-1 bg-amber-500/10 rounded-md">
              <Clock className="h-3.5 w-3.5" />
              Market Closed
            </div>
          ) : isLive ? (
            <div className="flex items-center gap-1.5 text-xs text-success px-2 py-1 bg-success/10 rounded-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              Live
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 bg-muted rounded-md">
              <WifiOff className="h-3.5 w-3.5" />
              Paused
            </div>
          )}
          
          <span className="hidden sm:flex text-[10px] text-muted-foreground items-center gap-1.5 border-l pl-3 border-border">
            {data.data_source === "fyers_live" ? (
               <span className="text-success font-medium flex items-center gap-1 tracking-wide">
                 <Zap className="h-3 w-3" /> Fyers
               </span>
            ) : (
               <span className="text-muted-foreground">Simulation</span>
            )}
            <span>• {isMarketClosed ? "Last data" : "Updated"}: {lastUpdate}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
              isLive
                ? "bg-success/10 text-success hover:bg-success/20"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {isLive ? "Pause" : "Resume"}
          </button>
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            title="Refresh now"
          >
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* ──── MAIN ZONE DISPLAY ──── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={data.market_zone}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className={`relative overflow-hidden rounded-2xl border-2 ${zone.border} p-6 sm:p-8`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${zone.gradient} pointer-events-none`} />

          <div className="relative">
            {/* Zone Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl ${zone.bg} flex items-center justify-center`}>
                  <span className="text-3xl">{zone.emoji}</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">
                    Market Sentiment
                  </p>
                  <h2 className={`font-heading text-2xl sm:text-3xl font-bold ${zone.color}`}>
                    {zone.label}
                  </h2>
                </div>
              </div>

              {/* Sentiment Score */}
              <div className="text-center sm:text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Sentiment Score
                </p>
                <div className="flex items-end gap-1">
                  <span
                    className={`text-4xl font-bold font-heading ${
                      data.radar_score >= 70
                        ? "text-success"
                        : data.radar_score >= 45
                          ? "text-amber-500"
                          : "text-destructive"
                    }`}
                  >
                    {data.radar_score}
                  </span>
                  <span className="text-sm text-muted-foreground mb-1">/100</span>
                </div>
              </div>
            </div>

            {/* Sub-message */}
            <p className={`text-sm ${zone.color} mb-6 font-medium`}>
              {zone.message}
              <span className="text-muted-foreground text-xs ml-2">
                (Informational only — not financial advice)
              </span>
            </p>

            {/* 4 Sub-indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="rounded-xl border border-border/50 bg-card/50 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Confidence
                </p>
                <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold ${confidenceColors[data.confidence]}`}>
                  {data.confidence}
                </span>
              </div>
              <div className="rounded-xl border border-border/50 bg-card/50 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Stability
                </p>
                <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold ${stabilityColors[data.stability]}`}>
                  {data.stability}
                </span>
              </div>
              <div className="rounded-xl border border-border/50 bg-card/50 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Momentum
                </p>
                <span className={`text-xs font-bold flex items-center gap-1 ${momentumColors[data.momentum]}`}>
                  {data.momentum === "RISING" ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : data.momentum === "WEAKENING" ? (
                    <ArrowDown className="h-3 w-3" />
                  ) : (
                    <MinusCircle className="h-3 w-3" />
                  )}
                  {data.momentum}
                </span>
              </div>
              <div className="rounded-xl border border-border/50 bg-card/50 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Regime
                </p>
                <span className="text-xs font-bold text-foreground">
                  {regimeLabels[data.regime]}
                </span>
              </div>
            </div>

            {/* Reasons */}
            <div className="rounded-xl border border-border/50 bg-card/50 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Why this zone?
              </p>
              <ul className="space-y-2">
                {data.reasons.map((reason: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                    <span
                      className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                        data.market_zone === "BULLISH"
                          ? "bg-success"
                          : data.market_zone === "BEARISH"
                            ? "bg-destructive"
                            : "bg-muted-foreground"
                      }`}
                    />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ──── Market Data Strip ──── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Nifty 50
          </p>
          <p className="text-lg font-bold font-heading font-mono">
            {data.nifty_price?.toLocaleString("en-IN") ?? "N/A"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            India VIX
          </p>
          <p
            className={`text-lg font-bold font-heading font-mono ${
              data.vix > 20 ? "text-destructive" : data.vix > 15 ? "text-amber-500" : "text-success"
            }`}
          >
            {data.vix?.toFixed(2) ?? "N/A"}
          </p>
          {data.vix > 20 && (
            <p className="text-[10px] text-destructive font-semibold mt-0.5 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              High Volatility
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Put-Call Ratio
          </p>
          <p className="text-lg font-bold font-heading font-mono">
            {data.pcr?.toFixed(2) ?? "N/A"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {data.pcr >= 1.2 ? "Bullish" : data.pcr <= 0.7 ? "Bearish" : "Neutral"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Advance/Decline
          </p>
          <div className="flex items-center gap-2">
            <span className="text-success font-bold font-mono text-sm">{data.advances}</span>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="text-destructive font-bold font-mono text-sm">{data.declines}</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1.5 flex">
            <div className="h-full bg-success rounded-l-full" style={{ width: `${(data.advances / 50) * 100}%` }} />
            <div className="h-full bg-destructive rounded-r-full" style={{ width: `${(data.declines / 50) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* ──── Sentiment Score Scale (Client Doc Section 7) ──── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Sentiment Score
          </p>
          <span className={`text-lg font-bold ${
            data.radar_score >= 70
              ? "text-success"
              : data.radar_score >= 55
                ? "text-success/80"
                : data.radar_score >= 45
                  ? "text-muted-foreground"
                  : data.radar_score >= 30
                    ? "text-destructive/80"
                    : "text-destructive"
          }`}>
            {data.radar_score} / 100
          </span>
        </div>
        {/* Visual sentiment bar */}
        <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
            style={{
              width: `${data.radar_score}%`,
              background: data.radar_score >= 55 ? "var(--success)" : data.radar_score >= 45 ? "var(--muted-foreground)" : "var(--destructive)",
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>0–30 Strong Bearish</span>
          <span>30–45 Bearish</span>
          <span>45–55 Neutral</span>
          <span>55–70 Bullish</span>
          <span>70–100 Strong Bullish</span>
        </div>
      </div>

      {/* ──── Universal Trading Psychology Message ──── */}
      <div className="rounded-xl border border-success/20 bg-success/5 p-4 text-center">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="text-success font-semibold">Risk management and trading psychology is universal and a must for all traders.</span>
          {" "}INTROSPECT™ is built for that.
        </p>
      </div>

      {/* ──── Data Source Attribution (Client Doc Section 8) ──── */}
      <p className="text-[11px] text-muted-foreground text-center">
        Market data source: Fyers | Index data © NSE India | Delayed where applicable
      </p>

      {/* ──── IMPORTANT DISCLAIMER (Client Doc Section 9 - 12-14px font) ──── */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-500 mb-2">IMPORTANT DISCLAIMER</p>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              This indicator reflects market sentiment derived from a quantitative model and is provided for{" "}
              <strong>informational and educational purposes only</strong>. It does <strong>not</strong> constitute
              investment advice, financial advice, or a recommendation to buy or sell any financial instrument.
              Users should conduct their own research and consult with a qualified financial advisor before
              making any financial decisions.
            </p>
            <p className="text-[11px] text-muted-foreground mt-2">
              Market data may be delayed and is provided for informational purposes only. Accuracy and completeness are not guaranteed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
