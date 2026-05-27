"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, ReactNode, useRef } from "react";

// Create a singleton QueryClient to persist across navigations
// This prevents infinite loading when switching between pages
let globalQueryClient: QueryClient | null = null;

function getQueryClient() {
  if (!globalQueryClient) {
    globalQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // Shorter stale time for faster perceived updates
          staleTime: 30 * 1000, // 30 seconds
          // Keep cache longer to prevent refetching on navigation
          gcTime: 10 * 60 * 1000, // 10 minutes
          // Disable refetch on window focus to prevent page flashes and reduce query loads
          refetchOnWindowFocus: false,
          refetchOnReconnect: "always",
          // Reduce retries to fail faster
          retry: 1,
          retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 3000),
          // Always attempt fetches
          networkMode: "always",
          // CRITICAL: Don't refetch on mount if data exists and is fresh
          refetchOnMount: false,
          // Prevent queries from getting stuck
          structuralSharing: true,
        },
      },
    });
  }
  return globalQueryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // Use singleton pattern - same client across all renders and navigations
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Export for manual cache operations
export { getQueryClient };
