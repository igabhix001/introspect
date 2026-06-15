"use client";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RiskLineChartProps {
  data: Array<{
    index: number;
    score: number;
    date: string;
  }>;
}

export default function RiskLineChart({ data }: RiskLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "10px",
            padding: "4px 8px",
            color: "var(--foreground)",
          }}
          labelFormatter={(label) => `Assessment #${label}`}
          formatter={(value) => [`${value}/100`, "Score"]}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="var(--success)"
          strokeWidth={2}
          dot={{ r: 2.5, fill: "var(--success)", strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
