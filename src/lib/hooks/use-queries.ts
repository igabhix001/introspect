"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Production-grade React Query hooks for dashboard data
 * Benefits over manual useState/useEffect:
 * - Automatic caching and deduplication
 * - Background revalidation (stale-while-revalidate)
 * - No race conditions or loading loops
 * - Proper error handling
 * - Optimistic updates support
 */

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
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.dashboard(user?.id || ""),
    queryFn: async () => {
      if (!user?.id) return null;

      const today = new Date().toISOString().split("T")[0];

      // Parallel fetch for performance
      const [tradesRes, assessmentRes, reportsRes, challengeRes] = await Promise.all([
        supabase
          .from("trades")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", `${today}T00:00:00`)
          .order("created_at", { ascending: false }),
        supabase
          .from("assessments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("daily_reports")
          .select("date, discipline_score")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(7),
        supabase
          .from("challenges")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const trades = tradesRes.data || [];
      const assessment = assessmentRes.data;
      const reports = reportsRes.data || [];
      const activeChallenge = challengeRes.data;

      // Calculate metrics
      const todayPnl = trades.reduce((sum: number, t: { pnl?: number }) => sum + (t.pnl || 0), 0);
      const tradingRules = (assessment?.personalized_rules as string[] || []).map((rule: string) => ({
        text: rule,
        followed: trades.every((t: { followed_plan?: boolean }) => t.followed_plan !== false),
      }));
      const rulesFollowed = tradingRules.filter((r: { followed: boolean }) => r.followed).length;

      const disciplineTrend = reports
        .slice()
        .reverse()
        .map((r: { date: string; discipline_score?: number }) => ({
          day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(r.date).getDay()],
          score: r.discipline_score || 0,
        }));

      const maxTrades = (assessment?.personalized_rules as string[])?.find(
        (r: string) => r.toLowerCase().includes("max trades")
      )
        ? parseInt(
            ((assessment?.personalized_rules as string[])
              ?.find((r: string) => r.toLowerCase().includes("max trades"))
              ?.match(/\d+/) || ["3"])[0]
          )
        : 3;

      return {
        disciplineScore: assessment?.discipline_score || 0,
        todayTrades: trades.length,
        maxTrades,
        todayPnl,
        capitalUsed: assessment?.capital || 100000,
        rulesFollowed,
        totalRules: tradingRules.length,
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
        tradingRules,
      };
    },
    enabled: !authLoading && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

// ─── Trade Journal Data ───
export function useTradesQuery() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.trades(user?.id || ""),
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      return data || [];
    },
    enabled: !authLoading && !!user?.id,
    staleTime: 30 * 1000,
  });
}

// ─── Assessment Data ───
export function useAssessmentQuery() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.assessment(user?.id || ""),
    queryFn: async () => {
      if (!user?.id) return null;

      const { data } = await supabase
        .from("assessments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return data;
    },
    enabled: !authLoading && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes (assessments don't change often)
  });
}

// ─── Challenges Data ───
export function useChallengesQuery() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.challenges(user?.id || ""),
    queryFn: async () => {
      if (!user?.id) return { active: null, history: [] };

      const [activeRes, historyRes] = await Promise.all([
        supabase
          .from("challenges")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("challenges")
          .select("*")
          .eq("user_id", user.id)
          .neq("status", "active")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      return {
        active: activeRes.data,
        history: historyRes.data || [],
      };
    },
    enabled: !authLoading && !!user?.id,
    staleTime: 60 * 1000,
  });
}

// ─── Market Sentiment Data ───
export function useMarketQuery() {
  const { user, loading: authLoading } = useAuth();

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
    enabled: !authLoading && !!user,
    staleTime: 5 * 1000, // 5 seconds (market data is real-time)
    refetchInterval: 5 * 1000, // Auto-refresh every 5 seconds
    retry: 2,
  });
}

// ─── Loyalty Points Data ───
export function useLoyaltyQuery() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.loyalty(user?.id || ""),
    queryFn: async () => {
      if (!user?.id) return null;

      const { data } = await supabase
        .from("loyalty_points")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      return data;
    },
    enabled: !authLoading && !!user?.id,
    staleTime: 60 * 1000,
  });
}

// ─── Daily Reports Data ───
export function useDailyReportsQuery() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.dailyReports(user?.id || ""),
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(30);

      return data || [];
    },
    enabled: !authLoading && !!user?.id,
    staleTime: 60 * 1000,
  });
}

// ─── Loyalty Data with Transactions ───
export function useLoyaltyWithTransactionsQuery() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ["loyaltyFull", user?.id || ""] as const,
    queryFn: async () => {
      if (!user?.id) return null;

      const [profileRes, ledgerRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("current_points_balance, total_lifetime_points, current_tier")
          .eq("id", user.id)
          .single(),
        supabase
          .from("loyalty_points")
          .select("*")
          .eq("user_id", user.id)
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
    enabled: !authLoading && !!user?.id,
    staleTime: 60 * 1000,
  });
}

// ─── Daily Report Data ───
export function useDailyReportQuery(date: string) {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ["dailyReport", user?.id || "", date] as const,
    queryFn: async () => {
      if (!user?.id) return null;

      const { data } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", date)
        .single();

      return data;
    },
    enabled: !authLoading && !!user?.id && !!date,
    staleTime: 60 * 1000,
  });
}

// ─── Recent Daily Reports ───
export function useRecentDailyReportsQuery() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ["recentDailyReports", user?.id || ""] as const,
    queryFn: async () => {
      if (!user?.id) return [];

      const since = new Date();
      since.setDate(since.getDate() - 7);

      const { data } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", since.toISOString().split("T")[0])
        .order("date", { ascending: false });

      return data || [];
    },
    enabled: !authLoading && !!user?.id,
    staleTime: 60 * 1000,
  });
}

// ─── Analytics Data ───
export function useAnalyticsQuery() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ["analytics", user?.id || ""] as const,
    queryFn: async () => {
      if (!user?.id) return null;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: trades } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
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

      // Weekly P&L
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayPnl: Record<string, number> = {};
      trades.forEach((t: { created_at: string; pnl: number }) => {
        const dayName = dayNames[new Date(t.created_at).getDay()];
        dayPnl[dayName] = (dayPnl[dayName] || 0) + t.pnl;
      });
      const weeklyPnl = dayNames.slice(1, 6).map((day) => ({ day, pnl: dayPnl[day] || 0 }));

      // Mistake breakdown
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
    enabled: !authLoading && !!user?.id,
    staleTime: 60 * 1000,
  });
}

// ─── Mutations ───

// Add Trade Mutation
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
      // Invalidate related queries to refetch fresh data
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.trades(user.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(user.id) });
      }
    },
  });
}

// Challenge Check-in Mutation
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
