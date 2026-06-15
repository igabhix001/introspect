import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { formatMistakeLabel } from "@/lib/utils";

// GET: Export journal/trades as CSV or JSON
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    // Build query
    let query = supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);

    const { data: trades, error } = await query;

    if (error) throw error;

    if (format === "json") {
      const virtualizedTrades = (trades || []).map(t => {
        const originalMistakes: string[] = Array.isArray(t.mistakes) ? t.mistakes : [];
        const observationsList = ["holding_losers_too_long", "early_profit_booking", "always_apply_sl"];
        const mistakes = originalMistakes.filter((m: string) => !observationsList.includes(m));
        const observations = originalMistakes.filter((m: string) => observationsList.includes(m));
        return {
          ...t,
          mistakes,
          observations,
        };
      });
      return NextResponse.json({
        exported_at: new Date().toISOString(),
        total_trades: virtualizedTrades.length,
        trades: virtualizedTrades,
      });
    }

    // CSV format
    if (!trades || trades.length === 0) {
      return new NextResponse("No trades to export", { status: 200 });
    }

    const headers = [
      "Date", "Symbol", "Direction", "Entry Price", "Exit Price", 
      "Quantity", "Stop Loss", "Target", "P&L", "Risk %", 
      "SL Followed", "Followed Plan", "Emotion", "Notes", "Mistakes",
      "Observations", "Market Sentiment", "Entry Time", "Exit Time"
    ];

    const rows = trades.map(t => {
      const originalMistakes: string[] = Array.isArray(t.mistakes) ? t.mistakes : [];
      const observationsList = ["holding_losers_too_long", "early_profit_booking", "always_apply_sl"];
      const mistakes = originalMistakes.filter((m: string) => !observationsList.includes(m)).map(formatMistakeLabel);
      const observations = originalMistakes.filter((m: string) => observationsList.includes(m)).map(formatMistakeLabel);

      return [
        t.date || "",
        t.stock || "",
        t.direction || "",
        t.entry_price || "",
        t.exit_price || "",
        t.quantity || "",
        t.stop_loss || "",
        t.target_price || "",
        t.pnl || 0,
        t.risk_pct || 0,
        t.sl_followed ? "Yes" : "No",
        t.followed_plan ? "Yes" : "No",
        t.emotion_before || "",
        (t.notes || "").replace(/,/g, ";").replace(/\n/g, " ").replace(/"/g, '""'),
        mistakes.join("; "),
        observations.join("; "),
        t.market_sentiment || "",
        t.entry_time || "",
        t.exit_time || "",
      ];
    });

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="trades_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export trades" }, { status: 500 });
  }
}
