import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// Cron job to handle subscription expiry and status management
// Should be called daily via Vercel Cron or external scheduler
// POST /api/cron/subscription-expiry

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = createAdminClient();
    const now = new Date().toISOString();
    
    // 1. Mark expired subscriptions as 'expired'
    const { data: expiredSubs, error: expireError } = await adminDb
      .from("subscriptions")
      .update({ status: "expired" })
      .eq("status", "active")
      .lt("current_period_end", now)
      .select("id, user_id, plan, current_period_end");

    if (expireError) {
      console.error("Error expiring subscriptions:", expireError);
    }

    // 2. Find subscriptions expiring in 3 days (for reminder notifications)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysISO = threeDaysFromNow.toISOString();

    const { data: expiringSoon } = await adminDb
      .from("subscriptions")
      .select("id, user_id, plan, current_period_end, profiles(email, full_name)")
      .eq("status", "active")
      .lte("current_period_end", threeDaysISO)
      .gt("current_period_end", now);

    // 3. Create notifications for users with expiring subscriptions
    if (expiringSoon && expiringSoon.length > 0) {
      const notifications = expiringSoon.map((sub) => ({
        user_id: sub.user_id,
        title: "Subscription Expiring Soon",
        message: `Your ${sub.plan} subscription expires on ${new Date(sub.current_period_end).toLocaleDateString("en-IN")}. Renew now to continue using INTROSPECT™.`,
        type: "subscription",
        read: false,
      }));

      // Check if notification already sent today to avoid duplicates
      const today = new Date().toISOString().split("T")[0];
      for (const notif of notifications) {
        const { data: existing } = await adminDb
          .from("user_notifications")
          .select("id")
          .eq("user_id", notif.user_id)
          .eq("type", "subscription")
          .gte("created_at", `${today}T00:00:00`)
          .limit(1)
          .maybeSingle();

        if (!existing) {
          await adminDb.from("user_notifications").insert(notif);
        }
      }
    }

    // 4. Log admin notification for expired subscriptions
    if (expiredSubs && expiredSubs.length > 0) {
      await adminDb.from("notifications").insert({
        title: "Subscriptions Expired",
        message: `${expiredSubs.length} subscription(s) have expired today.`,
        type: "system",
      });
    }

    // 5. Send trial expiry warning emails — on last day of trial
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString();

    const { data: expiringTrials } = await adminDb
      .from("subscriptions")
      .select("user_id, plan, current_period_end")
      .eq("status", "active")
      .eq("plan", "trial")
      .lte("current_period_end", tomorrowISO)
      .gte("current_period_end", now);

    let trialEmailsSent = 0;
    if (expiringTrials && expiringTrials.length > 0) {
      const { sendWelcomeTrialEmail } = await import("@/lib/email/welcome-email");
      const today = new Date().toISOString().split("T")[0];

      for (const trial of expiringTrials) {
        try {
          // Dedup: only send once per day
          const { data: alreadySent } = await adminDb
            .from("ai_response_cache")
            .select("state_hash")
            .eq("state_hash", `trial_expiry_email:${trial.user_id}:${today}`)
            .maybeSingle();

          if (alreadySent) continue;

          const { data: profile } = await adminDb
            .from("profiles")
            .select("email, full_name")
            .eq("id", trial.user_id)
            .single();

          if (profile?.email) {
            await sendWelcomeTrialEmail({
              userEmail: profile.email,
              userName: profile.full_name || "Trader",
              type: "trial_expiry_warning",
            });

            // Mark as sent
            await adminDb.from("ai_response_cache").insert({
              state_hash: `trial_expiry_email:${trial.user_id}:${today}`,
              response_text: `sent_at:${new Date().toISOString()}`,
            });
            trialEmailsSent++;
          }
        } catch (emailErr) {
          console.error("Failed to send trial expiry email:", emailErr);
        }
      }
    }

    // 6. Get stats for response
    const { count: totalActive } = await adminDb
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    const { count: totalExpired } = await adminDb
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "expired");

    return NextResponse.json({
      success: true,
      processed: {
        expired: expiredSubs?.length || 0,
        expiringSoon: expiringSoon?.length || 0,
        trialEmailsSent,
      },
      stats: {
        totalActive: totalActive || 0,
        totalExpired: totalExpired || 0,
      },
      timestamp: now,
    });

  } catch (error) {
    console.error("Subscription expiry cron error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
