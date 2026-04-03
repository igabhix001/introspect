/**
 * Hotjar/Contentsquare Component
 * Implements Hotjar tracking for heatmaps and session recordings
 * Note: Hotjar was acquired by Contentsquare, they share the same dashboard
 */

'use client';

import Script from 'next/script';
import { ANALYTICS_CONFIG } from '@/lib/analytics/config';

export function Hotjar() {
  const { siteId, version, enabled } = ANALYTICS_CONFIG.hotjar;

  if (!enabled) {
    console.log('[Hotjar] Disabled (not production)');
    return null;
  }

  console.log('[Hotjar] Loading with Site ID:', siteId);

  return (
    <>
      {/* Hotjar Tracking Code - using Contentsquare CDN (Hotjar's parent company) */}
      <Script
        id="hotjar"
        strategy="afterInteractive"
        onLoad={() => console.log('[Hotjar] Script loaded successfully')}
        onError={() => console.error('[Hotjar] Script failed to load')}
        dangerouslySetInnerHTML={{
          __html: `
            (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:${siteId},hjsv:${version}};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
            console.log('[Hotjar] Initialized with Site ID: ${siteId}');
          `,
        }}
      />
    </>
  );
}
