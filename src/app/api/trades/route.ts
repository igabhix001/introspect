import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { tradeSchema } from "@/lib/validation/schemas";
import { tradeRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { autoCheckInChallenge } from "@/lib/services/challenge-service";

// Mistake Detector per client spec
function detectMistakes(trade: {
  direction: string;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  followed_plan: boolean;
  pnl: number;
  risk_pct: number;
}): string[] {
  const mistakes: string[] = [];

  if (!trade.stop_loss) mistakes.push("no_stop_loss");
  if (trade.risk_pct > 1) mistakes.push("over_risk");
  if (!trade.followed_plan) mistakes.push("plan_not_followed");
  if (trade.pnl < 0 && trade.risk_pct > 1.5) mistakes.push("over_leveraged");

  return mistakes;
}

// POST: Add trade with mistake detection
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limiting
    const identifier = getRateLimitIdentifier(request, user.id);
    const rateLimitResult = await tradeRateLimit(identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = tradeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid trade data", details: validation.error.issues },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // Calculate P&L
    const pnl = validatedData.exit_price
      ? validatedData.direction === "long"
        ? (validatedData.exit_price - validatedData.entry_price) * validatedData.quantity
        : (validatedData.entry_price - validatedData.exit_price) * validatedData.quantity
      : 0;

    // Calculate risk %
    const { data: profile } = await supabase
      .from("profiles")
      .select("trading_capital")
      .eq("id", user.id)
      .single();

    const capital = profile?.trading_capital || 100000;
    const riskAmount = validatedData.stop_loss
      ? Math.abs(validatedData.entry_price - validatedData.stop_loss) * validatedData.quantity
      : 0;
    const riskPct = (riskAmount / capital) * 100;

    const slFollowed = validatedData.stop_loss
      ? validatedData.direction === "long"
        ? !validatedData.exit_price || validatedData.exit_price >= validatedData.stop_loss
        : !validatedData.exit_price || validatedData.exit_price <= validatedData.stop_loss
      : false;

    const tradeData = {
      ...validatedData,
      user_id: user.id,
      date: new Date().toISOString().split("T")[0], // Ensure date is always set
      pnl: Math.round(pnl * 100) / 100,
      risk_pct: Math.round(riskPct * 100) / 100,
      sl_followed: slFollowed,
      mistakes: detectMistakes({
        ...body,
        pnl,
        risk_pct: riskPct,
      }),
    };

    // Check for rule violations BEFORE saving (blocking mode)
    const today = new Date().toISOString().split("T")[0];
    
    // Check daily trade count
    const { count: tradeCount } = await supabase
      .from("trades")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("date", today);

    // Check daily loss limit
    const { data: todayTrades } = await supabase
      .from("trades")
      .select("pnl")
      .eq("user_id", user.id)
      .eq("date", today);

    const dailyPnl = (todayTrades || []).reduce((sum, t) => sum + (t.pnl || 0), 0);
    const dailyLossPct = Math.abs(Math.min(dailyPnl, 0)) / capital * 100;

    // RULE VIOLATION BLOCKING
    const violations: string[] = [];
    if (dailyLossPct >= 2) {
      violations.push("Daily loss limit (2%) exceeded - trading blocked for today");
    }
    if ((tradeCount || 0) >= 5) {
      violations.push("Maximum daily trades (5) reached - no more trades allowed today");
    }
    if (riskPct > 2) {
      violations.push("Risk per trade exceeds 2% - reduce position size");
    }

    // Block trade if critical violations
    if (violations.length > 0 && dailyLossPct >= 2) {
      return NextResponse.json({ 
        error: "Trade blocked due to rule violations",
        violations,
        blocked: true,
      }, { status: 403 });
    }

    const { data: trade, error } = await supabase
      .from("trades")
      .insert(tradeData)
      .select()
      .single();

    if (error) throw error;

    // Generate instant mistake feedback
    const mistakeFeedback: { mistake: string; feedback: string; severity: string }[] = [];
    const mistakes = tradeData.mistakes || [];
    
    if (mistakes.includes("no_stop_loss")) {
      mistakeFeedback.push({
        mistake: "no_stop_loss",
        feedback: "⚠️ Trading without a stop-loss is extremely risky. Always define your exit before entering.",
        severity: "critical"
      });
    }
    if (mistakes.includes("over_risk")) {
      mistakeFeedback.push({
        mistake: "over_risk",
        feedback: "⚠️ You risked more than 1% of capital. Reduce position size to protect your account.",
        severity: "high"
      });
    }
    if (mistakes.includes("plan_not_followed")) {
      mistakeFeedback.push({
        mistake: "plan_not_followed",
        feedback: "📋 You deviated from your trading plan. Discipline is key to long-term success.",
        severity: "medium"
      });
    }
    if (mistakes.includes("over_leveraged")) {
      mistakeFeedback.push({
        mistake: "over_leveraged",
        feedback: "💰 Over-leveraged position led to a loss. Consider reducing leverage.",
        severity: "high"
      });
    }

    const warnings: string[] = [];
    if ((tradeCount || 0) > 3) warnings.push("overtrading");
    if (dailyLossPct >= 1) warnings.push("daily_loss_limit_warning");

    // AUTOMATIC CHALLENGE CHECK-IN
    // One journal entry (trade) = one day of challenge progress
    // Progress is cumulative - no streak reset on missed days
    let challengeCheckin = null;
    try {
      challengeCheckin = await autoCheckInChallenge(supabase, user.id);
      
      // If this was a successful check-in, add to response
      if (challengeCheckin.checked_in) {
        console.log(`Challenge auto check-in: Day ${challengeCheckin.current_day}/${challengeCheckin.total_days}`);
      }
    } catch (checkinError) {
      // Don't fail the trade if challenge check-in fails
      console.error("Challenge auto check-in error (non-blocking):", checkinError);
    }

    return NextResponse.json({ 
      trade, 
      warnings, 
      dailyPnl,
      mistakes: tradeData.mistakes,
      mistakeFeedback,
      violations: violations.length > 0 ? violations : undefined,
      // Include challenge progress in response
      challengeProgress: challengeCheckin?.checked_in ? {
        current_day: challengeCheckin.current_day,
        total_days: challengeCheckin.total_days,
        progress_pct: challengeCheckin.progress_pct,
        is_completed: challengeCheckin.is_completed,
        points_earned: challengeCheckin.points_earned,
        message: challengeCheckin.message,
      } : challengeCheckin?.already_checked_in ? {
        already_checked_in: true,
        current_day: challengeCheckin.current_day,
        message: challengeCheckin.message,
      } : null,
    });
  } catch (error) {
    console.error("Trade error:", error);
    return NextResponse.json({ error: "Failed to save trade" }, { status: 500 });
  }
}

// GET: Fetch user trades (paginated)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const { data: trades, count, error } = await supabase
      .from("trades")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ trades, total: count, page, limit });
  } catch {
    return NextResponse.json({ trades: [], total: 0 });
  }
}

// DELETE: Remove a trade
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await request.json();

    const { error } = await supabase
      .from("trades")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete trade" }, { status: 500 });
  }
}
