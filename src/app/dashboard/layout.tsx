"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { QueryProvider } from "@/lib/query-client";
import { useRealtimeInvalidation } from "@/lib/hooks/use-realtime-invalidation";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AdBanner } from "@/components/ads/google-adsense";


function RealtimeInvalidator() {
  useRealtimeInvalidation();
  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      // Trigger welcome email check for trial users on layout mount
      fetch("/api/user/welcome-email", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "sent") {
            console.log("[Welcome Email] Welcome email successfully sent via Resend.");
          }
        })
        .catch((err) => console.error("[Welcome Email] Error invoking welcome email trigger:", err));
    }
  }, [user]);

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <QueryProvider>
      <RealtimeInvalidator />
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
              {children}
              {/* Ad shown to free users at the bottom of every dashboard page — Pro users see nothing */}
              <AdBanner slot="1992174832" format="auto" className="mt-6" />
            </div>
          </main>
        </div>
      </div>
    </QueryProvider>
  );
}
