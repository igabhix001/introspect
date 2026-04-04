"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

// Singleton Supabase client — shared across all hooks, never recreated per render
const supabase = createClient();

/**
 * Helper to get stable user ID that doesn't cause query key changes during auth loading
 * Returns cached userId if auth is still loading to prevent query restarts
 */
let cachedUserId: string | null = null;
function getStableUserId(user: { id: string } | null, loading: boolean): string | null {
  if (user?.id) {
    cachedUserId = user.id;
    return user.id;
  }
  // If loading, return cached ID to prevent query key changes
  if (loading && cachedUserId) {
    return cachedUserId;
  }
  return null;
}

// ─── Query Keys (centralized for cache invalidation) ───
export const queryKeys = {
  dashboard: (userId: string) => ["dashboard", userId] as const,
  trades: (userId: string) => ["trades", userId] as const,
  assessment: (userId: string) => ["assessment", userId] as const,
  challenges: (userId: string) => ["challenges", userId] as const,
  dailyReports: (userId: string) => ["dailyReports", userId] as const,
  loyalty: (userId: string) => ["loyalty", userId] as const,
  market: () => ["market"] as const,
  notifications: (userId: string) => ["notifications", userId] as const,
};

// ─── Dashboard Overview Data ───
export function useDashboardQuery() {
  const { user, loading: authLoading } = useAuth();
  const userId = getStableUserId(user, authLoading);

  return useQuery({
    queryKey: queryKeys.dashboard(userId || ""),
    queryFn: async ({ signal }) => {
      if (!userId) return null;

      const today = new Date().toISOString().split("T")[0];

      const [tradesRes, assessmentRes, reportsRes, challengeRes, todayReportRes] = await Promise.all([
        supabase
          .from("trades")
          .select("*")
          .eq("user_id", userId)
          .gte("created_at", `${today}T00:00:00`)
          .order("created_at", { ascending: false })
          .abortSignal(signal),
        supabase
          .from("assessments")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .abortSignal(signal)
          .maybeSingle(),
        supabase
          .from("daily_reports")
          .select("date, discipline_score")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .limit(7)
          .abortSignal(signal),
        supabase
          .from("challenges")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .abortSignal(signal)
          .maybeSingle(),
        supabase
          .from("daily_reports")
          .select("*")
          .eq("user_id", userId)
          .eq("date", today)
          .abortSignal(signal)
          .maybeSingle(),
      ]);

      const trades = tradesRes.data || [];
      const assessment = assessmentRes.data;
      const reports = reportsRes.data || [];
      const activeChallenge = challengeRes.data;
      const todayFullReport = todayReportRes.data as {
        discipline_score?: number;
        mistakes_count?: number;
        rules_followed?: number;
        total_rules?: number;
        feedback?: {
          positive?: string[];
          negative?: string[];
          suggestions?: string[];
          mistakeTags?: Array<{ stock: string; pnl: number; tag: string }>;
        };
      } | null;

      const todayPnl = trades.reduce((sum: number, t: { pnl?: number }) => sum + (t.pnl || 0), 0);

      // Get today's report if it exists
      const todayReport = reports.find((r: { date: string }) => r.date === today) as { discipline_score?: number } | undefined;
      
      // Discipline score logic:
      // 1. If today's report exists, use it
      // 2. If no trades today, show 0 (not 100 - you haven't earned discipline yet)
      // 3. Otherwise show last known score or 0
      let disciplineScore = 0;
      if (todayFullReport?.discipline_score !== undefined) {
        disciplineScore = todayFullReport.discipline_score;
      } else if (todayReport?.discipline_score !== undefined) {
        disciplineScore = todayReport.discipline_score;
      } else if (trades.length === 0) {
        disciplineScore = 0;
      } else {
        disciplineScore = 0;
      }

      const disciplineTrend = reports
        .slice()
        .reverse()
        .map((r: { date: string; discipline_score?: number }) => ({
          day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(r.date).getDay()],
          score: r.discipline_score || 0,
        }));

      // Determine if user has journaled today
      const hasJournaledToday = trades.length > 0;
      const hasTodayReport = !!todayFullReport || !!todayReport;
      
      // Check if user has ever done assessment (has any historical reports or assessment)
      const hasEverTraded = reports.length > 0 || trades.length > 0;
      const hasAssessment = !!assessment;

      // Extract mistakes from today's report
      const todayMistakesCount = todayFullReport?.mistakes_count || 0;
      const todayMistakeTags = todayFullReport?.feedback?.mistakeTags || [];
      const todayAreasToImprove = todayFullReport?.feedback?.negative || [];
      const rulesFollowed = todayFullReport?.rules_followed || 0;
      const totalRules = todayFullReport?.total_rules || 4;

      return {
        disciplineScore,
        hasJournaledToday,
        hasTodayReport,
        hasEverTraded,
        hasAssessment,
        todayTrades: trades.length,
        maxTrades: 5,
        todayPnl,
        capitalUsed: assessment?.capital || 100000,
        rulesFollowed,
        totalRules,
        currentStreak: activeChallenge?.current_day || 0,
        todayMistakesCount,
        todayMistakeTags,
        todayAreasToImprove,
        recentTrades: trades.slice(0, 5).map((t: Record<string, unknown>) => ({
          id: t.id as string,
          stock_index: (t.stock || t.stock_index || "Unknown") as string,
          direction: t.direction as string,
          entry_price: t.entry_price as number,
          exit_price: (t.exit_price || 0) as number,
          pnl: (t.pnl || 0) as number,
          followed_plan: t.followed_plan as boolean,
          created_at: t.created_at as string,
        })),
        disciplineTrend: disciplineTrend.length > 0
          ? disciplineTrend
          : [
              { day: "Mon", score: 0 },
              { day: "Tue", score: 0 },
              { day: "Wed", score: 0 },
              { day: "Today", score: 0 },
            ],
        tradingRules: [],
      };
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

// ─── Trade Journal Data ───
export function useTradesQuery() {
  const { user, loading: authLoading } = useAuth();
  const userId = getStableUserId(user, authLoading);

  return useQuery({
    queryKey: queryKeys.trades(userId || ""),
    queryFn: async ({ signal }) => {
      if (!userId) return [];

      const { data } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100)
        .abortSignal(signal);

      return data || [];
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

// ─── Assessment Data ───
export function useAssessmentQuery() {
  const { user, loading: authLoading } = useAuth();
  const userId = getStableUserId(user, authLoading);

  return useQuery({
    queryKey: queryKeys.assessment(userId || ""),
    queryFn: async ({ signal }) => {
      if (!userId) return null;

      const { data } = await supabase
        .from("assessments")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .abortSignal(signal)
        .maybeSingle();

      return data;
    },
    enabled: !!userId,
    staleTime: 0, // Always fetch fresh assessment data - no stale cache
  });
}

// ─── Challenges Data ───
export function useChallengesQuery() {
  const { user, loading: authLoading } = useAuth();
  const userId = getStableUserId(user, authLoading);

  return useQuery({
    queryKey: queryKeys.challenges(userId || ""),
    queryFn: async ({ signal }) => {
      if (!userId) return { active: null, history: [] };

      const [activeRes, historyRes] = await Promise.all([
        supabase
          .from("challenges")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .abortSignal(signal)
          .maybeSingle(),
        supabase
          .from("challenges")
          .select("*")
          .eq("user_id", userId)
          .neq("status", "active")
          .order("created_at", { ascending: false })
          .limit(10)
          .abortSignal(signal),
      ]);

      return {
        active: activeRes.data,
        history: historyRes.data || [],
      };
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

// ─── Market Sentiment Data ───
export function useMarketQuery() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.market(),
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/market", { signal });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Network error" }));
        throw new Error(error.error || "Failed to fetch market data");
      }
      return res.json();
    },
    enabled: !!user?.id,
    staleTime: 5 * 1000,
    refetchInterval: 5 * 1000,
    retry: 1,
  });
}

// ─── Loyalty Points Data ───
export function useLoyaltyQuery() {
  const { user, loading: authLoading } = useAuth();
  const userId = getStableUserId(user, authLoading);

  return useQuery({
    queryKey: queryKeys.loyalty(userId || ""),
    queryFn: async ({ signal }) => {
      if (!userId) return null;

      const { data } = await supabase
        .from("loyalty_points")
        .select("*")
        .eq("user_id", userId)
        .abortSignal(signal)
        .maybeSingle();

      return data;
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

// ─── Daily Reports Data ───
export function useDailyReportsQuery() {
  const { user, loading: authLoading } = useAuth();
  const userId = getStableUserId(user, authLoading);

  return useQuery({
    queryKey: queryKeys.dailyReports(userId || ""),
    queryFn: async ({ signal }) => {
      if (!userId) return [];

      const { data } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(30)
        .abortSignal(signal);

      return data || [];
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

// ─── Loyalty Data with Transactions ───
export function useLoyaltyWithTransactionsQuery() {
  const { user, loading: authLoading } = useAuth();
  const userId = getStableUserId(user, authLoading);

  return useQuery({
    queryKey: ["loyaltyFull", userId || ""] as const,
    queryFn: async ({ signal }) => {
      if (!userId) return null;

      const [profileRes, ledgerRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("current_points_balance, total_lifetime_points, current_tier")
          .eq("id", userId)
          .abortSignal(signal)
          .single(),
        supabase
          .from("loyalty_points")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20)
          .abortSignal(signal),
      ]);

      return {
        points: profileRes.data?.current_points_balance || 0,
        lifetimePoints: profileRes.data?.total_lifetime_points || 0,
        tier: profileRes.data?.current_tier || "Bronze",
        transactions: ledgerRes.data || [],
      };
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

// ─── Daily Report Data ───
export function useDailyReportQuery(date: string) {
  const { user, loading: authLoading } = useAuth();
  const userId = getStableUserId(user, authLoading);

  return useQuery({
    queryKey: ["dailyReport", userId || "", date] as const,
    queryFn: async ({ signal }) => {
      if (!userId) return null;

      const { data } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("user_id", userId)
        .eq("date", date)
        .abortSignal(signal)
        .maybeSingle();

      return data;
    },
    enabled: !!userId && !!date,
    staleTime: 60 * 1000,
  });
}

// ─── Recent Daily Reports ───
export function useRecentDailyReportsQuery() {
  const { user, loading: authLoading } = useAuth();
  const userId = getStableUserId(user, authLoading);

  return useQuery({
    queryKey: ["recentDailyReports", userId || ""] as const,
    queryFn: async ({ signal }) => {
      if (!userId) return [];

      const since = new Date();
      since.setDate(since.getDate() - 7);

      const { data } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("user_id", userId)
        .gte("date", since.toISOString().split("T")[0])
        .order("date", { ascending: false })
        .abortSignal(signal);

      return data || [];
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

// ─── Analytics Data ───
export function useAnalyticsQuery() {
  const { user, loading: authLoading } = useAuth();
  const userId = getStableUserId(user, authLoading);

  return useQuery({
    queryKey: ["analytics", userId || ""] as const,
    queryFn: async ({ signal }) => {
      if (!userId) return null;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Fetch trades and weekly reports in parallel
      const [tradesRes, weeklyReportsRes] = await Promise.all([
        supabase
          .from("trades")
          .select("*")
          .eq("user_id", userId)
          .gte("created_at", thirtyDaysAgo.toISOString())
          .order("created_at", { ascending: true })
          .abortSignal(signal),
        supabase
          .from("daily_reports")
          .select("*")
          .eq("user_id", userId)
          .gte("date", sevenDaysAgo.toISOString().split("T")[0])
          .order("date", { ascending: false })
          .abortSignal(signal),
      ]);

      const allTrades = tradesRes.data || [];
      const weeklyReports = (weeklyReportsRes.data || []) as Array<{
        date: string;
        mistakes_count?: number;
        feedback?: {
          negative?: string[];
          suggestions?: string[];
          mistakeTags?: Array<{ stock: string; pnl: number; tag: string }>;
        };
      }>;

      // Extract weekly mistakes from daily reports
      const weeklyMistakeCounts: Record<string, number> = {};
      const weeklyAreasToImprove: string[] = [];
      const weeklySuggestions: string[] = [];

      weeklyReports.forEach((report) => {
        // Collect mistake tags
        if (report.feedback?.mistakeTags) {
          report.feedback.mistakeTags.forEach((mt) => {
            if (!mt.tag.startsWith("✅")) {
              const cleanTag = mt.tag.replace(/^🔴\s*/, "").split(" (")[0];
              weeklyMistakeCounts[cleanTag] = (weeklyMistakeCounts[cleanTag] || 0) + 1;
            }
          });
        }
        // Collect areas to improve
        if (report.feedback?.negative) {
          report.feedback.negative.forEach((neg) => {
            const cleanNeg = neg.replace(/^⚠️\s*/, "");
            if (!weeklyAreasToImprove.includes(cleanNeg)) {
              weeklyAreasToImprove.push(cleanNeg);
            }
          });
        }
        // Collect suggestions
        if (report.feedback?.suggestions) {
          report.feedback.suggestions.forEach((sug) => {
            if (!weeklySuggestions.includes(sug)) {
              weeklySuggestions.push(sug);
            }
          });
        }
      });

      const mistakeColors: Record<string, string> = {
        "SIZE VIOLATION": "#EF4444",
        "NO STOP-LOSS": "#F97316",
        "REVENGE TRADE": "#DC2626",
        "FOMO": "#F59E0B",
        "Overtrading": "#A855F7",
        "Over-leveraged": "#3B82F6",
      };

      const weeklyMistakeData = Object.entries(weeklyMistakeCounts).map(([name, value]) => ({
        name,
        value,
        color: mistakeColors[name] || "#6B7280",
      }));

      if (allTrades.length === 0) {
        return {
          allTrades: [],
          tradeCount: 0,
          totalPnl: 0,
          winRate: 0,
          ruleAdherence: 0,
          weeklyPnl: [],
          mistakeData: [],
          weeklyMistakeData,
          weeklyAreasToImprove,
          weeklySuggestions,
        };
      }

      const total = allTrades.reduce((sum: number, t: { pnl: number }) => sum + t.pnl, 0);
      const wins = allTrades.filter((t: { pnl: number }) => t.pnl > 0).length;
      const rulesFollowed = allTrades.filter((t: { followed_plan: boolean }) => t.followed_plan).length;

      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayPnl: Record<string, number> = {};
      allTrades.forEach((t: { created_at: string; pnl: number }) => {
        const dayName = dayNames[new Date(t.created_at).getDay()];
        dayPnl[dayName] = (dayPnl[dayName] || 0) + t.pnl;
      });
      const weeklyPnl = dayNames.slice(1, 6).map((day) => ({ day, pnl: dayPnl[day] || 0 }));

      // Legacy mistake data from trades (for backward compatibility)
      const tradeMistakeCounts: Record<string, number> = {};
      allTrades.forEach((t: { mistakes?: string[] }) => {
        (t.mistakes || []).forEach((m: string) => {
          tradeMistakeCounts[m] = (tradeMistakeCounts[m] || 0) + 1;
        });
      });
      const mistakeData = Object.entries(tradeMistakeCounts).map(([name, value]) => ({
        name,
        value,
        color: mistakeColors[name] || "#6B7280",
      }));

      return {
        allTrades,
        tradeCount: allTrades.length,
        totalPnl: total,
        winRate: Math.round((wins / allTrades.length) * 100),
        ruleAdherence: Math.round((rulesFollowed / allTrades.length) * 100),
        weeklyPnl,
        mistakeData,
        weeklyMistakeData,
        weeklyAreasToImprove,
        weeklySuggestions,
      };
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

// ─── Mutations ───

export function useAddTradeMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (trade: Record<string, unknown>) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("trades")
        .insert({ ...trade, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.trades(user.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(user.id) });
      }
    },
  });
}

export function useChallengeCheckinMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (challengeId: string) => {
      const res = await fetch("/api/challenges/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Check-in failed");
      }

      return res.json();
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.challenges(user.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(user.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.loyalty(user.id) });
      }
    },
  });
}

// ─── Admin Queries ───

export function useAdminStatsQuery() {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ["adminStats"] as const,
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch admin stats");
      return res.json();
    },
    enabled: !!user?.id && isAdmin,
    staleTime: 30 * 1000,
  });
}

export function useAdminUsersQuery() {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ["adminUsers"] as const,
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: !!user?.id && isAdmin,
    staleTime: 30 * 1000,
  });
}

export function useAdminSubscriptionsQuery() {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ["adminSubscriptions"] as const,
    queryFn: async () => {
      const res = await fetch("/api/admin/subscriptions");
      if (!res.ok) throw new Error("Failed to fetch subscriptions");
      return res.json();
    },
    enabled: !!user?.id && isAdmin,
    staleTime: 30 * 1000,
  });
}

export function useAdminNotificationsQuery() {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ["adminNotifications"] as const,
    queryFn: async () => {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    enabled: !!user?.id && isAdmin,
    staleTime: 30 * 1000,
  });
}
