import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { generateCoachingNarrative } from "@/lib/ai/kimi-client";
import { checkAndTrackAiUsage, commitAiUsage } from "@/lib/ai/ai-limiter";

export const dynamic = "force-dynamic";

/**
 * INTROSPECT™ Behavioral Audit Engine — 4-Pillar Discipline Score
 *
 * Per client spec "DISCIPLINE SCORE FROM JOURNAL.md":
 *   Pillar 1: Capital Guardrail   — daily P&L breaches daily_limit → -100 (score=0)
 *   Pillar 2: Bullet Precision    — initial_risk > unit_risk → -20/trade (cap -40)
 *   Pillar 3: The "Stop" Rule     — 3rd trade after 2 consecutive losses → -40
 *   Pillar 4: Realized R:R        — avg realized R:R < 1.5 → -10
 *
 *   Formula: Discipline = max(0, 100 - (P1 + min(P2*n, 40) + P3 + P4))
 */

interface Trade {
  id: string;
  stock?: string;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  quantity: number;
  pnl: number | null;
  direction?: string;
  followed_plan: boolean | null;
  sl_followed: boolean | null;
  risk_pct: number | null;
  mistakes: string[] | null;
  emotion_before?: string | null;
  entry_time?: string | null;
  exit_time?: string | null;
  notes?: string | null;
  reflection_text?: string | null;
  reflection_feedback?: string | null;
}

function calculateHoldTimeMinutes(entryStr?: string | null, exitStr?: string | null): number {
  if (!entryStr || !exitStr) return 0;
  
  // Try parsing as ISO strings first
  const entryDate = Date.parse(entryStr);
  const exitDate = Date.parse(exitStr);
  if (!isNaN(entryDate) && !isNaN(exitDate)) {
    return Math.max(0, Math.round((exitDate - entryDate) / (1000 * 60)));
  }

  // Fallback to "HH:MM" format parsing
  const entryParts = entryStr.split(":");
  const exitParts = exitStr.split(":");
  if (entryParts.length >= 2 && exitParts.length >= 2) {
    const entryMin = parseInt(entryParts[0]) * 60 + parseInt(entryParts[1]);
    const exitMin = parseInt(exitParts[0]) * 60 + parseInt(exitParts[1]);
    return Math.max(0, exitMin - entryMin);
  }
  
  return 0;
}

interface PillarResult {
  penalty: number;
  breached: boolean;
  recommendation: string;
}

interface AuditResult {
  score: number;
  pillar1: PillarResult;
  pillar2: PillarResult & { violatingTrades: string[] };
  pillar3: PillarResult;
  pillar4: PillarResult & { avgRR: number };
  mistakeTags: Array<{ stock: string; pnl: number; tag: string }>;
  recommendations: string[];
}

function runBehavioralAudit(
  trades: Trade[],
  capital: number,
  riskPc: number,       // e.g. 1 for 1%
  plannedTrades: number // e.g. 40 "bullets"
): AuditResult {
  const dailyLimit = capital * (riskPc / 100);           // e.g. ₹1,000
  const unitRisk = dailyLimit / (plannedTrades || 40);   // e.g. ₹25

  const mistakeTags: AuditResult["mistakeTags"] = [];

  // ── Pillar 1: Capital Guardrail ──
  const totalDayPnl = trades.reduce((s, t) => s + (t.pnl || 0), 0);
  const p1Breached = totalDayPnl <= -dailyLimit && trades.length > 0;
  const p1: PillarResult = {
    penalty: p1Breached ? 100 : 0,
    breached: p1Breached,
    recommendation: p1Breached
      ? `Total Loss Limit Breached. You traded past your survival point. Stop immediately tomorrow if you hit ₹${Math.round(dailyLimit).toLocaleString("en-IN")}.`
      : "",
  };

  // ── Pillar 2: Bullet Precision (Position Sizing) ──
  const p2Violators: string[] = [];
  let p2Count = 0;
  for (const t of trades) {
    const sl = t.stop_loss || 0;
    const entry = t.entry_price || 0;
    const qty = t.quantity || 1;
    const initialRisk = Math.abs(entry - sl) * qty;

    if (sl > 0 && initialRisk > unitRisk) {
      p2Count++;
      const overPct = Math.round(((initialRisk - unitRisk) / unitRisk) * 100);
      p2Violators.push(t.stock || `Trade ${t.id?.slice(0, 6)}`);
      mistakeTags.push({
        stock: t.stock || "Unknown",
        pnl: t.pnl || 0,
        tag: `🔴 SIZE VIOLATION (Risked ₹${Math.round(initialRisk)} vs allowed ₹${Math.round(unitRisk)}, ${overPct}% over)`,
      });
    } else if (!t.stop_loss) {
      mistakeTags.push({
        stock: t.stock || "Unknown",
        pnl: t.pnl || 0,
        tag: "🔴 NO STOP-LOSS",
      });
    } else {
      mistakeTags.push({
        stock: t.stock || "Unknown",
        pnl: t.pnl || 0,
        tag: "✅ Clean",
      });
    }
  }
  const p2Penalty = Math.min(p2Count * 20, 40); // Capped at -40
  const p2: PillarResult & { violatingTrades: string[] } = {
    penalty: p2Penalty,
    breached: p2Count > 0,
    violatingTrades: p2Violators,
    recommendation: p2Count > 0
      ? `Size Violation on ${p2Violators.join(", ")}. Your plan allows ₹${Math.round(unitRisk)} per bullet. Reduce quantity.`
      : "",
  };

  // ── Pillar 3: The "Stop" Rule (Revenge Trading) ──
  let p3Breached = false;
  let revengeTrades = 0;
  for (let i = 2; i < trades.length; i++) {
    const prev1Pnl = trades[i - 1]?.pnl ?? 0;
    const prev2Pnl = trades[i - 2]?.pnl ?? 0;
    if (prev1Pnl < 0 && prev2Pnl < 0) {
      p3Breached = true;
      revengeTrades = trades.length - i;
      // Mark these trades
      mistakeTags[i] = {
        ...mistakeTags[i],
        tag: `🔴 REVENGE TRADE (after 2 consecutive losses)`,
      };
      break; // Penalty applies once
    }
  }
  const p3: PillarResult = {
    penalty: p3Breached ? 40 : 0,
    breached: p3Breached,
    recommendation: p3Breached
      ? `Revenge Trading Detected. You took ${revengeTrades} trade(s) after 2 consecutive losses. Walk away earlier.`
      : "",
  };

  // ── Pillar 4: Realized R:R ──
  let totalRealizedRR = 0;
  let rrCount = 0;
  for (const t of trades) {
    const sl = t.stop_loss || 0;
    const entry = t.entry_price || 0;
    const initialRisk = Math.abs(entry - sl) * (t.quantity || 1);
    if (initialRisk > 0 && sl > 0) {
      const realizedRR = Math.abs(t.pnl || 0) / initialRisk;
      totalRealizedRR += realizedRR;
      rrCount++;
    }
  }
  const avgRR = rrCount > 0 ? totalRealizedRR / rrCount : 0;
  const p4Breached = rrCount > 0 && avgRR < 1.5;
  const p4: PillarResult & { avgRR: number } = {
    penalty: p4Breached ? 10 : 0,
    breached: p4Breached,
    avgRR: Math.round(avgRR * 100) / 100,
    recommendation: p4Breached
      ? `Poor R:R (${avgRR.toFixed(2)}). You are scalping for pennies but risking dollars. Hold winners longer to reach 1:1.5 minimum.`
      : "",
  };

  // ── Master Formula ──
  // If Pillar 1 breached, score = 0 (per spec: "-100 Points (Score = 0)")
  const rawScore = p1Breached
    ? 0
    : Math.max(0, 100 - (p1.penalty + p2Penalty + p3.penalty + p4.penalty));

  // Build top 3 recommendations
  const recommendations: string[] = [];
  if (p2.recommendation) recommendations.push(p2.recommendation);
  if (p3.recommendation) recommendations.push(p3.recommendation);
  if (p4.recommendation) recommendations.push(p4.recommendation);
  if (p1.recommendation) recommendations.unshift(p1.recommendation); // Most critical first

  return {
    score: rawScore,
    pillar1: p1,
    pillar2: p2,
    pillar3: p3,
    pillar4: p4,
    mistakeTags,
    recommendations: recommendations.slice(0, 3),
  };
}

// POST: Generate end-of-day report
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limiting
    const identifier = getRateLimitIdentifier(request, user.id);
    const rateLimitResult = await apiRateLimit(identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

    const { date } = await request.json();
    const reportDate = date || new Date().toISOString().split("T")[0];

    // Fetch today's trades (ordered by created_at for Pillar 3 sequence analysis)
    const { data: trades } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", reportDate)
      .order("created_at", { ascending: true });

    // Get profile for capital and risk settings
    const { data: profile } = await supabase
      .from("profiles")
      .select("trading_capital")
      .eq("id", user.id)
      .single();

    const capital = profile?.trading_capital || 100000;
    const riskPc = 1; // 1% standard — can be made configurable later
    const plannedTrades = 40; // "Bullets" — can be made configurable later

    const tradesList = (trades || []) as Trade[];
    const tradesTaken = tradesList.length;
    const totalPnl = tradesList.reduce((sum, t) => sum + (t.pnl || 0), 0);

    // Calculate holding times and stats for Disposition Effect
    const winningHoldTimes: number[] = [];
    const losingHoldTimes: number[] = [];
    
    const tradeScorecard = tradesList.map(t => {
      const minutes = calculateHoldTimeMinutes(t.entry_time, t.exit_time);
      const pnlVal = t.pnl || 0;
      if (pnlVal > 0) {
        winningHoldTimes.push(minutes);
      } else if (pnlVal < 0) {
        losingHoldTimes.push(minutes);
      }
      return {
        id: t.id,
        stock: t.stock || "Unknown",
        entry_time: t.entry_time || null,
        exit_time: t.exit_time || null,
        hold_time_minutes: minutes,
        pnl: pnlVal,
        direction: t.direction || "long",
        followed_plan: t.followed_plan ?? true,
        sl_followed: t.sl_followed ?? true,
        mistakes: t.mistakes || [],
        reflection_text: t.reflection_text || null,
        reflection_feedback: t.reflection_feedback || null,
      };
    });

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const avgWinHoldTime = winningHoldTimes.length > 0 ? Math.round(sum(winningHoldTimes) / winningHoldTimes.length) : 0;
    const avgLossHoldTime = losingHoldTimes.length > 0 ? Math.round(sum(losingHoldTimes) / losingHoldTimes.length) : 0;
    const dispositionRatio = avgWinHoldTime > 0 ? Math.round((avgLossHoldTime / avgWinHoldTime) * 100) / 100 : 0;

    // Run the 4-Pillar Behavioral Audit
    const audit = runBehavioralAudit(tradesList, capital, riskPc, plannedTrades);

    const updatedCapital = capital + totalPnl;

    // Build feedback from audit results
    const positive: string[] = [];
    const negative: string[] = [];

    if (!audit.pillar1.breached && tradesTaken > 0) positive.push("Capital guardrail respected ✅");
    if (!audit.pillar2.breached && tradesTaken > 0) positive.push("Position sizing within limits ✅");
    if (!audit.pillar3.breached && tradesTaken > 0) positive.push("No revenge trading detected ✅");
    if (!audit.pillar4.breached && tradesTaken > 0 && audit.pillar4.avgRR >= 1.5) positive.push(`Good R:R ratio (${audit.pillar4.avgRR.toFixed(1)}) ✅`);
    if (totalPnl > 0) positive.push(`Profitable day: +₹${totalPnl.toLocaleString("en-IN")}`);

    if (audit.pillar1.breached) negative.push("⚠️ Daily loss limit breached — critical violation");
    if (audit.pillar2.breached) negative.push(`⚠️ Position size violation on ${audit.pillar2.violatingTrades.length} trade(s)`);
    if (audit.pillar3.breached) negative.push("⚠️ Revenge trading detected after consecutive losses");
    if (audit.pillar4.breached) negative.push(`⚠️ Average R:R too low (${audit.pillar4.avgRR.toFixed(2)} < 1.5)`);

    let encouragement = "";
    if (audit.score >= 90) encouragement = "🏆 Elite Executor! Outstanding discipline today.";
    else if (audit.score >= 70) encouragement = "✅ Professional grade discipline. Keep it up!";
    else if (audit.score >= 50) encouragement = "⚠️ Room for improvement. Focus on the flagged pillars.";
    else encouragement = "🔴 Systemic risk day. Reset, review your rules, and come back stronger.";

    // ── AI Coaching Narrative Generation ──
    const emotions = tradesList
      .map(t => t.emotion_before)
      .filter((e): e is string => typeof e === "string" && e !== "");
    const notes = tradesList
      .map(t => t.notes)
      .filter((n): n is string => typeof n === "string" && n !== "");

    // Deterministic state description for MD5 hashing
    const stateText = JSON.stringify({
      trades: tradesList.map(t => ({
        id: t.id,
        pnl: t.pnl,
        direction: t.direction,
        mistakes: t.mistakes,
        sl_followed: t.sl_followed,
        followed_plan: t.followed_plan,
        entry_time: t.entry_time,
        exit_time: t.exit_time
      })),
      date: reportDate
    });

    const aiCheck = await checkAndTrackAiUsage(user.id, stateText);
    let aiNarrative = "";
    let aiStatus = "free";

    if (aiCheck.allowed) {
      aiStatus = "allowed";
      if (aiCheck.cachedResponse) {
        aiNarrative = aiCheck.cachedResponse;
      } else {
        try {
          const formattedMistakeTags = audit.mistakeTags.map(m => m.tag);
          aiNarrative = await generateCoachingNarrative({
            tradesCount: tradesTaken,
            totalPnl: totalPnl,
            rulesFollowed: [!audit.pillar1.breached, !audit.pillar2.breached, !audit.pillar3.breached, !audit.pillar4.breached].filter(Boolean).length,
            totalRules: 4,
            mistakesCount: audit.mistakeTags.filter(t => !t.tag.startsWith("✅")).length,
            mistakeTags: formattedMistakeTags,
            emotions,
            notes
          });
          
          await commitAiUsage(user.id, stateText, aiNarrative);
        } catch (err: any) {
          console.error("Failed to generate AI narrative:", err);
          aiNarrative = "AI Coaching failed to compile today's analysis. Using rules-based fallback suggestions.";
          aiStatus = "error";
        }
      }
    } else {
      aiStatus = aiCheck.error === "PAYWALL" ? "paywall" : 
                 aiCheck.error === "LIMIT_EXCEEDED" ? "limit_exceeded" : "error";
      aiNarrative = aiCheck.message || "AI Coaching is disabled for your subscription plan.";
    }

    const report = {
      user_id: user.id,
      date: reportDate,
      trades_taken: tradesTaken,
      rules_followed: [!audit.pillar1.breached, !audit.pillar2.breached, !audit.pillar3.breached, !audit.pillar4.breached].filter(Boolean).length,
      total_rules: 4,
      mistakes_count: audit.mistakeTags.filter(t => !t.tag.startsWith("✅")).length,
      discipline_score: audit.score,
      total_pnl: totalPnl,
      updated_capital: Math.round(updatedCapital),
      feedback: {
        positive,
        negative,
        suggestions: audit.recommendations,
        encouragement,
        audit: {
          pillar1: { name: "Capital Guardrail", penalty: audit.pillar1.penalty, breached: audit.pillar1.breached },
          pillar2: { name: "Bullet Precision", penalty: audit.pillar2.penalty, breached: audit.pillar2.breached, trades: audit.pillar2.violatingTrades },
          pillar3: { name: "Stop Rule", penalty: audit.pillar3.penalty, breached: audit.pillar3.breached },
          pillar4: { name: "Realized R:R", penalty: audit.pillar4.penalty, breached: audit.pillar4.breached, avgRR: audit.pillar4.avgRR },
        },
        mistakeTags: audit.mistakeTags,
        holdingTimes: {
          avgWinHoldTime,
          avgLossHoldTime,
          dispositionRatio
        },
        tradeScorecard,
        ai_narrative: aiNarrative,
        ai_status: aiStatus
      },
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
