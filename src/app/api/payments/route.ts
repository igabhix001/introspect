import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import Razorpay from "razorpay";
import { awardPoints, POINTS_CONFIG } from "@/lib/services/loyalty-service";
import { apiRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

// POST /api/payments — Handle Razorpay order creation and verification
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limiting
    const identifier = getRateLimitIdentifier(request, user.id);
    const rateLimitResult = await apiRateLimit(identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

    // Parse body ONCE - request.json() can only be called once
    const body = await request.json();
    const { action } = body;

    if (action === "create-order" || action === "create_order") {
      const plan = body.plan || "monthly";
      const referralCode = body.referral_code || null;

      const pricingMap: Record<string, number> = {
        "monthly": 33300,
        "6-month": 183600,
        "yearly": 365400
      };

      // Try to fetch dynamic pricing from system settings
      try {
        const adminDb = createAdminClient();
        const { data: settings } = await adminDb.from("system_settings").select("*").in("key", ["pricing_monthly", "pricing_6month", "pricing_yearly"]);
        if (settings) {
          settings.forEach((s) => {
            if (s.key === "pricing_monthly" && s.value?.amount_paise) pricingMap["monthly"] = s.value.amount_paise;
            if (s.key === "pricing_6month" && s.value?.amount_paise) pricingMap["6-month"] = s.value.amount_paise;
            if (s.key === "pricing_yearly" && s.value?.amount_paise) pricingMap["yearly"] = s.value.amount_paise;
          });
        }
      } catch {
        // Use default pricing if settings fetch fails
      }

      const amount = pricingMap[plan as keyof typeof pricingMap] || pricingMap["monthly"];
      
      const razorpay = new Razorpay({
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      });

      // Receipt max length is 40 chars for Razorpay
      // Use short user ID prefix (8 chars) + timestamp (13 chars) = ~25 chars
      const shortUserId = user.id.replace(/-/g, "").slice(0, 8);
      const receipt = `rcpt_${shortUserId}_${Date.now()}`.slice(0, 40);

      const order = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt,
        notes: {
          user_id: user.id,
          plan,
          email: user.email || "",
          referral_code: referralCode || "",
        },
      });

      return NextResponse.json({ order, referral_code: referralCode });
    }

    if (action === "verify") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, referral_code } = body;

      // Verify signature
      const sigBody = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(sigBody)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }

      // Calculate period
      const now = new Date();
      const periodEnd = new Date(now);
      if (plan === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else if (plan === "6-month") {
        periodEnd.setMonth(periodEnd.getMonth() + 6);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Save subscription with correct amounts
      const amountPaidMap: Record<string, number> = {
        "yearly": 3654,
        "6-month": 1836,
        "monthly": 333,
      };

      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan,
          status: "active",
          razorpay_order_id,
          razorpay_payment_id,
          amount_paid: amountPaidMap[plan] || 333,
          currency: "INR",
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Award loyalty points using centralized service (sends email automatically)
      let rewardAction: "monthly_purchase" | "semiannual_purchase" | "annual_purchase" = "monthly_purchase";
      if (plan === "yearly") {
        rewardAction = "annual_purchase";
      } else if (plan === "6-month") {
        rewardAction = "semiannual_purchase";
      }

      const pointsResult = await awardPoints({
        userId: user.id,
        points: POINTS_CONFIG[rewardAction],
        reason: rewardAction,
        description: `${plan} subscription purchase`,
        activityNote: `Thank you for your ${plan} subscription! Your loyalty points have been credited.`,
      });

      // Send notification to admin
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single();
        
        const userName = profile?.full_name || profile?.email || user.email || "Unknown User";
        const userEmail = profile?.email || user.email || "N/A";
        const amountDisplay = plan === "yearly" ? "₹3,654" : plan === "6-month" ? "₹1,836" : "₹333";
        
        const adminDb = createAdminClient();
        await adminDb.from("notifications").insert({
          title: `New ${plan} Subscription!`,
          message: `${userName} (${userEmail}) subscribed to ${plan} plan for ${amountDisplay}. Payment ID: ${razorpay_payment_id}`,
          type: "payment",
        });

        console.log(`[PAYMENT] New subscription: ${userName} - ${plan} - ${amountDisplay}`);
      } catch (emailErr) {
        console.error("Failed to send payment notification:", emailErr);
      }

      // Process referral reward if referral code exists
      let referralRewardGiven = false;
      if (referral_code) {
        try {
          const adminDb = createAdminClient();
          
          // Find the referrer by their referral code (first 8 chars of user ID)
          const { data: profiles } = await adminDb
            .from("profiles")
            .select("id, full_name, email")
            .limit(100);
          
          // Find profile where ID starts with the referral code
          const referrer = profiles?.find(p => p.id.replace(/-/g, "").slice(0, 8) === referral_code);
          
          if (referrer && referrer.id !== user.id) {
            // Award 25 points to the referrer using centralized service (sends email)
            const refResult = await awardPoints({
              userId: referrer.id,
              points: POINTS_CONFIG.referral_reward,
              reason: "referral_reward",
              description: `Referral reward: ${user.email || "A user"} subscribed using your link`,
              activityNote: "Congratulations on successfully referring a friend! Keep sharing to earn more rewards.",
            });

            // Send notification to referrer
            await adminDb.from("notifications").insert({
              title: "Referral Reward! 🎉",
              message: `You earned 25 points! Someone subscribed using your referral link.`,
              type: "reward",
              user_id: referrer.id,
            });

            referralRewardGiven = refResult.success;
            console.log(`[REFERRAL] Awarded 25 points to ${referrer.email} for referring ${user.email}`);
          }
        } catch (refErr) {
          console.error("Failed to process referral reward:", refErr);
        }
      }

      return NextResponse.json({ subscription, pointsAwarded: pointsResult.pointsAwarded, referralRewardGiven });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}

// GET: Fetch current subscription status
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const { data: points } = await supabase
      .from("loyalty_points")
      .select("points")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString());

    const totalPoints = (points || []).reduce((sum, p) => sum + p.points, 0);

    return NextResponse.json({ subscription, totalPoints });
  } catch {
    return NextResponse.json({ subscription: null, totalPoints: 0 });
  }
}
