"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
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
    <Script
      id="google-adsense-script"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
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
  const [mounted, setMounted] = useState(false);
  const [isUnfilled, setIsUnfilled] = useState(false);
  const [isFilled, setIsFilled] = useState(false);
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

  // Step 1: Prevent SSR/Client hydration mismatch (Fixes React Error #418)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Step 2: Push adsbygoogle and observe ad status for auto-collapse
  useEffect(() => {
    if (!mounted) return;
    if (hasActiveSubscription === true) return;
    if (!publisherId) return;

    // Reset status on navigation
    setIsUnfilled(false);
    setIsFilled(false);

    // Watch for AdSense status changes (filled vs unfilled)
    const currentIns = insRef.current;
    let observer: MutationObserver | null = null;

    if (currentIns) {
      observer = new MutationObserver(() => {
        const status = currentIns.getAttribute("data-ad-status");
        if (status === "unfilled") {
          setIsUnfilled(true);
          setIsFilled(false);
        } else if (status === "filled" || currentIns.hasChildNodes()) {
          setIsFilled(true);
          setIsUnfilled(false);
        }
      });

      observer.observe(currentIns, {
        attributes: true,
        attributeFilter: ["data-ad-status", "style"],
        childList: true,
      });
    }

    // Push ad request with debounce
    const timer = setTimeout(() => {
      try {
        if (typeof window !== "undefined" && insRef.current) {
          const status = insRef.current.getAttribute("data-adsbygoogle-status");
          if (!status) {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          }
        }
      } catch (e) {
        console.warn("[AdSense] Route push notice:", e);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [pathname, slot, publisherId, hasActiveSubscription, mounted]);

  // Don't render on server pass or until mounted (Guarantees 0 hydration errors)
  if (!mounted) {
    return null;
  }

  // Paid Pro users get 100% AD-FREE experience
  if (hasActiveSubscription === true) {
    return null;
  }

  // If Google AdSense returned "unfilled" for this auction, collapse completely (No ugly blank box)
  if (isUnfilled) {
    return null;
  }

  // No publisher ID configured — show dev placeholder
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
      key={`ad-box-${pathname}-${slot}`}
      className={`my-6 w-full max-w-full text-center transition-all duration-300 ${
        isFilled
          ? `p-2 sm:p-3 rounded-2xl border border-border/40 bg-card/30 ${className}`
          : "min-h-[1px] opacity-90"
      }`}
    >
      {/* Label only visible when ad is filled or loading */}
      <div
        className={`text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50 mb-1.5 text-center ${
          isFilled ? "block" : "hidden"
        }`}
      >
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

