"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export function DisciplineBanner() {
  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative z-[60] bg-gradient-to-r from-success/10 via-success/5 to-success/10 border-b border-success/10"
    >
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-center gap-2 text-xs sm:text-sm">
        <AlertTriangle className="h-3.5 w-3.5 text-success flex-shrink-0" />
        <p className="text-center">
          <span className="font-semibold text-success">90% of intraday traders lose money.</span>
          <span className="text-muted-foreground hidden sm:inline">
            {" "}Not because they lack strategy, but because they lack discipline.{" "}
          </span>
          <span className="font-semibold text-foreground">INTROSPECT™</span>
          <span className="text-muted-foreground"> was built to fix that.</span>
        </p>
      </div>
    </motion.div>
  );
}
