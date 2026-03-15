import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST: Generate end-of-day report
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { date } = await request.json();
    const reportDate = date || new Date().toISOString().split("T")[0];

    // Fetch today's trades
    const { data: trades } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", reportDate);

    // Fetch personalized rules
    const { data: rulesData } = await supabase
      .from("personalized_rules")
      .select("rules")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const totalRules = rulesData?.rules?.length || 6;
    const tradesList = trades || [];
    const tradesTaken = tradesList.length;
    const totalPnl = tradesList.reduce((sum, t) => sum + (t.pnl || 0), 0);

    // Analyze mistakes
    const allMistakes = tradesList.flatMap((t) => t.mistakes || []);
    const mistakesCount = allMistakes.length;
    const slFollowed = tradesList.filter((t) => t.sl_followed).length;
    const planFollowed = tradesList.filter((t) => t.followed_plan).length;

    // Calculate rules followed (simplified)
    let rulesFollowed = totalRules;
    if (allMistakes.includes("no_stop_loss")) rulesFollowed--;
    if (allMistakes.includes("over_risk")) rulesFollowed--;
    if (allMistakes.includes("plan_not_followed")) rulesFollowed--;
    if (tradesTaken > 4) rulesFollowed--; // overtrading
    rulesFollowed = Math.max(0, rulesFollowed);

    const disciplineScore = totalRules > 0
      ? Math.round((rulesFollowed / totalRules) * 100)
      : 0;

    // Get profile for capital
    const { data: profile } = await supabase
      .from("profiles")
      .select("trading_capital")
      .eq("id", user.id)
      .single();

    const updatedCapital = (profile?.trading_capital || 100000) + totalPnl;

    // Generate feedback
    const positive: string[] = [];
    const negative: string[] = [];
    const suggestions: string[] = [];

    if (slFollowed === tradesTaken && tradesTaken > 0) positive.push("Stop-loss followed on every trade");
    if (planFollowed === tradesTaken && tradesTaken > 0) positive.push("Trading plan followed consistently");
    if (tradesTaken <= 3) positive.push("Good discipline — stayed within trade limits");
    if (totalPnl > 0) positive.push(`Profitable day: +₹${totalPnl.toLocaleString("en-IN")}`);

    if (allMistakes.includes("no_stop_loss")) negative.push("Traded without stop-loss — high risk");
    if (allMistakes.includes("over_risk")) negative.push("Risk exceeded allowed limit on some trades");
    if (allMistakes.includes("plan_not_followed")) negative.push("Trading plan was not followed");
    if (tradesTaken > 4) negative.push("Overtrading detected — too many trades today");

    if (allMistakes.includes("no_stop_loss")) suggestions.push("Tomorrow: Set stop-loss before entering every trade");
    if (totalPnl < 0) suggestions.push("Review losing trades and identify patterns");
    if (tradesTaken === 0) suggestions.push("No trades today. Review market conditions for tomorrow");
    if (suggestions.length === 0) suggestions.push("Keep up the discipline! Maintain your current approach");

    let encouragement = "";
    if (disciplineScore >= 80) encouragement = "Outstanding discipline today! Keep this momentum going.";
    else if (disciplineScore >= 60) encouragement = "Good effort today. Small improvements lead to big results.";
    else if (disciplineScore >= 40) encouragement = "Room for improvement. Focus on your weakest rule tomorrow.";
    else encouragement = "Tough day. Reset, review, and come back stronger tomorrow.";

    const report = {
      user_id: user.id,
      date: reportDate,
      trades_taken: tradesTaken,
      rules_followed: rulesFollowed,
      total_rules: totalRules,
      mistakes_count: mistakesCount,
      discipline_score: disciplineScore,
      total_pnl: totalPnl,
      updated_capital: Math.round(updatedCapital),
      feedback: { positive, negative, suggestions, encouragement },
    };

    const { data, error } = await supabase
      .from("daily_reports")
      .upsert(report, { onConflict: "user_id,date" })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ report: data });
  } catch (error) {
    console.error("Daily report error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}

// GET: Fetch reports
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: reports, error } = await supabase
      .from("daily_reports")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", since.toISOString().split("T")[0])
      .order("date", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ reports: [] });
  }
}
