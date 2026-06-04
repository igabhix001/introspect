import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAssessmentAiProfile } from "@/lib/ai/kimi-client";
import { checkAndTrackAiUsage, commitAiUsage } from "@/lib/ai/ai-limiter";
import { apiRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Define the exact diagnostic questions map for high-fidelity prompt generation
const QUESTIONS_MAP: Record<string, { question: string; category: string }> = {
  q1: {
    question: "When price approaches my stop-loss, I feel discomfort affecting exit.",
    category: "Stop-Loss & Loss Response",
  },
  q2: {
    question: "After a losing trade, I feel pressure to recover quickly.",
    category: "Stop-Loss & Loss Response",
  },
  q3: {
    question: "I delay exits even when the plan is clear.",
    category: "Stop-Loss & Loss Response",
  },
  q4: {
    question: "After consecutive wins, confidence increases significantly.",
    category: "Behaviour After Profits",
  },
  q5: {
    question: "I increase position size after profits.",
    category: "Behaviour After Profits",
  },
  q6: {
    question: "Rules feel flexible when things go well.",
    category: "Behaviour After Profits",
  },
  q7: {
    question: "Exact ₹ risk is not always predefined.",
    category: "Risk Planning & Positioning",
  },
  q8: {
    question: "I sometimes enter trades without calculating exact risk.",
    category: "Risk Planning & Positioning",
  },
  q9: {
    question: "I trade to participate rather than wait for clear setup.",
    category: "Impulse & Over-Participation",
  },
  q10: {
    question: "Staying inactive in slow markets feels difficult.",
    category: "Impulse & Over-Participation",
  },
  q11: {
    question: "Under pressure, I override predefined rules.",
    category: "Rule Consistency",
  },
  q12: {
    question: "Similar mistakes repeat despite review.",
    category: "Rule Consistency",
  },
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const identifier = getRateLimitIdentifier(request, user.id);
    const rateLimitResult = await apiRateLimit(identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

    // 1. Fetch latest assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: "No assessment found", message: "Please complete your diagnostic assessment first." },
        { status: 404 }
      );
    }

    // 2. Check if AI profile is already cached inside categories_analysis
    const categoriesAnalysis = assessment.categories_analysis || {};
    if (categoriesAnalysis.ai_profile) {
      return NextResponse.json({
        profile: categoriesAnalysis.ai_profile,
        cached: true,
        aiStatus: "allowed"
      });
    }

    // 3. Subscription & AI usage limits verification (Paywall check)
    // To generate the profile, we build a state text of the answers
    const answersList = (assessment.answers || []) as Array<{ question_id: string; answer: number | string }>;
    const answersText = JSON.stringify(answersList);

    const aiCheck = await checkAndTrackAiUsage(user.id, answersText);
    
    if (!aiCheck.allowed) {
      return NextResponse.json({
        error: aiCheck.error,
        message: aiCheck.message,
        aiStatus: aiCheck.error === "PAYWALL" ? "paywall" : 
                  aiCheck.error === "LIMIT_EXCEEDED" ? "limit_exceeded" : "error"
      });
    }

    // If it was cached in the global response cache, use that
    if (aiCheck.cachedResponse) {
      try {
        const parsedProfile = JSON.parse(aiCheck.cachedResponse);
        
        // Cache it locally in categories_analysis
        const updatedAnalysis = {
          ...categoriesAnalysis,
          ai_profile: parsedProfile
        };
        
        await supabase
          .from("assessments")
          .update({ categories_analysis: updatedAnalysis })
          .eq("id", assessment.id);

        return NextResponse.json({
          profile: parsedProfile,
          cached: true,
          aiStatus: "allowed"
        });
      } catch {
        // Fallback to generation if cache string is corrupt
      }
    }

    // 4. Map user answers to text questions for Kimi
    const answersWithText = answersList
      .map((ans) => {
        const questionInfo = QUESTIONS_MAP[ans.question_id];
        if (!questionInfo) return null;
        return {
          question: questionInfo.question,
          category: questionInfo.category,
          answer: Number(ans.answer) || 1,
        };
      })
      .filter((q): q is NonNullable<typeof q> => q !== null);

    // 5. Generate AI profile via Kimi client
    const generatedProfile = await generateAssessmentAiProfile(answersWithText);

    // 6. Persist generated profile into categories_analysis column
    const updatedAnalysis = {
      ...categoriesAnalysis,
      ai_profile: generatedProfile
    };

    const { error: updateError } = await supabase
      .from("assessments")
      .update({ categories_analysis: updatedAnalysis })
      .eq("id", assessment.id);

    if (updateError) {
      console.error("Failed to persist AI profile to assessment:", updateError);
    }

    // 7. Track usage limits
    await commitAiUsage(user.id, answersText, JSON.stringify(generatedProfile));

    return NextResponse.json({
      profile: generatedProfile,
      cached: false,
      aiStatus: "allowed"
    });
  } catch (error: any) {
    console.error("AI Psychological Profiler route error:", error);
    return NextResponse.json(
      { error: "Failed to generate profile", message: error.message },
      { status: 500 }
    );
  }
}
