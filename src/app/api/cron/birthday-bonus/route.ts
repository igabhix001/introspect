import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { awardPoints, POINTS_CONFIG } from "@/lib/services/loyalty-service";

// Birthday bonus automation - runs daily via cron
// Vercel cron config: { "path": "/api/cron/birthday-bonus", "schedule": "0 6 * * *" }

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const today = new Date();
    const monthDay = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // Find users with birthday today
    const { data: birthdayUsers, error: fetchError } = await supabase
      .from("profiles")
      .select("id, full_name, email, date_of_birth, current_points_balance")
      .not("date_of_birth", "is", null);

    if (fetchError) throw fetchError;

    const usersWithBirthdayToday = (birthdayUsers || []).filter(user => {
      if (!user.date_of_birth) return false;
      const dob = new Date(user.date_of_birth);
      const userMonthDay = `${String(dob.getMonth() + 1).padStart(2, "0")}-${String(dob.getDate()).padStart(2, "0")}`;
      return userMonthDay === monthDay;
    });

    if (usersWithBirthdayToday.length === 0) {
      return NextResponse.json({ message: "No birthdays today", processed: 0 });
    }

    const BIRTHDAY_BONUS_POINTS = 10; // Client spec: 10 points birthday bonus
    const results: { user_id: string; name: string; success: boolean }[] = [];

    for (const user of usersWithBirthdayToday) {
      // Check if already received birthday bonus this year
      const thisYear = today.getFullYear();
      const { data: existingBonus } = await supabase
        .from("loyalty_points")
        .select("id")
        .eq("user_id", user.id)
        .eq("action", "birthday_bonus")
        .gte("created_at", `${thisYear}-01-01`)
        .single();

      if (existingBonus) {
        results.push({ user_id: user.id, name: user.full_name, success: false });
        continue;
      }

      // Award birthday bonus using centralized service (sends email)
      const result = await awardPoints({
        userId: user.id,
        points: BIRTHDAY_BONUS_POINTS,
        reason: "birthday_bonus",
        description: `🎂 Happy Birthday! Enjoy ${BIRTHDAY_BONUS_POINTS} bonus points!`,
        activityNote: "Happy Birthday! 🎂 Enjoy your special day with bonus points from INTROSPECT. May this year bring you disciplined trading and great success!",
      });

      if (result.success) {
        // Create notification
        await supabase.from("notifications").insert({
          user_id: user.id,
          title: "🎂 Happy Birthday!",
          message: `We've added ${BIRTHDAY_BONUS_POINTS} bonus points to your account. Have a great day!`,
          type: "birthday",
        });

        results.push({ user_id: user.id, name: user.full_name, success: true });
      } else {
        results.push({ user_id: user.id, name: user.full_name, success: false });
      }
    }

    return NextResponse.json({
      message: "Birthday bonuses processed",
      processed: results.filter(r => r.success).length,
      total_birthdays: usersWithBirthdayToday.length,
      results,
    });
  } catch (error) {
    console.error("Birthday bonus cron error:", error);
    return NextResponse.json({ error: "Failed to process birthday bonuses" }, { status: 500 });
  }
}
