# Analytics Implementation Documentation

## Overview
This document describes the Google Analytics 4 (GA4) and Hotjar implementation for INTROSPECT™.

## Implementation Details

### 1. Google Analytics 4 (GA4)
- **Measurement ID**: `G-GHXF5V689T`
- **Implementation**: Next.js Script component with `afterInteractive` strategy
- **Location**: `src/components/analytics/google-analytics.tsx`
- **Loaded on**: All pages via root layout

### 2. Hotjar
- **Site ID**: `725552`
- **Version**: 6
- **Implementation**: Next.js Script component with `afterInteractive` strategy
- **Location**: `src/components/analytics/hotjar.tsx`
- **Loaded on**: All pages via root layout

## Custom Events Tracked

### Conversion Events

#### 1. `subscribe_button_click` (Most Important)
**Triggered when**: User clicks any Subscribe/Pay Now button
**Parameters**:
- `button_location`: Where the button was clicked (e.g., 'pricing_page', 'navbar', 'dashboard')
- `plan_type`: Subscription plan (monthly, 6-month, yearly)
- `event_category`: 'conversion'
- `event_label`: Descriptive label

**Locations tracked**:
- Pricing page (all 3 plan buttons)
- Navbar "Subscribe" button
- Dashboard upgrade prompts

#### 2. `begin_checkout`
**Triggered when**: Razorpay payment modal opens
**Parameters**:
- `currency`: INR
- `value`: Amount in rupees
- `items`: Array with subscription details

#### 3. `purchase` (Conversion Goal)
**Triggered when**: Payment is successfully completed
**Parameters**:
- `transaction_id`: Razorpay order ID
- `currency`: INR
- `value`: Amount in rupees
- `items`: Array with subscription details

#### 4. `sign_up`
**Triggered when**: Payment is successfully completed (duplicate tracking for conversion)
**Parameters**:
- `method`: 'razorpay'
- `plan_type`: Subscription plan

### Engagement Events

#### 5. `cta_click`
**Triggered when**: User clicks any CTA button
**Parameters**:
- `cta_text`: Button text
- `cta_location`: Page location

#### 6. `challenge_start`
**Triggered when**: User starts a discipline challenge
**Parameters**:
- `challenge_type`: 30-day, 60-day, or 90-day

#### 7. `assessment_complete`
**Triggered when**: User completes risk assessment
**Parameters**:
- `discipline_score`: Score out of 100
- `risk_level`: low, medium, or high

## GA4 Configuration Steps

### Step 1: Enhanced Measurement
✅ **Already Enabled** - Enhanced Measurement is automatically active in GA4 and tracks:
- Page views
- Scrolls
- Outbound clicks
- Site search
- Video engagement
- File downloads

### Step 2: Internal Traffic Filter (IP: 103.84.68.227)

**To exclude your office/home IP from analytics:**

1. Go to GA4 Admin → Data Streams → Select your stream
2. Click "Configure tag settings"
3. Click "Show more" → "Define internal traffic"
4. Click "Create"
5. Configure:
   - **Rule name**: "Venkat Office/Home"
   - **Match type**: "IP address equals"
   - **Value**: `103.84.68.227`
6. Click "Create"
7. Go to Admin → Data Settings → Data Filters
8. Find "Internal Traffic" filter
9. Change state from "Testing" to "Active"

### Step 3: Conversion Events

**Mark these events as conversions in GA4:**

1. Go to Admin → Events
2. Find these events and mark as conversion:
   - ✅ `subscribe_button_click` (Primary conversion)
   - ✅ `purchase` (Transaction conversion)
   - ✅ `sign_up` (Signup conversion)

**To mark as conversion:**
1. Click the toggle next to the event name
2. Or click "Mark as conversion" button

### Step 4: Success Page Tracking

**Current Implementation**: 
- After successful payment, user is redirected to `/dashboard?payment=success`
- This page view is automatically tracked by GA4
- The `purchase` and `sign_up` events fire BEFORE the redirect

**To track in GA4:**
1. Go to Reports → Engagement → Pages and screens
2. Filter for `/dashboard?payment=success` to see conversion count

## Performance Optimization

### Script Loading Strategy
Both GA4 and Hotjar use Next.js `Script` component with `afterInteractive` strategy:
- Scripts load **after** the page becomes interactive
- Does not block initial page render
- Minimal impact on Core Web Vitals

### Production-Only Loading
Scripts only load in production environment:
```typescript
enabled: process.env.NODE_ENV === 'production'
```

In development, events are logged to console instead.

## Verification Steps

### 1. Real-Time Testing
1. Open GA4 → Reports → Realtime
2. Visit the site (not from IP 103.84.68.227)
3. Click a Subscribe button
4. Verify you see:
   - Page view event
   - `subscribe_button_click` event
   - User location and device info

### 2. Event Testing
1. Open browser DevTools → Console
2. Click Subscribe button
3. Check for GA4 event in Network tab:
   - Look for requests to `google-analytics.com/g/collect`
   - Verify event parameters

### 3. Hotjar Testing
1. Visit the site
2. Open browser DevTools → Console
3. Type: `window.hj`
4. Should return a function (confirms Hotjar loaded)
5. Check Hotjar dashboard for recordings after 5-10 minutes

## LinkedIn Traffic Tracking

### UTM Parameters
To track which LinkedIn posts drive traffic, use UTM parameters:

**Example LinkedIn post URL**:
```
https://www.intradaymindview.com/pricing?utm_source=linkedin&utm_medium=social&utm_campaign=discipline_challenge&utm_content=post_jan_2026
```

**Parameters**:
- `utm_source=linkedin` - Traffic source
- `utm_medium=social` - Medium type
- `utm_campaign=discipline_challenge` - Campaign name
- `utm_content=post_jan_2026` - Specific post identifier

**To view in GA4**:
1. Go to Reports → Acquisition → Traffic acquisition
2. Add secondary dimension: "Session campaign"
3. Filter by source = "linkedin"

## Troubleshooting

### Events Not Showing in GA4
1. Check browser console for errors
2. Verify scripts loaded (check Network tab)
3. Wait 24-48 hours for data to appear in standard reports (Realtime is instant)
4. Ensure you're not browsing from filtered IP (103.84.68.227)

### Hotjar Not Recording
1. Verify Site ID is correct (725552)
2. Check Hotjar dashboard → Settings → Sites
3. Ensure recording is enabled
4. Wait 5-10 minutes for first recordings

### Performance Issues
1. Check Lighthouse score before/after
2. Verify scripts use `afterInteractive` strategy
3. Monitor Core Web Vitals in GA4

## Files Modified

### New Files Created
- `src/lib/analytics/config.ts` - Analytics configuration
- `src/lib/analytics/gtag.ts` - GA4 helper functions
- `src/lib/analytics/index.ts` - Analytics exports
- `src/components/analytics/google-analytics.tsx` - GA4 component
- `src/components/analytics/hotjar.tsx` - Hotjar component
- `src/components/analytics/index.ts` - Component exports

### Modified Files
- `src/app/layout.tsx` - Added analytics components
- `src/app/pricing/pricing-content.tsx` - Added event tracking

## Support

For questions or issues:
1. Check GA4 Realtime reports
2. Review browser console for errors
3. Verify implementation in this document
4. Contact development team

---

**Implementation Date**: April 2, 2026
**Implemented By**: AI Development Team
**Client**: Venkat (INTROSPECT™)
