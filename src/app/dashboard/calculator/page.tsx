"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

export default function CalculatorPage() {
  const [accountSize, setAccountSize] = useState<string>("100000");
  const [dailyMaxLossPercent, setDailyMaxLossPercent] = useState<string>("3");
  const [tradesPlannedPerDay, setTradesPlannedPerDay] = useState<string>("5");
  const [entryPrice, setEntryPrice] = useState<string>("");
  const [stopLossPrice, setStopLossPrice] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const account = parseFloat(accountSize) || 0;
    const dailyMaxLossPct = parseFloat(dailyMaxLossPercent) || 0;
    const tradesPerDay = parseInt(tradesPlannedPerDay) || 1;
    const entry = parseFloat(entryPrice) || 0;
    const sl = parseFloat(stopLossPrice) || 0;

    if (!account || !dailyMaxLossPct || !tradesPerDay) {
      return null;
    }

    // Calculate daily max loss amount
    const dailyMaxLossAmount = (account * dailyMaxLossPct) / 100;
    
    // Risk per trade = Daily Max Loss / Number of Trades Planned
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
      direction: entry > sl ? "LONG" : "SHORT",
      riskOfCapital: ((actualRisk / account) * 100).toFixed(2),
    };
  }, [accountSize, dailyMaxLossPercent, tradesPlannedPerDay, entryPrice, stopLossPrice]);

  const handleCopy = () => {
    if (!result || !result.quantity) return;
    const text = `Position Size: ${result.quantity} qty | Entry: ₹${entryPrice} | SL: ₹${stopLossPrice} | Risk: ₹${result.actualRisk} (${result.riskOfCapital}%) | Daily Limit: ₹${result.dailyMaxLossAmount}`;
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
    <div className="max-w-3xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Calculator className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold">
                Position Size Calculator
              </h2>
              <p className="text-xs text-muted-foreground">
                Never risk more than you can afford to lose
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Account Capital */}
            <div>
              <label
                htmlFor="account-size"
                className="text-sm font-medium mb-1.5 block"
              >
                Account Capital
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  ₹
                </span>
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

            {/* Daily Max Loss % */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="daily-max-loss" className="text-sm font-medium">
                  Daily Max Loss
                </label>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${riskLevel.bg} ${riskLevel.color}`}
                >
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
                  <span className="text-lg font-bold font-heading">
                    {dailyMaxLossPercent}
                  </span>
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              {result && (
                <div className="flex items-center justify-between mt-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                  <span className="text-xs text-muted-foreground">Max Loss Daily Limit</span>
                  <span className="text-sm font-mono font-semibold text-destructive">
                    ₹{result.dailyMaxLossAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {parseFloat(dailyMaxLossPercent) > 5 && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  <span>
                    High daily risk! Professional traders limit daily loss to 2-3%.
                  </span>
                </div>
              )}
            </div>

            {/* Trades Planned Per Day */}
            <div>
              <label
                htmlFor="trades-per-day"
                className="text-sm font-medium mb-1.5 block"
              >
                No. of Trades Planned Per Day
              </label>
              <div className="flex items-center gap-3">
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
              </div>
              {result && (
                <div className="flex items-center justify-between mt-2 px-3 py-2 rounded-lg bg-success/5 border border-success/20">
                  <span className="text-xs text-muted-foreground">Risk Per Trade</span>
                  <span className="text-sm font-mono font-semibold text-success">
                    ₹{result.riskPerTrade.toLocaleString("en-IN")} ({result.riskPerTradePercent}%)
                  </span>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Risk Amount = ₹{result?.dailyMaxLossAmount.toLocaleString("en-IN") || "0"} ÷ {tradesPlannedPerDay} = ₹{result?.riskPerTrade.toLocaleString("en-IN") || "0"} per trade
              </p>
            </div>

            {/* Entry & SL */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="entry-price"
                  className="text-sm font-medium mb-1.5 block"
                >
                  Entry Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    ₹
                  </span>
                  <input
                    id="entry-price"
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    className="w-full pl-7 pr-4 py-3 rounded-xl bg-background/50 border border-border text-sm font-mono focus:outline-none focus:border-success/40 focus:ring-1 focus:ring-success/20 transition-all"
                    placeholder="22450"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="sl-price"
                  className="text-sm font-medium mb-1.5 block"
                >
                  Stop Loss Price
                </label>
                <div className="relative">
                  <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive/50" />
                  <input
                    id="sl-price"
                    type="number"
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-background/50 border border-border text-sm font-mono focus:outline-none focus:border-destructive/40 focus:ring-1 focus:ring-destructive/20 transition-all"
                    placeholder="22400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-2 space-y-4">
          {result && result.quantity ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-success/30 bg-success/[0.04] p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-sm font-bold text-success">
                  Calculated Result
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    result.direction === "LONG"
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {result.direction}
                </span>
              </div>

              {/* Main result */}
              <div className="text-center py-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Position Size
                </p>
                <span className="text-5xl font-bold font-heading text-foreground">
                  {result.quantity}
                </span>
                <span className="text-lg text-muted-foreground ml-1.5">
                  qty
                </span>
              </div>

              {/* Breakdown */}
              <div className="space-y-3 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Daily Max Loss</span>
                  <span className="font-mono font-medium text-destructive">
                    ₹{result.dailyMaxLossAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Risk Per Trade</span>
                  <span className="font-mono font-medium">
                    ₹{result.riskPerTrade.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Actual Risk</span>
                  <span className="font-mono font-medium text-amber-500">
                    ₹{result.actualRisk?.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">SL Distance</span>
                  <span className="font-mono font-medium">
                    ₹{result.slDistance}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">% of Capital</span>
                  <span
                    className={`font-mono font-medium ${
                      parseFloat(result.riskOfCapital || "0") <= 1
                        ? "text-success"
                        : "text-amber-500"
                    }`}
                  >
                    {result.riskOfCapital}%
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-medium transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-success" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-success/10 hover:bg-success/20 text-success text-sm font-semibold transition-colors cursor-pointer">
                  <ArrowRight className="h-3.5 w-3.5" />
                  Log Trade
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
              <Info className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-amber-500 font-medium bg-amber-500/10 px-3 py-1 rounded-full mb-1">
                {(!entryPrice && !stopLossPrice) ? "Enter Entry & Stop Loss Prices" : 
                 !entryPrice ? "Enter Entry Price" : 
                 !stopLossPrice ? "Enter Stop Loss Price" :
                 (parseFloat(entryPrice) === parseFloat(stopLossPrice)) ? "Entry and SL cannot be identical" :
                 "Fill all fields to calculate"}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-2">
                The calculator will show your optimal position size instantly
              </p>
            </div>
          )}

          {/* Stop Trading Signal */}
          <div className="rounded-xl border border-destructive/30 bg-destructive/[0.04] p-4">
            <div className="flex items-start gap-2.5">
              <AlertOctagon className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-destructive mb-1">
                  Stop Trading Signal
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Once your ₹{result?.dailyMaxLossAmount.toLocaleString("en-IN") || ((parseFloat(accountSize) * parseFloat(dailyMaxLossPercent)) / 100).toLocaleString("en-IN")} daily loss threshold is hit, <span className="font-semibold text-destructive">STOP TRADING</span> for the day. No exceptions.
                </p>
              </div>
            </div>
          </div>

          {/* Pro tip */}
          <div className="rounded-xl border border-success/30 bg-success/[0.04] p-4">
            <div className="flex items-start gap-2.5">
              <Lightbulb className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-success mb-1">
                  INTROSPECT™ Pro Tip
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Never bet your whole day on one trade. By splitting your daily limit into {tradesPlannedPerDay} planned trades, you transform trading from a gamble into a game of mathematical edge.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
