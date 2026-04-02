"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useMemo } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/database";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  hasActiveSubscription: boolean | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  hasActiveSubscription: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);
  
  // Use singleton Supabase client - memoized to prevent recreation
  const supabase = useMemo(() => createClient(), []);

  // Refs to prevent race conditions — NEVER put these in useEffect deps
  const mountedRef = useRef(true);
  const initDoneRef = useRef(false);
  const hydratingRef = useRef(false); // Prevent concurrent hydrations

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      // Add timeout to prevent hanging on slow Supabase responses
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .abortSignal(controller.signal)
        .single();

      clearTimeout(timeout);

      if (error) {
        // Handle RLS infinite recursion (42P17)
        if (error.code === "42P17" || error.code === "PGRST301") {
          const fallback = {
            id: userId, email: userEmail || "",
            role: userEmail === "intradaymindview@gmail.com" ? "admin" : "user",
            full_name: null, trading_capital: 0, trading_style: "intraday",
            is_suspended: false, referral_code: null,
            created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
          } as unknown as Profile;
          if (mountedRef.current) setProfile(fallback);
          return;
        }
        // Profile row doesn't exist — create it
        if (error.code === "PGRST116") {
          const { data: newProfile } = await supabase
            .from("profiles")
            .upsert({ id: userId, role: "user", email: userEmail })
            .select("*")
            .single();
          if (mountedRef.current) setProfile(newProfile as Profile | null);
          return;
        }
      }
      if (mountedRef.current) setProfile(data as Profile | null);
    } catch {
      // Absolute fallback — never crash the app (also handles AbortError)
      if (mountedRef.current) {
        setProfile({
          id: userId, email: userEmail || "",
          role: userEmail === "intradaymindview@gmail.com" ? "admin" : "user",
        } as unknown as Profile);
      }
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id, user.email || undefined);
  };

  // ── Single useEffect, empty deps, runs ONCE ──
  useEffect(() => {
    mountedRef.current = true;

    // Safety net: never stay loading > 2s no matter what (reduced for faster navigation)
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.warn("[AuthProvider] Safety timer fired — forcing loading=false");
        setLoading(false);
      }
    }, 2000);

    /**
     * Helper: given a valid user, hydrate profile + subscription in parallel.
     * Does NOT touch `loading` — the caller decides when to clear it.
     * Uses hydratingRef to prevent concurrent hydrations that cause race conditions.
     * IMPORTANT: If hydration is already in progress, still ensures loading clears.
     */
    const hydrateUser = async (u: User) => {
      if (!mountedRef.current) return;
      
      // Prevent concurrent hydrations - this is critical for mobile stability
      if (hydratingRef.current) {
        // Just update user object — the in-flight hydration will clear loading
        setUser(u);
        return;
      }
      
      hydratingRef.current = true;
      setUser(u);

      try {
        // Subscription check with aggressive 2s timeout
        const subPromise = supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", u.id)
          .eq("status", "active")
          .gte("current_period_end", new Date().toISOString())
          .limit(1)
          .maybeSingle();

        const [, subResult] = await Promise.allSettled([
          fetchProfile(u.id, u.email || undefined),
          Promise.race([subPromise, new Promise<null>((r) => setTimeout(() => r(null), 2000))]),
        ]);

        if (!mountedRef.current) return;
        const sub =
          subResult.status === "fulfilled" &&
          subResult.value &&
          typeof subResult.value === "object" &&
          "data" in subResult.value
            ? (subResult.value as { data: unknown }).data
            : null;
        setHasActiveSubscription(!!sub);
      } finally {
        hydratingRef.current = false;
      }
    };

    const clearAuth = () => {
      if (!mountedRef.current) return;
      setUser(null);
      setProfile(null);
      setHasActiveSubscription(false);
    };

    // ── 1. Initial auth check (runs once) ──
    // Uses getSession() which reads from local storage (fast) rather than network
    const initAuth = async () => {
      if (initDoneRef.current) return;
      initDoneRef.current = true;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mountedRef.current) return;

        if (!session?.user) {
          clearAuth();
          setLoading(false);
          return;
        }

        await hydrateUser(session.user);
        if (mountedRef.current) setLoading(false);
      } catch {
        if (mountedRef.current) { clearAuth(); setLoading(false); }
      }
    };

    initAuth();

    // ── 2. Auth state listener — handles sign-in, sign-out, token refresh ──
    // CRITICAL: This listener should NOT cause loading states after initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        // SIGNED_OUT: Clear everything
        if (event === "SIGNED_OUT") {
          clearAuth();
          setLoading(false);
          return;
        }

        // TOKEN_REFRESHED: Just update user object silently - NO loading state change
        if (event === "TOKEN_REFRESHED" && session?.user) {
          setUser(session.user);
          return;
        }

        // USER_UPDATED: Update user object silently
        if (event === "USER_UPDATED" && session?.user) {
          setUser(session.user);
          return;
        }

        // SIGNED_IN: Full hydration only for actual sign-in (not token refresh)
        if (event === "SIGNED_IN" && session?.user) {
          // Only hydrate if we don't already have this user
          if (!user || user.id !== session.user.id) {
            await hydrateUser(session.user);
          } else {
            setUser(session.user);
          }
          if (mountedRef.current) setLoading(false);
          return;
        }

        // INITIAL_SESSION: Always ensure loading clears even if hydration is skipped
        if (event === "INITIAL_SESSION") {
          if (session?.user) {
            // Only hydrate if initAuth hasn't already done it
            if (!user && !hydratingRef.current) {
              await hydrateUser(session.user);
            }
          } else {
            clearAuth();
          }
          // ALWAYS clear loading on INITIAL_SESSION — this is the critical fix
          if (mountedRef.current) setLoading(false);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← EMPTY deps — runs once, never re-runs

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin: profile?.role === "admin" || user?.email === "intradaymindview@gmail.com",
        hasActiveSubscription,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
