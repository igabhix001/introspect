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
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch trades, weekly reports, and user profile in parallel
    const [tradesRes, weeklyReportsRes, profileRes] = await Promise.all([
      supabase
        .from("trades")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("daily_reports")
        .select("*")
        .eq("user_id", userId)
        .gte("date", sevenDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: false }),
      supabase
        .from("profiles")
        .select("trading_capital")
        .eq("id", userId)
        .single()
    ]);

    const allTrades = tradesRes.data || [];
    const weeklyReports = (weeklyReportsRes.data || []) as Array<{
      date: string;
      mistakes_count?: number;
      feedback?: {
        negative?: string[];
        suggestions?: string[];
        mistakeTags?: Array<{ stock: string; pnl: number; tag: string }>;
      };
    }>;

    // Extract weekly mistakes from daily reports
    const weeklyMistakeCounts: Record<string, number> = {};
    const weeklyAreasToImprove: string[] = [];
    const weeklySuggestions: string[] = [];

    weeklyReports.forEach((report) => {
      // Collect mistake tags
      if (report.feedback?.mistakeTags) {
        report.feedback.mistakeTags.forEach((mt) => {
          if (!mt.tag.startsWith("✅")) {
            const cleanTag = mt.tag.replace(/^🔴\s*/, "").split(" (")[0];
            weeklyMistakeCounts[cleanTag] = (weeklyMistakeCounts[cleanTag] || 0) + 1;
          }
        });
      }
      // Collect areas to improve
      if (report.feedback?.negative) {
        report.feedback.negative.forEach((neg) => {
          const cleanNeg = neg.replace(/^⚠️\s*/, "");
          if (!weeklyAreasToImprove.includes(cleanNeg)) {
            weeklyAreasToImprove.push(cleanNeg);
          }
        });
      }
      // Collect suggestions
      if (report.feedback?.suggestions) {
        report.feedback.suggestions.forEach((sug) => {
          if (!weeklySuggestions.includes(sug)) {
            weeklySuggestions.push(sug);
          }
        });
      }
    });

    const mistakeColors: Record<string, string> = {
      "SIZE VIOLATION": "#EF4444",
      "NO STOP-LOSS": "#F97316",
      "REVENGE TRADE": "#DC2626",
      "FOMO": "#F59E0B",
      "Overtrading": "#A855F7",
      "Over-leveraged": "#3B82F6",
    };

    const weeklyMistakeData = Object.entries(weeklyMistakeCounts).map(([name, value]) => ({
      name,
      value,
      color: mistakeColors[name] || "#6B7280",
    }));

    if (allTrades.length === 0) {
      return NextResponse.json({
        allTrades: [],
        tradeCount: 0,
        totalPnl: 0,
        winRate: 0,
        ruleAdherence: 0,
        weeklyPnl: [],
        mistakeData: [],
        weeklyMistakeData,
        weeklyAreasToImprove,
        weeklySuggestions,
        tradingCapital: profileRes.data?.trading_capital || 100000,
      });
    }

    const total = allTrades.reduce((sum: number, t: { pnl: number | string }) => sum + (Number(t.pnl) || 0), 0);
    const closedTrades = allTrades.filter((t: { exit_price?: number | null }) => t.exit_price !== null && t.exit_price !== undefined);
    const totalClosed = closedTrades.length;
    const wins = closedTrades.filter((t: { pnl: number | string }) => (Number(t.pnl) || 0) > 0).length;
    const rulesFollowed = allTrades.filter((t: { followed_plan: boolean }) => t.followed_plan).length;

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayPnl: Record<string, number> = {};
    allTrades.forEach((t: { created_at: string; pnl: number | string }) => {
      const dayName = dayNames[new Date(t.created_at).getDay()];
      dayPnl[dayName] = (dayPnl[dayName] || 0) + (Number(t.pnl) || 0);
    });
    const weeklyPnl = dayNames.slice(1, 6).map((day) => ({ day, pnl: dayPnl[day] || 0 }));

    // Legacy mistake data from trades (for backward compatibility)
    const observationsList = ["holding_losers_too_long", "early_profit_booking", "always_apply_sl"];
    const tradeMistakeCounts: Record<string, number> = {};
    allTrades.forEach((t: { mistakes?: string[] }) => {
      (t.mistakes || [])
        .filter((m: string) => !observationsList.includes(m))
        .forEach((m: string) => {
          tradeMistakeCounts[m] = (tradeMistakeCounts[m] || 0) + 1;
        });
    });
    const mistakeData = Object.entries(tradeMistakeCounts).map(([name, value]) => ({
      name,
      value,
      color: mistakeColors[name] || "#6B7280",
    }));

    return NextResponse.json({
      allTrades: allTrades.map((t: Record<string, any>) => {
        const originalMistakes = Array.isArray(t.mistakes) ? t.mistakes : [];
        const mistakes = originalMistakes.filter((m: string) => !observationsList.includes(m));
        const observations = originalMistakes.filter((m: string) => observationsList.includes(m));
        return {
          ...t,
          entry_price: Number(t.entry_price),
          exit_price: t.exit_price ? Number(t.exit_price) : null,
          pnl: Number(t.pnl || 0),
          mistakes,
          observations,
        };
      }),
      tradeCount: allTrades.length,
      totalPnl: total,
      winRate: totalClosed > 0 ? Math.round((wins / totalClosed) * 100) : 0,
      ruleAdherence: Math.round((rulesFollowed / allTrades.length) * 100),
      weeklyPnl,
      mistakeData,
      weeklyMistakeData,
      weeklyAreasToImprove,
      weeklySuggestions,
      tradingCapital: profileRes.data?.trading_capital || 100000,
    });
  } catch (error) {
    console.error("[Dashboard Analytics API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
