"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Target, Shield, AlertOctagon, Lightbulb } from "lucide-react";

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
          Pre-Market Routine & Guardrails
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Setup Quality Card */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-success/20 bg-success/[0.02] p-5 space-y-4 hover:border-success/30 transition-all group"
        >
          <div className="flex items-center gap-2 text-success border-b border-success/10 pb-2">
            <CheckCircle2 className="h-4.5 w-4.5" />
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider">
              Setup Quality
            </h4>
          </div>
          <ul className="space-y-3 text-xs text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <strong className="text-foreground">Trend Confirmed</strong>
                <p className="text-[11px] text-muted-foreground mt-0.5">Higher timeframe trend matches trade direction.</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <strong className="text-foreground">Risk : Reward ≥ 1:2</strong>
                <p className="text-[11px] text-muted-foreground mt-0.5">Calculated target offers double the stop loss distance.</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <strong className="text-foreground">Stop Loss Defined</strong>
                <p className="text-[11px] text-muted-foreground mt-0.5">Hard SL level determined on chart before entry.</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <strong className="text-foreground">Playbook Matches</strong>
                <p className="text-[11px] text-muted-foreground mt-0.5">Setup aligns with one of your verified strategies.</p>
              </div>
            </li>
          </ul>
        </motion.div>

        {/* Hard Stop Rules Card */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-destructive/20 bg-destructive/[0.02] p-5 space-y-4 hover:border-destructive/30 transition-all group"
        >
          <div className="flex items-center gap-2 text-destructive border-b border-destructive/10 pb-2">
            <AlertOctagon className="h-4.5 w-4.5" />
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider">
              Hard Stop Rules
            </h4>
          </div>
          <ul className="space-y-3 text-xs text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <strong className="text-foreground">Zero Revenge Trading</strong>
                <p className="text-[11px] text-muted-foreground mt-0.5">No immediate re-entries. Rest after any loss.</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <strong className="text-foreground">No Averaging Losers</strong>
                <p className="text-[11px] text-muted-foreground mt-0.5">Never add size to a losing trade. Exit at SL.</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <strong className="text-foreground">No Moving Stop Loss</strong>
                <p className="text-[11px] text-muted-foreground mt-0.5">Never widen SL. Respect the initial invalidation.</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <strong className="text-foreground">No FOMO Chasing</strong>
                <p className="text-[11px] text-muted-foreground mt-0.5">If you missed the entry trigger, skip the trade.</p>
              </div>
            </li>
          </ul>
        </motion.div>

        {/* Session Goal Card */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-primary/20 bg-primary/[0.01] p-5 space-y-4 hover:border-primary/30 transition-all group"
        >
          <div className="flex items-center gap-2 text-primary border-b border-primary/10 pb-2">
            <Lightbulb className="h-4.5 w-4.5" />
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider">
              Session Goal
            </h4>
          </div>
          <ul className="space-y-3 text-xs text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <strong className="text-foreground">Process Over P&L</strong>
                <p className="text-[11px] text-muted-foreground mt-0.5">Success is measured by process score, not profits.</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <strong className="text-foreground">Position Sizing</strong>
                <p className="text-[11px] text-muted-foreground mt-0.5">Always size trades via Position Sizer console.</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <strong className="text-foreground">Strict SL Application</strong>
                <p className="text-[11px] text-muted-foreground mt-0.5">100% hard SL application on all executed trades.</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <strong className="text-foreground">Immediate Journaling</strong>
                <p className="text-[11px] text-muted-foreground mt-0.5">Log every trade today with honest reflection tags.</p>
              </div>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
