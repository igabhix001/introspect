"use client";

import React, { useState } from "react";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { UpgradeModal } from "./upgrade-modal";

interface LockedFeatureCardProps {
  title: string;
  description: string;
  featureName: string;
  className?: string;
  children?: React.ReactNode;
}

export function LockedFeatureCard({
  title,
  description,
  featureName,
  className = "",
  children,
}: LockedFeatureCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className={`relative rounded-3xl border border-border bg-card overflow-hidden ${className}`}>
        {/* Blurry background preview if children passed */}
        {children && (
          <div className="filter blur-md opacity-30 pointer-events-none select-none p-6 min-h-[300px]">
            {children}
          </div>
        )}

        {/* Lock Overlay */}
        <div className={`${children ? "absolute inset-0 z-10" : ""} flex flex-col items-center justify-center p-8 text-center bg-card/85 backdrop-blur-sm min-h-[320px]`}>
          <div className="h-14 w-14 rounded-2xl bg-success/10 border border-success/30 flex items-center justify-center text-success mb-4 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
            <Lock className="h-7 w-7" />
          </div>

          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-success/10 text-success border border-success/20 text-[11px] font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="h-3 w-3" /> Pro Feature
          </span>

          <h3 className="font-heading text-xl font-bold text-foreground mb-2">
            {title}
          </h3>

          <p className="text-xs md:text-sm text-muted-foreground max-w-md mb-6">
            {description}
          </p>

          <button
            onClick={() => setIsModalOpen(true)}
            className="py-3 px-6 rounded-xl bg-success hover:bg-success/90 text-success-foreground font-semibold text-xs md:text-sm shadow-[0_0_20px_rgba(34,197,94,0.25)] transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Unlock {featureName}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <UpgradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Unlock ${featureName}`}
        description={description}
        featureName={featureName}
      />
    </>
  );
}
