import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { tradeSchema } from "@/lib/validation/schemas";
import { tradeRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { autoCheckInChallenge } from "@/lib/services/challenge-service";

export function virtualizeTrade(trade: any) {
  if (!trade) return trade;
  const originalMistakes: string[] = Array.isArray(trade.mistakes) ? trade.mistakes : [];
  
  // These keys are suppressed from the red mistake[] badges:
  // - holding_losers_too_long, early_profit_booking: removed per client request
  // - always_apply_sl: shown as neutral observation with link
  // - data_integrity_buy_sell: was a false-positive that flagged ALL losing long trades
  //   (entry > exit for a long is a LOSS, not a data error). Removed from detection,
  //   but kept here to suppress it for any old DB records that still have it.
  const observationsList = [
    "holding_losers_too_long",
    "early_profit_booking",
    "always_apply_sl",
    "data_integrity_buy_sell",
  ];
  
  const mistakes = originalMistakes.filter((m: string) => !observationsList.includes(m));
  const observations = originalMistakes.filter((m: string) => observationsList.includes(m));
  
  return {
    ...trade,
    mistakes,
    observations,
  };
}


function getHoldTimeInMinutes(entryTime: string | null, exitTime: string | null): number | null {
  if (!entryTime || !exitTime) return null;
  const entryParts = entryTime.split(":");
  const exitParts = exitTime.split(":");
  if (entryParts.length >= 2 && exitParts.length >= 2) {
    const h1 = parseInt(entryParts[0]);
    const m1 = parseInt(entryParts[1]);
    const h2 = parseInt(exitParts[0]);
    const m2 = parseInt(exitParts[1]);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return null;
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    return diff >= 0 ? diff : null;
  }
  return null;
}

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
    dailyLossLimitPct: number;
    plannedTradesPerDay: number;
    plannedRiskAmount: number;
    lastLosingTrade: { pnl: number; exit_time?: string | null; risk_pct?: number } | null;
  }
): string[] {
  const mistakes: string[] = [];

  // 1. Risk per trade breached: Trade risk > 1% of capital OR Single Trade Loss > 1% of capital
  if (trade.risk_pct > 1) {
    mistakes.push("risk_breached");
  }
  if (trade.exit_price !== null && trade.exit_price !== undefined && trade.pnl < -0.01 * context.capital) {
    mistakes.push("single_loss_breached");
  }

  // 2. Daily loss breached: Realized loss > defined% of capital
  const netDailyPnl = context.todayNetPnl + trade.pnl;
  const limitPct = (context.dailyLossLimitPct || 3) / 100;
  if (netDailyPnl < -limitPct * context.capital) {
    mistakes.push("daily_loss_breached");
  }

  // 3. Stop loss checking (observation only, not a mistake)
  if (trade.stop_loss === null || trade.stop_loss === undefined) {
    mistakes.push("always_apply_sl");
  }

  // 4. Revenge Trading - REVISED RULE (tighter, avoids false positives).
  //    Detected ONLY when ALL 3 conditions are met:
  //    a) Previous trade loss >= 1R (the user's planned risk amount)
  //    b) New trade entered within 30 minutes of previous losing trade's exit
  //    c) Risk on new trade is escalated above previous planned risk level
  if (context.lastLosingTrade && trade.entry_time) {
    const prevLoss = Math.abs(Number(context.lastLosingTrade.pnl || 0));
    const oneR = context.plannedRiskAmount > 0 ? context.plannedRiskAmount : context.capital * 0.01;
    const isPrevLossGtOneR = prevLoss >= oneR;

    if (isPrevLossGtOneR && context.lastLosingTrade.exit_time) {
      // Check time gap: new entry within 30 minutes of last losing trade's exit
      const toMins = (t: string) => {
        const p = t.split(":");
        return p.length >= 2 ? parseInt(p[0]) * 60 + parseInt(p[1]) : null;
      };
      const entryMins = toMins(trade.entry_time);
      const exitMins = toMins(context.lastLosingTrade.exit_time);

      if (entryMins !== null && exitMins !== null) {
        const gap = entryMins - exitMins;
        const isWithin30Min = gap >= 0 && gap <= 30;

        if (isWithin30Min) {
          // c) Risk escalated: new trade risk > 110% of previous trade's risk (or > 1%)
          const prevRiskPct = Number(context.lastLosingTrade.risk_pct || 0);
          const riskEscalated = trade.risk_pct > Math.max(prevRiskPct * 1.1, 1.0);
          if (riskEscalated) {
            mistakes.push("revenge_trading");
          }
        }
      }
    }
  }

  // 5. Overtrading: Total trades today > user's planned trades per day (from profile)
  const totalTradesCount = context.todayTradeCount + 1;
  if (totalTradesCount > context.plannedTradesPerDay) {
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

  // NOTE: We intentionally do NOT flag entry_price > exit_price for long trades.
  //       A long trade with entry > exit is simply a LOSS, not a data integrity error.
  //       Removing this rule prevents false-positive mistake badges on all losing longs.

  // 8. Missing/wrong symbol or date: symbol empty OR date invalid
  const isSymbolEmpty = !trade.stock || trade.stock.trim() === "";
  const isDateInvalid = !trade.date || isNaN(Date.parse(trade.date));
  if (isSymbolEmpty || isDateInvalid) {
    mistakes.push("data_integrity_symbol_date");
  }

  // 9. Early Profit Booking & Holding Losers Too Long: removed from mistake detection per client.
  //    These are natural trading situations and are NOT flagged.

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

    // Check Free tier 50-trade journal limit
    const { checkUserSubscription, FREE_JOURNAL_LIMIT } = await import("@/lib/paywall");
    const subStatus = await checkUserSubscription(supabase, user.id);
    if (!subStatus.isPro) {
      const { count: totalTradesCount } = await supabase
        .from("trades")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      if (totalTradesCount && totalTradesCount >= FREE_JOURNAL_LIMIT) {
        return NextResponse.json(
          {
            error: `Free journal limit reached (${FREE_JOURNAL_LIMIT} trades). Upgrade to Pro for unlimited journaling.`,
            limitReached: true,
            freeLimit: FREE_JOURNAL_LIMIT,
          },
          { status: 403 }
        );
      }
    }

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

    const { data: latestAssessment } = await supabase
      .from("assessments")
      .select("risk_level")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const riskLevel = latestAssessment?.risk_level || "medium";
    const dailyLossLimitPct = riskLevel === "low" ? 2 : riskLevel === "high" ? 5 : 3;

    // Fetch planned trades per day from profile (fallback to 5)
    const { data: profileSettings } = await supabase
      .from("profiles")
      .select("planned_trades_per_day")
      .eq("id", user.id)
      .single();
    const plannedTradesPerDay: number = (profileSettings as any)?.planned_trades_per_day || 5;

    const todayTradeCount = todayTrades?.length || 0;
    const completedTodayTrades = (todayTrades || []).filter(t => t.exit_price !== null);
    const todayLosingTradesCount = completedTodayTrades.filter(t => (t.pnl || 0) < 0).length;
    const todayNetPnl = (todayTrades || []).reduce((sum, t) => sum + (t.pnl || 0), 0);
    const dailyLossPct = Math.abs(Math.min(todayNetPnl, 0)) / capital * 100;

    // Find the most recent losing trade today for revenge trading detection
    const losingTrades = completedTodayTrades
      .filter(t => (t.pnl || 0) < 0)
      .sort((a: any, b: any) => (b.entry_time || "").localeCompare(a.entry_time || ""));
    const lastLosingTrade = losingTrades.length > 0 ? losingTrades[0] : null;

    // Planned risk amount = risk per trade based on stop loss distance
    const plannedRiskAmount = validatedData.stop_loss
      ? Math.abs(validatedData.entry_price - validatedData.stop_loss) * validatedData.quantity
      : capital * 0.01;

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
        todayNetPnl,
        dailyLossLimitPct,
        plannedTradesPerDay,
        plannedRiskAmount,
        lastLosingTrade,
      }),
    };

    // RULE VIOLATION BLOCKING
    const violations: string[] = [];
    if (dailyLossPct >= dailyLossLimitPct) {
      violations.push(`Daily loss limit (${dailyLossLimitPct}%) exceeded - trading blocked for today`);
    }
    if (todayTradeCount >= plannedTradesPerDay) {
      violations.push(`Maximum daily trades (${plannedTradesPerDay}) reached - no more trades allowed today`);
    }
    if (riskPct > 2) {
      violations.push("Risk per trade exceeds 2% - reduce position size");
    }

    // Block trade if critical violations
    if (violations.length > 0 && dailyLossPct >= dailyLossLimitPct) {
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
    
    if (mistakes.includes("always_apply_sl")) {
      mistakeFeedback.push({
        mistake: "always_apply_sl",
        feedback: "💡 Note: Always apply a stop loss and position size risk to protect your capital. Use the Position Sizer tool to control risk.",
        severity: "low"
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
        feedback: `⚠️ Daily loss limit breached: Your net daily loss has exceeded ${dailyLossLimitPct}% of capital.`,
        severity: "critical"
      });
    }
    if (mistakes.includes("revenge_trading")) {
      mistakeFeedback.push({
        mistake: "revenge_trading",
        feedback: `⚠️ Revenge trading detected: You entered a new trade with increased risk within 30 minutes of a losing trade ≥1R. Take a break and review your plan.`,

        severity: "critical"
      });
    }
    if (mistakes.includes("overtrading")) {
      mistakeFeedback.push({
        mistake: "overtrading",
        feedback: `⚠️ Overtrading detected: You exceeded your planned daily trade limit of ${plannedTradesPerDay} trades.`,

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
    if (mistakes.includes("single_loss_breached")) {
      mistakeFeedback.push({
        mistake: "single_loss_breached",
        feedback: "⚠️ Single Trade Loss > 1% Capital: You realized a loss exceeding 1% of your total capital on a single trade. Keep your losses small.",
        severity: "high"
      });
    }

    const warnings: string[] = [];
    if (todayTradeCount > Math.floor(plannedTradesPerDay * 0.6)) warnings.push("overtrading");
    if (dailyLossPct >= (dailyLossLimitPct - 1)) warnings.push("daily_loss_limit_warning");

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

    const virtualTrade = virtualizeTrade(trade);

    return NextResponse.json({ 
      trade: virtualTrade, 
      warnings, 
      dailyPnl: todayNetPnl,
      mistakes: virtualTrade.mistakes,
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

    // Fetch reversal records for these trades to show "Reversed by User" states
    const tradeIds = (trades || []).map((t: any) => t.id);
    let reversalsMap: Record<string, { mistake_key: string; reversal_comment: string }[]> = {};
    if (tradeIds.length > 0) {
      try {
        const { data: reversals } = await supabase
          .from("trade_mistake_reversals")
          .select("trade_id, mistake_key, reversal_comment")
          .in("trade_id", tradeIds)
          .eq("user_id", user.id);
        if (reversals) {
          for (const r of reversals) {
            if (!reversalsMap[r.trade_id]) reversalsMap[r.trade_id] = [];
            reversalsMap[r.trade_id].push({ mistake_key: r.mistake_key, reversal_comment: r.reversal_comment });
          }
        }
      } catch {
        // Non-critical: table may not exist yet if migration hasn't been run
      }
    }

    const virtualizedTrades = (trades || []).map((t: any) => ({
      ...virtualizeTrade(t),
      reversals: reversalsMap[t.id] || [],
    }));

    return NextResponse.json({ trades: virtualizedTrades, total: count, page, limit });
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
