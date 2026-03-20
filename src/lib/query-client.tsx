"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute — data is fresh for 1 min
            gcTime: 5 * 60 * 1000, // 5 minutes — garbage collect after 5 min
            refetchOnWindowFocus: true, // Refetch stale (not fresh) queries on focus
            refetchOnReconnect: true, // Refetch stale queries on reconnect
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
