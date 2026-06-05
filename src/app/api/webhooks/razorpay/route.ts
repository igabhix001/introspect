import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { awardPoints, POINTS_CONFIG } from "@/lib/services/loyalty-service";

/**
 * Razorpay Webhook Handler
 * 
 * This endpoint receives webhook events from Razorpay when payments are captured.
 * It's the SOURCE OF TRUTH for subscription status - more reliable than frontend handlers.
 * 
 * Webhook URL to configure in Razorpay Dashboard:
 * https://www.intradaymindview.com/api/webhooks/razorpay
 * 
 * Events to enable:
 * - payment.captured
 * - order.paid
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    // Verify webhook signature - REQUIRED in production
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error("[WEBHOOK] RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    if (!signature) {
      console.error("[WEBHOOK] Missing signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("[WEBHOOK] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.event;

    console.log(`[WEBHOOK] Received event: ${eventType}`);

    // Handle payment.captured and order.paid events
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const payment = event.payload.payment?.entity;
      const order = event.payload.order?.entity || event.payload.payment?.entity?.order_id;

      if (!payment) {
        console.error("[WEBHOOK] No payment entity in payload");
        return NextResponse.json({ error: "No payment data" }, { status: 400 });
      }

      // Extract user_id from order notes (we pass this when creating the order)
      const notes = payment.notes || {};
      const userId = notes.user_id;
      const plan = notes.plan || "monthly";
      const userEmail = notes.email || "";
      const referralCode = notes.referral_code || null;

      if (!userId) {
        console.error("[WEBHOOK] No user_id in payment notes:", notes);
        return NextResponse.json({ error: "No user_id in notes" }, { status: 400 });
      }

      console.log(`[WEBHOOK] Processing payment for user: ${userId}, plan: ${plan}`);

      const adminDb = createAdminClient();

      // Check if subscription already exists for this payment (idempotency)
      const { data: existingSub } = await adminDb
        .from("subscriptions")
        .select("id")
        .eq("razorpay_payment_id", payment.id)
        .maybeSingle();

      if (existingSub) {
        console.log(`[WEBHOOK] Subscription already exists for payment ${payment.id}`);
        return NextResponse.json({ status: "already_processed" });
      }

      // Calculate subscription period
      const now = new Date();
      const periodEnd = new Date(now);
      if (plan === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else if (plan === "6-month") {
        periodEnd.setMonth(periodEnd.getMonth() + 6);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Amount mapping
      const amountPaidMap: Record<string, number> = {
        "yearly": 3499,
        "6-month": 1999,
        "monthly": 399,
      };

      // Create subscription record
      const { data: subscription, error: subError } = await adminDb
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan,
          status: "active",
          razorpay_order_id: typeof order === "string" ? order : payment.order_id,
          razorpay_payment_id: payment.id,
          amount_paid: amountPaidMap[plan] || payment.amount / 100,
          currency: payment.currency || "INR",
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .select()
        .single();

      if (subError) {
        console.error("[WEBHOOK] Failed to create subscription:", subError);
        return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
      }

      console.log(`[WEBHOOK] Subscription created: ${subscription.id}`);

      // Award loyalty points
      let rewardAction: "monthly_purchase" | "semiannual_purchase" | "annual_purchase" = "monthly_purchase";
      if (plan === "yearly") {
        rewardAction = "annual_purchase";
      } else if (plan === "6-month") {
        rewardAction = "semiannual_purchase";
      }

      try {
        await awardPoints({
          userId,
          points: POINTS_CONFIG[rewardAction],
          reason: rewardAction,
          description: `${plan} subscription purchase (via webhook)`,
          activityNote: `Thank you for your ${plan} subscription! Your loyalty points have been credited.`,
        });
        console.log(`[WEBHOOK] Loyalty points awarded for ${plan}`);
      } catch (pointsErr) {
        console.error("[WEBHOOK] Failed to award points:", pointsErr);
        // Don't fail the webhook for points error
      }

      // Create notification for admin
      try {
        const amountDisplay = plan === "yearly" ? "₹3,654" : plan === "6-month" ? "₹1,836" : "₹333";
        await adminDb.from("notifications").insert({
          title: `New ${plan} Subscription! 🎉`,
          message: `User ${userEmail || userId} subscribed to ${plan} plan for ${amountDisplay}. Payment ID: ${payment.id}`,
          type: "payment",
        });
      } catch (notifErr) {
        console.error("[WEBHOOK] Failed to create notification:", notifErr);
      }

      // Process referral reward if applicable
      if (referralCode) {
        try {
          const { data: profiles } = await adminDb
            .from("profiles")
            .select("id, full_name, email")
            .limit(100);

          const referrer = profiles?.find(p => p.id.replace(/-/g, "").slice(0, 8) === referralCode);

          if (referrer && referrer.id !== userId) {
            await awardPoints({
              userId: referrer.id,
              points: POINTS_CONFIG.referral_reward,
              reason: "referral_reward",
              description: `Referral reward: ${userEmail || "A user"} subscribed using your link`,
              activityNote: "Congratulations on successfully referring a friend!",
            });

            await adminDb.from("notifications").insert({
              title: "Referral Reward! 🎉",
              message: `You earned 25 points! Someone subscribed using your referral link.`,
              type: "reward",
              user_id: referrer.id,
            });

            console.log(`[WEBHOOK] Referral reward given to ${referrer.email}`);
          }
        } catch (refErr) {
          console.error("[WEBHOOK] Failed to process referral:", refErr);
        }
      }

      return NextResponse.json({ 
        status: "success", 
        subscription_id: subscription.id,
        message: "Subscription activated via webhook"
      });
    }

    // Handle payment.failed event
    if (eventType === "payment.failed") {
      const payment = event.payload.payment?.entity;
      const notes = payment?.notes || {};
      
      console.log(`[WEBHOOK] Payment failed for user: ${notes.user_id}, reason: ${payment?.error_description}`);
      
      // Optionally create a notification about failed payment
      if (notes.user_id) {
        const adminDb = createAdminClient();
        await adminDb.from("notifications").insert({
          title: "Payment Failed",
          message: `Payment attempt failed: ${payment?.error_description || "Unknown error"}`,
          type: "payment",
          user_id: notes.user_id,
        });
      }

      return NextResponse.json({ status: "logged" });
    }

    // For other events, just acknowledge
    console.log(`[WEBHOOK] Unhandled event type: ${eventType}`);
    return NextResponse.json({ status: "ignored", event: eventType });

  } catch (error) {
    console.error("[WEBHOOK] Error processing webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// Razorpay sends GET to verify webhook URL is active
export async function GET() {
  return NextResponse.json({ 
    status: "active",
    message: "Razorpay webhook endpoint is active",
    timestamp: new Date().toISOString()
  });
}
