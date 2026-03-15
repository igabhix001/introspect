import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Pro Tips based on user's trading behavior and assessment
const PRO_TIPS_DATABASE = {
  // Risk Management Tips
  risk_management: [
    { id: "rm1", tip: "Never risk more than 1% of your capital on a single trade.", category: "risk", severity: "critical" },
    { id: "rm2", tip: "Always set your stop-loss before entering a trade, not after.", category: "risk", severity: "high" },
    { id: "rm3", tip: "Use position sizing calculators to determine optimal lot sizes.", category: "risk", severity: "medium" },
    { id: "rm4", tip: "Keep a maximum of 3 open positions at any time to manage risk effectively.", category: "risk", severity: "medium" },
  ],
  // Psychology Tips
  psychology: [
    { id: "ps1", tip: "Take a 15-minute break after a losing trade before entering another.", category: "psychology", severity: "high" },
    { id: "ps2", tip: "Don't revenge trade - it's the fastest way to blow your account.", category: "psychology", severity: "critical" },
    { id: "ps3", tip: "Keep a trading journal to identify emotional patterns.", category: "psychology", severity: "medium" },
    { id: "ps4", tip: "Accept that losses are part of trading - focus on the process, not individual outcomes.", category: "psychology", severity: "medium" },
  ],
  // Discipline Tips
  discipline: [
    { id: "ds1", tip: "Follow your trading plan religiously - no exceptions.", category: "discipline", severity: "critical" },
    { id: "ds2", tip: "Set a maximum number of trades per day and stick to it.", category: "discipline", severity: "high" },
    { id: "ds3", tip: "Review your trades at the end of each day - what worked, what didn't?", category: "discipline", severity: "medium" },
    { id: "ds4", tip: "Don't trade during the first 15 minutes of market open - wait for clarity.", category: "discipline", severity: "medium" },
  ],
  // Execution Tips
  execution: [
    { id: "ex1", tip: "Wait for confirmation before entering - patience pays.", category: "execution", severity: "high" },
    { id: "ex2", tip: "Use limit orders instead of market orders for better fills.", category: "execution", severity: "medium" },
    { id: "ex3", tip: "Scale out of winning positions - take partial profits.", category: "execution", severity: "medium" },
    { id: "ex4", tip: "Don't move your stop-loss further away - that's a sign of hope, not strategy.", category: "execution", severity: "critical" },
  ],
  // Market Awareness Tips
  market: [
    { id: "mk1", tip: "Check VIX before trading - high volatility requires smaller positions.", category: "market", severity: "high" },
    { id: "mk2", tip: "Avoid trading during major news events unless you have a specific strategy.", category: "market", severity: "high" },
    { id: "mk3", tip: "Understand the broader market trend before taking individual trades.", category: "market", severity: "medium" },
    { id: "mk4", tip: "Bank Nifty is more volatile than Nifty - adjust your risk accordingly.", category: "market", severity: "medium" },
  ],
};

// GET: Get personalized pro tips based on user's profile and recent trades
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "5");

    // Get user's recent trades to personalize tips
    const { data: recentTrades } = await supabase
      .from("trades")
      .select("mistakes, pnl, risk_pct, sl_followed, followed_plan")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Analyze user's weak areas
    const weakAreas: string[] = [];
    if (recentTrades && recentTrades.length > 0) {
      const noStopLossCount = recentTrades.filter(t => t.mistakes?.includes("no_stop_loss")).length;
      const overRiskCount = recentTrades.filter(t => t.mistakes?.includes("over_risk")).length;
      const planNotFollowedCount = recentTrades.filter(t => !t.followed_plan).length;
      const losingTrades = recentTrades.filter(t => t.pnl < 0).length;

      if (noStopLossCount > 2) weakAreas.push("risk_management");
      if (overRiskCount > 2) weakAreas.push("risk_management");
      if (planNotFollowedCount > 3) weakAreas.push("discipline");
      if (losingTrades > recentTrades.length * 0.6) weakAreas.push("psychology");
    }

    // Collect tips
    let tips: typeof PRO_TIPS_DATABASE.risk_management = [];

    if (category && PRO_TIPS_DATABASE[category as keyof typeof PRO_TIPS_DATABASE]) {
      tips = PRO_TIPS_DATABASE[category as keyof typeof PRO_TIPS_DATABASE];
    } else {
      // Prioritize tips from weak areas
      if (weakAreas.length > 0) {
        for (const area of weakAreas) {
          if (PRO_TIPS_DATABASE[area as keyof typeof PRO_TIPS_DATABASE]) {
            tips.push(...PRO_TIPS_DATABASE[area as keyof typeof PRO_TIPS_DATABASE]);
          }
        }
      }
      
      // Add general tips if not enough
      if (tips.length < limit) {
        const allTips = Object.values(PRO_TIPS_DATABASE).flat();
        const remainingTips = allTips.filter(t => !tips.find(existing => existing.id === t.id));
        tips.push(...remainingTips);
      }
    }

    // Shuffle and limit
    const shuffled = tips.sort(() => Math.random() - 0.5).slice(0, limit);

    // Get tip of the day (consistent for the day)
    const today = new Date().toISOString().split("T")[0];
    const allTips = Object.values(PRO_TIPS_DATABASE).flat();
    const dayIndex = parseInt(today.replace(/-/g, "")) % allTips.length;
    const tipOfTheDay = allTips[dayIndex];

    return NextResponse.json({
      tips: shuffled,
      tip_of_the_day: tipOfTheDay,
      weak_areas: weakAreas,
      personalized: weakAreas.length > 0,
    });
  } catch (error) {
    console.error("Tips error:", error);
    return NextResponse.json({ error: "Failed to fetch tips" }, { status: 500 });
  }
}
