"use client";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

interface DisciplineChartProps {
  data: Array<{ day: string; score: number }>;
}

export default function DisciplineChart({ data }: DisciplineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient
            id="disciplineGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="var(--success)"
              stopOpacity={0.3}
            />
            <stop
              offset="100%"
              stopColor="var(--success)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          dy={8}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            fontSize: "12px",
            padding: "8px 12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            color: "var(--foreground)",
          }}
          labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
          itemStyle={{ color: "var(--success)" }}
          formatter={(value) => [`${value}/100`, "Score"]}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="var(--success)"
          strokeWidth={2.5}
          fill="url(#disciplineGradient)"
          dot={{
            r: 4,
            fill: "var(--card)",
            stroke: "var(--success)",
            strokeWidth: 2,
          }}
          activeDot={{
            r: 6,
            fill: "var(--success)",
            stroke: "var(--card)",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
