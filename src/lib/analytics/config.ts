/**
 * Analytics Configuration
 * Centralized configuration for Google Analytics 4 and Hotjar
 */

export const ANALYTICS_CONFIG = {
  // Google Analytics 4
  ga4: {
    measurementId: 'G-GHXF5V689T',
    // Enable in production OR when explicitly set via env var for testing
    enabled: process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  },
  
  // Hotjar
  hotjar: {
    siteId: 725552,
    version: 6,
    enabled: process.env.NODE_ENV === 'production',
  },
} as const;

// Custom event names for GA4
export const GA4_EVENTS = {
  // Subscription events
  SUBSCRIBE_BUTTON_CLICK: 'subscribe_button_click',
  PAYMENT_INITIATED: 'begin_checkout',
  PAYMENT_SUCCESS: 'purchase',
  SIGNUP_COMPLETE: 'sign_up',
  
  // Engagement events
  CTA_CLICK: 'cta_click',
  CHALLENGE_START: 'challenge_start',
  ASSESSMENT_COMPLETE: 'assessment_complete',
  
  // Navigation events
  PAGE_VIEW: 'page_view',
} as const;
