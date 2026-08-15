"use client";

import React, { useEffect, useState } from "react";
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
  slot,
  format = "auto",
  responsive = true,
  className = "",
}: AdBannerProps) {
  const [isProUser, setIsProUser] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [adPushed, setAdPushed] = useState(false);

  useEffect(() => {
    const checkUserSub = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsProUser(false);
          setIsLoaded(true);
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
      } finally {
        setIsLoaded(true);
      }
    };

    checkUserSub();
  }, []);

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

  useEffect(() => {
    if (isLoaded && !isProUser && publisherId && !adPushed) {
      const timer = setTimeout(() => {
        try {
          if (typeof window !== "undefined") {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setAdPushed(true);
          }
        } catch (e) {
          console.warn("AdSense push notice:", e);
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [isLoaded, isProUser, publisherId, adPushed]);

  // Paid Pro users get 100% AD-FREE experience
  if (isProUser) {
    return null;
  }

  return (
    <div
      className={`my-6 flex flex-col items-center justify-center p-3 rounded-2xl border border-border/40 bg-card/30 text-center overflow-hidden min-h-[100px] ${className}`}
    >
      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60 mb-1.5">
        Advertisement
      </span>

      {publisherId ? (
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%", minHeight: "90px" }}
          data-ad-client={publisherId}
          {...(validSlot ? { "data-ad-slot": validSlot } : {})}
          data-ad-format={format}
          data-full-width-responsive={responsive ? "true" : "false"}
        />
      ) : (
        <div className="flex items-center justify-center py-4 px-6 rounded-xl bg-muted/40 border border-dashed border-border text-xs text-muted-foreground">
          <span>Google AdSense Slot ({format}) — Active on Public Site</span>
        </div>
      )}
    </div>
  );
}
