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
} from "lucide-react";

export default function CalculatorPage() {
  const [accountSize, setAccountSize] = useState<string>("100000");
  const [riskPercent, setRiskPercent] = useState<string>("1");
  const [entryPrice, setEntryPrice] = useState<string>("");
  const [stopLossPrice, setStopLossPrice] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const account = parseFloat(accountSize) || 0;
    const risk = parseFloat(riskPercent) || 0;
    const entry = parseFloat(entryPrice) || 0;
    const sl = parseFloat(stopLossPrice) || 0;

    if (!account || !risk || !entry || !sl || entry === sl) {
      return null;
    }

    const riskAmount = (account * risk) / 100;
    const slDistance = Math.abs(entry - sl);
    const quantity = Math.floor(riskAmount / slDistance);
    const actualRisk = quantity * slDistance;
    const riskReward = slDistance; // placeholder for target-based R:R

    return {
      riskAmount: Math.round(riskAmount),
      slDistance: slDistance.toFixed(2),
      quantity,
      actualRisk: Math.round(actualRisk),
      direction: entry > sl ? "LONG" : "SHORT",
      riskOfCapital: ((actualRisk / account) * 100).toFixed(2),
    };
  }, [accountSize, riskPercent, entryPrice, stopLossPrice]);

  const handleCopy = () => {
    if (!result) return;
    const text = `Position Size: ${result.quantity} qty | Entry: ₹${entryPrice} | SL: ₹${stopLossPrice} | Risk: ₹${result.actualRisk} (${result.riskOfCapital}%)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const riskLevel =
    parseFloat(riskPercent) <= 0.5
      ? { label: "Conservative", color: "text-success", bg: "bg-success/10" }
      : parseFloat(riskPercent) <= 1
        ? { label: "Recommended", color: "text-success", bg: "bg-success/10" }
        : parseFloat(riskPercent) <= 2
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
            {/* Account Size */}
            <div>
              <label
                htmlFor="account-size"
                className="text-sm font-medium mb-1.5 block"
              >
                Account Size
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

            {/* Risk % */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="risk-pct" className="text-sm font-medium">
                  Risk per Trade
                </label>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${riskLevel.bg} ${riskLevel.color}`}
                >
                  {riskLevel.label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="risk-pct"
                  type="range"
                  min="0.25"
                  max="3"
                  step="0.25"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                  className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer accent-success"
                />
                <div className="w-16 text-right">
                  <span className="text-lg font-bold font-heading">
                    {riskPercent}
                  </span>
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              {parseFloat(riskPercent) > 2 && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  <span>
                    High risk! Professional traders risk 0.5-1% per trade.
                  </span>
                </div>
              )}
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
          {result ? (
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
                  <span className="text-muted-foreground">Risk Amount</span>
                  <span className="font-mono font-medium">
                    ₹{result.riskAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Actual Risk</span>
                  <span className="font-mono font-medium text-destructive">
                    ₹{result.actualRisk.toLocaleString("en-IN")}
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
                      parseFloat(result.riskOfCapital) <= 1
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

          {/* Pro tip */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold mb-1">
                  INTROSPECT™ Pro Tip
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Professional traders risk 0.5-1% of capital per trade. Even with a 50% win rate, this ensures your account survives losing streaks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
