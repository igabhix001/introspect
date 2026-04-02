/**
 * Analytics Module
 * Centralized exports for all analytics functions
 */

export { ANALYTICS_CONFIG, GA4_EVENTS } from './config';
export {
  trackEvent,
  trackSubscribeClick,
  trackPaymentInitiated,
  trackPurchase,
  trackCTAClick,
  trackChallengeStart,
  trackAssessmentComplete,
} from './gtag';
