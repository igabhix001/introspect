import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { awardPoints } from "@/lib/services/loyalty-service";

// This endpoint should be called by a cron job (e.g., Vercel Cron, AWS EventBridge)
// Schedule: Daily at 00:00 UTC
// Vercel cron config in vercel.json: { "crons": [{ "path": "/api/cron/points-expiry", "schedule": "0 0 * * *" }] }

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (for security)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    // Find all expired points entries
    const { data: expiredEntries, error: fetchError } = await supabase
      .from("loyalty_points")
      .select("id, user_id, points, expires_at")
      .lt("expires_at", today)
      .eq("expired", false)
      .gt("points", 0);

    if (fetchError) throw fetchError;

    if (!expiredEntries || expiredEntries.length === 0) {
      return NextResponse.json({ message: "No points to expire", processed: 0 });
    }

    // Group by user
    const userPoints: Record<string, number> = {};
    const entryIds: string[] = [];

    for (const entry of expiredEntries) {
      userPoints[entry.user_id] = (userPoints[entry.user_id] || 0) + entry.points;
      entryIds.push(entry.id);
    }

    // Mark entries as expired
    const { error: markError } = await supabase
      .from("loyalty_points")
      .update({ expired: true })
      .in("id", entryIds);

    if (markError) throw markError;

    // Deduct expired points from user profiles using centralized service (sends email)
    const results: { user_id: string; points_expired: number; success: boolean }[] = [];

    for (const [userId, points] of Object.entries(userPoints)) {
      // Use centralized service to deduct points and send email notification
      const result = await awardPoints({
        userId,
        points: -points,
        reason: "points_expired",
        description: `${points} points expired due to 24-month inactivity policy`,
        activityNote: "Some of your points have expired as per our 24-month expiry policy. Remember to use your points before they expire! Earn more points through referrals, challenges, and subscriptions.",
      });

      results.push({
        user_id: userId,
        points_expired: points,
        success: result.success,
      });
    }

    return NextResponse.json({
      message: "Points expiry processed",
      processed: results.length,
      total_points_expired: Object.values(userPoints).reduce((a, b) => a + b, 0),
      results,
    });
  } catch (error) {
    console.error("Points expiry cron error:", error);
    return NextResponse.json({ error: "Failed to process points expiry" }, { status: 500 });
  }
}
