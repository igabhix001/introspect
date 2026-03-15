import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST: Start a new challenge
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type, rules_to_follow } = await request.json();

    const names: Record<string, string> = {
      "30": "30-Day Foundation Challenge",
      "60": "60-Day Consistency Challenge",
      "90": "90-Day Mastery Challenge",
    };

    // Check for already active challenge
    const { data: existing } = await supabase
      .from("challenges")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You already have an active challenge. Complete or abandon it first." },
        { status: 400 }
      );
    }

    const { data: challenge, error } = await supabase
      .from("challenges")
      .insert({
        user_id: user.id,
        type,
        name: names[type] || "30-Day Challenge",
        rules_to_follow: rules_to_follow || [],
        daily_progress: [],
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error("Challenge error:", error);
    return NextResponse.json({ error: "Failed to start challenge" }, { status: 500 });
  }
}

// PATCH: Update daily progress
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { challengeId, dayProgress } = await request.json();

    const { data: challenge } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .eq("user_id", user.id)
      .single();

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const updatedProgress = [...(challenge.daily_progress || []), dayProgress];
    const newDay = updatedProgress.length + 1;
    const targetDays = parseInt(challenge.type);
    const isCompleted = updatedProgress.length >= targetDays;

    const { data, error } = await supabase
      .from("challenges")
      .update({
        daily_progress: updatedProgress,
        current_day: newDay,
        status: isCompleted ? "completed" : "active",
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq("id", challengeId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ challenge: data, isCompleted });
  } catch (error) {
    console.error("Challenge update error:", error);
    return NextResponse.json({ error: "Failed to update challenge" }, { status: 500 });
  }
}

// GET: Fetch challenges
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: challenges, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ challenges });
  } catch {
    return NextResponse.json({ challenges: [] });
  }
}
