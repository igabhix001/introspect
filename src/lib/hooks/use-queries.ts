"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useRef } from "react";

/**
 * Helper hook to get stable user ID that doesn't cause query key changes during auth loading
 * Returns cached userId if auth is still loading to prevent query restarts
 * IMPORTANT: Clear cache when user is explicitly null (signed out) to prevent stale data
 */
function useStableUserId(): string | null {
  const { user, loading } = useAuth();
  const cachedUserIdRef = useRef<string | null>(null);

  if (user?.id) {
    cachedUserIdRef.current = user.id;
    return user.id;
  }
  // If NOT loading and user is null, clear cache (user signed out)
  if (!loading && !user) {
    cachedUserIdRef.current = null;
    return null;
  }
  // If loading, return cached ID to prevent query key changes
  if (loading && cachedUserIdRef.current) {
    return cachedUserIdRef.current;
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
  const userId = useStableUserId();

  return useQuery({
    queryKey: queryKeys.dashboard(userId || ""),
    queryFn: async ({ signal }) => {
      if (!userId) return null;
      const res = await fetch(`/api/dashboard/overview?t=${Date.now()}`, { signal });
      if (!res.ok) throw new Error("Failed to fetch dashboard overview");
      return res.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 15 * 60 * 1000,
  });
}

// ─── Trade Journal Data ───
export function useTradesQuery() {
  const userId = useStableUserId();
  const supabase = createClient();

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
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 15 * 60 * 1000,
  });
}

// ─── Assessment Data ───
export function useAssessmentQuery() {
  const userId = useStableUserId();
  const supabase = createClient();

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
    staleTime: 10 * 60 * 1000, // 10 minutes — assessment rarely changes
  });
}

// ─── All Assessments Data (Historical) ───
export function useAllAssessmentsQuery() {
  const userId = useStableUserId();
  const supabase = createClient();

  return useQuery({
    queryKey: ["assessmentsAll", userId || ""] as const,
    queryFn: async ({ signal }) => {
      if (!userId) return [];

      const { data } = await supabase
        .from("assessments")
        .select("id, discipline_score, created_at, risk_level")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .abortSignal(signal);

      return data || [];
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes — assessment rarely changes
  });
}

// ─── Challenges Data ───
export function useChallengesQuery() {
  const userId = useStableUserId();
  const supabase = createClient();

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
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 15 * 60 * 1000,
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
  const userId = useStableUserId();
  const supabase = createClient();

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
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 20 * 60 * 1000,
  });
}

// ─── Daily Reports Data ───
export function useDailyReportsQuery() {
  const userId = useStableUserId();
  const supabase = createClient();

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
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 20 * 60 * 1000,
  });
}

// ─── Loyalty Data with Transactions ───
export function useLoyaltyWithTransactionsQuery() {
  const userId = useStableUserId();
  const supabase = createClient();

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
          .abortSignal(signal), // Retrieve all to dynamically filter and calculate totals
      ]);

      const rawTransactions = ledgerRes.data || [];
      const allowedActions = ["referral", "referral_reward", "redemption"];
      const filteredTransactions = rawTransactions.filter((tx) =>
        allowedActions.includes(tx.action)
      );

      // Dynamically sum only referral and redemption points
      let dynamicPoints = 0;
      let dynamicLifetimePoints = 0;

      filteredTransactions.forEach((tx) => {
        const pts = tx.points || 0;
        dynamicPoints += pts;
        if (pts > 0) {
          dynamicLifetimePoints += pts;
        }
      });

      // Ensure points balance never falls below 0
      dynamicPoints = Math.max(0, dynamicPoints);

      // Recalculate tier
      let dynamicTier = "Bronze";
      if (dynamicLifetimePoints >= 900) dynamicTier = "Platinum";
      else if (dynamicLifetimePoints >= 600) dynamicTier = "Gold";
      else if (dynamicLifetimePoints >= 300) dynamicTier = "Silver";

      return {
        points: dynamicPoints,
        lifetimePoints: dynamicLifetimePoints,
        tier: dynamicTier,
        transactions: filteredTransactions.slice(0, 20), // Display only top 20 allowed transactions
      };
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 20 * 60 * 1000,
  });
}

// ─── Daily Report Data ───
export function useDailyReportQuery(date: string) {
  const userId = useStableUserId();
  const supabase = createClient();

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
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 20 * 60 * 1000,
  });
}

// ─── Recent Daily Reports ───
export function useRecentDailyReportsQuery() {
  const userId = useStableUserId();
  const supabase = createClient();

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
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 20 * 60 * 1000,
  });
}

// ─── Analytics Data ───
export function useAnalyticsQuery() {
  const userId = useStableUserId();

  return useQuery({
    queryKey: ["analytics", userId || ""] as const,
    queryFn: async ({ signal }) => {
      if (!userId) return null;
      const res = await fetch(`/api/dashboard/analytics?t=${Date.now()}`, { signal });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 20 * 60 * 1000,
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
        queryClient.invalidateQueries({ queryKey: queryKeys.dailyReports(user.id) });
        queryClient.invalidateQueries({ queryKey: ["recentDailyReports", user.id] });
        queryClient.invalidateQueries({ queryKey: ["analytics", user.id] });
        queryClient.invalidateQueries({ queryKey: ["dailyReport", user.id] });
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
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/admin/stats", { signal });
      if (!res.ok) throw new Error("Failed to fetch admin stats");
      return res.json();
    },
    enabled: !!user?.id && isAdmin,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useAdminUsersQuery(page?: number, limit?: number, search?: string) {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ["adminUsers", page, limit, search] as const,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      if (page) params.append("page", page.toString());
      if (limit) params.append("limit", limit.toString());
      if (search) params.append("search", search);

      const res = await fetch(`/api/admin/users?${params}`, { signal });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: !!user?.id && isAdmin,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useAdminSubscriptionsQuery(filter?: string) {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ["adminSubscriptions", filter] as const,
    queryFn: async ({ signal }) => {
      const url = filter ? `/api/admin/subscriptions?filter=${filter}` : "/api/admin/subscriptions";
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error("Failed to fetch subscriptions");
      return res.json();
    },
    enabled: !!user?.id && isAdmin,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useAdminNotificationsQuery() {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ["adminNotifications"] as const,
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/admin/notifications", { signal });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    enabled: !!user?.id && isAdmin,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useAdminMessagesQuery(filter?: string) {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ["adminMessages", filter] as const,
    queryFn: async ({ signal }) => {
      const statusFilter = filter || "all";
      const res = await fetch(`/api/contact?status=${statusFilter}`, { signal });
      if (!res.ok) throw new Error("Failed to fetch contact messages");
      return res.json();
    },
    enabled: !!user?.id && isAdmin,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useAdminSettingsQuery() {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ["adminSettings"] as const,
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/admin/settings", { signal });
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
    enabled: !!user?.id && isAdmin,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useAdminFyersStatusQuery() {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ["adminFyersStatus"] as const,
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/admin/fyers", { signal });
      if (!res.ok) throw new Error("Failed to fetch Fyers status");
      return res.json();
    },
    enabled: !!user?.id && isAdmin,
    staleTime: 30 * 1000, // Check Fyers token connection status relatively frequently
    gcTime: 5 * 60 * 1000,
  });
}
