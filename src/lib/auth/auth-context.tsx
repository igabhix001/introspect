"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Step 1: Use getSession (cached, instant) for fast initial render
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        if (!session?.user) {
          setUser(null);
          setProfile(null);
          setHasActiveSubscription(false);
          setLoading(false);
          return;
        }
        
        // Step 2: We have a session — set user immediately
        setUser(session.user);
        
        // Step 3: Fetch profile and subscription in parallel
        const [profileResult, subResult] = await Promise.allSettled([
          fetchProfile(session.user.id, session.user.email || undefined),
          supabase
            .from("subscriptions")
            .select("id")
            .eq("user_id", session.user.id)
            .eq("status", "active")
            .gte("current_period_end", new Date().toISOString())
            .limit(1)
            .single(),
        ]);
        
        if (isMounted) {
          const subData = subResult.status === "fulfilled" ? subResult.value.data : null;
          setHasActiveSubscription(!!subData);
        }
      } catch (err) {
        console.warn("Auth init error:", err);
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setHasActiveSubscription(false);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
          setHasActiveSubscription(false);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id, session.user.email || undefined);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
