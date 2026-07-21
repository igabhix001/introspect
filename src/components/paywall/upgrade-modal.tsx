"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Sparkles, Check, ArrowRight, X, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  featureName?: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  title = "Unlock Premium INTROSPECT™",
  description = "Get unlimited access to AI Risk Reports, Advanced Analytics, Unlimited Journaling, and AI Coaching.",
  featureName = "this Pro feature",
}: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg rounded-3xl border border-success/30 bg-gradient-to-b from-card via-card to-background p-6 md:p-8 shadow-2xl overflow-hidden"
        >
          {/* Subtle ambient glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-success/20 rounded-full blur-3xl pointer-events-none" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-2xl bg-success/10 border border-success/30 flex items-center justify-center text-success mb-4 shadow-[0_0_25px_rgba(34,197,94,0.2)]">
              <Lock className="h-7 w-7" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success border border-success/20 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5" /> INTROSPECT™ Pro
            </span>

            <h3 className="font-heading text-xl md:text-2xl font-bold text-foreground mb-2">
              {title}
            </h3>

            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              You clicked on <span className="font-semibold text-foreground">{featureName}</span>. {description}
            </p>

            {/* Feature checklist */}
            <div className="w-full bg-muted/20 rounded-2xl border border-border/50 p-4 mb-6 text-left space-y-2.5">
              {[
                "Unlimited Trade Journal Storage (Beyond 50 free limit)",
                "Full Assessment Report & Deep AI Behavioral Risk Matrix",
                "Advanced Trade Analytics & Cumulative Performance Insights",
                "Historical Daily Reports (Past dates & calendar view)",
                "Interactive AI Coach & Real-Time Trade Recommendations",
                "Export Trade Journal & Analytics to PDF / Excel",
                "100% Ad-Free Clean Professional Experience",
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-foreground/90">
                  <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <Link
                href="/pricing"
                onClick={onClose}
                className="w-full py-3 px-6 rounded-xl bg-success hover:bg-success/90 text-success-foreground font-semibold text-sm shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all flex items-center justify-center gap-2"
              >
                <span>Upgrade to Pro Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={onClose}
                className="w-full sm:w-auto py-3 px-4 rounded-xl border border-border hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
              >
                Maybe Later
              </button>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              <span>Cancel anytime. Money-back guarantee included.</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
