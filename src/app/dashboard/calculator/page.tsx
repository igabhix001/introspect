"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Info,
  TrendingDown,
  Copy,
  Check,
  AlertOctagon,
  Lightbulb,
  RefreshCw,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
  Clock,
  Shield,
  Zap,
} from "lucide-react";

export default function CalculatorPage() {
  const [accountSize, setAccountSize] = useState<string>("100000");
  const [dailyMaxLossPercent, setDailyMaxLossPercent] = useState<string>("3");
  const [tradesPlannedPerDay, setTradesPlannedPerDay] = useState<string>("5");
  const [entryPrice, setEntryPrice] = useState<string>("");
  const [stopLossPrice, setStopLossPrice] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Advanced Stop Loss Helper States
  const [slMethod, setSlMethod] = useState<"manual" | "atr" | "timeframe">("manual");
  const [tradeDirection, setTradeDirection] = useState<"long" | "short">("long");
  const [atrVal, setAtrVal] = useState<string>("80");
  const [atrMultiplier, setAtrMultiplier] = useState<string>("2");

  // Timeframe Sizing States
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("15m");
  const [fetchingTimeframe, setFetchingTimeframe] = useState(false);
  const [timeframeData, setTimeframeData] = useState<{ close: number; low: number; high: number } | null>(null);

  // Live Market Sentiment State
  const [marketData, setMarketData] = useState<any>(null);
  const [loadingMarket, setLoadingMarket] = useState(false);

  const fetchMarketSentiment = async () => {
    setLoadingMarket(true);
    try {
      const res = await fetch("/api/market");
      const data = await res.json();
      if (data && !data.error) {
        setMarketData(data);
      }
    } catch (err) {
      console.error("Failed to fetch market data:", err);
    } finally {
      setLoadingMarket(false);
    }
  };

  const fetchTimeframePrices = async (tf: string) => {
    setFetchingTimeframe(true);
    try {
      const res = await fetch(`/api/market/timeframe-low?timeframe=${tf}`);
      const data = await res.json();
      if (data && !data.error) {
        setTimeframeData(data);
        // Auto-fill entry price with Nifty close
        setEntryPrice(data.close.toString());
        // Auto-fill stop loss price: low for LONG, high for SHORT
        const sl = tradeDirection === "long" ? data.low : data.high;
        setStopLossPrice(sl.toString());
      }
    } catch (err) {
      console.error("Failed to fetch timeframe prices:", err);
    } finally {
      setFetchingTimeframe(false);
    }
  };

  useEffect(() => {
    fetchMarketSentiment();
  }, []);

  // Fetch timeframe prices when method, timeframe, or direction changes
  useEffect(() => {
    if (slMethod === "timeframe") {
      fetchTimeframePrices(selectedTimeframe);
    }
  }, [slMethod, selectedTimeframe, tradeDirection]);

  // Compute dynamic stop loss price
  const computedStopLossPrice = useMemo(() => {
    if (slMethod === "manual" || slMethod === "timeframe") {
      return stopLossPrice;
    }
    const entry = parseFloat(entryPrice) || 0;
    if (!entry) return "";

    if (slMethod === "atr") {
      const atr = parseFloat(atrVal) || 0;
      const mult = parseFloat(atrMultiplier) || 2;
      if (!atr) return "";
      const val = tradeDirection === "long" ? entry - atr * mult : entry + atr * mult;
      return (Math.round(val * 100) / 100).toString();
    }
    return "";
  }, [slMethod, tradeDirection, entryPrice, atrVal, atrMultiplier, stopLossPrice]);

  const result = useMemo(() => {
    const account = parseFloat(accountSize) || 0;
    const dailyMaxLossPct = parseFloat(dailyMaxLossPercent) || 0;
    const tradesPerDay = parseInt(tradesPlannedPerDay) || 1;
    const entry = parseFloat(entryPrice) || 0;
    const sl = parseFloat(slMethod === "manual" || slMethod === "timeframe" ? stopLossPrice : computedStopLossPrice) || 0;

    if (!account || !dailyMaxLossPct || !tradesPerDay) {
      return null;
    }

    const dailyMaxLossAmount = (account * dailyMaxLossPct) / 100;
    const riskPerTrade = dailyMaxLossAmount / tradesPerDay;
    const riskPerTradePercent = (riskPerTrade / account) * 100;

    if (!entry || !sl || entry === sl) {
      return {
        dailyMaxLossAmount: Math.round(dailyMaxLossAmount),
        riskPerTrade: Math.round(riskPerTrade),
        riskPerTradePercent: riskPerTradePercent.toFixed(2),
        tradesPerDay,
        quantity: null,
        actualRisk: null,
        slDistance: null,
        direction: null,
        riskOfCapital: null,
      };
    }

    const slDistance = Math.abs(entry - sl);
    const quantity = Math.floor(riskPerTrade / slDistance);
    const actualRisk = quantity * slDistance;

    return {
      dailyMaxLossAmount: Math.round(dailyMaxLossAmount),
      riskPerTrade: Math.round(riskPerTrade),
      riskPerTradePercent: riskPerTradePercent.toFixed(2),
      tradesPerDay,
      slDistance: slDistance.toFixed(2),
      quantity,
      actualRisk: Math.round(actualRisk),
      direction: tradeDirection.toUpperCase(),
      riskOfCapital: ((actualRisk / account) * 100).toFixed(2),
    };
  }, [accountSize, dailyMaxLossPercent, tradesPlannedPerDay, entryPrice, stopLossPrice, slMethod, computedStopLossPrice, tradeDirection]);

  const handleCopy = () => {
    if (!result || !result.quantity) return;
    const slVal = slMethod === "manual" || slMethod === "timeframe" ? stopLossPrice : computedStopLossPrice;
    const text = `Position Size: ${result.quantity} qty | Direction: ${result.direction} | Entry: ₹${entryPrice} | SL: ₹${slVal} | Risk: ₹${result.actualRisk} (${result.riskOfCapital}%) | Daily Limit: ₹${result.dailyMaxLossAmount}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const riskLevel =
    parseFloat(dailyMaxLossPercent) <= 2
      ? { label: "Conservative", color: "text-success", bg: "bg-success/10" }
      : parseFloat(dailyMaxLossPercent) <= 3
        ? { label: "Recommended", color: "text-success", bg: "bg-success/10" }
        : parseFloat(dailyMaxLossPercent) <= 5
          ? { label: "Moderate", color: "text-amber-500", bg: "bg-amber-500/10" }
          : { label: "Aggressive", color: "text-destructive", bg: "bg-destructive/10" };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="border-b border-border/50 pb-4">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
          Sizer & Sentiment Console
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Evaluate real-time market sentiment and calculate optimal share quantities under strict risk boundaries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Side: Market Sentiment Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Activity className="h-4 w-4 text-primary" />
                  {marketData?.market_status === "OPEN" && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success animate-ping" />
                  )}
                </div>
                <h3 className="font-heading text-xs font-bold uppercase tracking-wider">
                  Market Intelligence
                </h3>
              </div>
              <button
                onClick={fetchMarketSentiment}
                disabled={loadingMarket}
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingMarket ? "animate-spin" : ""}`} />
              </button>
            </div>

            {loadingMarket && !marketData ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground/40" />
              </div>
            ) : marketData ? (
              <div className="space-y-4">
                {/* Zone Classification */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Sentiment Zone</span>
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
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        marketData.market_zone === "BULLISH" 
                          ? "bg-success/10 text-success" 
                          : marketData.market_zone === "BEARISH" 
                          ? "bg-destructive/10 text-destructive" 
                          : "bg-amber-500/10 text-amber-500"
                      }`}>
                        {marketData.market_zone}
                      </span>
                    </div>
                  </div>

                  {/* Watch State Progress Bar */}
                  {marketData.zone_status === "WATCH" && !marketData.failsafe_mode && (
                    <div className="rounded-lg bg-amber-500/[0.03] border border-amber-500/10 p-2.5 space-y-1.5 animate-pulse">
                      <div className="flex items-center justify-between text-[10px] text-amber-500 font-semibold">
                        <span>Stabilizing Zone...</span>
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
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground bg-muted/20 border border-border/30 px-3 py-1 rounded-lg">
                      <span>Zone Stability:</span>
                      <span className="text-foreground font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-success animate-ping" />
                        Stable for {marketData.stability_duration}
                      </span>
                    </div>
                  )}
                </div>

                {/* Radar Score Bar */}
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
                    <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Nifty 50</span>
                    <span className="font-mono font-bold text-foreground text-sm">₹{marketData.nifty_price.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                    <span className="text-[10px] text-muted-foreground uppercase block font-semibold">India VIX</span>
                    <span className="font-mono font-bold text-foreground text-sm">{marketData.vix}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                    <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Put-Call Ratio</span>
                    <span className="font-mono font-bold text-foreground text-sm">{marketData.pcr}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                    <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Advances/Declines</span>
                    <span className="font-mono font-bold text-foreground text-sm">{marketData.advances} : {marketData.declines}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                    <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Market Regime</span>
                    <span className={`font-mono font-bold text-sm ${
                      marketData.regime === "TREND_DAY" ? "text-success" : marketData.regime === "VOLATILE" ? "text-destructive" : marketData.regime === "COMPRESSION" ? "text-amber-500" : "text-foreground"
                    }`}>
                      {marketData.regime?.replace("_", " ")}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                    <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Zone Stability</span>
                    <span className={`font-mono font-bold text-sm ${
                      marketData.stability === "STABLE" ? "text-success" : marketData.stability === "WATCH" ? "text-amber-500" : "text-destructive"
                    }`}>
                      {marketData.stability}
                    </span>
                  </div>
                </div>

                {/* Insights List */}
                <div className="space-y-1.5 border-t border-border/40 pt-3">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-bold">Insights Summary</span>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {marketData.reasons?.map((reason: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                        <span className="text-primary mt-1">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between text-[9px] text-muted-foreground/60 border-t border-border/30 pt-2 font-mono">
                  <span>Source: Third-party data providers</span>
                  <span className="capitalize">Market: {marketData.market_status.toLowerCase()}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-4">No live market data available.</p>
            )}
          </div>

          {/* Stop Trading Signal Card */}
          <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.04] p-4">
            <div className="flex items-start gap-2.5">
              <AlertOctagon className="h-4.5 w-4.5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-destructive mb-1 uppercase tracking-wider">
                  Stop Trading Rule
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Once your ₹{result?.dailyMaxLossAmount.toLocaleString("en-IN") || ((parseFloat(accountSize) * parseFloat(dailyMaxLossPercent)) / 100).toLocaleString("en-IN")} daily loss threshold is reached, <span className="font-bold text-destructive">CLOSE TERMINAL</span> immediately. No exceptions.
                </p>
              </div>
            </div>
          </div>

          {/* Pro tip Card */}
          <div className="rounded-2xl border border-success/20 bg-success/[0.04] p-4">
            <div className="flex items-start gap-2.5">
              <Lightbulb className="h-4.5 w-4.5 text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-success mb-1 uppercase tracking-wider">
                  Position Sizing Pro Tip
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Never bet your entire daily loss threshold on a single entry. By splitting it into {tradesPlannedPerDay} planned trades, you maintain a mathematical buffer to weather random market noise.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Position Calculator Input Form & Result */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-heading text-sm font-bold">
                  Sizing Parameters
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Define your setup guidelines to automatically calculate share quantity
                </p>
              </div>
            </div>

            {/* Trade Direction Selector */}
            <div>
              <label className="text-xs font-medium mb-1.5 block">Direction</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTradeDirection("long")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    tradeDirection === "long"
                      ? "border-success bg-success/[0.06] text-success font-bold"
                      : "border-border text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  LONG (Buy)
                </button>
                <button
                  type="button"
                  onClick={() => setTradeDirection("short")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    tradeDirection === "short"
                      ? "border-destructive bg-destructive/[0.06] text-destructive font-bold"
                      : "border-border text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  SHORT (Sell)
                </button>
              </div>
            </div>

            {/* Account Capital */}
            <div>
              <label htmlFor="account-size" className="text-xs font-medium mb-1.5 block">
                Account Capital
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <input
                  id="account-size"
                  type="number"
                  value={accountSize}
                  onChange={(e) => setAccountSize(e.target.value)}
                  className="w-full pl-7 pr-4 py-3 rounded-xl bg-background/50 border border-border text-sm font-mono focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all"
                  placeholder="100000"
                />
              </div>
            </div>

            {/* Daily Max Loss % Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="daily-max-loss" className="text-xs font-medium">Daily Max Loss Limit</label>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${riskLevel.bg} ${riskLevel.color}`}>
                  {riskLevel.label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="daily-max-loss"
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={dailyMaxLossPercent}
                  onChange={(e) => setDailyMaxLossPercent(e.target.value)}
                  className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer accent-success"
                />
                <div className="w-16 text-right">
                  <span className="text-base font-bold font-heading">{dailyMaxLossPercent}</span>
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
              {result && (
                <div className="flex items-center justify-between mt-2 px-3 py-2 rounded-xl bg-muted/30 border border-border text-xs">
                  <span className="text-muted-foreground">Max Daily Loss Exposure</span>
                  <span className="font-mono font-semibold text-destructive">
                    ₹{result.dailyMaxLossAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>

            {/* Trades Planned Per Day */}
            <div>
              <label htmlFor="trades-per-day" className="text-xs font-medium mb-1.5 block">
                Planned Trades Per Day
              </label>
              <input
                id="trades-per-day"
                type="number"
                min="1"
                max="50"
                value={tradesPlannedPerDay}
                onChange={(e) => setTradesPlannedPerDay(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border text-sm font-mono focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all"
                placeholder="5"
              />
              {result && (
                <div className="flex items-center justify-between mt-2 px-3 py-2 rounded-xl bg-success/5 border border-success/10 text-xs">
                  <span className="text-muted-foreground">Risk Budget Per Trade</span>
                  <span className="font-mono font-semibold text-success">
                    ₹{result.riskPerTrade.toLocaleString("en-IN")} ({result.riskPerTradePercent}%)
                  </span>
                </div>
              )}
            </div>

            {/* Stop Loss Method Selector */}
            <div>
              <label className="text-xs font-medium mb-1.5 block">Stop Loss Strategy</label>
              <div className="flex gap-1.5 p-1 rounded-xl bg-background/50 border border-border">
                {["manual", "atr", "timeframe"].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSlMethod(method as any)}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-semibold capitalize transition-colors cursor-pointer ${
                      slMethod === method
                        ? "bg-card text-foreground border border-border shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {method === "manual" ? "Manual" : method === "atr" ? "ATR-Based" : "Timeframe Low"}
                  </button>
                ))}
              </div>
            </div>

            {/* Entry / Stop Loss inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="entry-price" className="text-xs font-medium mb-1.5 block">Entry Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <input
                    id="entry-price"
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    disabled={slMethod === "timeframe"}
                    className={`w-full pl-7 pr-4 py-3 rounded-xl bg-background/50 border border-border text-sm font-mono focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all ${
                      slMethod === "timeframe" ? "bg-muted/40 cursor-not-allowed border-dashed" : ""
                    }`}
                    placeholder="Entry Level"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="sl-price" className="text-xs font-medium mb-1.5 block">
                  Stop Loss Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <input
                    id="sl-price"
                    type="number"
                    value={slMethod === "manual" ? stopLossPrice : computedStopLossPrice}
                    onChange={(e) => {
                      if (slMethod === "manual" || slMethod === "timeframe") setStopLossPrice(e.target.value);
                    }}
                    disabled={slMethod === "atr"}
                    className={`w-full pl-7 pr-4 py-3 rounded-xl bg-background/50 border border-border text-sm font-mono focus:outline-none focus:border-destructive/40 focus:ring-1 focus:ring-destructive/20 transition-all ${
                      slMethod === "atr"
                        ? "bg-muted/40 cursor-not-allowed border-dashed text-foreground/80 font-semibold"
                        : ""
                    }`}
                    placeholder="SL Level"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Helper Controls */}
            {slMethod === "atr" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 rounded-xl border border-border bg-muted/20 space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">
                      ATR (Average True Range)
                    </label>
                    <input
                      type="number"
                      value={atrVal}
                      onChange={(e) => setAtrVal(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-xs font-mono focus:outline-none"
                      placeholder="Points"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 block">
                      ATR Multiplier
                    </label>
                    <select
                      value={atrMultiplier}
                      onChange={(e) => setAtrMultiplier(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="1.0">1.0x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2.0">2.0x (Standard)</option>
                      <option value="2.5">2.5x</option>
                      <option value="3.0">3.0x (Conservative)</option>
                    </select>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">
                  Formula: {tradeDirection === "long" 
                    ? `${entryPrice || "Entry"} - (${atrVal || "ATR"} * ${atrMultiplier}) = ${computedStopLossPrice || "?"}`
                    : `${entryPrice || "Entry"} + (${atrVal || "ATR"} * ${atrMultiplier}) = ${computedStopLossPrice || "?"}`
                  }
                </p>
              </motion.div>
            )}

            {slMethod === "timeframe" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 rounded-xl border border-border bg-muted/20 space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1 w-full">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">
                      Candle Resolution Timeframe
                    </label>
                    <div className="flex gap-2 w-full">
                      <select
                        value={selectedTimeframe}
                        onChange={(e) => setSelectedTimeframe(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-xs focus:outline-none cursor-pointer font-semibold"
                      >
                        <option value="5m">5 Minute</option>
                        <option value="15m">15 Minute</option>
                        <option value="30m">30 Minute</option>
                        <option value="1h">1 Hour</option>
                        <option value="4h">4 Hour</option>
                        <option value="1d">Daily (1D)</option>
                      </select>
                      <button
                        onClick={() => fetchTimeframePrices(selectedTimeframe)}
                        disabled={fetchingTimeframe}
                        className="px-3 rounded-lg border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${fetchingTimeframe ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {fetchingTimeframe ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Fetching index levels...</span>
                  </div>
                ) : timeframeData ? (
                  <div className="text-[11px] text-muted-foreground font-mono bg-background/40 p-2.5 rounded-lg border border-border/30 space-y-1">
                    <div className="flex justify-between">
                      <span>Nifty Close (Entry):</span>
                      <span className="font-semibold text-foreground">₹{timeframeData.close}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nifty Low (Stop):</span>
                      <span className="font-semibold text-destructive">₹{timeframeData.low}</span>
                    </div>
                    <div className="flex justify-between border-t border-border/30 pt-1 mt-1 font-semibold text-foreground">
                      <span>Stop Loss Gap:</span>
                      <span>₹{(Math.round(Math.abs(timeframeData.close - (tradeDirection === "long" ? timeframeData.low : timeframeData.high)) * 100) / 100).toFixed(2)} pts</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-destructive italic">Failed to retrieve index metrics. Falling back to manual parameters.</p>
                )}
              </motion.div>
            )}
          </div>

          {/* Sizing Result Card */}
          {result && result.quantity ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-success/30 bg-success/[0.04] p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-xs font-bold text-success uppercase tracking-wider">
                  Sizing Recommendation
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                    result.direction === "LONG"
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {result.direction}
                </span>
              </div>

              {/* Main Quantity Display */}
              <div className="text-center py-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Optimal Order Quantity
                </p>
                <span className="text-5xl font-bold font-heading text-foreground">
                  {result.quantity}
                </span>
                <span className="text-base text-muted-foreground ml-2">qty</span>
              </div>

              {/* Position Details */}
              <div className="space-y-2.5 pt-3 border-t border-border/50 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Daily Loss Limit Cap</span>
                  <span className="font-mono font-medium">₹{result.dailyMaxLossAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Budget Risk (Per Trade)</span>
                  <span className="font-mono font-medium">₹{result.riskPerTrade.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Actual Risk exposure</span>
                  <span className="font-mono font-semibold text-amber-500">₹{result.actualRisk?.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Stop Loss Distance</span>
                  <span className="font-mono font-medium">₹{result.slDistance} pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">% of Account Capital</span>
                  <span className={`font-mono font-semibold ${parseFloat(result.riskOfCapital || "0") <= 1 ? "text-success" : "text-amber-500"}`}>
                    {result.riskOfCapital}%
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-success" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Sizing details
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 flex flex-col items-center justify-center text-center min-h-[220px]">
              <Info className="h-8 w-8 text-muted-foreground/20 mb-3" />
              <p className="text-xs text-amber-500 font-semibold bg-amber-500/10 px-3 py-1.5 rounded-full">
                {(!entryPrice && !computedStopLossPrice) ? "Define Entry & Stop Loss Parameters" : 
                 !entryPrice ? "Fill Entry Price" : 
                 !computedStopLossPrice ? "Fill SL Helper Options" :
                 (parseFloat(entryPrice) === parseFloat(computedStopLossPrice)) ? "Entry & SL Prices cannot be equal" :
                 "Complete parameters to view sizing"}
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-2 max-w-[220px]">
                Optimal trade quantities and mathematical risk allocation breakdown will auto-generate here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
