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
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
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
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) await fetchProfile(user.id, user.email || undefined);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email || undefined);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
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
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
