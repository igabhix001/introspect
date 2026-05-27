/**
 * Google Analytics 4 Component
 * Implements GA4 tracking with Next.js Script component for optimal performance
 */

'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ANALYTICS_CONFIG } from '@/lib/analytics/config';

export function GoogleAnalytics() {
  const { measurementId, enabled } = ANALYTICS_CONFIG.ga4;
  const pathname = usePathname();

  // Track page views on route changes
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('config', measurementId, {
      page_path: pathname,
    });
    console.log('[GA4] Page view tracked:', pathname);
  }, [pathname, measurementId, enabled]);

  if (!enabled) {
    console.log('[GA4] Analytics disabled (not production)');
    return null;
  }

  return (
    <>
      {/* Google Analytics Script - loaded with lazyOnload strategy */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="lazyOnload"
        onLoad={() => console.log('[GA4] Script loaded successfully')}
        onError={() => console.error('[GA4] Script failed to load')}
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
            send_page_view: true,
            debug_mode: true
          });
          console.log('[GA4] Initialized with ID: ${measurementId}');
        `}
      </Script>
    </>
  );
}
