"use client";

import { motion } from "framer-motion";
import { Shield, AlertOctagon, Lightbulb, Target } from "lucide-react";

export function PreMarketRoutineRow() {
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <Target className="h-4.5 w-4.5 text-primary" />
        <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-foreground">
          Pre-Trade Discipline Checklist & Rules
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Setup Quality Card */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-success/20 bg-success/[0.02] p-5 space-y-4 hover:border-success/30 transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="border-b border-success/10 pb-2">
              <h4 className="font-heading text-sm font-bold text-success flex items-center gap-1.5 uppercase tracking-wide">
                🟢 Setup Quality
              </h4>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Trade only if ALL conditions are met</p>
            </div>
            <ul className="space-y-2.5 text-xs text-foreground font-medium">
              <li className="flex items-center gap-2">
                <span className="text-success text-sm font-bold">✓</span>
                <span>Trend confirmed</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-success text-sm font-bold">✓</span>
                <span>Risk : Reward ≥ 1:2</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-success text-sm font-bold">✓</span>
                <span>Stop Loss defined</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-success text-sm font-bold">✓</span>
                <span>Setup matches trading plan</span>
              </li>
            </ul>
          </div>
          <div className="pt-2 border-t border-success/15 mt-2 text-center">
            <span className="text-[11px] font-bold text-destructive animate-pulse uppercase tracking-wide">
              Missing even one condition? → NO TRADE
            </span>
          </div>
        </motion.div>

        {/* Hard Stop Rules Card */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-destructive/20 bg-destructive/[0.02] p-5 space-y-4 hover:border-destructive/30 transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="border-b border-destructive/10 pb-2">
              <h4 className="font-heading text-sm font-bold text-destructive flex items-center gap-1.5 uppercase tracking-wide">
                🔴 Hard Stop Rules
              </h4>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Zero Tolerance Behaviors</p>
            </div>
            <ul className="space-y-2.5 text-xs text-foreground font-medium">
              <li className="flex items-center gap-2">
                <span className="text-sm">🚨</span>
                <span>Revenge Trading</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-sm">🚨</span>
                <span>Averaging Losers</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-sm">🚨</span>
                <span>Moving Stop Loss Away</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-sm">🚨</span>
                <span>FOMO Entries</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-sm">🚨</span>
                <span>Strategy Switching Intraday</span>
              </li>
            </ul>
          </div>
          <div className="pt-2 border-t border-destructive/15 mt-2 text-center">
            <span className="text-[11px] font-bold text-destructive uppercase tracking-wide">
              1 Violation = Trading Session Over
            </span>
          </div>
        </motion.div>

        {/* Session Goal Card */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-primary/20 bg-primary/[0.01] p-5 space-y-4 hover:border-primary/30 transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="border-b border-primary/10 pb-2">
              <h4 className="font-heading text-sm font-bold text-primary flex items-center gap-1.5 uppercase tracking-wide">
                🟢 Session Goal
              </h4>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Today&apos;s Success Criteria</p>
            </div>
            <ul className="space-y-2.5 text-xs text-foreground font-medium">
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs border border-border rounded px-1 py-0.5 font-sans">☐</span>
                <span>Follow Position Sizing</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs border border-border rounded px-1 py-0.5 font-sans">☐</span>
                <span>Respect Stop Losses</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs border border-border rounded px-1 py-0.5 font-sans">☐</span>
                <span>No Rule Violations</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs border border-border rounded px-1 py-0.5 font-sans">☐</span>
                <span>Journal Every Trade</span>
              </li>
            </ul>
          </div>
          <div className="pt-2 border-t border-primary/15 mt-2 text-center">
            <span className="text-[11px] font-bold text-success uppercase tracking-wide">
              Success = Process Score, NOT P&L
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
