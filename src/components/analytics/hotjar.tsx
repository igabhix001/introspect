/**
 * Microsoft Clarity Component
 * Free heatmaps and session recordings - unlimited recordings
 * Replaces Contentsquare/Hotjar for better mobile LCP performance
 * 
 * To get your Clarity Project ID:
 * 1. Go to https://clarity.microsoft.com
 * 2. Create a new project or select existing
 * 3. Copy the project ID from the tracking code
 */

'use client';

import Script from 'next/script';
import { ANALYTICS_CONFIG } from '@/lib/analytics/config';

// Microsoft Clarity Project ID - set in environment or use default
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || 'your-clarity-id';

export function Hotjar() {
  const { enabled } = ANALYTICS_CONFIG.hotjar;

  if (!enabled) {
    console.log('[Clarity] Disabled (not production)');
    return null;
  }

  if (CLARITY_PROJECT_ID === 'your-clarity-id') {
    console.warn('[Clarity] Project ID not configured. Set NEXT_PUBLIC_CLARITY_PROJECT_ID');
    return null;
  }

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
        `,
      }}
    />
  );
}

// Export with new name for clarity (pun intended)
export { Hotjar as MicrosoftClarity };
