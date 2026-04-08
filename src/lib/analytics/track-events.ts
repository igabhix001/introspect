/**
 * GA4 Event Tracking Utilities
 * Simple functions to track cta_click and sign_up events
 */

// Use existing gtag type from google analytics

/**
 * Track CTA button clicks
 * Call this when user clicks main CTA buttons
 */
export function trackCtaClick(ctaName?: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'cta_click', {
      cta_name: ctaName || 'primary',
    });
    console.log('[GA4] cta_click event fired:', ctaName || 'primary');
  }
}

/**
 * Track successful signups
 * Call this ONLY after successful user registration
 */
export function trackSignUp(method?: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'sign_up', {
      method: method || 'email',
    });
    console.log('[GA4] sign_up event fired:', method || 'email');
  }
}
