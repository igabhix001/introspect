"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
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
  const supabase = createClient();
  
  // Track initialization and refresh state to prevent race conditions
  const isInitialized = useRef(false);
  const isRefreshing = useRef(false);
  const lastRefreshTime = useRef(0);

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error) {
        console.error("Profile fetch error:", error.message, error.code);
        
        // Handle RLS infinite recursion (42P17) — create fallback profile
        if (error.code === "42P17" || error.code === "PGRST301") {
          console.warn("RLS recursion detected — using fallback profile");
          const fallbackProfile = {
            id: userId,
            email: userEmail || "",
            role: userEmail === "intradaymindview@gmail.com" ? "admin" : "user",
            full_name: null,
            trading_capital: 0,
            trading_style: "intraday",
            is_suspended: false,
            referral_code: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as unknown as Profile;
          setProfile(fallbackProfile);
          return;
        }
        
        // If profiles table doesn't have the row, create one
        if (error.code === "PGRST116") {
          const { data: newProfile } = await supabase
            .from("profiles")
            .upsert({ id: userId, role: "user", email: userEmail })
            .select("*")
            .single();
          setProfile(newProfile as Profile | null);
          return;
        }
      }
      setProfile(data as Profile | null);
    } catch (err) {
      console.error("Profile fetch unexpected error:", err);
      // Absolute fallback — never crash
      setProfile({
        id: userId,
        email: userEmail || "",
        role: userEmail === "intradaymindview@gmail.com" ? "admin" : "user",
      } as unknown as Profile);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  // Production-grade session refresh with debouncing
  const refreshSession = useCallback(async (force = false) => {
    // Debounce: Don't refresh more than once per 5 seconds unless forced
    const now = Date.now();
    if (!force && now - lastRefreshTime.current < 5000) {
      return;
    }
    
    // Prevent concurrent refreshes
    if (isRefreshing.current) {
      return;
    }
    
    isRefreshing.current = true;
    lastRefreshTime.current = now;
    
    try {
      // Use getUser() for server-validated session (more reliable than getSession)
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        // Session is invalid - user needs to re-authenticate
        console.warn("Session refresh failed:", error.message);
        setUser(null);
        setProfile(null);
        setHasActiveSubscription(false);
        setLoading(false);
        return;
      }
      
      if (currentUser) {
        setUser(currentUser);
        await fetchProfile(currentUser.id, currentUser.email || undefined);
        
        // Refresh subscription status
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", currentUser.id)
          .eq("status", "active")
          .gte("current_period_end", new Date().toISOString())
          .limit(1)
          .maybeSingle();
        
        setHasActiveSubscription(!!subData);
      } else {
        setUser(null);
        setProfile(null);
        setHasActiveSubscription(false);
      }
    } catch (err) {
      console.error("Session refresh error:", err);
    } finally {
      isRefreshing.current = false;
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;
    
    // Safety timeout - never stay loading forever (max 6 seconds)
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("Auth safety timeout triggered - forcing loading to false");
        setLoading(false);
      }
    }, 6000);

    const initAuth = async () => {
      // Prevent double initialization
      if (isInitialized.current) return;
      isInitialized.current = true;
      
      try {
        // Use getUser() for server-validated session (recommended by Supabase)
        // This is more reliable than getSession() which can return stale tokens
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (!isMounted) return;
        
        if (userError || !currentUser) {
          // No valid session
          setUser(null);
          setProfile(null);
          setHasActiveSubscription(false);
          setLoading(false);
          return;
        }
        
        // Valid session - set user immediately
        setUser(currentUser);
        
        // Fetch profile and subscription in parallel with timeout
        const subPromise = supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", currentUser.id)
          .eq("status", "active")
          .gte("current_period_end", new Date().toISOString())
          .limit(1)
          .maybeSingle();
        
        const [, subResult] = await Promise.allSettled([
          fetchProfile(currentUser.id, currentUser.email || undefined),
          Promise.race([
            subPromise,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000))
          ]),
        ]);
        
        if (isMounted) {
          const subData = subResult.status === "fulfilled" && subResult.value && typeof subResult.value === 'object' && 'data' in subResult.value 
            ? (subResult.value as { data: unknown }).data 
            : null;
          setHasActiveSubscription(!!subData);
          setLoading(false);
        }
      } catch (err) {
        console.warn("Auth init error:", err);
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setHasActiveSubscription(false);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Handle auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        // Handle all auth events properly
        switch (event) {
          case "SIGNED_OUT":
            setUser(null);
            setProfile(null);
            setHasActiveSubscription(false);
            setLoading(false);
            break;
            
          case "SIGNED_IN":
          case "TOKEN_REFRESHED":
          case "USER_UPDATED":
            if (session?.user) {
              setUser(session.user);
              await fetchProfile(session.user.id, session.user.email || undefined);
            }
            setLoading(false);
            break;
            
          case "INITIAL_SESSION":
            // Already handled by initAuth, but ensure loading is false
            if (!session?.user) {
              setLoading(false);
            }
            break;
            
          default:
            // For any other event, ensure we're not stuck loading
            setLoading(false);
        }
      }
    );

    // CRITICAL: Handle tab visibility change to refresh session when user returns
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user) {
        // User returned to tab - refresh session to ensure it's still valid
        refreshSession(false);
      }
    };
    
    // CRITICAL: Handle window focus to catch cases visibility change misses
    const handleFocus = () => {
      if (user) {
        refreshSession(false);
      }
    };
    
    // CRITICAL: Handle online event - refresh session when connection restored
    const handleOnline = () => {
      if (user) {
        refreshSession(true); // Force refresh when coming back online
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);

    return () => {
      isMounted = false;
      isInitialized.current = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshSession]);

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
