"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RiskRadarChartProps {
  data: Array<{
    category: string;
    score: number;
    fullMark: number;
  }>;
}

export default function RiskRadarChart({ data }: RiskRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid stroke="var(--border)" strokeDasharray="3 3" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontWeight: 500 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            fontSize: "12px",
            padding: "8px 12px",
            color: "var(--foreground)",
          }}
          labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
          itemStyle={{ color: "var(--success)" }}
          formatter={(value) => [`${value}/100`, "Score"]}
        />
        <Radar
          dataKey="score"
          stroke="var(--success)"
          strokeWidth={2}
          fill="var(--success)"
          fillOpacity={0.15}
          dot={{ r: 4, fill: "var(--success)", strokeWidth: 0 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
