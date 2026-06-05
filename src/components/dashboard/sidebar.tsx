"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { m, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardCheck,
  ShieldAlert,
  Calculator,
  BookOpen,
  Trophy,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
  TrendingUp,
  Activity,
  Shield,
  Users,
  Wallet,
  Bell,
  Wrench,
  Gift,
  FileText,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

const userNavItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Your trading command center",
  },
  {
    label: "Assessment",
    href: "/dashboard/assessment",
    icon: ClipboardCheck,
    description: "Diagnose your risk profile",
  },
  {
    label: "Risk Report",
    href: "/dashboard/risk-report",
    icon: ShieldAlert,
    description: "Your personalized rules",
  },
  {
    label: "Sizer & Sentiment",
    href: "/dashboard/calculator",
    icon: Calculator,
    description: "Calculator & live market sentiment",
  },
  {
    label: "Trade Journal",
    href: "/dashboard/journal",
    icon: BookOpen,
    description: "Log & analyze your trades",
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    description: "Deep behavior insights",
  },
  {
    label: "Daily Report",
    href: "/dashboard/daily-report",
    icon: FileText,
    description: "End-of-day summary",
  },
  {
    label: "Challenges",
    href: "/dashboard/challenges",
    icon: Trophy,
    description: "30-day discipline journey",
  },
  {
    label: "Loyalty Portal",
    href: "/dashboard/loyalty",
    icon: Gift,
    description: "Manage points & rewards",
  },
];

const adminNavItems = [
  {
    label: "Admin Overview",
    href: "/dashboard/admin",
    icon: Shield,
    description: "Platform overview & stats",
  },
  {
    label: "User Management",
    href: "/dashboard/admin/users",
    icon: Users,
    description: "View, edit & manage users",
  },
  {
    label: "Subscriptions",
    href: "/dashboard/admin/subscriptions",
    icon: Wallet,
    description: "Plans, revenue & billing",
  },
  {
    label: "Messages",
    href: "/dashboard/admin/messages",
    icon: MessageSquare,
    description: "Contact form submissions",
  },
  {
    label: "Notifications",
    href: "/dashboard/admin/notifications",
    icon: Bell,
    description: "Broadcast messages",
  },
  {
    label: "Points Engine",
    href: "/dashboard/admin/points",
    icon: Gift,
    description: "Loyalty & Rewards Activity",
  },
  {
    label: "System Settings",
    href: "/dashboard/admin/settings",
    icon: Wrench,
    description: "System configuration",
  },
];

const userBottomItems = [
  {
    label: "← Back to Home",
    href: "/",
    icon: ChevronLeft,
  },
];

const adminBottomItems = [
  {
    label: "Back to User View",
    href: "/dashboard",
    icon: ChevronLeft,
  },
];

export function DashboardSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const { profile, isAdmin, signOut } = useAuth();

  const isOnAdminPage = pathname.startsWith("/dashboard/admin");
  const navItems = isOnAdminPage && isAdmin ? adminNavItems : userNavItems;
  const bottomItems = isOnAdminPage && isAdmin ? adminBottomItems : userBottomItems;

  return (
    <LazyMotion features={domAnimation}>
    <aside
      className={`relative hidden lg:flex flex-col h-screen border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300 ease-in-out ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Logo — links to landing page */}
      <Link
        href="/"
        className={`flex items-center h-16 px-4 border-b border-border/50 shrink-0 hover:bg-muted/30 transition-colors ${
          collapsed ? "justify-center" : "gap-2.5"
        }`}
      >
        <div className="relative w-8 h-8 shrink-0">
          <Image
            src="/logo.png"
            alt="INTROSPECT™"
            fill
            className="object-contain"
          />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <m.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-heading text-base font-bold tracking-tight whitespace-nowrap overflow-hidden"
            >
              INTROSPECT
              <span className="text-[9px] align-super opacity-50">™</span>
            </m.span>
          )}
        </AnimatePresence>
      </Link>

      {/* Admin/User toggle banner */}
      {isAdmin && !collapsed && (
        <div className={`mx-2.5 mt-3 rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-2 transition-colors ${
          isOnAdminPage
            ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
            : "bg-success/10 border border-success/20 text-success"
        }`}>
          <Shield className="h-3.5 w-3.5" />
          {isOnAdminPage ? "Admin Panel" : "User Dashboard"}
          <Link
            href={isOnAdminPage ? "/dashboard" : "/dashboard/admin"}
            className="ml-auto text-[10px] underline underline-offset-2 opacity-80 hover:opacity-100"
          >
            Switch →
          </Link>
        </div>
      )}

      {isAdmin && collapsed && (
        <div className="flex justify-center mt-3">
          <Link
            href={isOnAdminPage ? "/dashboard" : "/dashboard/admin"}
            title={isOnAdminPage ? "Switch to User Dashboard" : "Switch to Admin Panel"}
            className={`p-2 rounded-xl border flex items-center justify-center transition-colors ${
              isOnAdminPage
                ? "bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20"
                : "bg-success/10 border border-success/20 text-success hover:bg-success/20"
            }`}
          >
            <Shield className="h-[18px] w-[18px]" />
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              item.href !== "/dashboard/admin" &&
              pathname.startsWith(item.href));
          // Exact match for overview pages
          const isExactActive =
            (item.href === "/dashboard" && pathname === "/dashboard") ||
            (item.href === "/dashboard/admin" && pathname === "/dashboard/admin");
          const active = isActive || isExactActive;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? isOnAdminPage
                    ? "bg-amber-500/10 text-amber-500 shadow-sm"
                    : "bg-success/10 text-success shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              } ${collapsed ? "justify-center px-0" : ""}`}
            >
              {/* Active indicator */}
              {active && (
                <m.div
                  layoutId="sidebar-active"
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full ${
                    isOnAdminPage ? "bg-amber-500" : "bg-success"
                  }`}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <Icon
                className={`shrink-0 ${collapsed ? "h-5 w-5" : "h-[18px] w-[18px]"} transition-colors ${
                  active
                    ? isOnAdminPage ? "text-amber-500" : "text-success"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
                strokeWidth={active ? 2.2 : 1.8}
              />

              <AnimatePresence mode="wait">
                {!collapsed && (
                  <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col overflow-hidden whitespace-nowrap"
                  >
                    <span>{item.label}</span>
                    {!active && (
                      <span className="text-[11px] text-muted-foreground/60 font-normal">
                        {item.description}
                      </span>
                    )}
                  </m.div>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Psychology Learning Links - only show when not collapsed */}
      {!collapsed && (
        <div className="mx-3 my-4 p-4 rounded-xl border border-success/15 bg-success/[0.02] space-y-2 shrink-0">
          <span className="text-[10px] text-success font-bold uppercase tracking-wider block">
            Psychology Learning
          </span>
          <div className="space-y-1.5 text-xs">
            <a
              href="https://youtube.com/@intraday.mindview?sub_confirmation=1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-success transition-colors font-medium"
            >
              <TrendingUp className="h-3.5 w-3.5 text-success shrink-0" />
              <span>YouTube (English)</span>
            </a>
            <a
              href="https://www.youtube.com/channel/UCTMpGuxQcWKzDtA0TeQsdWQ?sub_confirmation=1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-success transition-colors font-medium"
            >
              <TrendingUp className="h-3.5 w-3.5 text-success shrink-0" />
              <span>YouTube (Hindi)</span>
            </a>
            <a
              href="https://www.linkedin.com/in/venkat-iyer-7839883b2"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-success transition-colors font-medium"
            >
              <Users className="h-3.5 w-3.5 text-success shrink-0" />
              <span>LinkedIn Profile</span>
            </a>
          </div>
        </div>
      )}

      {/* Bottom items - only show for admin */}
      {bottomItems.length > 0 && (
        <div className="border-t border-border/50 px-2.5 py-3 space-y-1">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
                <AnimatePresence>
                  {!collapsed && (
                    <m.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </m.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 z-10 flex items-center justify-center w-6 h-6 rounded-full border border-border bg-card shadow-sm hover:bg-muted transition-colors cursor-pointer"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </aside>
    </LazyMotion>
  );
}
