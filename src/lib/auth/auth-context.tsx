"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types/database";

let supabaseInstance: any = null;

async function getSupabase() {
  if (supabaseInstance) return supabaseInstance;
  const { createClient } = await import("@/lib/supabase/client");
  supabaseInstance = createClient();
  return supabaseInstance;
}

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

// Module-level cache for auth state to prevent loading flash on navigation
let cachedAuthState: {
  user: User | null;
  profile: Profile | null;
  hasActiveSubscription: boolean | null;
  initialized: boolean;
} = {
  user: null,
  profile: null,
  hasActiveSubscription: null,
  initialized: false,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize from cache to prevent loading flash on navigation within dashboard
  const [user, setUser] = useState<User | null>(cachedAuthState.user);
  const [profile, setProfile] = useState<Profile | null>(cachedAuthState.profile);
  const [loading, setLoading] = useState(!cachedAuthState.initialized);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(cachedAuthState.hasActiveSubscription);
  
  // Refs for tracking latest state in persistent event listener closure
  const userRef = useRef<User | null>(user);
  const profileRef = useRef<Profile | null>(profile);

  useEffect(() => {
    userRef.current = user;
    profileRef.current = profile;
  }, [user, profile]);

  // Refs to prevent race conditions — NEVER put these in useEffect deps
  const mountedRef = useRef(true);
  const initDoneRef = useRef(cachedAuthState.initialized);
  const hydratingRef = useRef(false); // Prevent concurrent hydrations
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track loading timeout

  // Update cache whenever state changes
  useEffect(() => {
    cachedAuthState = {
      user,
      profile,
      hasActiveSubscription,
      initialized: !loading,
    };
  }, [user, profile, hasActiveSubscription, loading]);

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      const supabase = await getSupabase();

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("[AuthProvider] Profile fetch error details:", error);
        // Handle RLS infinite recursion (42P17)
        if (error.code === "42P17" || error.code === "PGRST301") {
          const emailLower = userEmail?.toLowerCase() || "";
          const fallback = {
            id: userId, email: userEmail || "",
            role: "user",
            full_name: null, trading_capital: 0, trading_style: "intraday",
            is_suspended: false, referral_code: null,
            created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
          } as unknown as Profile;
          if (mountedRef.current) setProfile(fallback);
          return;
        }
        // Profile row doesn't exist — create it
        if (error.code === "PGRST116") {
          console.log("[AuthProvider] Profile not found, creating new profile row.");
          const { data: newProfile, error: upsertError } = await supabase
            .from("profiles")
            .upsert({ id: userId, role: "user", email: userEmail })
            .select("*")
            .single();
          if (upsertError) {
            console.error("[AuthProvider] Failed to create new profile row:", upsertError);
          } else if (mountedRef.current) {
            setProfile(newProfile as Profile | null);
          }
          return;
        }
      }
      if (mountedRef.current) setProfile(data as Profile | null);
    } catch (err) {
      console.error("[AuthProvider] Exception during profile fetch:", err);
      // Absolute fallback — never crash the app
      if (mountedRef.current) {
        const emailLower = userEmail?.toLowerCase() || "";
        setProfile({
          id: userId, email: userEmail || "",
          role: "user",
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

    // Safety net: never stay loading > 1.5s no matter what (reduced for faster navigation)
    // This is critical to prevent infinite loading when switching between admin/user dashboards
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.warn("[AuthProvider] Safety timer fired — forcing loading=false");
        setLoading(false);
        hydratingRef.current = false; // Also reset hydrating flag
      }
    }, 1500);
    loadingTimeoutRef.current = safetyTimer;

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
        const supabase = await getSupabase();
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
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    const clearAuth = () => {
      if (!mountedRef.current) return;
      setUser(null);
      setProfile(null);
      setHasActiveSubscription(false);
    };

    // ── 1. Initial auth check (runs once) ──
    const initAuth = async () => {
      if (initDoneRef.current) return;
      initDoneRef.current = true;

      try {
        const supabase = await getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (!mountedRef.current) return;

        if (!session?.user) {
          clearAuth();
          setLoading(false);
          return;
        }

        await hydrateUser(session.user);
      } catch {
        if (mountedRef.current) { clearAuth(); setLoading(false); }
      }
    };

    // Delay initialization to let initial paint complete without CPU contention
    const delayTimer = setTimeout(() => {
      initAuth();
    }, 100);

    // ── 2. Auth state listener — handles sign-in, sign-out, token refresh ──
    // CRITICAL: This listener should NOT cause loading states after initial load
    let activeSubscription: any = null;
    
    const initListener = async () => {
      const supabase = await getSupabase();
      if (!mountedRef.current) return;
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: any, session: any) => {
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
            // Only hydrate if we don't already have this user or if the profile is missing
            if (!userRef.current || userRef.current.id !== session.user.id || !profileRef.current) {
              await hydrateUser(session.user);
            } else {
              setUser(session.user);
              if (mountedRef.current) setLoading(false);
            }
            return;
          }

          // INITIAL_SESSION: Always ensure loading clears even if hydration is skipped
          if (event === "INITIAL_SESSION") {
            if (session?.user) {
              // Only hydrate if initAuth hasn't already done it
              if ((!userRef.current || !profileRef.current) && !hydratingRef.current) {
                await hydrateUser(session.user);
              } else if (!hydratingRef.current) {
                if (mountedRef.current) setLoading(false);
              }
            } else {
              clearAuth();
              if (mountedRef.current) setLoading(false);
            }
          }
        }
      );
      if (!mountedRef.current) {
        subscription.unsubscribe();
      } else {
        activeSubscription = subscription;
      }
    };
    initListener();

    return () => {
      mountedRef.current = false;
      clearTimeout(safetyTimer);
      clearTimeout(delayTimer);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (activeSubscription) {
        activeSubscription.unsubscribe();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← EMPTY deps — runs once, never re-runs

  const signOut = async () => {
    try {
      const supabase = await getSupabase();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Supabase signOut error, forcing local logout:", err);
    }
    setUser(null);
    setProfile(null);
    setHasActiveSubscription(false);
    if (typeof window !== "undefined") {
      // Clear all supabase local storage keys
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
          window.localStorage.removeItem(key);
        }
      }
    }
    window.location.href = "/";
  };

  const calculatedIsAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin: calculatedIsAdmin,
        hasActiveSubscription: calculatedIsAdmin ? true : hasActiveSubscription,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
