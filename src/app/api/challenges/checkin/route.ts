import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { challenge_id, discipline_met } = await request.json();

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

    // Check restart limits (max 3 restarts per challenge type per month)
    if (!discipline_met) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: restartCount } = await supabase
        .from("challenges")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("type", challenge.type)
        .eq("status", "failed")
        .gte("created_at", startOfMonth.toISOString());

      if ((restartCount || 0) >= 3) {
        return NextResponse.json({
          error: "Challenge restart limit reached",
          message: "You've restarted this challenge type 3 times this month. Try again next month or choose a different challenge.",
          restart_limit_reached: true,
        }, { status: 400 });
      }
    }

    // Check if already checked in today
    const today = new Date().toISOString().split("T")[0];
    const lastCheckin = challenge.last_checkin_date;
    
    if (lastCheckin === today) {
      return NextResponse.json({ error: "Already checked in today" }, { status: 400 });
    }

    // Validate consecutive day (must be yesterday or first checkin)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const isConsecutive = !lastCheckin || lastCheckin === yesterdayStr;
    const newCurrentDay = isConsecutive && discipline_met 
      ? (challenge.current_day || 0) + 1 
      : discipline_met ? 1 : 0; // Reset if not consecutive

    // Check if challenge completed
    const isCompleted = newCurrentDay >= (challenge.total_days || 30);
    const newStatus = isCompleted ? "completed" : "active";

    // Calculate points earned
    let pointsEarned = 0;
    if (isCompleted) {
      const pointsMap: Record<string, number> = { "30": 50, "60": 100, "90": 150 };
      pointsEarned = pointsMap[challenge.type] || 50;
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

    // Award points if completed
    if (isCompleted && pointsEarned > 0) {
      // Update profile points
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_points_balance, total_lifetime_points")
        .eq("id", user.id)
        .single();

      await supabase
        .from("profiles")
        .update({
          current_points_balance: (profile?.current_points_balance || 0) + pointsEarned,
          total_lifetime_points: (profile?.total_lifetime_points || 0) + pointsEarned,
        })
        .eq("id", user.id);

      // Record in loyalty_points table
      await supabase.from("loyalty_points").insert({
        user_id: user.id,
        points: pointsEarned,
        action: "challenge_completion",
        description: `Completed ${challenge.type}-day challenge: ${challenge.name}`,
      });
    }

    // Get total days for challenge type
    const totalDaysMap: Record<string, number> = { "30": 30, "60": 60, "90": 90 };
    const totalDays = totalDaysMap[challenge.type] || 30;

    return NextResponse.json({
      success: true,
      current_day: newCurrentDay,
      total_days: totalDays,
      progress_pct: Math.round((newCurrentDay / totalDays) * 100),
      status: newStatus,
      is_completed: isCompleted,
      points_earned: pointsEarned,
      was_consecutive: isConsecutive,
      message: isCompleted 
        ? `🎉 Congratulations! Challenge completed! You earned ${pointsEarned} points!`
        : discipline_met
          ? getProgressiveMessage(newCurrentDay, totalDays)
          : "❌ Discipline not met today. Your streak has been reset. Stay focused tomorrow!",
    });
  } catch (error) {
    console.error("Checkin error:", error);
    return NextResponse.json({ error: "Failed to process check-in" }, { status: 500 });
  }
}
