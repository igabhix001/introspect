"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { AuthProvider } from "@/lib/auth/auth-context";
import { QueryProvider } from "@/lib/query-client";
import { Loader2 } from "lucide-react";

// Lazy load sidebar and header for faster initial render
const DashboardSidebar = dynamic(
  () => import("@/components/dashboard/sidebar").then(m => m.DashboardSidebar),
  { ssr: false }
);
const DashboardHeader = dynamic(
  () => import("@/components/dashboard/header").then(m => m.DashboardHeader),
  { ssr: false }
);

function DashboardLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-success" />
        <span className="text-sm text-muted-foreground">Loading dashboard...</span>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <QueryProvider>
      <AuthProvider>
        <Suspense fallback={<DashboardLoading />}>
          <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            <DashboardSidebar
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <DashboardHeader
                onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
                mobileMenuOpen={mobileMenuOpen}
              />

              <main className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
                  <Suspense fallback={<DashboardLoading />}>
                    {children}
                  </Suspense>
                </div>
              </main>
            </div>
          </div>
        </Suspense>
      </AuthProvider>
    </QueryProvider>
  );
}
