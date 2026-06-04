"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { m, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Search,
  Plus,
  ChevronDown,
  User,
  Settings,
  LogOut,
  X,
  LayoutDashboard,
  ClipboardCheck,
  ShieldAlert,
  Calculator,
  BookOpen,
  Trophy,
  BarChart3,
  Activity,
  Gift,
  FileText,
  Home,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/client";

interface DashboardHeaderProps {
  onMobileMenuToggle: () => void;
  mobileMenuOpen: boolean;
}

const mobileNavItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Assessment", href: "/dashboard/assessment", icon: ClipboardCheck },
  { label: "Risk Report", href: "/dashboard/risk-report", icon: ShieldAlert },
  { label: "Sizer & Sentiment", href: "/dashboard/calculator", icon: Calculator },
  { label: "Trade Journal", href: "/dashboard/journal", icon: BookOpen },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Daily Report", href: "/dashboard/daily-report", icon: FileText },
  { label: "Challenges", href: "/dashboard/challenges", icon: Trophy },
  { label: "Reward Points", href: "/dashboard/loyalty", icon: Gift },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const mobileAdminNavItems = [
  { label: "Admin Overview", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "User Management", href: "/dashboard/admin/users", icon: User },
  { label: "Subscriptions", href: "/dashboard/admin/subscriptions", icon: BarChart3 },
  { label: "Notifications", href: "/dashboard/admin/notifications", icon: Bell },
  { label: "System Settings", href: "/dashboard/admin/settings", icon: Settings },
];

// Page title mapping
const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Your trading discipline command center",
  },
  "/dashboard/assessment": {
    title: "Risk Assessment",
    subtitle: "Diagnose your trading psychology",
  },
  "/dashboard/risk-report": {
    title: "Risk Report",
    subtitle: "Your personalized discipline rules",
  },
  "/dashboard/calculator": {
    title: "Sizer & Sentiment",
    subtitle: "Calculate risk-optimal trade sizes & monitor live market intelligence",
  },
  "/dashboard/journal": {
    title: "Trade Journal",
    subtitle: "Log, track & learn from every trade",
  },
  "/dashboard/challenges": {
    title: "Challenges",
    subtitle: "Your 30-day discipline journey",
  },
  "/dashboard/analytics": {
    title: "Analytics",
    subtitle: "Deep behavioral insights",
  },
  "/dashboard/settings": {
    title: "Settings",
    subtitle: "Manage your account & preferences",
  },
};

export function DashboardHeader({
  onMobileMenuToggle,
  mobileMenuOpen,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { profile, signOut, isAdmin } = useAuth();
  const isOnAdminPage = pathname.startsWith("/dashboard/admin");
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<{id: string; title: string; message: string; type: string; created_at: string}[]>([]);
  const [mounted, setMounted] = useState(false);

  // Get page info
  const pageInfo = pageTitles[pathname] || pageTitles["/dashboard"];

  // Client-side only for theme - fix hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch notifications
  useEffect(() => {
    async function fetchNotifs() {
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select("id, title, message, type, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      setNotifications(data || []);
    }
    fetchNotifs();
  }, []);

  return (
    <LazyMotion features={domAnimation}>
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 border-b border-border bg-background/80 backdrop-blur-md">
        {/* Left: Mobile menu + Page title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          <div className="hidden sm:block">
            <h1 className="font-heading text-lg font-bold leading-none">
              {pageInfo.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pageInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Add Trade */}
          <Link
            href="/dashboard/journal?new=true"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-semibold hover:bg-success/20 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Log Trade
          </Link>

          {/* Search */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
            aria-label="Search"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-success rounded-full ring-2 ring-background" />
              )}
            </button>

            {/* Notification dropdown */}
            <AnimatePresence>
              {notifOpen && (
                <m.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute right-0 top-12 w-80 rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-border">
                    <h4 className="text-sm font-semibold">Notifications</h4>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <p className="text-xs font-semibold">{n.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{n.message}</p>
                          <p className="text-[9px] text-muted-foreground/60 mt-1">{new Date(n.created_at).toLocaleDateString("en-IN")}</p>
                        </div>
                      ))
                    )}
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </button>
          )}

          {/* Profile */}
          <div className="relative ml-1">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-success/30 to-success/10 border border-success/20 flex items-center justify-center">
                <User className="h-4 w-4 text-success" />
              </div>
              <ChevronDown
                className={`hidden sm:block h-3.5 w-3.5 text-muted-foreground transition-transform ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <m.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-xl shadow-black/10 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-border/50">
                      <p className="text-sm font-semibold">{profile?.full_name || "Trader"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {profile?.email || ""}
                      </p>
                    </div>
                    <div className="py-1.5">
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          signOut();
                        }}
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  </m.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={onMobileMenuToggle}
            />
            <m.nav
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-card border-r border-border shadow-2xl lg:hidden flex flex-col"
            >
              {/* Mobile logo */}
              <div className="flex items-center gap-2.5 h-16 px-4 border-b border-border/50">
                <div className="relative w-8 h-8">
                  <Image
                    src="/logo.png"
                    alt="INTROSPECT™"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-heading text-base font-bold">
                  INTROSPECT
                  <span className="text-[9px] align-super opacity-50">™</span>
                </span>
              </div>

              {/* Admin/User Switch Banner for Mobile */}
              {isAdmin && (
                <div className={`mx-3 mt-3 rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-2 ${
                  isOnAdminPage
                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                    : "bg-success/10 border border-success/20 text-success"
                }`}>
                  {isOnAdminPage ? "Admin Panel" : "User Dashboard"}
                  <Link
                    href={isOnAdminPage ? "/dashboard" : "/dashboard/admin"}
                    onClick={onMobileMenuToggle}
                    className="ml-auto text-[10px] underline underline-offset-2 opacity-80 hover:opacity-100"
                  >
                    Switch →
                  </Link>
                </div>
              )}

              {/* Mobile nav items */}
              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {(isOnAdminPage && isAdmin ? mobileAdminNavItems : mobileNavItems).map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      item.href !== "/dashboard/admin" &&
                      pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileMenuToggle}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? isOnAdminPage ? "bg-amber-500/10 text-amber-500" : "bg-success/10 text-success"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <Icon
                        className="h-[18px] w-[18px]"
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile bottom actions */}
              <div className="border-t border-border/50 p-3 space-y-1">
                {/* Back to Home */}
                <Link
                  href="/"
                  onClick={onMobileMenuToggle}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Home className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  ← Back to Home
                </Link>
                {/* Logout */}
                <button
                  onClick={signOut}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  Log out
                </button>
              </div>
            </m.nav>
          </>
        )}
      </AnimatePresence>
    </>
    </LazyMotion>
  );
}
