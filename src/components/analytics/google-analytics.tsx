/**
 * Google Analytics 4 Component
 * Implements GA4 tracking with Next.js Script component for optimal performance
 */

'use client';

import Script from 'next/script';
import { ANALYTICS_CONFIG } from '@/lib/analytics/config';

export function GoogleAnalytics() {
  const { measurementId, enabled } = ANALYTICS_CONFIG.ga4;

  if (!enabled) {
    return null;
  }

  return (
    <>
      {/* Google Analytics Script - loaded with afterInteractive strategy */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}
