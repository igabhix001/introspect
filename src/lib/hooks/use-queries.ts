"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

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
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.dashboard(userId || ""),
    queryFn: async () => {
      if (!userId) return null;

      const today = new Date().toISOString().split("T")[0];

      const [tradesRes, assessmentRes, reportsRes, challengeRes] = await Promise.all([
        supabase
          .from("trades")
          .select("*")
          .eq("user_id", userId)
          .gte("created_at", `${today}T00:00:00`)
          .order("created_at", { ascending: false }),
        supabase
          .from("assessments")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("daily_reports")
          .select("date, discipline_score")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .limit(7),
        supabase
          .from("challenges")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const trades = tradesRes.data || [];
      const assessment = assessmentRes.data;
      const reports = reportsRes.data || [];
      const activeChallenge = challengeRes.data;

      const todayPnl = trades.reduce((sum: number, t: { pnl?: number }) => sum + (t.pnl || 0), 0);

      // Use last daily_report discipline_score if available, else derive from assessment
      const latestReportScore = reports.length > 0 ? (reports[0] as { discipline_score?: number }).discipline_score : null;
      const disciplineScore = latestReportScore ?? assessment?.discipline_score ?? 0;

      const disciplineTrend = reports
        .slice()
        .reverse()
        .map((r: { date: string; discipline_score?: number }) => ({
          day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(r.date).getDay()],
          score: r.discipline_score || 0,
        }));

      return {
        disciplineScore,
        todayTrades: trades.length,
        maxTrades: 5,
        todayPnl,
        capitalUsed: assessment?.capital || 100000,
        rulesFollowed: 0,
        totalRules: 4,
        currentStreak: activeChallenge?.current_day || 0,
        recentTrades: trades.slice(0, 5).map((t: Record<string, unknown>) => ({
          id: t.id as string,
          stock_index: t.stock_index as string,
          direction: t.direction as string,
          entry_price: t.entry_price as number,
          exit_price: t.exit_price as number,
          pnl: t.pnl as number,
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
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.trades(userId || ""),
    queryFn: async () => {
      if (!userId) return [];

      const { data } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      return data || [];
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

// ─── Assessment Data ───
export function useAssessmentQuery() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.assessment(userId || ""),
    queryFn: async () => {
      if (!userId) return null;

      const { data } = await supabase
        .from("assessments")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Challenges Data ───
export function useChallengesQuery() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.challenges(userId || ""),
    queryFn: async () => {
      if (!userId) return { active: null, history: [] };

      const [activeRes, historyRes] = await Promise.all([
        supabase
          .from("challenges")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("challenges")
          .select("*")
          .eq("user_id", userId)
          .neq("status", "active")
          .order("created_at", { ascending: false })
          .limit(10),
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
    queryFn: async () => {
      const res = await fetch("/api/market");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch market data");
      }
      return res.json();
    },
    enabled: !!user?.id,
    staleTime: 5 * 1000,
    refetchInterval: 5 * 1000,
    retry: 2,
  });
}

// ─── Loyalty Points Data ───
export function useLoyaltyQuery() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.loyalty(userId || ""),
    queryFn: async () => {
      if (!userId) return null;

      const { data } = await supabase
        .from("loyalty_points")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      return data;
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

// ─── Daily Reports Data ───
export function useDailyReportsQuery() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.dailyReports(userId || ""),
    queryFn: async () => {
      if (!userId) return [];

      const { data } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(30);

      return data || [];
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

// ─── Loyalty Data with Transactions ───
export function useLoyaltyWithTransactionsQuery() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = createClient();

  return useQuery({
    queryKey: ["loyaltyFull", userId || ""] as const,
    queryFn: async () => {
      if (!userId) return null;

      const [profileRes, ledgerRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("current_points_balance, total_lifetime_points, current_tier")
          .eq("id", userId)
          .single(),
        supabase
          .from("loyalty_points")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
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
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = createClient();

  return useQuery({
    queryKey: ["dailyReport", userId || "", date] as const,
    queryFn: async () => {
      if (!userId) return null;

      const { data } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle();

      return data;
    },
    enabled: !!userId && !!date,
    staleTime: 60 * 1000,
  });
}

// ─── Recent Daily Reports ───
export function useRecentDailyReportsQuery() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = createClient();

  return useQuery({
    queryKey: ["recentDailyReports", userId || ""] as const,
    queryFn: async () => {
      if (!userId) return [];

      const since = new Date();
      since.setDate(since.getDate() - 7);

      const { data } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("user_id", userId)
        .gte("date", since.toISOString().split("T")[0])
        .order("date", { ascending: false });

      return data || [];
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

// ─── Analytics Data ───
export function useAnalyticsQuery() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = createClient();

  return useQuery({
    queryKey: ["analytics", userId || ""] as const,
    queryFn: async () => {
      if (!userId) return null;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: trades } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (!trades || trades.length === 0) {
        return {
          tradeCount: 0,
          totalPnl: 0,
          winRate: 0,
          ruleAdherence: 0,
          weeklyPnl: [],
          mistakeData: [],
        };
      }

      const total = trades.reduce((sum: number, t: { pnl: number }) => sum + t.pnl, 0);
      const wins = trades.filter((t: { pnl: number }) => t.pnl > 0).length;
      const rulesFollowed = trades.filter((t: { followed_plan: boolean }) => t.followed_plan).length;

      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayPnl: Record<string, number> = {};
      trades.forEach((t: { created_at: string; pnl: number }) => {
        const dayName = dayNames[new Date(t.created_at).getDay()];
        dayPnl[dayName] = (dayPnl[dayName] || 0) + t.pnl;
      });
      const weeklyPnl = dayNames.slice(1, 6).map((day) => ({ day, pnl: dayPnl[day] || 0 }));

      const mistakeColors: Record<string, string> = {
        FOMO: "#F59E0B",
        "Revenge Trade": "#EF4444",
        "No SL": "#F97316",
        Overtrading: "#A855F7",
        "Over-leveraged": "#3B82F6",
      };
      const mistakeCounts: Record<string, number> = {};
      trades.forEach((t: { mistakes?: string[] }) => {
        (t.mistakes || []).forEach((m: string) => {
          mistakeCounts[m] = (mistakeCounts[m] || 0) + 1;
        });
      });
      const mistakeData = Object.entries(mistakeCounts).map(([name, value]) => ({
        name,
        value,
        color: mistakeColors[name] || "#6B7280",
      }));

      return {
        tradeCount: trades.length,
        totalPnl: total,
        winRate: Math.round((wins / trades.length) * 100),
        ruleAdherence: Math.round((rulesFollowed / trades.length) * 100),
        weeklyPnl,
        mistakeData,
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
  const supabase = createClient();

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
