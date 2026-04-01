"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

// GA4 Measurement ID
const GA_MEASUREMENT_ID = "G-GHXF5V689T";

// Internal IP to exclude (client's IP)
const INTERNAL_IP = "103.84.68.227";

// Declare gtag on window
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// Initialize gtag function
export const gtag = (...args: unknown[]) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
};

// Track page views
export const pageview = (url: string) => {
  gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// Track custom events
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, unknown>
) => {
  gtag("event", eventName, parameters);
};

// Specific event: Subscribe button click
export const trackSubscribeClick = (buttonLocation: string, plan?: string) => {
  trackEvent("subscribe_button_click", {
    button_location: buttonLocation,
    plan: plan || "not_specified",
    page_url: typeof window !== "undefined" ? window.location.href : "",
  });
};

// Specific event: Successful subscription/signup
export const trackSubscriptionSuccess = (plan: string, amount: number) => {
  // Track as sign_up event
  trackEvent("sign_up", {
    method: "razorpay",
    plan: plan,
    value: amount,
    currency: "INR",
  });

  // Also track as generate_lead for conversion tracking
  trackEvent("generate_lead", {
    currency: "INR",
    value: amount,
    plan: plan,
  });

  // Track as purchase event for e-commerce
  trackEvent("purchase", {
    transaction_id: `sub_${Date.now()}`,
    value: amount,
    currency: "INR",
    items: [
      {
        item_name: `INTROSPECT ${plan} Subscription`,
        item_category: "subscription",
        price: amount,
        quantity: 1,
      },
    ],
  });
};

// Page view tracker component
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      pageview(url);
    }
  }, [pathname, searchParams]);

  return null;
}

// Main Google Analytics component
export function GoogleAnalytics() {
  return (
    <>
      {/* Google Analytics Script - loaded async for performance */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            // Configure GA4 with enhanced measurement
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              send_page_view: true,
              // Internal traffic filter - mark traffic from client's IP
              // Note: Actual filtering is done in GA4 Admin settings
              // This sets a custom dimension to identify internal traffic
              'custom_map': {
                'dimension1': 'traffic_type'
              }
            });
            
            // Check if current visitor is internal (client's IP)
            // This is a client-side hint; actual filtering happens in GA4 settings
            fetch('https://api.ipify.org?format=json')
              .then(r => r.json())
              .then(data => {
                if (data.ip === '${INTERNAL_IP}') {
                  gtag('set', 'traffic_type', 'internal');
                  console.log('[GA4] Internal traffic detected - will be filtered in GA4 settings');
                }
              })
              .catch(() => {});
          `,
        }}
      />
      {/* Track page views on route changes */}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}

export default GoogleAnalytics;
