"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * /join?ref=XXXXXXXX
 * 
 * This page handles referral links. When a user clicks a referral link:
 * 1. Extract the referral code from the URL
 * 2. Store it in localStorage for persistence across sessions
 * 3. Redirect to the pricing page
 * 
 * The referral code will be picked up during signup/payment to credit the referrer.
 */

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get("ref");
    
    if (refCode) {
      // Store referral code in localStorage with timestamp
      const referralData = {
        code: refCode,
        timestamp: Date.now(),
        source: document.referrer || "direct",
      };
      
      try {
        localStorage.setItem("introspect_referral", JSON.stringify(referralData));
        console.log("Referral code stored:", refCode);
      } catch (e) {
        console.warn("Failed to store referral code:", e);
      }
    }

    // Redirect to pricing page after a brief moment
    // The slight delay ensures localStorage is written
    setTimeout(() => {
      router.replace("/pricing");
    }, 100);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-success mx-auto" />
        <h1 className="text-xl font-heading font-semibold">
          Welcome to INTROSPECT™
        </h1>
        <p className="text-sm text-muted-foreground">
          Redirecting you to our plans...
        </p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-success mx-auto" />
            <h1 className="text-xl font-heading font-semibold">
              Welcome to INTROSPECT™
            </h1>
            <p className="text-sm text-muted-foreground">
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}
