import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { awardPoints, POINTS_CONFIG } from "@/lib/services/loyalty-service";

// Birthday bonus automation - runs daily via cron
// Vercel cron config: { "path": "/api/cron/birthday-bonus", "schedule": "0 6 * * *" }

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      message: "Birthday bonus points cron is disabled. Reward points only for referrals.",
      processed: 0,
    });
  } catch (error) {
    console.error("Birthday bonus cron error:", error);
    return NextResponse.json({ error: "Failed to process birthday bonuses" }, { status: 500 });
  }
}
