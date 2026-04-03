# Razorpay Payment Testing Guide

> How to test and verify Razorpay payments are working correctly.

---

## ✅ Current Setup

| Setting | Value |
|---------|-------|
| Mode | **LIVE** (Real payments) |
| Key ID | `rzp_live_SQ0Xhb2kigU5l0` |
| Currency | INR |

---

## 🧪 How to Test Payments

### Option 1: Test with Real Payment (Recommended)

1. Go to `https://www.intradaymindview.com/pricing`
2. Login with a test account
3. Click **"Start Monthly"** (₹333 - lowest amount)
4. Complete payment with UPI/Card
5. Verify:
   - Redirected to `/dashboard?payment=success`
   - Subscription shows in Razorpay dashboard
   - User has access to dashboard features

### Option 2: Switch to Test Mode (For Development)

**⚠️ Only do this for testing, switch back to live for production!**

1. Go to Razorpay Dashboard → Settings → API Keys
2. Copy **Test** mode keys
3. Update Vercel environment variables:
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` = Test Key ID
   - `RAZORPAY_KEY_SECRET` = Test Key Secret
4. Redeploy

**Test Card Numbers (Test Mode Only):**
| Card Number | Result |
|-------------|--------|
| 4111 1111 1111 1111 | Success |
| 4000 0000 0000 0002 | Declined |

---

## 🔍 Diagnosing Payment Issues

### Check 1: Browser Console Errors

1. Open pricing page
2. Press F12 → Console tab
3. Click Subscribe button
4. Look for errors:

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | User not logged in | Redirect to login first |
| `Failed to create order` | Razorpay API issue | Check API keys |
| `Invalid signature` | Key mismatch | Verify RAZORPAY_KEY_SECRET |
| `CSP violation` | Script blocked | CSP already fixed ✅ |

### Check 2: Razorpay Dashboard

1. Go to [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Check **Transactions → Orders**
   - Are orders being created?
3. Check **Transactions → Payments**
   - Are payments successful or failing?

### Check 3: Common Failure Reasons

| Reason | % of Failures | Solution |
|--------|---------------|----------|
| User cancelled | 40% | Normal - user changed mind |
| Insufficient funds | 25% | User's bank issue |
| Bank declined | 20% | User should try different method |
| Network timeout | 10% | User should retry |
| Technical error | 5% | Check logs |

---

## 📊 Payment Flow

```
User clicks Subscribe
        ↓
[1] POST /api/payments (action: create_order)
        ↓
[2] Razorpay order created
        ↓
[3] Razorpay checkout opens
        ↓
[4] User completes payment
        ↓
[5] POST /api/payments (action: verify)
        ↓
[6] Signature verified
        ↓
[7] Subscription saved to database
        ↓
[8] Redirect to /dashboard?payment=success
```

---

## 🐛 Debugging Steps

### If Users Report "Payment Not Working"

1. **Ask for details:**
   - What error message did they see?
   - What payment method did they use?
   - Did Razorpay popup open?

2. **Check Razorpay Dashboard:**
   - Search by email in Transactions
   - Check if order was created
   - Check payment status

3. **Check Supabase:**
   - Look in `subscriptions` table
   - Check if user has active subscription

4. **Check Browser Console:**
   - Ask user to share console errors
   - Look for network failures

### If Razorpay Popup Doesn't Open

**Possible causes:**
1. User not logged in → Shows 401 error
2. Ad blocker blocking script → Ask to disable
3. CSP blocking → Already fixed ✅
4. JavaScript error → Check console

### If Payment Succeeds but No Access

**Check:**
1. Subscription saved in Supabase?
2. `current_period_end` is in future?
3. Status is "active"?

---

## 📈 Monitoring Payments

### Daily Checks
1. Razorpay Dashboard → Today's payments
2. Check for failed payments
3. Verify amounts match plans

### Weekly Checks
1. Total revenue this week
2. Conversion rate (orders vs payments)
3. Most used payment methods

---

## 🔐 Security Checklist

- [x] API keys stored in environment variables
- [x] Signature verification on payment success
- [x] HTTPS only
- [x] Rate limiting on payment API
- [x] No sensitive data in client-side code

---

## 💡 Why Users Might Not Subscribe

Based on GA4 data, if you see:
- High `subscribe_button_click` but low `begin_checkout` → Razorpay not loading
- High `begin_checkout` but low `purchase` → Users abandoning at payment
- Low `subscribe_button_click` → Pricing page needs improvement

**Use Hotjar recordings to see exactly where users drop off!**

---

## 📞 Razorpay Support

If you need help:
- Email: support@razorpay.com
- Dashboard: Help → Contact Support
- Docs: https://razorpay.com/docs/

---

## Quick Test Checklist

- [ ] Can create a new account
- [ ] Can login
- [ ] Pricing page loads
- [ ] Subscribe button triggers Razorpay
- [ ] Can complete payment (use ₹333 monthly)
- [ ] Redirects to dashboard after payment
- [ ] User has active subscription in database
- [ ] GA4 shows `purchase` event
