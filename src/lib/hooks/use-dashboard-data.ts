"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

// Client-side cache for dashboard data (reduces DB calls)
const CACHE_TTL_MS = 30000; // 30 seconds
const dashboardCache = new Map<string, { data: unknown; timestamp: number }>();

function getCachedData<T>(key: string): T | null {
  const cached = dashboardCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T;
  }
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  dashboardCache.set(key, { data, timestamp: Date.now() });
}

/* ─── Dashboard Overview Data ─── */
export function useDashboardData() {
  const { user, loading: authLoading } = useAuth();
  const [hasFetched, setHasFetched] = useState(false);
  const [data, setData] = useState<{
    disciplineScore: number;
    todayTrades: number;
    maxTrades: number;
    todayPnl: number;
    capitalUsed: number;
    rulesFollowed: number;
    totalRules: number;
    currentStreak: number;
    recentTrades: Array<{
      id: string;
      stock_index: string;
      direction: string;
      entry_price: number;
      exit_price: number;
      pnl: number;
      followed_plan: boolean;
      created_at: string;
    }>;
    disciplineTrend: Array<{ day: string; score: number }>;
    tradingRules: Array<{ text: string; followed: boolean }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // If auth is still loading, wait but don't block forever
    if (authLoading) {
      return; // useEffect will re-trigger when authLoading changes
    }
    
    // No user = no data to fetch
    if (!user?.id) {
      setLoading(false);
      setHasFetched(true);
      return;
    }

    // Check cache first (unless force refresh)
    const cacheKey = `dashboard:${user.id}`;
    if (!forceRefresh) {
      const cached = getCachedData<typeof data>(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        setHasFetched(true);
        return;
      }
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // Fetch today's trades
      const today = new Date().toISOString().split("T")[0];
      const { data: trades } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", `${today}T00:00:00`)
        .order("created_at", { ascending: false });

      // Fetch latest assessment for rules
      const { data: assessment } = await supabase
        .from("assessments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Fetch recent daily reports for discipline trend
      const { data: reports } = await supabase
        .from("daily_reports")
        .select("date, discipline_score")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(7);

      // Fetch active challenge for streak
      const { data: activeChallenge } = await supabase
        .from("challenges")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .single();

      const todayTrades = trades || [];
      const todayPnl = todayTrades.reduce(
        (sum: number, t: { pnl: number | null }) => sum + (t.pnl || 0),
        0
      );
      const rulesFollowed = todayTrades.filter(
        (t: { followed_plan: boolean | null }) => t.followed_plan
      ).length;

      const rules = assessment?.personalized_rules as string[] | null;
      const tradingRules = (rules || [
        "Stop-loss on every trade",
        "Risk ≤ 1% per trade",
        "No revenge trading",
        "Max 3 trades per day",
      ]).map((text: string) => ({
        text,
        followed: Math.random() > 0.3, // Will be replaced with actual tracking
      }));

      const disciplineTrend = (reports || [])
        .reverse()
        .map(
          (r: { date: string; discipline_score: number | null }, i: number) => ({
            day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"][
              Math.min(i, 6)
            ],
            score: r.discipline_score || 0,
          })
        );

      const maxTrades = (assessment?.personalized_rules as string[])?.find(
        (r: string) => r.toLowerCase().includes("max trades")
      )
        ? parseInt(
            ((assessment?.personalized_rules as string[])
              ?.find((r: string) => r.toLowerCase().includes("max trades"))
              ?.match(/\d+/) || ["3"])[0]
          )
        : 3;

      const dashboardData = {
        disciplineScore: assessment?.discipline_score || 0,
        todayTrades: todayTrades.length,
        maxTrades,
        todayPnl,
        capitalUsed: assessment?.capital || 100000,
        rulesFollowed,
        totalRules: tradingRules.length,
        currentStreak: activeChallenge?.current_day || 0,
        recentTrades: todayTrades.slice(0, 5).map((t: Record<string, unknown>) => ({
          id: t.id as string,
          stock_index: t.stock_index as string,
          direction: t.direction as string,
          entry_price: t.entry_price as number,
          exit_price: t.exit_price as number,
          pnl: t.pnl as number,
          followed_plan: t.followed_plan as boolean,
          created_at: t.created_at as string,
        })),
        disciplineTrend:
          disciplineTrend.length > 0
            ? disciplineTrend
            : [
                { day: "Mon", score: 0 },
                { day: "Tue", score: 0 },
                { day: "Wed", score: 0 },
                { day: "Today", score: 0 },
              ],
        tradingRules,
      };

      // Cache the data
      setCachedData(cacheKey, dashboardData);
      setData(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, [user?.id, authLoading]);

  useEffect(() => {
    // Only fetch when auth is done loading
    if (!authLoading) {
      fetchData();
    }
  }, [fetchData, authLoading]);

  // Auto-refresh every 60 seconds (separate effect to avoid re-triggering on authLoading change)
  useEffect(() => {
    if (!authLoading && user?.id) {
      const interval = setInterval(() => {
        fetchData(true); // force refresh
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [user?.id, authLoading, fetchData]);

  // Loading is true only if auth is loading OR we haven't fetched yet
  const isLoading = authLoading || (!hasFetched && loading);

  return { data, loading: isLoading, refetch: fetchData };
}

/* ─── Trade Journal Data ─── */
export function useTradeJournal() {
  const { user, loading: authLoading } = useAuth();
  const [trades, setTrades] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
       setLoading(false);
       return;
    }
    setLoading(true);
    const supabase = createClient();

    const { data } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    setTrades(data || []);
    setLoading(false);
  }, [user?.id, authLoading]);

  const addTrade = async (trade: Record<string, unknown>) => {
    if (!user) return;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("trades")
      .insert({ ...trade, user_id: user.id })
      .select()
      .single();

    if (!error && data) {
      setTrades((prev) => [data, ...prev]);
    }
    return { data, error };
  };

  const deleteTrade = async (tradeId: string) => {
    if (!user) return;
    const supabase = createClient();

    const { error } = await supabase
      .from("trades")
      .delete()
      .eq("id", tradeId)
      .eq("user_id", user.id);

    if (!error) {
      setTrades((prev) => prev.filter((t) => t.id !== tradeId));
    }
    return { error };
  };

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return { trades, loading: loading || authLoading, addTrade, deleteTrade, refetch: fetchTrades };
}

/* ─── Assessment Data ─── */
export function useAssessmentData() {
  const { user, loading: authLoading } = useAuth();
  const [assessment, setAssessment] = useState<Record<string, unknown> | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const fetchAssessment = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = createClient();

    const { data } = await supabase
      .from("assessments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    setAssessment(data);
    setLoading(false);
  }, [user?.id, authLoading]);

  const saveAssessment = async (assessmentData: Record<string, unknown>) => {
    if (!user) return;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("assessments")
      .insert({ ...assessmentData, user_id: user.id })
      .select()
      .single();

    if (!error && data) {
      setAssessment(data);
    }
    return { data, error };
  };

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  return { assessment, loading: loading || authLoading, saveAssessment, refetch: fetchAssessment };
}

/* ─── Challenge Data ─── */
export function useChallengeData() {
  const { user, loading: authLoading } = useAuth();
  const [challenges, setChallenges] = useState<Record<string, unknown>[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = createClient();

    const { data: all } = await supabase
      .from("challenges")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: active } = await supabase
      .from("challenges")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .single();

    setChallenges(all || []);
    setActiveChallenge(active);
    setLoading(false);
  }, [user?.id, authLoading]);

  const startChallenge = async (challengeData: Record<string, unknown>) => {
    if (!user) return;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("challenges")
      .insert({ ...challengeData, user_id: user.id, status: "active", current_day: 0 })
      .select()
      .single();

    if (!error && data) {
      setActiveChallenge(data);
      setChallenges((prev) => [data, ...prev]);
    }
    return { data, error };
  };

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  return {
    challenges,
    activeChallenge,
    loading: loading || authLoading,
    startChallenge,
    refetch: fetchChallenges,
  };
}

/* ─── Profile/Settings Data ─── */
export function useProfileSettings() {
  const { user, profile, refreshProfile } = useAuth();

  const updateProfile = async (updates: Record<string, unknown>) => {
    if (!user) return;
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (!error) {
      await refreshProfile();
    }
    return { error };
  };

  return { profile, updateProfile };
}
