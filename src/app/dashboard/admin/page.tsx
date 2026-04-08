"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  CreditCard,
  TrendingUp,
  Activity,
  UserPlus,
  Bell,
  Settings,
  ChevronRight,
  ArrowUpRight,
  Shield,
  Wallet,
  Loader2,
  ShieldX,
  MessageSquare,
  Gift,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useAdminStatsQuery } from "@/lib/hooks/use-queries";

interface AdminStats {
  totalUsers: number;
  activeSubscribers: number;
  mrr: number;
  churnRate: number;
  recentSignups: number;
  recentUsers: { id: string; full_name: string; email: string; created_at: string }[];
}

const adminNavItems = [
  {
    label: "User Management",
    href: "/dashboard/admin/users",
    icon: Users,
    description: "View, edit, suspend, and manage all users",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    label: "Subscriptions",
    href: "/dashboard/admin/subscriptions",
    icon: Wallet,
    description: "Manage plans, revenue, and Razorpay logs",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    label: "Contact Messages",
    href: "/dashboard/admin/messages",
    icon: MessageSquare,
    description: "View and respond to contact form submissions",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    label: "Notifications",
    href: "/dashboard/admin/notifications",
    icon: Bell,
    description: "Send and manage user notifications",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    label: "Loyalty Points",
    href: "/dashboard/admin/points",
    icon: Gift,
    description: "Manage user points and rewards",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    label: "System Settings",
    href: "/dashboard/admin/settings",
    icon: Settings,
    description: "App configuration and API health",
    color: "text-success",
    bg: "bg-success/10",
  },
];

export default function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useAdminStatsQuery();
  
  const loading = statsLoading && !stats;

  // Show loading spinner only on initial load
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Access denied for non-admins
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center rounded-2xl border border-destructive/30 bg-destructive/5 p-10 max-w-md">
          <ShieldX className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground mb-6">
            You do not have admin privileges to access this page.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats ? stats.totalUsers.toLocaleString("en-IN") : "—",
      change: stats ? `+${stats.recentSignups} this week` : "",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active Subscribers",
      value: stats ? stats.activeSubscribers.toLocaleString("en-IN") : "—",
      icon: CreditCard,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Monthly Revenue (MRR)",
      value: stats ? `₹${stats.mrr.toLocaleString("en-IN")}` : "—",
      icon: TrendingUp,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Churn Rate",
      value: stats ? `${stats.churnRate}%` : "—",
      icon: Activity,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-success" />
            <h1 className="font-heading text-xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage users, subscriptions, and platform settings
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.bg}`}
                >
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                {stat.change && (
                  <div className="flex items-center gap-0.5 text-xs font-semibold text-success">
                    <ArrowUpRight className="h-3 w-3" />
                    {stat.change}
                  </div>
                )}
              </div>
              <p className="text-xl font-bold font-heading">
                {loading ? (
                  <span className="inline-block w-16 h-6 bg-muted rounded animate-pulse" />
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                {stat.label}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-success/30 transition-all cursor-pointer group"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.bg} shrink-0`}
                >
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-success transition-colors shrink-0" />
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Recent Signups */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-sm font-bold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-success" />
            Recent Signups
          </h3>
          <Link
            href="/dashboard/admin/users"
            className="text-xs text-success hover:text-success/80 font-semibold"
          >
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (stats as AdminStats)?.recentUsers?.length ? (
          <div className="space-y-2">
            {(stats as AdminStats).recentUsers.map((user: AdminStats["recentUsers"][0]) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{user.full_name || "New User"}</p>
                  <p className="text-[10px] text-muted-foreground">{user.email}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            No recent signups yet
          </p>
        )}
      </div>
    </div>
  );
}
