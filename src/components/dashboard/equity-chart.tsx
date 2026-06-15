"use client";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface EquityChartProps {
  data: Array<{
    name: string;
    equity: number;
    pnl: number;
    symbol?: string;
  }>;
}

export default function EquityChart({ data }: EquityChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            fontSize: "12px",
            color: "var(--foreground)",
          }}
          formatter={(value: any) => [`₹${value.toLocaleString("en-IN")}`, "Account Balance"]}
        />
        <Area
          type="monotone"
          dataKey="equity"
          stroke="var(--success)"
          strokeWidth={2}
          fill="url(#equityGradient)"
          dot={{ r: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
