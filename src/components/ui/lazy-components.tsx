"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Loading skeleton component
function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={`${height} w-full flex items-center justify-center bg-muted/20 rounded-xl animate-pulse`}>
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border animate-pulse">
      <div className="h-4 bg-muted/30 rounded w-1/3 mb-4" />
      <div className="h-8 bg-muted/30 rounded w-1/2 mb-2" />
      <div className="h-3 bg-muted/20 rounded w-2/3" />
    </div>
  );
}

// Lazy load Recharts components - these are heavy
export const LazyAreaChart = dynamic(
  () => import("recharts").then((mod) => mod.AreaChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export const LazyBarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export const LazyPieChart = dynamic(
  () => import("recharts").then((mod) => mod.PieChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export const LazyRadarChart = dynamic(
  () => import("recharts").then((mod) => mod.RadarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export const LazyResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

// Lazy load framer-motion AnimatePresence for non-critical animations
export const LazyAnimatePresence = dynamic(
  () => import("framer-motion").then((mod) => mod.AnimatePresence),
  { ssr: false }
);

// Export skeleton components for reuse
export { ChartSkeleton, CardSkeleton };
