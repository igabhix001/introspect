import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { awardPoints, POINTS_CONFIG } from "@/lib/services/loyalty-service";

/**
 * Weekly Journal Points Cron Job
 * 
 * NEW LOGIC (per client spec): 1 point per journal entry
 * - Each trade entry = 1 point
 * - No minimum threshold required
 * - Points awarded weekly based on actual entry count
 * 
 * Schedule: Every Monday at 00:00 UTC
 * Vercel cron: { "path": "/api/cron/weekly-journal-points", "schedule": "0 0 * * 1" }
 */

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = createAdminClient();
    
    // Calculate last week's date range (Monday to Sunday)
    const now = new Date();
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - 7);
    lastMonday.setHours(0, 0, 0, 0);
    
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() - 1);
    lastSunday.setHours(23, 59, 59, 999);

    // Get all trades (journal entries) from last week grouped by user
    const { data: trades, error: tradesError } = await adminDb
      .from("trades")
      .select("user_id, created_at")
      .gte("created_at", lastMonday.toISOString())
      .lte("created_at", lastSunday.toISOString());

    if (tradesError) {
      console.error("[WEEKLY-JOURNAL] Error fetching trades:", tradesError);
      throw tradesError;
    }

    // Group trades by user and count
    const userTradeCounts: Record<string, number> = {};
    (trades || []).forEach(trade => {
      userTradeCounts[trade.user_id] = (userTradeCounts[trade.user_id] || 0) + 1;
    });

    // All users with at least 1 entry are eligible (1 point per entry)
    const eligibleUsers = Object.entries(userTradeCounts)
      .filter(([_, count]) => count >= 1)
      .map(([userId, count]) => ({ userId, count }));

    if (eligibleUsers.length === 0) {
      return NextResponse.json({
        message: "No users eligible for weekly journal points",
        processed: 0,
        week: `${lastMonday.toISOString().split("T")[0]} to ${lastSunday.toISOString().split("T")[0]}`,
      });
    }

    // Check which users haven't already received points for this week
    const weekKey = `${lastMonday.toISOString().split("T")[0]}`;
    
    const { data: existingAwards } = await adminDb
      .from("loyalty_points")
      .select("user_id")
      .eq("action", "weekly_journal")
      .gte("created_at", lastMonday.toISOString())
      .lte("created_at", now.toISOString());

    const alreadyAwarded = new Set((existingAwards || []).map(a => a.user_id));

    // Award points to eligible users who haven't received them yet
    // NEW: 1 point per entry (not flat 5 points)
    const results: { user_id: string; entries: number; points: number; success: boolean }[] = [];

    for (const { userId, count } of eligibleUsers) {
      if (alreadyAwarded.has(userId)) {
        continue; // Skip users who already got points this week
      }

      // 1 point per journal entry
      const pointsToAward = count * POINTS_CONFIG.journal_entry;

      const result = await awardPoints({
        userId,
        points: pointsToAward,
        reason: "weekly_journal",
        description: `Weekly journal reward: ${count} entries logged (${weekKey})`,
        activityNote: `Great job maintaining your trading journal this week! You logged ${count} trades and earned ${pointsToAward} points (1 point per entry).`,
      });

      results.push({
        user_id: userId,
        entries: count,
        points: pointsToAward,
        success: result.success,
      });
    }

    const totalPointsAwarded = results.reduce((sum, r) => sum + (r.success ? r.points : 0), 0);
    console.log(`[WEEKLY-JOURNAL] Processed ${results.length} users for week ${weekKey}, total points: ${totalPointsAwarded}`);

    return NextResponse.json({
      message: "Weekly journal points processed",
      processed: results.length,
      totalPointsAwarded,
      week: `${lastMonday.toISOString().split("T")[0]} to ${lastSunday.toISOString().split("T")[0]}`,
      results,
    });
  } catch (error) {
    console.error("[WEEKLY-JOURNAL] Cron error:", error);
    return NextResponse.json({ error: "Failed to process weekly journal points" }, { status: 500 });
  }
}
