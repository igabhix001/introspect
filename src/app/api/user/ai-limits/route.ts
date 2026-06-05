import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = createAdminClient();
    
    // Fetch profile role (to check if admin)
    const { data: profile } = await adminDb
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = profile?.role === "admin";

    // 1. Fetch Subscription period
    const { data: subscription } = await adminDb
      .from("subscriptions")
      .select("current_period_start, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gte("current_period_end", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    // Calculate billing cycle start
    const billingCycleStart = subscription?.current_period_start
      ? new Date(subscription.current_period_start).toISOString().split("T")[0]
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Query user_ai_usage rows since billing cycle start
    const { data: usageRows, error: usageError } = await adminDb
      .from("user_ai_usage")
      .select("total_cost, daily_insights_count, weekly_reviews_count, monthly_reviews_count, deep_patterns_count, date, call_count")
      .eq("user_id", user.id)
      .gte("date", billingCycleStart);

    const today = new Date().toISOString().split("T")[0];

    // Sum total cost
    const accumulatedCost = usageRows?.reduce((sum, r) => sum + Number(r.total_cost || 0), 0) || 0;

    // Get today's insights
    const todayRow = usageRows?.find(r => r.date === today);
    const todayInsightsCount = todayRow ? (todayRow.daily_insights_count !== undefined ? todayRow.daily_insights_count : todayRow.call_count) : 0;
    
    // Get rolling weekly reviews
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const weeklyReviewsCount = usageRows
      ?.filter(r => r.date >= sevenDaysAgo)
      ?.reduce((sum, r) => sum + Number(r.weekly_reviews_count || 0), 0) || 0;

    // Get monthly reviews
    const monthlyReviewsCount = usageRows?.reduce((sum, r) => sum + Number(r.monthly_reviews_count || 0), 0) || 0;

    // Get deep patterns
    const deepPatternsCount = usageRows?.reduce((sum, r) => sum + Number(r.deep_patterns_count || 0), 0) || 0;

    return NextResponse.json({
      isAdmin,
      billingCycleStart,
      total_monthly_cost: Number(accumulatedCost.toFixed(4)),
      hard_limit: 25.0,
      soft_limit: 20.0,
      daily_insights_remaining: isAdmin ? 5 : Math.max(0, 5 - todayInsightsCount),
      weekly_review_available: isAdmin ? true : weeklyReviewsCount < 1,
      monthly_review_available: isAdmin ? true : monthlyReviewsCount < 1,
      deep_patterns_remaining: isAdmin ? 5 : Math.max(0, 5 - deepPatternsCount),
    });
  } catch (error: any) {
    console.error("GET AI Limits error:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
