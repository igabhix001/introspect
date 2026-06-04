import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { awardPoints, POINTS_CONFIG } from "@/lib/services/loyalty-service";

// Progressive messages based on day count
function getProgressiveMessage(day: number, totalDays: number): string {
  const progress = day / totalDays;
  if (day === 1) return "🚀 Great start! Day 1 complete. The journey of a thousand miles begins with a single step.";
  if (day === 7) return "🔥 One week strong! You're building momentum. Keep it up!";
  if (day === 14) return "💪 Two weeks of discipline! You're proving your commitment.";
  if (day === 21) return "🧠 21 days - habits are forming! Science says it takes 21 days to build a habit.";
  if (progress >= 0.5 && progress < 0.6) return "🎯 Halfway there! You've come too far to quit now.";
  if (progress >= 0.75 && progress < 0.8) return "⚡ 75% complete! The finish line is in sight!";
  if (progress >= 0.9) return "🏆 Final stretch! Just a few more days to victory!";
  if (day % 10 === 0) return `📊 ${day} days of discipline logged. You're building something great!`;
  return `✅ Day ${day} complete! Keep the streak alive!`;
}

// POST: Daily check-in for active challenge
// NOTE: This endpoint is kept for backward compatibility but automatic check-in
// via trade logging is the primary method now
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { challenge_id } = await request.json();

    // Get the challenge
    const { data: challenge, error: fetchError } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challenge_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (fetchError || !challenge) {
      return NextResponse.json({ error: "Challenge not found or not active" }, { status: 404 });
    }

    // Check if already checked in today (idempotent)
    const today = new Date().toISOString().split("T")[0];
    const lastCheckin = challenge.last_checkin_date;
    
    if (lastCheckin === today) {
      return NextResponse.json({ 
        error: "Already checked in today",
        current_day: challenge.current_day,
        total_days: parseInt(challenge.type) || 30,
      }, { status: 400 });
    }

    // Simply increment the day count - NO STREAK RESET
    // Skipped days don't matter - progress is cumulative (1/30, 2/30, 3/30...)
    const newCurrentDay = (challenge.current_day || 0) + 1;

    // Check if challenge completed
    const totalDays = parseInt(challenge.type) || 30;
    const isCompleted = newCurrentDay >= totalDays;
    const newStatus = isCompleted ? "completed" : "active";

    // Calculate points earned on completion
    let pointsEarned = 0;
    if (isCompleted) {
      const challengeAction = challenge.type === "90" ? "challenge_90" 
        : challenge.type === "60" ? "challenge_60" 
        : "challenge_30";
      pointsEarned = POINTS_CONFIG[challengeAction] || 0;
    }

    // Update challenge
    const { error: updateError } = await supabase
      .from("challenges")
      .update({
        current_day: newCurrentDay,
        last_checkin_date: today,
        status: newStatus,
        completed_at: isCompleted ? new Date().toISOString() : null,
        points_earned: isCompleted ? pointsEarned : 0,
      })
      .eq("id", challenge_id);

    if (updateError) throw updateError;

    // Award points if completed using centralized service (sends email)
    if (isCompleted && pointsEarned > 0) {
      const challengeAction = challenge.type === "90" ? "challenge_90" 
        : challenge.type === "60" ? "challenge_60" 
        : "challenge_30";
      
      await awardPoints({
        userId: user.id,
        points: pointsEarned,
        reason: challengeAction,
        description: `Completed ${challenge.type}-day challenge: ${challenge.name}`,
        activityNote: `Amazing achievement! You've completed the ${challenge.type}-Day ${challenge.name} Challenge. Your discipline is paying off!`,
      });
    }

    return NextResponse.json({
      success: true,
      current_day: newCurrentDay,
      total_days: totalDays,
      progress_pct: Math.round((newCurrentDay / totalDays) * 100),
      status: newStatus,
      is_completed: isCompleted,
      points_earned: pointsEarned,
      last_journal_date: today,
      message: isCompleted 
        ? `🎉 Congratulations! Challenge completed! ${newCurrentDay}/${totalDays} days journaled. You earned ${pointsEarned} points!`
        : getProgressiveMessage(newCurrentDay, totalDays),
    });
  } catch (error) {
    console.error("Checkin error:", error);
    return NextResponse.json({ error: "Failed to process check-in" }, { status: 500 });
  }
}
