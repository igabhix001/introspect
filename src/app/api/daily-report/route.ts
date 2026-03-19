import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Production-grade discipline score calculation
 * Based on actual trade data and rule adherence
 */
interface Trade {
  id: string;
  followed_plan: boolean | null;
  sl_followed: boolean | null;
  stop_loss: number | null;
  risk_pct: number | null;
  pnl: number | null;
  mistakes: string[] | null;
  emotion: string | null;
  quantity: number | null;
}

function calculateDisciplineScore(trades: Trade[], capital: number): {
  score: number;
  rulesFollowed: number;
  totalRules: number;
  violations: string[];
  details: Record<string, boolean>;
} {
  // Core discipline rules (5 rules)
  const rules = {
    stopLossUsed: true,        // Rule 1: Stop-loss on every trade
    riskManaged: true,         // Rule 2: Risk ≤ 2% per trade
    planFollowed: true,        // Rule 3: Trading plan followed
    noOvertrading: true,       // Rule 4: Max 5 trades per day
    emotionalControl: true,    // Rule 5: No revenge/emotional trading
  };

  const violations: string[] = [];

  if (trades.length === 0) {
    return { score: 0, rulesFollowed: 0, totalRules: 5, violations: [], details: rules };
  }

  // Rule 1: Check if ALL trades have stop-loss
  const tradesWithoutSL = trades.filter(t => !t.stop_loss);
  if (tradesWithoutSL.length > 0) {
    rules.stopLossUsed = false;
    violations.push(`${tradesWithoutSL.length} trade(s) without stop-loss`);
  }

  // Rule 2: Check if ALL trades have risk ≤ 2%
  const overRiskTrades = trades.filter(t => (t.risk_pct || 0) > 2);
  if (overRiskTrades.length > 0) {
    rules.riskManaged = false;
    violations.push(`${overRiskTrades.length} trade(s) exceeded 2% risk limit`);
  }

  // Rule 3: Check if ALL trades followed plan
  const planNotFollowed = trades.filter(t => t.followed_plan === false);
  if (planNotFollowed.length > 0) {
    rules.planFollowed = false;
    violations.push(`${planNotFollowed.length} trade(s) did not follow trading plan`);
  }

  // Rule 4: Check overtrading (max 5 trades)
  if (trades.length > 5) {
    rules.noOvertrading = false;
    violations.push(`Overtrading: ${trades.length} trades (max 5 recommended)`);
  }

  // Rule 5: Check emotional trading (revenge trades, frustrated emotion)
  const emotionalTrades = trades.filter(t => {
    const mistakes = t.mistakes || [];
    const emotion = (t.emotion || "").toLowerCase();
    return mistakes.includes("revenge_trade") || 
           emotion === "frustrated" || 
           emotion === "angry" ||
           emotion === "fearful";
  });
  if (emotionalTrades.length > 0) {
    rules.emotionalControl = false;
    violations.push(`${emotionalTrades.length} trade(s) showed emotional trading patterns`);
  }

  // Calculate score
  const rulesFollowed = Object.values(rules).filter(Boolean).length;
  const totalRules = Object.keys(rules).length;
  const score = Math.round((rulesFollowed / totalRules) * 100);

  return { score, rulesFollowed, totalRules, violations, details: rules };
}

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

    // Get profile for capital
    const { data: profile } = await supabase
      .from("profiles")
      .select("trading_capital")
      .eq("id", user.id)
      .single();

    const capital = profile?.trading_capital || 100000;
    const tradesList = (trades || []) as Trade[];
    const tradesTaken = tradesList.length;
    const totalPnl = tradesList.reduce((sum, t) => sum + (t.pnl || 0), 0);

    // Calculate discipline using production-grade logic
    const disciplineResult = calculateDisciplineScore(tradesList, capital);
    const { score: disciplineScore, rulesFollowed, totalRules, violations } = disciplineResult;

    // Analyze mistakes from trades
    const allMistakes = tradesList.flatMap((t) => t.mistakes || []);
    const mistakesCount = allMistakes.length;
    const slFollowed = tradesList.filter((t) => t.sl_followed).length;
    const planFollowed = tradesList.filter((t) => t.followed_plan).length;

    const updatedCapital = capital + totalPnl;

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
