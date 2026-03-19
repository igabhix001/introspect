import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { awardPoints, POINTS_CONFIG } from "@/lib/services/loyalty-service";

/**
 * Referral Milestones Bonus Cron Job
 * 
 * Per client spec:
 * - 3 referrals = +20 points
 * - 5 referrals = +50 points  
 * - 10 referrals = +100 points
 * 
 * Schedule: Daily at 01:00 UTC
 * Vercel cron: { "path": "/api/cron/referral-milestones", "schedule": "0 1 * * *" }
 */

const MILESTONES = [
  { count: 3, bonus: POINTS_CONFIG.referral_milestone_3, key: "milestone_3" },
  { count: 5, bonus: POINTS_CONFIG.referral_milestone_5, key: "milestone_5" },
  { count: 10, bonus: POINTS_CONFIG.referral_milestone_10, key: "milestone_10" },
];

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = createAdminClient();

    // Get all users with their completed referral counts
    const { data: referralCounts, error: refError } = await adminDb
      .from("referrals")
      .select("referrer_id")
      .eq("status", "completed");

    if (refError) {
      console.error("[REFERRAL-MILESTONES] Error fetching referrals:", refError);
      throw refError;
    }

    // Count referrals per user
    const userReferralCounts: Record<string, number> = {};
    (referralCounts || []).forEach(ref => {
      if (ref.referrer_id) {
        userReferralCounts[ref.referrer_id] = (userReferralCounts[ref.referrer_id] || 0) + 1;
      }
    });

    // Get existing milestone awards to avoid duplicates
    const { data: existingMilestones } = await adminDb
      .from("loyalty_points")
      .select("user_id, action")
      .in("action", ["referral_milestone_3", "referral_milestone_5", "referral_milestone_10"]);

    // Track which milestones each user has already received
    const userMilestones: Record<string, Set<string>> = {};
    (existingMilestones || []).forEach(m => {
      if (!userMilestones[m.user_id]) {
        userMilestones[m.user_id] = new Set();
      }
      userMilestones[m.user_id].add(m.action);
    });

    // Process milestone awards
    const results: { user_id: string; milestone: number; bonus: number; success: boolean }[] = [];

    for (const [userId, count] of Object.entries(userReferralCounts)) {
      const userAwarded = userMilestones[userId] || new Set();

      for (const milestone of MILESTONES) {
        // Check if user reached this milestone and hasn't been awarded yet
        if (count >= milestone.count && !userAwarded.has(`referral_${milestone.key}`)) {
          const result = await awardPoints({
            userId,
            points: milestone.bonus,
            reason: `referral_${milestone.key}`,
            description: `Referral milestone: ${milestone.count} successful referrals`,
            activityNote: `Congratulations! You've reached ${milestone.count} successful referrals and earned ${milestone.bonus} bonus points! Keep sharing to unlock more rewards.`,
          });

          results.push({
            user_id: userId,
            milestone: milestone.count,
            bonus: milestone.bonus,
            success: result.success,
          });

          console.log(`[REFERRAL-MILESTONES] Awarded ${milestone.bonus} points to ${userId} for ${milestone.count} referrals`);
        }
      }
    }

    return NextResponse.json({
      message: "Referral milestones processed",
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("[REFERRAL-MILESTONES] Cron error:", error);
    return NextResponse.json({ error: "Failed to process referral milestones" }, { status: 500 });
  }
}
