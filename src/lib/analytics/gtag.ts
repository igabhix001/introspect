/**
 * Google Analytics 4 Helper Functions
 * Type-safe wrapper for gtag events
 */

import { ANALYTICS_CONFIG, GA4_EVENTS } from './config';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

/**
 * Track custom GA4 event
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, any>
): void {
  // Always log for debugging
  console.log('[GA4 Event]', eventName, eventParams, {
    enabled: ANALYTICS_CONFIG.ga4.enabled,
    gtagExists: typeof window !== 'undefined' && !!window.gtag,
  });

  if (!ANALYTICS_CONFIG.ga4.enabled) {
    return;
  }

  if (typeof window !== 'undefined' && window.gtag) {
    // Send event with debug_mode for DebugView visibility
    window.gtag('event', eventName, {
      ...eventParams,
      debug_mode: true,
      send_to: ANALYTICS_CONFIG.ga4.measurementId,
    });
    console.log('[GA4 Event Sent]', eventName);
  } else {
    console.warn('[GA4] gtag not available - script may not have loaded');
  }
}

/**
 * Track subscribe button click
 * This is the most important event for conversion tracking
 */
export function trackSubscribeClick(
  buttonLocation: string,
  plan?: string
): void {
  trackEvent(GA4_EVENTS.SUBSCRIBE_BUTTON_CLICK, {
    button_location: buttonLocation,
    plan_type: plan || 'unknown',
    event_category: 'conversion',
    event_label: `Subscribe - ${buttonLocation}`,
  });
}

/**
 * Track payment initiation
 */
export function trackPaymentInitiated(
  plan: string,
  amount: number,
  currency: string = 'INR'
): void {
  trackEvent(GA4_EVENTS.PAYMENT_INITIATED, {
    currency,
    value: amount,
    items: [
      {
        item_id: `subscription_${plan}`,
        item_name: `INTROSPECT ${plan} Subscription`,
        item_category: 'subscription',
        price: amount,
        quantity: 1,
      },
    ],
  });
}

/**
 * Track successful purchase/subscription
 */
export function trackPurchase(
  transactionId: string,
  plan: string,
  amount: number,
  currency: string = 'INR'
): void {
  trackEvent(GA4_EVENTS.PAYMENT_SUCCESS, {
    transaction_id: transactionId,
    currency,
    value: amount,
    items: [
      {
        item_id: `subscription_${plan}`,
        item_name: `INTROSPECT ${plan} Subscription`,
        item_category: 'subscription',
        price: amount,
        quantity: 1,
      },
    ],
  });
  
  // Also track as sign_up for conversion
  trackEvent(GA4_EVENTS.SIGNUP_COMPLETE, {
    method: 'razorpay',
    plan_type: plan,
  });
}

/**
 * Track CTA button clicks
 */
export function trackCTAClick(
  ctaText: string,
  ctaLocation: string
): void {
  trackEvent(GA4_EVENTS.CTA_CLICK, {
    cta_text: ctaText,
    cta_location: ctaLocation,
  });
}

/**
 * Track challenge start
 */
export function trackChallengeStart(challengeType: string): void {
  trackEvent(GA4_EVENTS.CHALLENGE_START, {
    challenge_type: challengeType,
  });
}

/**
 * Track assessment completion
 */
export function trackAssessmentComplete(
  disciplineScore: number,
  riskLevel: string
): void {
  trackEvent(GA4_EVENTS.ASSESSMENT_COMPLETE, {
    discipline_score: disciplineScore,
    risk_level: riskLevel,
  });
}
