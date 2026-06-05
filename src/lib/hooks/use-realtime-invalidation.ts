"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { queryKeys } from "@/lib/hooks/use-queries";

export function useRealtimeInvalidation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const supabase = createClient();

    // Subscribe to Postgres changes on key tables filtered by the user's ID
    const channel = supabase
      .channel(`db-changes:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trades",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("[Realtime] Trades modified. Invalidating caches...", payload.eventType);
          queryClient.invalidateQueries({ queryKey: queryKeys.trades(user.id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(user.id) });
          queryClient.invalidateQueries({ queryKey: ["analytics", user.id] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assessments",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("[Realtime] Assessments modified. Invalidating caches...", payload.eventType);
          queryClient.invalidateQueries({ queryKey: queryKeys.assessment(user.id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(user.id) });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_reports",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("[Realtime] Daily reports modified. Invalidating caches...", payload.eventType);
          queryClient.invalidateQueries({ queryKey: queryKeys.dailyReports(user.id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(user.id) });
          queryClient.invalidateQueries({ queryKey: ["recentDailyReports", user.id] });
          queryClient.invalidateQueries({ queryKey: ["dailyReport", user.id] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "challenges",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("[Realtime] Challenges modified. Invalidating caches...", payload.eventType);
          queryClient.invalidateQueries({ queryKey: queryKeys.challenges(user.id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(user.id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.loyalty(user.id) });
        }
      )
      .subscribe();

    return () => {
      console.log("[Realtime] Unsubscribing from database change events for user:", user.id);
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
