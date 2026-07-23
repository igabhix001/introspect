"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
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

/**
 * Reads/writes auth cache from sessionStorage (tab-scoped, not shared across requests).
 * Prevents loading flash on in-app navigation without risking cross-user state leakage.
 */
const SESSION_CACHE_KEY = "introspect_auth_cache";

interface CachedAuth {
  user: User | null;
  profile: Profile | null;
  hasActiveSubscription: boolean | null;
  initialized: boolean;
}

function readCache(): CachedAuth {
  if (typeof window === "undefined") {
    return { user: null, profile: null, hasActiveSubscription: null, initialized: false };
  }
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (raw) return JSON.parse(raw) as CachedAuth;
  } catch {
    // ignore parse errors
  }
  return { user: null, profile: null, hasActiveSubscription: null, initialized: false };
}

function writeCache(state: CachedAuth) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

function clearCache() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_CACHE_KEY);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Read from sessionStorage on mount for instant hydration (tab-scoped, safe)
  const initialCache = readCache();

  const [user, setUser] = useState<User | null>(initialCache.user);
  const [profile, setProfile] = useState<Profile | null>(initialCache.profile);
  const [loading, setLoading] = useState(!initialCache.initialized);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(
    initialCache.hasActiveSubscription
  );

  const userRef = useRef<User | null>(user);
  const profileRef = useRef<Profile | null>(profile);

  useEffect(() => {
    userRef.current = user;
    profileRef.current = profile;
  }, [user, profile]);

  const mountedRef = useRef(true);
  // Mutex: prevents concurrent hydrations
  const hydrationStartedRef = useRef(false);
  const hydrationDoneRef = useRef(initialCache.initialized);

  // Keep sessionStorage cache in sync with state
  useEffect(() => {
    writeCache({ user, profile, hasActiveSubscription, initialized: !loading });
  }, [user, profile, hasActiveSubscription, loading]);

  const clearAuth = () => {
    if (!mountedRef.current) return;
    setUser(null);
    setProfile(null);
    setHasActiveSubscription(false);
    hydrationStartedRef.current = false;
    hydrationDoneRef.current = true;
    clearCache();
  };

  /**
   * Fetch profile via server API route (uses admin client to bypass RLS).
   * Falls back to direct Supabase query with user JWT if API fails.
   * Profile creation is NOT done here — that happens in /auth/callback (server-side).
   */
  const fetchProfile = async (userId: string, userEmail?: string): Promise<void> => {
    try {
      // Primary: server route with admin client — guarantees correct `role` field
      const res = await fetch(`/api/user/profile?t=${Date.now()}`, {
        method: "GET",
        credentials: "include", // Send session cookies for auth verification
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
        },
        signal: AbortSignal.timeout(5000), // 5s timeout to prevent hanging
      });

      if (res.status === 401 || res.status === 403) {
        console.warn("[AuthProvider] Unauthorized profile fetch (expired session). Logging out.");
        if (mountedRef.current) {
          clearAuth();
        }
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data?.id && mountedRef.current) {
          setProfile(data as Profile);
          return;
        }
      }

      // Fallback: direct Supabase query (may not have `role` if RLS blocks it)
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data && mountedRef.current) {
        setProfile(data as Profile);
        return;
      }

      console.error("[AuthProvider] Profile fetch failed:", error?.code);
    } catch (err) {
      console.error("[AuthProvider] Exception during profile fetch:", err);
    }

    // Final fallback: minimal profile — user can still use the app but no admin features
    // Only set if we don't already have a profile in state (prevents overwriting admin role on transient errors)
    if (mountedRef.current && !profileRef.current) {
      setProfile({
        id: userId,
        email: userEmail || "",
        role: "user",
      } as unknown as Profile);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id, user.email ?? undefined);
  };

  useEffect(() => {
    mountedRef.current = true;

    // Safety net: force loading=false after 5s regardless of network conditions
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current && !hydrationDoneRef.current) {
        console.warn("[AuthProvider] Safety timer fired — forcing loading=false");
        hydrationDoneRef.current = true;
        setLoading(false);
      }
    }, 5000);

    /**
     * Core hydration: fetch profile + subscription for a validated user.
     * Mutex (hydrationStartedRef) prevents concurrent duplicate hydrations.
     */
    const hydrateUser = async (u: User) => {
      if (!mountedRef.current) return;

      // Deduplication: if already hydrating, and same user + profile exists → just update user
      if (hydrationStartedRef.current) {
        if (userRef.current?.id === u.id && profileRef.current) {
          setUser(u);
          if (!hydrationDoneRef.current) {
            hydrationDoneRef.current = true;
            setLoading(false);
          }
        }
        return;
      }

      hydrationStartedRef.current = true;
      setUser(u);

      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        // Subscription check with 3s timeout
        const subPromise = supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", u.id)
          .eq("status", "active")
          .gte("current_period_end", new Date().toISOString())
          .limit(1)
          .maybeSingle();

        const [, subResult] = await Promise.allSettled([
          fetchProfile(u.id, u.email ?? undefined),
          Promise.race([
            subPromise,
            new Promise<null>((r) => setTimeout(() => r(null), 3000)),
          ]),
        ]);

        if (!mountedRef.current) return;

        const subData =
          subResult.status === "fulfilled" &&
          subResult.value !== null &&
          typeof subResult.value === "object" &&
          "data" in subResult.value
            ? (subResult.value as { data: unknown }).data
            : null;

        setHasActiveSubscription(!!subData);
      } finally {
        if (mountedRef.current && !hydrationDoneRef.current) {
          hydrationDoneRef.current = true;
          setLoading(false);
        }
      }
    };

    let activeSubscription: ReturnType<SupabaseClient["auth"]["onAuthStateChange"]>["data"]["subscription"] | null = null;

    const initListener = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      if (!mountedRef.current) return;

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          if (!mountedRef.current) return;

          switch (event) {
            case "SIGNED_OUT":
              clearAuth();
              setLoading(false);
              break;

            case "TOKEN_REFRESHED":
              if (session?.user) setUser(session.user);
              break;

            case "USER_UPDATED":
              if (session?.user) {
                setUser(session.user);
                // Re-fetch profile in case email/metadata changed
                await fetchProfile(session.user.id, session.user.email ?? undefined);
              }
              break;

            case "INITIAL_SESSION":
              // Primary hydration trigger for all page loads
              if (session?.user) {
                await hydrateUser(session.user);
              } else {
                clearAuth();
                setLoading(false);
              }
              break;

            case "SIGNED_IN":
              if (session?.user) {
                const isDifferentUser = userRef.current?.id !== session.user.id;
                const missingProfile = !profileRef.current;
                if (isDifferentUser || missingProfile) {
                  setHasActiveSubscription(false); // Reset subscription state immediately for new account
                  setProfile(null);
                  hydrationStartedRef.current = false; // Allow fresh hydration for new sign-in
                  await hydrateUser(session.user);
                } else {
                  setUser(session.user);
                  if (!hydrationDoneRef.current) {
                    hydrationDoneRef.current = true;
                    setLoading(false);
                  }
                }
              }
              break;

            default:
              break;
          }
        }
      );

      if (!mountedRef.current) {
        subscription.unsubscribe();
      } else {
        activeSubscription = subscription;
      }
    };

    const checkSessionOnFocus = async () => {
      if (!mountedRef.current || !userRef.current) return;
      
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        
        // Fetch current session from Supabase. This automatically attempts a token refresh if expired.
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // If we are online, but session is null or has error, it is a definitive auth failure.
        if (navigator.onLine && (error || !session)) {
          console.warn("[AuthProvider] Session validation failed on focus while online. Logging out.");
          clearAuth();
          window.location.replace("/auth/login");
        }
      } catch (err) {
        console.error("[AuthProvider] Error checking session on focus:", err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSessionOnFocus();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("focus", checkSessionOnFocus);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    initListener();

    return () => {
      mountedRef.current = false;
      clearTimeout(safetyTimer);
      activeSubscription?.unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", checkSessionOnFocus);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[AuthProvider] signOut error:", err);
    }
    setUser(null);
    setProfile(null);
    setHasActiveSubscription(false);
    hydrationStartedRef.current = false;
    hydrationDoneRef.current = false;
    clearCache();
    // Redirect via full navigation to ensure all client state is reset
    window.location.replace("/");
  };

  const calculatedIsAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin: calculatedIsAdmin,
        // Admins always have "active subscription" access
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
