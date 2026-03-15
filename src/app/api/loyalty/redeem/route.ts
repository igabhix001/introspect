import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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

    // Deduct points and extend subscription
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        current_points_balance: (profile.current_points_balance || 0) - pointsRequired,
        subscription_end_date: currentEnd.toISOString(),
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    // Record the redemption in loyalty_points table
    const { error: ledgerError } = await supabase
      .from("loyalty_points")
      .insert({
        user_id: user.id,
        points: -pointsRequired,
        action: "redemption",
        description: `Redeemed ${months} free month(s)`,
      });

    if (ledgerError) console.error("Ledger error:", ledgerError);

    return NextResponse.json({
      success: true,
      months_added: months,
      points_deducted: pointsRequired,
      new_balance: (profile.current_points_balance || 0) - pointsRequired,
      new_subscription_end: currentEnd.toISOString(),
    });
  } catch (error) {
    console.error("Redemption error:", error);
    return NextResponse.json({ error: "Failed to redeem points" }, { status: 500 });
  }
}
