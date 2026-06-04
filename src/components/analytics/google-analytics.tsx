'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ANALYTICS_CONFIG } from '@/lib/analytics/config';

export function GoogleAnalytics() {
  const { measurementId, enabled } = ANALYTICS_CONFIG.ga4;
  const pathname = usePathname();
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const loadScripts = () => {
      setShouldLoad(true);
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('scroll', loadScripts);
      window.removeEventListener('click', loadScripts);
      window.removeEventListener('touchstart', loadScripts);
      window.removeEventListener('mousemove', loadScripts);
    };

    // Add event listeners for user interaction
    window.addEventListener('scroll', loadScripts, { passive: true });
    window.addEventListener('click', loadScripts, { passive: true });
    window.addEventListener('touchstart', loadScripts, { passive: true });
    window.addEventListener('mousemove', loadScripts, { passive: true });

    return () => {
      cleanup();
    };
  }, [enabled]);

  // Track page views on route changes
  useEffect(() => {
    if (!enabled || !shouldLoad || typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('config', measurementId, {
      page_path: pathname,
    });
    console.log('[GA4] Page view tracked:', pathname);
  }, [pathname, measurementId, enabled, shouldLoad]);

  if (!enabled) {
    console.log('[GA4] Analytics disabled (not production)');
    return null;
  }

  if (!shouldLoad) {
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
            send_page_view: true
          });
          console.log('[GA4] Initialized with ID: ${measurementId}');
        `}
      </Script>
    </>
  );
}
