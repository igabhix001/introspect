import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { assessmentSchema } from "@/lib/validation/schemas";
import { apiRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

// ──── IMV_Master Scoring Engine (from client's Excel reference) ────
// Questions q1-q12, scale 1-5. Weights per client spec.
// Response meanings: 1=Strong discipline, 2=Mostly disciplined, 3=Situational bias, 4=Frequent interference, 5=Strong emotional dominance

// Weights per question from IMV_Master
const QUESTION_WEIGHTS: Record<string, number> = {
  q1: 2.0, q2: 2.0, q3: 2.0,       // Stop-Loss & Loss Response
  q4: 2.0, q5: 2.0, q6: 2.0,       // Behaviour After Profits
  q7: 1.5, q8: 1.5,                 // Risk Planning & Positioning
  q9: 1.5, q10: 1.5,                // Impulse & Over-Participation
  q11: 2.0, q12: 2.0,               // Rule Consistency
};

// Category definitions: which questions belong to which category
const CATEGORIES = [
  { name: "Stop-Loss & Loss Response", questions: ["q1", "q2", "q3"], maxPerQ: 5 },
  { name: "Behaviour After Profits", questions: ["q4", "q5", "q6"], maxPerQ: 5 },
  { name: "Risk Planning & Positioning", questions: ["q7", "q8"], maxPerQ: 5 },
  { name: "Impulse & Over-Participation", questions: ["q9", "q10"], maxPerQ: 5 },
  { name: "Rule Consistency", questions: ["q11", "q12"], maxPerQ: 5 },
];

// Response meaning lookup (from IMV 99_Lookups)
const RESPONSE_MEANING: Record<number, string> = {
  1: "High discipline and emotional control",
  2: "Mostly disciplined with occasional lapses",
  3: "Situational emotional bias",
  4: "Frequent emotional interference",
  5: "Strong emotional dominance under pressure",
};

// Corrective action lookup (from IMV 99_Lookups)
const CORRECTIVE_ACTION: Record<number, string> = {
  1: "Maintain current process",
  2: "Minor rule reinforcement",
  3: "Awareness training and journaling",
  4: "Pre-trade pause and execution checklist",
  5: "Immediate rule hardening and risk caps",
};

// Risk band determination based on category weighted score percentage
function getRiskBand(riskPercent: number): "Low" | "Medium" | "High" {
  if (riskPercent <= 0.40) return "Low";
  if (riskPercent <= 0.70) return "Medium";
  return "High";
}

// Category interpretation lookup (from IMV 99_Lookups)
const CATEGORY_INTERPRETATION: Record<string, { interpretation: string; focus: string; action: string }> = {
  Low: {
    interpretation: "Low behavioural risk – disciplined execution",
    focus: "Maintain framework and discipline",
    action: "Maintain rules and execution discipline",
  },
  Medium: {
    interpretation: "Moderate behavioural risk – inconsistency under pressure",
    focus: "Behaviour correction & rule reinforcement",
    action: "Reinforce rules, journaling, and review",
  },
  High: {
    interpretation: "High behavioural risk – impulsive execution",
    focus: "Immediate risk containment & behaviour reset",
    action: "Immediate rule hardening and risk containment",
  },
};

// Overall interpretation lookup (from IMV 99_Lookups)
const OVERALL_INTERPRETATION: Record<string, { interpretation: string; focus: string }> = {
  Low: {
    interpretation: "Low behavioural risk – disciplined execution",
    focus: "Maintain framework with periodic review",
  },
  Medium: {
    interpretation: "Moderate behavioural risk – inconsistency under pressure",
    focus: "Tighten risk controls and reinforce discipline",
  },
  High: {
    interpretation: "High behavioural risk – impulsive execution",
    focus: "Immediate risk containment & behaviour reset",
  },
};

// Compute metrics per category based on answers — IMV_Master Excel + Blueprint formula
//
// CORRECTED FORMULA (per client feedback - all 1s should be LOW risk):
//   - Response 1 = "High discipline" = LOW risk
//   - Response 5 = "Strong emotional dominance" = HIGH risk
//
// The Risk% must be normalized between 0 and 1:
//   - MinPossibleScore = Sum of (1 × weight) for all questions in category
//   - MaxPossibleScore = Sum of (5 × weight) for all questions in category
//   - ActualScore = Sum of (response × weight)
//   - Risk% = (ActualScore - MinPossibleScore) / (MaxPossibleScore - MinPossibleScore)
//
// This ensures:
//   - All 1s → Risk% = 0 → LOW
//   - All 5s → Risk% = 1 → HIGH
//
// Risk bands (from 99_Lookups): Low ≤ 0.40, Medium ≤ 0.70, High > 0.70
function computeCategoriesAnalysis(answersArray: any[]) {
  const answers = answersArray.reduce((acc: Record<string, any>, curr: any) => {
    acc[curr.question_id] = Number(curr.answer) || 0;
    return acc;
  }, {} as Record<string, any>);

  const MIN_RESPONSE = 1;
  const MAX_RESPONSE = 5;

  const categories = CATEGORIES.map(cat => {
    // Calculate actual weighted score
    let catWeightedScore = 0;
    let minPossibleScore = 0;
    let maxPossibleScore = 0;
    
    cat.questions.forEach(qId => {
      const response = answers[qId] || 1;
      const weight = QUESTION_WEIGHTS[qId] || 1;
      catWeightedScore += response * weight;
      minPossibleScore += MIN_RESPONSE * weight;
      maxPossibleScore += MAX_RESPONSE * weight;
    });

    // Normalized Risk% = (Actual - Min) / (Max - Min)
    // This gives 0 when all answers are 1, and 1 when all answers are 5
    const scoreRange = maxPossibleScore - minPossibleScore;
    const riskPercent = scoreRange > 0 ? (catWeightedScore - minPossibleScore) / scoreRange : 0;
    const risk_band = getRiskBand(riskPercent);
    const catInfo = CATEGORY_INTERPRETATION[risk_band];

    return {
      name: cat.name,
      score: catWeightedScore,
      max_score: maxPossibleScore,
      percentage: Math.round(riskPercent * 100),
      risk_percent: riskPercent,
      risk_band,
      interpretation: catInfo.interpretation,
      recommended_focus: catInfo.focus,
      prescribed_action: catInfo.action,
    };
  });

  // OverallRisk = Average of all category risk percentages (now normalized 0-1)
  const overallRiskPercent = categories.reduce((sum, c) => sum + c.risk_percent, 0) / categories.length;
  const overallRiskBand = getRiskBand(overallRiskPercent);

  // DisciplineScore = (1 - OverallRisk) × 100 (clamped to 0-100)
  const disciplineScore = Math.max(0, Math.min(100, Math.round((1 - overallRiskPercent) * 100)));

  const totalWeightedScore = categories.reduce((sum, c) => sum + c.score, 0);

  const riskLevel = overallRiskBand.toLowerCase();
  let traderLevel = "beginner";
  if (disciplineScore >= 80) traderLevel = "advanced";
  else if (disciplineScore >= 55) traderLevel = "intermediate";

  return {
    disciplineScore,
    riskLevel,
    traderLevel,
    totalWeightedScore,
    totalMaxWeightedScore: categories.reduce((sum, c) => sum + c.max_score, 0),
    overallRiskPercent: Math.round(overallRiskPercent * 100),
    categories,
  };
}

// POST: Save assessment, calculate detailed risk engine analysis, and return full report
export async function POST(request: NextRequest) {
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

    // Check subscription status
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gte("current_period_end", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    const hasActiveSubscription = !!subscription;

    // If not subscribed, check if user has already taken one free assessment
    if (!hasActiveSubscription) {
      const { count } = await supabase
        .from("assessments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (count && count >= 1) {
        return NextResponse.json(
          { 
            error: "Free assessment limit reached", 
            message: "You have already used your one free assessment. Subscribe to take unlimited assessments and unlock your full risk report.",
            requiresSubscription: true 
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    
    // Validate input
    const validation = assessmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid assessment data", details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { answers } = validation.data;
    const metrics = computeCategoriesAnalysis(answers);

    // Fetch templates from database corresponding to the computed risk bands
    const categoryNames = metrics.categories.map(c => c.name);
    
    // We fetch all possible matching templates to assemble the final response
    const { data: templates, error: templatesError } = await supabase
      .from("category_feedback_templates")
      .select("*")
      .in("category_name", categoryNames);

    if (templatesError) {
      console.error("Templates fetch error:", templatesError);
    }

    // Assemble the final detailed categories array
    const detailedCategories = metrics.categories.map(cat => {
      const template = templates?.find(t => t.category_name === cat.name && t.risk_band === cat.risk_band);
      
      let interpretation = "";
      if (cat.risk_band === "High") interpretation = "High behavioural risk - immediate attention required";
      else if (cat.risk_band === "Medium") interpretation = "Moderate risk - inconsistency present";
      else interpretation = "Low risk - maintaining good discipline";

      return {
        ...cat,
        interpretation,
        issues: template ? [template.issue_1, template.issue_2, template.issue_3].filter(Boolean) : [],
        recommendations: template ? [template.recommendation_1, template.recommendation_2, template.recommendation_3].filter(Boolean) : []
      };
    });

    const overallBand = metrics.riskLevel === "high" ? "High" : metrics.riskLevel === "medium" ? "Medium" : "Low";
    const overallLookup = OVERALL_INTERPRETATION[overallBand];
    const overallData = {
      risk_level: metrics.riskLevel,
      interpretation: overallLookup.interpretation,
      recommended_focus: overallLookup.focus,
      total_weighted_score: metrics.totalWeightedScore,
      max_weighted_score: metrics.totalMaxWeightedScore,
      risk_percent: metrics.overallRiskPercent,
    };

    const categories_analysis = {
      overall: overallData,
      categories: detailedCategories
    };

    // Save assessment to DB
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .insert({
        user_id: user.id,
        answers,
        discipline_score: metrics.disciplineScore,
        risk_level: metrics.riskLevel,
        trader_level: metrics.traderLevel,
        categories_analysis // New JSON payload stored for the comprehensive report
      })
      .select()
      .single();

    if (assessmentError) throw assessmentError;

    // Generate legacy simple personalized_rules format for backward compatibility elsewhere
    const plainRules = detailedCategories.flatMap(cat => cat.recommendations).slice(0, 5);
    const { error: rulesError } = await supabase
      .from("personalized_rules")
      .insert({
        user_id: user.id,
        assessment_id: assessment.id,
        rules: plainRules.map(r => ({ category: "General", rule: r, severity: "important", description: r })),
      });

    if (rulesError) throw rulesError;

    return NextResponse.json({
      assessment,
      categories_analysis,
      disciplineScore: metrics.disciplineScore,
      riskLevel: metrics.riskLevel,
    });
  } catch (error) {
    console.error("Assessment error:", error);
    return NextResponse.json(
      { error: "Failed to save assessment" },
      { status: 500 }
    );
  }
}

// GET: Fetch latest assessment
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: assessment } = await supabase
      .from("assessments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!assessment) {
      return NextResponse.json({ assessment: null, categories_analysis: null });
    }

    return NextResponse.json({ 
      assessment, 
      categories_analysis: assessment.categories_analysis || null 
    });
  } catch {
    return NextResponse.json({ assessment: null, categories_analysis: null });
  }
}
