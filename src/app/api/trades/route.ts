import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { tradeSchema } from "@/lib/validation/schemas";
import { tradeRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { autoCheckInChallenge } from "@/lib/services/challenge-service";

// Mistake Detector per client spec
// Mistake Detector per client spec
function detectMistakes(
  trade: {
    direction: string;
    entry_price: number;
    exit_price?: number | null;
    stop_loss?: number | null;
    followed_plan: boolean;
    pnl: number;
    risk_pct: number;
    quantity: number;
    entry_time?: string | null;
    exit_time?: string | null;
    notes?: string | null;
    stock?: string | null;
    date?: string | null;
  },
  context: {
    capital: number;
    todayTradeCount: number;
    todayLosingTradesCount: number;
    todayNetPnl: number;
  }
): string[] {
  const mistakes: string[] = [];

  // 1. Risk per trade breached: Trade risk > 1% of capital
  if (trade.risk_pct > 1) {
    mistakes.push("risk_breached");
  }

  // 2. Daily loss breached: Realized loss > 3% of capital
  const netDailyPnl = context.todayNetPnl + trade.pnl;
  if (netDailyPnl < -0.03 * context.capital) {
    mistakes.push("daily_loss_breached");
  }

  // 3. No stop loss set: stop_set? = No
  if (trade.stop_loss === null || trade.stop_loss === undefined) {
    mistakes.push("no_stop_loss");
  }

  // 4. Revenge trading: (losses today >= 2) AND (daily loss > 3% of capital)
  const isCurrentLoss = trade.exit_price !== null && trade.pnl < 0;
  const totalLosingTrades = context.todayLosingTradesCount + (isCurrentLoss ? 1 : 0);
  if (totalLosingTrades >= 2 && netDailyPnl < -0.03 * context.capital) {
    mistakes.push("revenge_trading");
  }

  // 5. Overtrading: Trades > planned_trades_per_day (5)
  const totalTradesCount = context.todayTradeCount + 1;
  if (totalTradesCount > 5) {
    mistakes.push("overtrading");
  }

  // 6. Missing critical fields: entry_time / exit_time / stop_set? / setup empty
  const hasExit = trade.exit_price !== null && trade.exit_price !== undefined;
  const isEntryTimeMissing = !trade.entry_time || trade.entry_time.trim() === "";
  const isExitTimeMissing = hasExit && (!trade.exit_time || trade.exit_time.trim() === "");
  const isStopLossMissing = trade.stop_loss === null || trade.stop_loss === undefined;
  const isNotesMissing = !trade.notes || trade.notes.trim() === "";
  if (isEntryTimeMissing || isExitTimeMissing || isStopLossMissing || isNotesMissing) {
    mistakes.push("missing_fields");
  }

  // 7. Buy price > sell price (long): entry > exit for long direction
  if (trade.direction === "long" && trade.exit_price !== null && trade.exit_price !== undefined) {
    if (trade.entry_price > trade.exit_price) {
      mistakes.push("data_integrity_buy_sell");
    }
  }

  // 8. Missing/wrong symbol or date: symbol empty OR date invalid
  const isSymbolEmpty = !trade.stock || trade.stock.trim() === "";
  const isDateInvalid = !trade.date || isNaN(Date.parse(trade.date));
  if (isSymbolEmpty || isDateInvalid) {
    mistakes.push("data_integrity_symbol_date");
  }

  // Backward compatibility legacy rules
  if (trade.risk_pct > 1) {
    if (!mistakes.includes("over_risk")) mistakes.push("over_risk");
  }
  if (!trade.followed_plan) {
    if (!mistakes.includes("plan_not_followed")) mistakes.push("plan_not_followed");
  }
  if (trade.pnl < 0 && trade.risk_pct > 1.5) {
    if (!mistakes.includes("over_leveraged")) mistakes.push("over_leveraged");
  }

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

    const today = new Date().toISOString().split("T")[0];
    
    // Check daily trades and loss limit in a single consolidated query
    const { data: todayTrades } = await supabase
      .from("trades")
      .select("pnl, exit_price")
      .eq("user_id", user.id)
      .eq("date", today);

    const todayTradeCount = todayTrades?.length || 0;
    const todayLosingTradesCount = (todayTrades || []).filter(t => t.exit_price !== null && (t.pnl || 0) < 0).length;
    const todayNetPnl = (todayTrades || []).reduce((sum, t) => sum + (t.pnl || 0), 0);
    const dailyLossPct = Math.abs(Math.min(todayNetPnl, 0)) / capital * 100;

    const tradeData = {
      ...validatedData,
      user_id: user.id,
      date: today, // Ensure date is always set
      pnl: Math.round(pnl * 100) / 100,
      risk_pct: Math.round(riskPct * 100) / 100,
      sl_followed: slFollowed,
      mistakes: detectMistakes({
        ...validatedData,
        pnl,
        risk_pct: riskPct,
        date: today
      }, {
        capital,
        todayTradeCount,
        todayLosingTradesCount,
        todayNetPnl
      }),
    };

    // RULE VIOLATION BLOCKING
    const violations: string[] = [];
    if (dailyLossPct >= 2) {
      violations.push("Daily loss limit (2%) exceeded - trading blocked for today");
    }
    if (todayTradeCount >= 5) {
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
    if (mistakes.includes("over_risk") || mistakes.includes("risk_breached")) {
      mistakeFeedback.push({
        mistake: "risk_breached",
        feedback: "⚠️ Risk per trade breached: You risked more than 1% of capital. Reduce position size to protect your account.",
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
    if (mistakes.includes("daily_loss_breached")) {
      mistakeFeedback.push({
        mistake: "daily_loss_breached",
        feedback: "⚠️ Daily loss limit breached: Your net daily loss has exceeded 3% of capital.",
        severity: "critical"
      });
    }
    if (mistakes.includes("revenge_trading")) {
      mistakeFeedback.push({
        mistake: "revenge_trading",
        feedback: "⚠️ Revenge trading detected: Multiple losses today and daily loss exceeded 3%. Take a break.",
        severity: "critical"
      });
    }
    if (mistakes.includes("overtrading")) {
      mistakeFeedback.push({
        mistake: "overtrading",
        feedback: "⚠️ Overtrading detected: You exceeded your planned trades limit of 5 trades per day.",
        severity: "high"
      });
    }
    if (mistakes.includes("missing_fields")) {
      mistakeFeedback.push({
        mistake: "missing_fields",
        feedback: "⚠️ Missing critical fields: Entry time, exit time, stop loss, or setup notes are missing.",
        severity: "medium"
      });
    }
    if (mistakes.includes("data_integrity_buy_sell")) {
      mistakeFeedback.push({
        mistake: "data_integrity_buy_sell",
        feedback: "⚠️ Data integrity warning: Long entry price is greater than exit price.",
        severity: "medium"
      });
    }
    if (mistakes.includes("data_integrity_symbol_date")) {
      mistakeFeedback.push({
        mistake: "data_integrity_symbol_date",
        feedback: "⚠️ Data integrity warning: Symbol or date is missing or invalid.",
        severity: "medium"
      });
    }

    const warnings: string[] = [];
    if (todayTradeCount > 3) warnings.push("overtrading");
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
      dailyPnl: todayNetPnl,
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
