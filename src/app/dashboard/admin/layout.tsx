"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for auth to fully load before checking admin status
    if (!loading) {
      if (!user) {
        // No user at all - redirect to login
        router.replace("/auth/login");
      } else if (!isAdmin) {
        // User exists but not admin - redirect to regular dashboard
        router.replace("/dashboard");
      } else {
        // User is admin - allow access
        setIsChecking(false);
      }
    }
  }, [loading, user, isAdmin, router]);

  // Show loading while auth is loading OR while we're checking admin status
  if (loading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Only render children if user is confirmed admin
  if (!isAdmin || !user) {
    return null;
  }

  return <>{children}</>;
}
