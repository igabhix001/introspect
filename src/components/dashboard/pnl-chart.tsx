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

interface PnlChartProps {
  data: Array<{
    tradeIndex: number;
    time: string;
    pnl: number;
    symbol?: string;
  }>;
}

export default function PnlChart({ data }: PnlChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="pnlCurveGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
        <XAxis
          dataKey="time"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickFormatter={(val) => `₹${val}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            fontSize: "12px",
          }}
          formatter={(val: any, name, props: any) => {
            const symbol = props.payload.symbol ? ` (${props.payload.symbol})` : "";
            return [`₹${val.toLocaleString("en-IN")}${symbol}`, "Running P&L"];
          }}
        />
        <Area
          type="monotone"
          dataKey="pnl"
          stroke="var(--primary)"
          strokeWidth={2.5}
          fill="url(#pnlCurveGradient)"
          dot={{ r: 4, fill: "var(--card)", stroke: "var(--primary)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
