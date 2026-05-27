import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReflectionFeedback } from "@/lib/ai/kimi-client";
import { apiRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting to prevent abuse
    const identifier = getRateLimitIdentifier(request, user.id);
    const rateLimitResult = await apiRateLimit(identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

    const { tradeId, userReflection } = await request.json();
    if (!tradeId || !userReflection) {
      return NextResponse.json(
        { error: "Bad Request", message: "tradeId and userReflection are required fields." },
        { status: 400 }
      );
    }

    // 1. Fetch the trade to get its mistake type
    const { data: trade, error: tradeError } = await supabase
      .from("trades")
      .select("*")
      .eq("id", tradeId)
      .eq("user_id", user.id)
      .single();

    if (tradeError || !trade) {
      return NextResponse.json(
        { error: "Trade not found", message: "The specified trade was not found." },
        { status: 404 }
      );
    }

    let mistakeType = "General Discipline";
    if (trade.mistakes && trade.mistakes.length > 0) {
      mistakeType = trade.mistakes[0];
    } else if (!trade.followed_plan) {
      mistakeType = "Plan Deviation";
    } else if (!trade.sl_followed) {
      mistakeType = "Stop-Loss Violation";
    }

    // Call Kimi to generate Cognitive Behavioral Therapy (CBT) reflection feedback
    const feedback = await generateReflectionFeedback(mistakeType, userReflection);

    // Save reflection text and feedback response directly to the trade journal entry
    const { error: updateError } = await supabase
      .from("trades")
      .update({
        reflection_text: userReflection,
        reflection_feedback: feedback
      })
      .eq("id", tradeId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to save reflection to database:", updateError);
    }

    return NextResponse.json({ feedback, mistakeType });
  } catch (error: any) {
    console.error("CBT Reflection Coach error:", error);
    return NextResponse.json(
      { error: "Failed to generate reflection feedback", message: error.message },
      { status: 500 }
    );
  }
}
