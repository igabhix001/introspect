import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { awardPoints } from "@/lib/services/loyalty-service";

// Client spec: 150 points = 1 free month, 400 points = 3 months
const REDEMPTION_OPTIONS: Record<number, number> = {
  1: 150,  // 1 month = 150 points
  3: 400,  // 3 months = 400 points
};

// POST: Redeem loyalty points for free subscription month
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { months = 1 } = await request.json();
    const pointsRequired = REDEMPTION_OPTIONS[months as number];
    if (!pointsRequired) {
      return NextResponse.json({ error: "Invalid redemption option. Choose 1 or 3 months." }, { status: 400 });
    }

    // Get current points balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_points_balance, subscription_end_date")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if ((profile.current_points_balance || 0) < pointsRequired) {
      return NextResponse.json({ 
        error: "Insufficient points",
        required: pointsRequired,
        available: profile.current_points_balance || 0,
      }, { status: 400 });
    }

    // Calculate new subscription end date
    const currentEnd = profile.subscription_end_date 
      ? new Date(profile.subscription_end_date)
      : new Date();
    
    if (currentEnd < new Date()) {
      currentEnd.setTime(Date.now());
    }
    
    currentEnd.setMonth(currentEnd.getMonth() + months);

    // Extend subscription first
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        subscription_end_date: currentEnd.toISOString(),
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    // Deduct points using centralized service (sends email notification)
    const result = await awardPoints({
      userId: user.id,
      points: -pointsRequired,
      reason: "redemption",
      description: `Redeemed ${pointsRequired} points for ${months} free month(s)`,
      activityNote: `Points successfully applied to your membership! You've redeemed ${months} free month(s). Your subscription has been extended until ${currentEnd.toLocaleDateString("en-IN")}.`,
    });

    return NextResponse.json({
      success: true,
      months_added: months,
      points_deducted: pointsRequired,
      new_balance: result.newBalance,
      new_subscription_end: currentEnd.toISOString(),
      email_sent: result.emailSent,
    });
  } catch (error) {
    console.error("Redemption error:", error);
    return NextResponse.json({ error: "Failed to redeem points" }, { status: 500 });
  }
}
