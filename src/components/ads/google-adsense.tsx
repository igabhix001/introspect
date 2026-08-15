"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

interface GoogleAdSenseScriptProps {
  pId?: string;
}

export function GoogleAdSenseScript({ pId }: GoogleAdSenseScriptProps) {
  const rawId = pId || process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;

  if (!rawId) {
    return null;
  }

  const clientId = rawId.startsWith("ca-pub-")
    ? rawId
    : rawId.startsWith("pub-")
    ? `ca-${rawId}`
    : `ca-pub-${rawId}`;

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
    />
  );
}

interface AdBannerProps {
  slot?: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  responsive?: boolean;
  className?: string;
}

export function AdBanner({
  slot = "1992174832",
  format = "auto",
  responsive = true,
  className = "",
}: AdBannerProps) {
  const pathname = usePathname();
  const { hasActiveSubscription, loading: authLoading } = useAuth();
  const insRef = useRef<HTMLModElement>(null);

  const rawPubId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;
  const publisherId = rawPubId
    ? rawPubId.startsWith("ca-pub-")
      ? rawPubId
      : rawPubId.startsWith("pub-")
      ? `ca-${rawPubId}`
      : `ca-pub-${rawPubId}`
    : null;

  // Only use slot if it's a valid numeric ID
  const validSlot = slot && /^\d+$/.test(slot.trim()) ? slot.trim() : undefined;

  // Trigger AdSense push on initial load and whenever the route (pathname) changes in SPA
  useEffect(() => {
    // Pro subscribers get an ad-free experience
    if (hasActiveSubscription === true) return;
    if (!publisherId) return;

    // Small delay to ensure the fresh <ins> element is mounted in the DOM
    const timer = setTimeout(() => {
      try {
        if (typeof window !== "undefined" && insRef.current) {
          // Check if this specific <ins> has not already been filled
          const status = insRef.current.getAttribute("data-adsbygoogle-status");
          if (!status) {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          }
        }
      } catch (e) {
        console.warn("[AdSense] Client-side route transition push notice:", e);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [pathname, slot, publisherId, hasActiveSubscription]);

  // Don't render until we know whether the user is a paid subscriber
  if (authLoading && hasActiveSubscription === null) {
    return null;
  }

  // Paid Pro users get 100% AD-FREE experience
  if (hasActiveSubscription === true) {
    return null;
  }

  // No publisher ID configured — show placeholder in dev
  if (!publisherId) {
    return (
      <div
        className={`my-6 flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed border-border bg-muted/30 text-center min-h-[100px] ${className}`}
      >
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">
          AdSense — Set NEXT_PUBLIC_GOOGLE_ADSENSE_ID
        </span>
      </div>
    );
  }

  return (
    <div
      key={`ad-container-${pathname}-${slot}`}
      className={`my-6 w-full max-w-full p-2 sm:p-3 rounded-2xl border border-border/40 bg-card/30 text-center overflow-hidden ${className}`}
    >
      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50 mb-1.5 text-center">
        Advertisement
      </div>
      <div className="w-full flex justify-center overflow-hidden">
        <ins
          key={`ins-${pathname}-${slot}`}
          ref={insRef}
          className="adsbygoogle"
          style={{ display: "block", width: "100%", minWidth: "250px", minHeight: "50px" }}
          data-ad-client={publisherId}
          data-ad-slot={validSlot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? "true" : "false"}
        />
      </div>
    </div>
  );
}
