"use client";

import { useState, useEffect, useCallback } from "react";
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

// ──── Market Intelligence Object (matching client doc v2.0 ATR-Adaptive) ────
interface MarketIntelligence {
  market_zone: "BULLISH" | "BEARISH" | "NO_TRADE";
  confidence: "HIGH" | "MODERATE" | "LOW";
  stability: "STABLE" | "WATCH" | "UNSTABLE";
  momentum: "RISING" | "STEADY" | "WEAKENING";
  regime: "TREND_DAY" | "BALANCED" | "VOLATILE" | "COMPRESSION";
  radar_score: number;
  sentiment_score: number;
  atr_value: number;
  current_buffer_percent: number;
  reasons: string[];
  timestamp: string;
  last_updated: string;
  data_source?: "fyers_live" | "simulated";
  market_status?: "OPEN" | "CLOSED";
  // Raw data
  nifty_price: number;
  prev_close: number;
  today_open: number;
  vix: number;
  pcr: number;
  advances: number;
  declines: number;
  // Computed thresholds
  bullish_threshold: number;
  bearish_threshold: number;
  ref_buy: number;
  ref_sell: number;
}

// ──── ATR-Adaptive Sentiment Engine Config (from client doc Section 9) ────
const CONFIG = {
  ATR_PERIOD: 14,
  ATR_MULTIPLIER: 0.8,
  MIN_BUFFER_PERCENT: 0.0020,
  MAX_BUFFER_PERCENT: 0.0060,
  PCR_BULLISH_THRESHOLD: 1.20,
  PCR_BEARISH_THRESHOLD: 0.70,
  PCR_NEUTRAL_LOW: 0.85,
  PCR_NEUTRAL_HIGH: 1.05,
  BREADTH_BULLISH_THRESHOLD: 35,
  BREADTH_BEARISH_THRESHOLD: 35,
  RADAR_WEIGHT_PRICE: 0.3,
  RADAR_WEIGHT_BREADTH: 0.3,
  RADAR_WEIGHT_PCR: 0.2,
  RADAR_WEIGHT_VIX: 0.2,
  DATA_REFRESH_INTERVAL_SECONDS: 5,
};

// ──── ATR-Based Zone Classification (Client Doc Section 5) ────
function calculateATRZone(
  currentPrice: number,
  prevClose: number,
  todayOpen: number,
  atrValue: number
) {
  // 5.1 Reference Price Calculation
  const ref_buy = Math.max(todayOpen, prevClose);
  const ref_sell = Math.min(todayOpen, prevClose);

  // 5.2 ATR-Based Dynamic Buffer
  let buffer_percent = (atrValue / ref_buy) * CONFIG.ATR_MULTIPLIER;
  buffer_percent = Math.max(CONFIG.MIN_BUFFER_PERCENT, Math.min(CONFIG.MAX_BUFFER_PERCENT, buffer_percent));

  // 5.3 Final Threshold Calculation
  const bullish_threshold = ref_buy * (1 + buffer_percent);
  const bearish_threshold = ref_sell * (1 - buffer_percent);

  // 5.4 Zone Assignment
  let market_zone: "BULLISH" | "BEARISH" | "NO_TRADE";
  if (currentPrice >= bullish_threshold) {
    market_zone = "BULLISH";
  } else if (currentPrice <= bearish_threshold) {
    market_zone = "BEARISH";
  } else {
    market_zone = "NO_TRADE";
  }

  return { market_zone, bullish_threshold, bearish_threshold, buffer_percent, ref_buy, ref_sell };
}

// ──── Sentiment Scoring Engine (Client Doc Section 6.1) ────
function calculateSentiment(advances: number, pcr: number) {
  // Market Breadth Score (SB)
  let sb = 0;
  if (advances >= CONFIG.BREADTH_BULLISH_THRESHOLD) sb = 1;
  else if ((50 - advances) >= CONFIG.BREADTH_BEARISH_THRESHOLD) sb = -1;

  // Derivatives Sentiment Score (SD)
  let sd = 0;
  if (pcr >= CONFIG.PCR_BULLISH_THRESHOLD) sd = 1;
  else if (pcr <= CONFIG.PCR_BEARISH_THRESHOLD) sd = -1;
  else if (pcr >= CONFIG.PCR_NEUTRAL_LOW && pcr <= CONFIG.PCR_NEUTRAL_HIGH) sd = 0;

  return sb + sd;
}

// ──── Confidence Engine (Client Doc Section 6.2) ────
function calculateConfidence(sentimentScore: number): "HIGH" | "MODERATE" | "LOW" {
  if (Math.abs(sentimentScore) >= 2) return "HIGH";
  if (Math.abs(sentimentScore) === 1) return "MODERATE";
  return "LOW";
}

// ──── Radar Score (Client Doc Section 6.4) ────
function calculateRadarScore(
  currentPrice: number,
  ref_buy: number,
  advances: number,
  pcr: number,
  vix: number
): number {
  const priceScore = Math.min(100, Math.max(0, ((currentPrice - ref_buy) / ref_buy) * 10000 + 50));
  const breadthScore = (advances / 50) * 100;
  const pcrScore = Math.min(100, Math.max(0, (pcr - 0.5) * 100));
  const vixScore = Math.max(0, 100 - (vix - 10) * 3);

  return Math.round(
    priceScore * CONFIG.RADAR_WEIGHT_PRICE +
    breadthScore * CONFIG.RADAR_WEIGHT_BREADTH +
    pcrScore * CONFIG.RADAR_WEIGHT_PCR +
    vixScore * CONFIG.RADAR_WEIGHT_VIX
  );
}

// ──── Regime Detection (Client Doc Section 6.3) ────
function detectRegime(
  vix: number,
  radarScore: number,
  momentum: "RISING" | "STEADY" | "WEAKENING",
  advances: number
): "TREND_DAY" | "VOLATILE" | "COMPRESSION" | "BALANCED" {
  if (vix > 25) return "VOLATILE";
  if (vix < 12) return "COMPRESSION";
  if (momentum === "RISING" && advances >= 35 && radarScore > 65) return "TREND_DAY";
  return "BALANCED";
}

// ──── Reason Generator (Client Doc Section 6 - simplified, no internal params exposed) ────
function generateReasons(data: MarketIntelligence): string[] {
  const reasons: string[] = [];
  const zone = data.market_zone;

  if (zone === "BULLISH") {
    reasons.push("Price trading above short-term resistance levels");
    if (data.advances >= 35) reasons.push("Market breadth currently bullish");
    if (data.pcr >= 1.2) reasons.push("Derivatives sentiment supporting upside");
    if (data.momentum === "RISING") reasons.push("Momentum rising across intraday timeframes");
    reasons.push("Volatility conditions " + (data.vix > 20 ? "elevated" : "stable"));
  } else if (zone === "BEARISH") {
    reasons.push("Price trading below short-term support levels");
    if (data.declines >= 35) reasons.push("Market breadth currently bearish");
    if (data.pcr <= 0.7) reasons.push("Derivatives sentiment supporting downside");
    if (data.momentum === "WEAKENING") reasons.push("Momentum weakening across intraday timeframes");
    reasons.push("Volatility conditions " + (data.vix > 20 ? "elevated" : "stable"));
  } else {
    reasons.push("Price trading within a defined range");
    reasons.push("Market breadth currently neutral");
    reasons.push("Momentum mixed across intraday timeframes");
    reasons.push("Volatility conditions " + (data.vix > 20 ? "elevated" : "stable"));
  }

  return reasons;
}

// ──── Mock Data Generator (simulates Fyers API feed) ────
function generateMockData(): MarketIntelligence {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

  const prevClose = 22350;
  const todayOpen = prevClose + Math.floor(Math.random() * 100 - 50);
  const currentPrice = todayOpen + Math.floor(Math.random() * 300 - 100);
  const atrValue = 100 + Math.random() * 80; // Simulated 14-period ATR
  const vix = 11 + Math.random() * 16;
  const pcr = 0.6 + Math.random() * 0.8;
  const advances = 15 + Math.floor(Math.random() * 30);
  const declines = 50 - advances;

  // Run ATR-based zone classification
  const { market_zone, bullish_threshold, bearish_threshold, buffer_percent, ref_buy, ref_sell } =
    calculateATRZone(currentPrice, prevClose, todayOpen, atrValue);

  // Supporting engines
  const sentiment_score = calculateSentiment(advances, pcr);
  const confidence = calculateConfidence(sentiment_score);
  const momentum: "RISING" | "STEADY" | "WEAKENING" =
    market_zone === "BULLISH" ? "RISING" : market_zone === "BEARISH" ? "WEAKENING" : "STEADY";
  const radar_score = calculateRadarScore(currentPrice, ref_buy, advances, pcr, vix);
  const stability: "STABLE" | "WATCH" | "UNSTABLE" =
    vix > 20 ? "UNSTABLE" : vix > 15 ? "WATCH" : "STABLE";
  const regime = detectRegime(vix, radar_score, momentum, advances);

  const data: MarketIntelligence = {
    market_zone,
    confidence,
    stability,
    momentum,
    regime,
    radar_score: Math.max(0, Math.min(100, radar_score)),
    sentiment_score,
    atr_value: atrValue,
    current_buffer_percent: buffer_percent,
    reasons: [],
    timestamp: timeStr,
    last_updated: now.toISOString(),
    nifty_price: currentPrice,
    prev_close: prevClose,
    today_open: todayOpen,
    vix,
    pcr,
    advances,
    declines,
    bullish_threshold,
    bearish_threshold,
    ref_buy,
    ref_sell,
  };

  data.reasons = generateReasons(data);
  return data;
}

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

const sentimentLabels: Record<number, string> = {
  2: "Strong Bullish",
  1: "Mild Bullish",
  0: "Neutral",
  [-1]: "Mild Bearish",
  [-2]: "Strong Bearish",
};

export default function SentimentEnginePage() {
  const [data, setData] = useState<MarketIntelligence | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/market");
      const newData = await res.json();
      if (!res.ok) {
        setError(newData.error || "Failed to connect to Fyers. Check your settings.");
        return;
      }
      setError(null);
      setData(newData);
      setLastUpdate(new Date(newData.timestamp).toLocaleTimeString("en-IN"));
      
      // Auto-pause polling if market is closed to save API rate limits
      if (newData.market_status === "CLOSED") {
        setIsLive(false);
      }
    } catch (err) {
      console.error("Market data fetch error:", err);
      setError("Network or API failure.");
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (isLive) fetchData();
    }, CONFIG.DATA_REFRESH_INTERVAL_SECONDS * 1000);
    return () => clearInterval(interval);
  }, [isLive, fetchData]);

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center max-w-5xl mx-auto">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-8 max-w-lg w-full flex flex-col items-center">
          <WifiOff className="h-10 w-10 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2 text-foreground">Market Data Offline</h2>
          <p className="text-sm text-destructive mb-6 leading-relaxed">
            {error}
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            Introspect requires a real-time market data feed to generate sentiment analytics.
          </p>
          <a
            href="/dashboard/admin/settings"
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Connect Fyers in Settings
          </a>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const zone = zoneConfig[data.market_zone];
  const ZoneIcon = zone.icon;

  const isMarketClosed = data.market_status === "CLOSED";

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Connection Status Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
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
              Market Live
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 bg-muted rounded-md">
              <WifiOff className="h-3.5 w-3.5" />
              Stream Paused
            </div>
          )}
          
          <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 border-l pl-3 border-border">
            {data.data_source === "fyers_live" ? (
               <span className="text-success font-medium flex items-center gap-1 tracking-wide">
                 <Zap className="h-3 w-3" /> Fyers Data
               </span>
            ) : (
               <span className="text-muted-foreground">Simulation</span>
            )}
            <span>• {isMarketClosed ? "Last Traded Data from" : "Last updated at"}: {lastUpdate}</span>
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
            onClick={fetchData}
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
                {data.reasons.map((reason, i) => (
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
