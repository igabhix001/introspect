"use client";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

/* ─── Profile/Settings Data ─── */
export function useProfileSettings() {
  const { user, profile, refreshProfile } = useAuth();

  const updateProfile = async (updates: Record<string, unknown>) => {
    if (!user) return { error: new Error("User not authenticated") };
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

