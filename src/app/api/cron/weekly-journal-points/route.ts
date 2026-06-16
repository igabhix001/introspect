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

    return NextResponse.json({
      message: "Weekly journal points cron is disabled. Journaling does not earn points.",
      processed: 0,
      totalPointsAwarded: 0,
    });
  } catch (error) {
    console.error("[WEEKLY-JOURNAL] Cron error:", error);
    return NextResponse.json({ error: "Failed to process weekly journal points" }, { status: 500 });
  }
}
