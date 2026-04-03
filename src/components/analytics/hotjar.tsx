/**
 * Contentsquare Component (formerly Hotjar)
 * Implements Contentsquare tracking for heatmaps and session recordings
 * Hotjar was acquired by Contentsquare - using their new tracking script
 */

'use client';

import Script from 'next/script';
import { ANALYTICS_CONFIG } from '@/lib/analytics/config';

export function Hotjar() {
  const { enabled } = ANALYTICS_CONFIG.hotjar;

  if (!enabled) {
    console.log('[Contentsquare] Disabled (not production)');
    return null;
  }

  return (
    <Script
      id="contentsquare"
      src="https://t.contentsquare.net/uxa/21662c8a5f8b7.js"
      strategy="afterInteractive"
      onLoad={() => console.log('[Contentsquare] Script loaded successfully')}
      onError={() => console.error('[Contentsquare] Script failed to load')}
    />
  );
}
