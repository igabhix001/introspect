# INTROSPECT™ Analytics & Tracking Guide

> Simple guide for monitoring your website's performance and user behavior.

---

## ✅ What's Set Up

| Tool | Status | Purpose |
|------|--------|---------|
| **Google Analytics 4** | ✅ Working | Track visitors, page views, conversions |
| **Hotjar** | ✅ Working | Heatmaps, session recordings |
| **Razorpay** | ✅ Working | Payment processing |

---

## 📊 Google Analytics 4 (GA4)

### How to Access
1. Go to [analytics.google.com](https://analytics.google.com)
2. Select **INTROSPECT** property
3. Property: `www.intradaymindview.com`

### Daily Checks (5 minutes)

#### 1. Realtime Overview
**Path**: Reports → Realtime

See who's on your site RIGHT NOW:
- Active users count
- Which pages they're viewing
- Events being triggered

#### 2. Traffic Overview
**Path**: Reports → Acquisition → Traffic acquisition

See where visitors come from:
- Direct (typed URL)
- Organic Search (Google)
- Social (LinkedIn, Twitter)
- Referral (other websites)

#### 3. Page Performance
**Path**: Reports → Engagement → Pages and screens

See which pages are popular:
- `/pricing` - Pricing page views
- `/dashboard` - Dashboard usage
- `/auth/signup` - Signup attempts

### Events Being Tracked

| Event Name | When It Fires | Why It Matters |
|------------|---------------|----------------|
| `page_view` | Every page load | Basic traffic |
| `subscribe_button_click` | Click Subscribe button | Shows purchase intent |
| `begin_checkout` | Razorpay opens | User started payment |
| `purchase` | Payment successful | 💰 Revenue! |
| `sign_up` | New account created | User acquisition |
| `form_start` | Started filling form | Engagement |

### Conversion Tracking

**To mark events as conversions:**
1. Go to Admin → Events
2. Find `subscribe_button_click`, `purchase`, `sign_up`
3. Toggle "Mark as key event" ON

**View conversions:**
- Reports → Engagement → Conversions

### UTM Tracking for LinkedIn Posts

When sharing links on LinkedIn, add UTM parameters:

```
https://www.intradaymindview.com/pricing?utm_source=linkedin&utm_medium=social&utm_campaign=discipline_post
```

**View LinkedIn traffic:**
1. Reports → Acquisition → Traffic acquisition
2. Filter by Source = "linkedin"

---

## 🔥 Hotjar

### How to Access
1. Go to [hotjar.com](https://hotjar.com)
2. Login with your account
3. Site ID: `725552`

### What Hotjar Shows

#### 1. Heatmaps
See where users click, scroll, and move their mouse.

**How to view:**
1. Hotjar Dashboard → Heatmaps
2. Select a page (e.g., `/pricing`)
3. See click patterns

**What to look for:**
- Are users clicking the Subscribe buttons?
- Are they scrolling to see all pricing options?
- Any "rage clicks" (frustrated clicking)?

#### 2. Session Recordings
Watch real user sessions like a video.

**How to view:**
1. Hotjar Dashboard → Recordings
2. Filter by page or date
3. Watch user behavior

**What to look for:**
- Where do users get stuck?
- Do they abandon at checkout?
- Any confusion on the UI?

#### 3. Feedback
Collect user feedback directly.

**How to enable:**
1. Hotjar Dashboard → Feedback
2. Create a feedback widget
3. Add to specific pages

---

## 💳 Razorpay

### How to Access
1. Go to [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Login with your account

### Daily Checks

#### 1. Payments
**Path**: Transactions → Payments

See all successful payments:
- Amount
- Customer email
- Payment method (UPI, Card, etc.)
- Status

#### 2. Failed Payments
**Path**: Transactions → Payments → Filter by "Failed"

**Common failure reasons:**
- Insufficient funds
- Bank declined
- User cancelled
- Network timeout

#### 3. Orders
**Path**: Transactions → Orders

See all orders created (even if not paid).

---

## 🔍 Troubleshooting

### GA4 Not Showing Data?
1. Check if you're browsing from filtered IP (103.84.68.227)
2. Use incognito mode to test
3. Wait 24-48 hours for standard reports (Realtime is instant)

### Hotjar Not Recording?
1. Verify Site ID is correct (725552)
2. Check if recording is enabled in Hotjar settings
3. Wait 5-10 minutes for first recordings

### Payment Not Working?
1. Check Razorpay dashboard for failed payments
2. Look at browser console for errors
3. Verify API keys are correct in Vercel env vars

---

## 📈 Weekly Review Checklist

- [ ] Check total visitors this week (GA4 → Reports → Acquisition)
- [ ] Review conversion rate (GA4 → Reports → Engagement → Conversions)
- [ ] Watch 3-5 Hotjar recordings
- [ ] Check Razorpay for failed payments
- [ ] Review top traffic sources
- [ ] Check LinkedIn post performance (UTM tracking)

---

## 🎯 Key Metrics to Track

| Metric | Where to Find | Good Target |
|--------|---------------|-------------|
| Daily Visitors | GA4 Realtime | 50+ |
| Pricing Page Views | GA4 Pages | 20% of visitors |
| Subscribe Clicks | GA4 Events | 10% of pricing views |
| Conversion Rate | GA4 Conversions | 2-5% |
| Failed Payments | Razorpay | < 10% of attempts |

---

## 📞 Support

For technical issues with analytics setup, check the detailed documentation in `ANALYTICS_SETUP.md`.
