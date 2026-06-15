"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Search,
  Filter,
  TrendingUp,
  Calendar,
  Wallet,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Sub {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  amount_paid: number;
  razorpay_payment_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  profiles?: { full_name: string; email: string } | null;
}

import { useAdminSubscriptionsQuery } from "@/lib/hooks/use-queries";

export default function AdminSubscriptionsPage() {
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "cancelled">("all");

  const { data, isLoading } = useAdminSubscriptionsQuery(filter);

  const subscriptions: Sub[] = data?.subscriptions || [];
  const stats = data?.stats || { total: 0, active: 0, monthly: 0, yearly: 0, totalRevenue: 0 };
  const loading = isLoading && !data;

  const planBadge: Record<string, string> = {
    monthly: "bg-blue-500/10 text-blue-500",
    "6-month": "bg-amber-500/10 text-amber-500",
    yearly: "bg-purple-500/10 text-purple-500",
    trial: "bg-success/10 text-success",
  };

  const statusBadge: Record<string, string> = {
    active: "bg-success/10 text-success",
    expired: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/10 text-destructive",
    pending: "bg-amber-500/10 text-amber-500",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold">Subscription Management</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage plans, revenue, and payment history
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: CreditCard, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Active", value: stats.active, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
          { label: "Monthly", value: stats.monthly, icon: Calendar, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Revenue", value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`, icon: Wallet, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.bg} mb-2`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-xl font-bold font-heading">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {(["all", "active", "expired", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
              filter === f ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border/50">
          <div className="col-span-3">User</div>
          <div className="col-span-1">Plan</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-2">Period</div>
          <div className="col-span-2">Payment ID</div>
          <div className="col-span-1">Date</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-20 text-sm text-muted-foreground">
            No subscriptions found
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="hidden md:grid grid-cols-12 gap-2 items-center px-5 py-3.5 text-sm hover:bg-muted/10 transition-colors">
                <div className="col-span-3">
                  <p className="text-xs font-medium truncate">{sub.profiles?.full_name || "—"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{sub.profiles?.email}</p>
                </div>
                <div className="col-span-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${planBadge[sub.plan]}`}>
                    {sub.plan}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusBadge[sub.status]}`}>
                    {sub.status}
                  </span>
                </div>
                <div className="col-span-2 text-xs font-mono">₹{sub.amount_paid}</div>
                <div className="col-span-2 text-[10px] text-muted-foreground">
                  {sub.current_period_start ? new Date(sub.current_period_start).toLocaleDateString("en-IN") : "—"}
                  {" → "}
                  {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("en-IN") : "—"}
                </div>
                <div className="col-span-2 text-[10px] font-mono text-muted-foreground truncate">
                  {sub.razorpay_payment_id || "—"}
                </div>
                <div className="col-span-1 text-[10px] text-muted-foreground">
                  {new Date(sub.created_at).toLocaleDateString("en-IN")}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile */}
        <div className="md:hidden divide-y divide-border/50">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{sub.profiles?.full_name || "—"}</p>
                  <p className="text-[10px] text-muted-foreground">{sub.profiles?.email}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${planBadge[sub.plan]}`}>{sub.plan}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusBadge[sub.status]}`}>{sub.status}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">₹{sub.amount_paid} • {new Date(sub.created_at).toLocaleDateString("en-IN")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
