import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { generateRiskReportSummary } from "@/lib/ai/kimi-client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription status
    const { checkUserSubscription } = await import("@/lib/paywall");
    const subStatus = await checkUserSubscription(supabase, user.id);
    if (!subStatus.isPro) {
      return NextResponse.json(
        { error: "AI Risk Report Summary is a Pro feature. Please upgrade to Pro.", isPro: false },
        { status: 403 }
      );
    }

    // Fetch the user's latest assessment
    const { data: assessment, error: fetchError } = await supabase
      .from("assessments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Check if the assessment already has a cached summary
    const categoriesAnalysis = assessment.categories_analysis || {};
    if (categoriesAnalysis.ai_summary) {
      return NextResponse.json({ summary: categoriesAnalysis.ai_summary });
    }

    // Generate a new summary using the assessment data
    const categories = categoriesAnalysis.categories || [];
    const overallScore = assessment.discipline_score || 50;
    const riskLevel = assessment.risk_level || "medium";

    // Standardize category array for Kimi prompt
    const formattedCategories = categories.map((c: any) => ({
      name: c.name || "Unknown",
      risk_percent: c.risk_percent || 0.5,
      risk_band: c.risk_band || "Medium",
      issues: c.issues || []
    }));

    const result = await generateRiskReportSummary({
      overallScore,
      riskLevel,
      categories: formattedCategories
    });

    const summary = result.content.trim();

    // Cache the summary in categories_analysis
    const adminDb = createAdminClient();
    const updatedCategoriesAnalysis = {
      ...categoriesAnalysis,
      ai_summary: summary
    };

    const { error: updateError } = await adminDb
      .from("assessments")
      .update({ categories_analysis: updatedCategoriesAnalysis })
      .eq("id", assessment.id);

    if (updateError) {
      console.error("[/api/risk-report/summary] Failed to cache summary:", updateError);
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("[/api/risk-report/summary] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
