"use client";

import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { useState, useEffect, ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000, // 2 minutes - data considered fresh
            gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
            refetchOnWindowFocus: "always", // Refetch stale queries when window regains focus
            refetchOnReconnect: "always", // Refetch when network reconnects
            retry: 1,
            // Don't refetch in background if data is fresh
            refetchInterval: false,
            // Keep previous data while refetching to prevent loading flicker
            placeholderData: (previousData: unknown) => previousData,
          },
        },
      })
  );

  // Production-grade: Custom focus detection that handles visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Tell React Query about focus state based on document visibility
      focusManager.setFocused(document.visibilityState === "visible");
    };

    // Also handle when tab becomes visible after being hidden
    const handleFocus = () => {
      focusManager.setFocused(true);
    };

    const handleBlur = () => {
      focusManager.setFocused(false);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
