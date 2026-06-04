import React from "react";

export function AuroraBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden aurora-bg-animate">
      {children}
    </div>
  );
}
