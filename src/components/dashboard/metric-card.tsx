import { memo } from "react";

import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: string;
}

export const MetricCard = memo(function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "success",
}: MetricCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 group animate-fade-up"
    >
      <div className={`absolute -top-8 -right-8 w-24 h-24 bg-${color}/[0.07] rounded-full blur-2xl transition-all group-hover:bg-${color}/[0.12]`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
              {trend.value}
            </div>
          )}
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold font-heading text-foreground">
            {value}
          </span>
          {subtitle && (
            <span className="text-sm text-muted-foreground mb-1">{subtitle}</span>
          )}
        </div>
        {Icon && (
          <div className="mt-3">
            <Icon className={`h-4 w-4 text-${color}`} />
          </div>
        )}
      </div>
    </div>
  );
});
