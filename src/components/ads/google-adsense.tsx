"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";

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
      id="google-adsense"
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
  const [isProUser, setIsProUser] = useState<boolean | null>(null); // null = loading
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

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

  // Step 1: Check if user is a Pro subscriber
  useEffect(() => {
    const checkUserSub = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsProUser(false);
          return;
        }

        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .gte("current_period_end", new Date().toISOString())
          .limit(1)
          .maybeSingle();

        setIsProUser(!!subscription);
      } catch (err) {
        console.error("AdBanner subscription check error:", err);
        setIsProUser(false); // Fail open — show ads on error
      }
    };

    checkUserSub();
  }, []);

  // Step 2: Push adsbygoogle AFTER <ins> is in the DOM and we know user is free
  useEffect(() => {
    // Wait until we know the user's subscription status
    if (isProUser !== false) return;
    // Don't push if no publisher ID or already pushed
    if (!publisherId || pushed.current) return;
    // Don't push if the <ins> element is not in DOM yet
    if (!insRef.current) return;

    const timer = setTimeout(() => {
      try {
        if (typeof window !== "undefined" && insRef.current) {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushed.current = true;
        }
      } catch (e) {
        console.warn("AdSense push:", e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isProUser, publisherId]);

  // Still loading subscription status — render nothing to avoid race
  if (isProUser === null) {
    return null;
  }

  // Paid Pro users get 100% AD-FREE experience
  if (isProUser === true) {
    return null;
  }

  // No publisher ID configured — show placeholder in dev
  if (!publisherId) {
    return (
      <div className={`my-6 flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed border-border bg-muted/30 text-center min-h-[100px] ${className}`}>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">
          AdSense — Set NEXT_PUBLIC_GOOGLE_ADSENSE_ID
        </span>
      </div>
    );
  }

  return (
    <div
      className={`my-6 flex flex-col items-center justify-center p-2 rounded-2xl border border-border/40 bg-card/30 text-center overflow-hidden min-h-[100px] ${className}`}
    >
      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/50 mb-1">
        Advertisement
      </span>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", minHeight: "90px" }}
        data-ad-client={publisherId}
        data-ad-slot={validSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
