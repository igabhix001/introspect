import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const today = new Date().toISOString().split("T")[0];

    const [tradesRes, assessmentRes, reportsRes, challengeRes, todayReportRes, totalClosedRes, winsRes] = await Promise.all([
      supabase
        .from("trades")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", `${today}T00:00:00`)
        .order("created_at", { ascending: false }),
      supabase
        .from("assessments")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("daily_reports")
        .select("date, discipline_score")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(35),
      supabase
        .from("challenges")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("daily_reports")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle(),
      supabase
        .from("trades")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .not("exit_price", "is", null),
      supabase
        .from("trades")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .not("exit_price", "is", null)
        .gt("pnl", 0),
    ]);

    const trades = tradesRes.data || [];
    const assessment = assessmentRes.data;
    const reports = reportsRes.data || [];
    const activeChallenge = challengeRes.data;
    const todayFullReport = todayReportRes.data as {
      discipline_score?: number;
      mistakes_count?: number;
      rules_followed?: number;
      total_rules?: number;
      feedback?: {
        positive?: string[];
        negative?: string[];
        suggestions?: string[];
        mistakeTags?: Array<{ stock: string; pnl: number; tag: string }>;
      };
    } | null;

    const todayPnl = trades.reduce((sum: number, t: { pnl?: number | string }) => sum + (Number(t.pnl) || 0), 0);

    // Get today's report if it exists
    const todayReport = reports.find((r: { date: string }) => r.date === today) as { discipline_score?: number } | undefined;
    
    // Discipline score logic:
    let disciplineScore = 0;
    if (todayFullReport?.discipline_score !== undefined) {
      disciplineScore = todayFullReport.discipline_score;
    } else if (todayReport?.discipline_score !== undefined) {
      disciplineScore = todayReport.discipline_score;
    }

    const disciplineTrend = reports
      .slice()
      .reverse()
      .map((r: { date: string; discipline_score?: number }) => ({
        day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(r.date).getDay()],
        score: r.discipline_score || 0,
      }));

    // Determine if user has journaled today
    const hasJournaledToday = trades.length > 0;
    const hasTodayReport = !!todayFullReport || !!todayReport;
    
    // Check if user has ever done assessment (has any historical reports or assessment)
    const hasEverTraded = reports.length > 0 || trades.length > 0;
    const hasAssessment = !!assessment;

    // Extract mistakes from today's report
    const todayMistakesCount = todayFullReport?.mistakes_count || 0;
    const todayMistakeTags = todayFullReport?.feedback?.mistakeTags || [];
    const todayAreasToImprove = todayFullReport?.feedback?.negative || [];
    const rulesFollowed = todayFullReport?.rules_followed || 0;
    const totalRules = todayFullReport?.total_rules || 4;

    const totalClosed = totalClosedRes.count || 0;
    const wins = winsRes.count || 0;
    const winRate = totalClosed > 0 ? Math.round((wins / totalClosed) * 100) : 0;

    return NextResponse.json({
      disciplineScore,
      hasJournaledToday,
      hasTodayReport,
      hasEverTraded,
      hasAssessment,
      dailyReports: reports,
      winRate,
      totalClosed,
      todayTrades: trades.length,
      maxTrades: 5,
      todayPnl,
      capitalUsed: assessment?.capital || 100000,
      rulesFollowed,
      totalRules,
      currentStreak: activeChallenge?.current_day || 0,
      todayMistakesCount,
      todayMistakeTags,
      todayAreasToImprove,
      recentTrades: trades.slice(0, 5).map((t: Record<string, any>) => ({
        id: t.id as string,
        stock_index: (t.stock || t.stock_index || "Unknown") as string,
        direction: t.direction as string,
        entry_price: Number(t.entry_price),
        exit_price: Number(t.exit_price || 0),
        pnl: Number(t.pnl || 0),
        followed_plan: t.followed_plan as boolean,
        created_at: t.created_at as string,
      })),
      disciplineTrend: disciplineTrend.length > 0
        ? disciplineTrend
        : [
            { day: "Mon", score: 0 },
            { day: "Tue", score: 0 },
            { day: "Wed", score: 0 },
            { day: "Today", score: 0 },
          ],
      tradingRules: [],
    });
  } catch (error) {
    console.error("[Dashboard Overview API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
