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
import { useEffect, useState } from 'react';
import { ANALYTICS_CONFIG } from '@/lib/analytics/config';

// Microsoft Clarity Project ID - set in environment or use hardcoded production ID
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || 'w6qsn3he05';

export function Hotjar() {
  const { enabled } = ANALYTICS_CONFIG.hotjar;
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

  if (!enabled) {
    console.log('[Clarity] Disabled (not production)');
    return null;
  }

  if (!shouldLoad) {
    return null;
  }

  return (
    <Script
      id="microsoft-clarity"
      strategy="lazyOnload"
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
