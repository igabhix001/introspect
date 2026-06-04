import { SupabaseClient } from "@supabase/supabase-js";
import { awardPoints, POINTS_CONFIG } from "./loyalty-service";

/**
 * Challenge Auto Check-in Service
 * 
 * Production-grade service that automatically processes challenge check-ins
 * when a user logs a trade (journal entry). This ensures:
 * - One journal entry = one day of challenge progress (1/30, 2/30, 3/30...)
 * - NO streak reset on missed days - progress is cumulative
 * - Automatic completion detection and point awarding
 * - Idempotent operations (safe to call multiple times per day)
 * - Tracks last journal date for display
 */

interface ChallengeCheckinResult {
  success: boolean;
  checked_in: boolean;
  current_day?: number;
  total_days?: number;
  progress_pct?: number;
  is_completed?: boolean;
  points_earned?: number;
  message?: string;
  error?: string;
  already_checked_in?: boolean;
  no_active_challenge?: boolean;
  last_journal_date?: string;
}

// Progressive messages based on day count
function getProgressiveMessage(day: number, totalDays: number): string {
  const progress = day / totalDays;
  if (day === 1) return "🚀 Day 1/${totalDays} complete! Your challenge journey begins.";
  if (day === 7) return `🔥 ${day}/${totalDays} - One week of journaling! Momentum is building.`;
  if (day === 14) return `💪 ${day}/${totalDays} - Two weeks of discipline! You're proving commitment.`;
  if (day === 21) return `🧠 ${day}/${totalDays} - 21 days - habits are forming!`;
  if (progress >= 0.5 && progress < 0.6) return `🎯 ${day}/${totalDays} - Halfway there! Keep pushing!`;
  if (progress >= 0.75 && progress < 0.8) return `⚡ ${day}/${totalDays} - 75% complete! Finish line in sight!`;
  if (progress >= 0.9) return `🏆 ${day}/${totalDays} - Final stretch! Victory awaits!`;
  if (day % 10 === 0) return `📊 ${day}/${totalDays} days logged. Building greatness!`;
  return `✅ Day ${day}/${totalDays} complete!`;
}

/**
 * Automatically check-in for active challenge when user logs a trade
 * 
 * NEW LOGIC (per client request):
 * - No streak reset on missed days - progress is cumulative (1/30, 2/30, 3/30...)
 * - Skipped days don't reset progress - there can be no-trade days
 * - No restart restrictions - user can always continue their challenge
 * - Tracks last journal date for display
 * 
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @returns ChallengeCheckinResult
 */
export async function autoCheckInChallenge(
  supabase: SupabaseClient,
  userId: string
): Promise<ChallengeCheckinResult> {
  try {
    // 1. Get active challenge for user
    const { data: challenge, error: fetchError } = await supabase
      .from("challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    // No active challenge - silently succeed (not an error)
    if (fetchError || !challenge) {
      return {
        success: true,
        checked_in: false,
        no_active_challenge: true,
        message: "No active challenge to check in for",
      };
    }

    // 2. Check if already checked in today (idempotent - multiple trades per day = 1 check-in)
    const today = new Date().toISOString().split("T")[0];
    const lastCheckin = challenge.last_checkin_date;

    if (lastCheckin === today) {
      return {
        success: true,
        checked_in: false,
        already_checked_in: true,
        current_day: challenge.current_day,
        total_days: parseInt(challenge.type) || 30,
        progress_pct: Math.round((challenge.current_day / (parseInt(challenge.type) || 30)) * 100),
        last_journal_date: lastCheckin,
        message: "Already journaled today - keep trading!",
      };
    }

    // 3. Simply increment the day count - NO STREAK RESET
    // Skipped days don't matter - progress is cumulative
    const newCurrentDay = (challenge.current_day || 0) + 1;

    // 4. Check if challenge completed
    const totalDays = parseInt(challenge.type) || 30;
    const isCompleted = newCurrentDay >= totalDays;
    const newStatus = isCompleted ? "completed" : "active";

    // 5. Calculate points earned on completion
    let pointsEarned = 0;
    if (isCompleted) {
      const challengeAction = challenge.type === "90" ? "challenge_90"
        : challenge.type === "60" ? "challenge_60"
        : "challenge_30";
      pointsEarned = POINTS_CONFIG[challengeAction] || 0;
    }

    // 6. Update challenge in database
    const { error: updateError } = await supabase
      .from("challenges")
      .update({
        current_day: newCurrentDay,
        last_checkin_date: today,
        status: newStatus,
        completed_at: isCompleted ? new Date().toISOString() : null,
        points_earned: isCompleted ? pointsEarned : 0,
      })
      .eq("id", challenge.id);

    if (updateError) {
      console.error("Challenge update error:", updateError);
      return {
        success: false,
        checked_in: false,
        error: "Failed to update challenge progress",
      };
    }

    // 7. Award points if completed
    if (isCompleted && pointsEarned > 0) {
      const challengeAction = challenge.type === "90" ? "challenge_90"
        : challenge.type === "60" ? "challenge_60"
        : "challenge_30";

      try {
        await awardPoints({
          userId,
          points: pointsEarned,
          reason: challengeAction,
          description: `Completed ${challenge.type}-day challenge: ${challenge.name}`,
          activityNote: `🎉 Amazing! You've completed the ${challenge.type}-Day Challenge!`,
        });
      } catch (pointsError) {
        // Log but don't fail - challenge is still completed
        console.error("Failed to award challenge points:", pointsError);
      }
    }

    // 8. Generate appropriate message
    const message = isCompleted
      ? `🎉 Challenge completed! ${newCurrentDay}/${totalDays} days journaled. You earned ${pointsEarned} points!`
      : getProgressiveMessage(newCurrentDay, totalDays);

    return {
      success: true,
      checked_in: true,
      current_day: newCurrentDay,
      total_days: totalDays,
      progress_pct: Math.round((newCurrentDay / totalDays) * 100),
      is_completed: isCompleted,
      points_earned: pointsEarned,
      last_journal_date: today,
      message,
    };
  } catch (error) {
    console.error("Auto check-in error:", error);
    return {
      success: false,
      checked_in: false,
      error: "Failed to process automatic check-in",
    };
  }
}

/**
 * Check if user has logged a trade today (for challenge validation)
 */
export async function hasLoggedTradeToday(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];
  
  const { count } = await supabase
    .from("trades")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("date", today);

  return (count || 0) > 0;
}

/**
 * Evaluate discipline for today's trades
 * Returns true if user followed basic discipline rules
 */
export async function evaluateTodaysDiscipline(
  supabase: SupabaseClient,
  userId: string
): Promise<{ disciplineMet: boolean; violations: string[] }> {
  const today = new Date().toISOString().split("T")[0];
  
  const { data: trades } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today);

  if (!trades || trades.length === 0) {
    return { disciplineMet: false, violations: ["No trades logged today"] };
  }

  const violations: string[] = [];

  // Check for critical violations
  const hasNoStopLoss = trades.some((t) => !t.stop_loss);
  const hasOverRisk = trades.some((t) => (t.risk_pct || 0) > 2);
  const hasPlanViolation = trades.some((t) => t.followed_plan === false);

  if (hasNoStopLoss) violations.push("Trade without stop-loss");
  if (hasOverRisk) violations.push("Over-risked trade (>2%)");
  if (hasPlanViolation) violations.push("Plan not followed");

  // Discipline is met if no critical violations
  // For now, we're lenient - just logging a trade counts
  // In strict mode, you could require: violations.length === 0
  const disciplineMet = true; // Logging a trade = discipline met

  return { disciplineMet, violations };
}
