# INTROSPECT™ Production Setup Guide

This guide covers the critical setup steps for production deployment.

## 🔴 CRITICAL: Razorpay Webhook Setup

**This is the #1 priority - without webhooks, payments won't sync properly!**

### Step 1: Configure Webhook in Razorpay Dashboard

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → Webhooks
2. Click "Add New Webhook"
3. Enter the following details:
   - **Webhook URL**: `https://www.intradaymindview.com/api/webhooks/razorpay`
   - **Secret**: Generate a strong secret (save this for `.env`)
   - **Active Events**: Select these events:
     - `payment.captured`
     - `order.paid`
     - `payment.failed` (optional, for logging)
4. Click "Create Webhook"

### Step 2: Add Webhook Secret to Environment

Add to your Vercel environment variables:
```
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret-from-step-1
```

### Step 3: Verify Webhook is Working

After deployment, test by:
1. Making a test payment
2. Check Vercel logs for `[WEBHOOK]` entries
3. Verify subscription is created in database

---

## 🔐 Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to APIs & Services → Credentials
4. Click "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure consent screen first if prompted
6. Application type: **Web application**
7. Add authorized redirect URIs:
   - `https://www.intradaymindview.com/auth/callback`
   - `https://bgwqaycjwfpnioffluvs.supabase.co/auth/v1/callback`

### Step 2: Configure in Supabase (leave it i will do it)

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Enter your Google Client ID and Client Secret
4. Save

### Step 3: Test Google Login

1. Go to `/auth/login`
2. Click "Continue with Google"
3. Should redirect to Google, then back to dashboard

---

## 📊 Microsoft Clarity Setup

### Step 1: Create Clarity Project

1. Go to [Microsoft Clarity](https://clarity.microsoft.com)
2. Sign in with Microsoft account
3. Click "Add new project"
4. Enter your website URL: `https://www.intradaymindview.com`
5. Copy the Project ID from the tracking code

### Step 2: Add to Environment

```
NEXT_PUBLIC_CLARITY_PROJECT_ID=your-clarity-project-id
```

### Step 3: Verify Installation

After deployment:
1. Visit your site
2. Go to Clarity dashboard
3. Should see "Recording" status within a few minutes

---

## 📱 Mobile LCP Optimization Checklist

The following optimizations have been implemented:

- [x] Analytics scripts lazy-loaded (non-blocking)
- [x] DNS prefetch for third-party domains
- [x] Preconnect to critical domains
- [x] Font display: swap (prevents FOIT)
- [x] Image optimization with WebP/AVIF
- [x] Viewport meta tag configured



## 🔒 Security Checklist

- [x] HSTS enabled (31536000 seconds, includeSubDomains, preload)
- [x] X-Content-Type-Options: nosniff
- [x] X-Frame-Options: DENY
- [x] X-XSS-Protection: 1; mode=block
- [x] Strict CSP configured
- [x] All API routes protected with authentication
- [x] Webhook signature verification

---

## 📧 Email Configuration (Resend)

Ensure these are set in Vercel:
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

Verify SPF/DKIM records are configured for your sending domain.

---

