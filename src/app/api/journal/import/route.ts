import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { tradeSchema } from "@/lib/validation/schemas";

function detectMistakes(
  trade: {
    direction: string;
    entry_price: number;
    exit_price?: number | null;
    stop_loss?: number | null;
    followed_plan: boolean;
    pnl: number;
    risk_pct: number;
    quantity: number;
    entry_time?: string | null;
    exit_time?: string | null;
    notes?: string | null;
    stock?: string | null;
    date?: string | null;
  },
  context: {
    capital: number;
    todayTradeCount: number;
    todayLosingTradesCount: number;
    todayNetPnl: number;
  }
): string[] {
  const mistakes: string[] = [];

  // 1. Risk per trade breached: Trade risk > 1% of capital
  if (trade.risk_pct > 1) {
    mistakes.push("risk_breached");
  }

  // 2. Daily loss breached: Realized loss > 3% of capital
  const netDailyPnl = context.todayNetPnl + trade.pnl;
  if (netDailyPnl < -0.03 * context.capital) {
    mistakes.push("daily_loss_breached");
  }

  // 3. No stop loss set: stop_set? = No
  if (trade.stop_loss === null || trade.stop_loss === undefined) {
    mistakes.push("no_stop_loss");
  }

  // 4. Revenge trading: (losses today >= 2) AND (daily loss > 3% of capital)
  const isCurrentLoss = trade.exit_price !== null && trade.pnl < 0;
  const totalLosingTrades = context.todayLosingTradesCount + (isCurrentLoss ? 1 : 0);
  if (totalLosingTrades >= 2 && netDailyPnl < -0.03 * context.capital) {
    mistakes.push("revenge_trading");
  }

  // 5. Overtrading: Trades > planned_trades_per_day (5)
  const totalTradesCount = context.todayTradeCount + 1;
  if (totalTradesCount > 5) {
    mistakes.push("overtrading");
  }

  // 6. Missing critical fields: entry_time / exit_time / stop_set? / setup empty
  const hasExit = trade.exit_price !== null && trade.exit_price !== undefined;
  const isEntryTimeMissing = !trade.entry_time || trade.entry_time.trim() === "";
  const isExitTimeMissing = hasExit && (!trade.exit_time || trade.exit_time.trim() === "");
  const isStopLossMissing = trade.stop_loss === null || trade.stop_loss === undefined;
  const isNotesMissing = !trade.notes || trade.notes.trim() === "";
  if (isEntryTimeMissing || isExitTimeMissing || isStopLossMissing || isNotesMissing) {
    mistakes.push("missing_fields");
  }

  // 7. Buy price > sell price (long): entry > exit for long direction
  if (trade.direction === "long" && trade.exit_price !== null && trade.exit_price !== undefined) {
    if (trade.entry_price > trade.exit_price) {
      mistakes.push("data_integrity_buy_sell");
    }
  }

  // 8. Missing/wrong symbol or date: symbol empty OR date invalid
  const isSymbolEmpty = !trade.stock || trade.stock.trim() === "";
  const isDateInvalid = !trade.date || isNaN(Date.parse(trade.date));
  if (isSymbolEmpty || isDateInvalid) {
    mistakes.push("data_integrity_symbol_date");
  }

  // Backward compatibility legacy rules
  if (trade.risk_pct > 1) {
    if (!mistakes.includes("over_risk")) mistakes.push("over_risk");
  }
  if (!trade.followed_plan) {
    if (!mistakes.includes("plan_not_followed")) mistakes.push("plan_not_followed");
  }
  if (trade.pnl < 0 && trade.risk_pct > 1.5) {
    if (!mistakes.includes("over_leveraged")) mistakes.push("over_leveraged");
  }

  return mistakes;
}

function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++; // skip \n
      }
      row.push(currentVal.trim());
      lines.push(row);
      row = [];
      currentVal = "";
    } else {
      currentVal += char;
    }
  }
  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    lines.push(row);
  }
  return lines;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const csvText = await file.text();
    const parsed = parseCSV(csvText);

    if (parsed.length <= 1) {
      return NextResponse.json({ error: "CSV file is empty or missing data rows" }, { status: 400 });
    }

    const headers = parsed[0].map(h => h.trim().toLowerCase());
    const dataRows = parsed.slice(1);

    const validTrades: any[] = [];
    const errors: string[] = [];

    // Helper to find column index (case-insensitive, allows space or underscore)
    const colIndex = (name: string) => {
      const normalizedName = name.toLowerCase().replace(/[\s_]+/g, "");
      return headers.findIndex(h => h.replace(/[\s_]+/g, "") === normalizedName);
    };

    const stockIdx = colIndex("stock") !== -1 ? colIndex("stock") : colIndex("symbol");
    const dateIdx = colIndex("date");
    const directionIdx = colIndex("direction");
    const entryPriceIdx = colIndex("entryprice");
    const exitPriceIdx = colIndex("exitprice");
    const quantityIdx = colIndex("quantity");
    const stopLossIdx = colIndex("stoploss");
    const targetIdx = colIndex("targetprice") !== -1 ? colIndex("targetprice") : colIndex("target");
    const followedPlanIdx = colIndex("followedplan");
    const emotionIdx = colIndex("emotion") !== -1 ? colIndex("emotion") : colIndex("emotionbefore");
    const notesIdx = colIndex("notes");
    const sentimentIdx = colIndex("marketsentiment");
    const entryTimeIdx = colIndex("entrytime");
    const exitTimeIdx = colIndex("exittime");

    // Fetch user profile trading capital to calculate risk_pct
    const { data: profile } = await supabase
      .from("profiles")
      .select("trading_capital")
      .eq("id", user.id)
      .single();
    const capital = profile?.trading_capital || 100000;

    const cleanFloat = (val: string | undefined): string => {
      if (!val) return "";
      return val.replace(/["',\s]/g, "");
    };

    const cleanTime = (val: string | undefined): string | null => {
      if (!val) return null;
      const trimmed = val.trim();
      const lower = trimmed.toLowerCase();
      if (lower === "" || lower === "not required" || lower === "not_required" || lower === "null" || lower === "undefined" || lower === "not required?") {
        return null;
      }
      return trimmed;
    };

    const parseYesNoOrNumber = (val: string | undefined, isStopLoss: boolean, entry: number, direction: string): number | null => {
      if (!val) return null;
      const cleaned = val.trim().toLowerCase();
      if (cleaned === "" || cleaned === "not required" || cleaned === "not_required" || cleaned === "null" || cleaned === "undefined") return null;
      if (cleaned === "yes" || cleaned === "y" || cleaned === "true") {
        if (isStopLoss) {
          return direction === "long" ? entry * 0.99 : entry * 1.01;
        } else {
          return direction === "long" ? entry * 1.02 : entry * 0.98;
        }
      }
      if (cleaned === "no" || cleaned === "n" || cleaned === "false") {
        return null;
      }
      const num = parseFloat(cleaned.replace(/["',\s]/g, ""));
      return isNaN(num) ? null : num;
    };

    // Date context caching helper for multi-trade and revenge trading checks on imported rows
    const dateContexts: Record<string, { dbTradeCount: number; dbLosingCount: number; dbNetPnl: number; importedList: any[] }> = {};

    const getDateContext = async (dateStr: string) => {
      if (!dateContexts[dateStr]) {
        // Query DB for this date
        const { count: dbTradeCount } = await supabase
          .from("trades")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("date", dateStr);

        const { data: dbTrades } = await supabase
          .from("trades")
          .select("pnl, exit_price")
          .eq("user_id", user.id)
          .eq("date", dateStr);

        const losingCount = (dbTrades || []).filter(t => t.exit_price !== null && (t.pnl || 0) < 0).length;
        const netPnl = (dbTrades || []).reduce((sum, t) => sum + (t.pnl || 0), 0);

        dateContexts[dateStr] = {
          dbTradeCount: dbTradeCount || 0,
          dbLosingCount: losingCount,
          dbNetPnl: netPnl,
          importedList: []
        };
      }
      
      const ctx = dateContexts[dateStr];
      const importedTradeCount = ctx.importedList.length;
      const importedLosingCount = ctx.importedList.filter(t => t.exit_price !== null && t.pnl < 0).length;
      const importedNetPnl = ctx.importedList.reduce((sum, t) => sum + t.pnl, 0);

      return {
        tradeCount: ctx.dbTradeCount + importedTradeCount,
        losingCount: ctx.dbLosingCount + importedLosingCount,
        netPnl: ctx.dbNetPnl + importedNetPnl,
        addImportedTrade: (trade: any) => {
          ctx.importedList.push(trade);
        }
      };
    };

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      // Skip empty or spacer rows
      if (row.length === 0 || (row.length === 1 && !row[0])) continue;

      const rowNum = i + 2; // Row number in Excel/CSV (1-indexed + header)

      try {
        const rawStock = stockIdx !== -1 ? row[stockIdx] : "";
        const rawDirection = directionIdx !== -1 ? row[directionIdx]?.trim().toLowerCase() : "";
        
        // Parse date first
        let dateVal = new Date().toISOString().split("T")[0];
        if (dateIdx !== -1 && row[dateIdx]) {
          const d = new Date(row[dateIdx]);
          if (!isNaN(d.getTime())) {
            dateVal = d.toISOString().split("T")[0];
          }
        }

        const entryStr = entryPriceIdx !== -1 ? cleanFloat(row[entryPriceIdx]) : "";
        const rawEntryPrice = entryStr ? parseFloat(entryStr) : NaN;

        const exitStr = exitPriceIdx !== -1 ? cleanFloat(row[exitPriceIdx]) : "";
        const rawExitPrice = exitStr ? parseFloat(exitStr) : null;

        const qtyStr = quantityIdx !== -1 ? cleanFloat(row[quantityIdx]) : "";
        const rawQty = qtyStr ? parseInt(qtyStr) : NaN;

        const directionVal = rawDirection === "short" || rawDirection === "sell" ? "short" : "long";

        const rawSLVal = stopLossIdx !== -1 ? row[stopLossIdx] : undefined;
        const rawTargetVal = targetIdx !== -1 ? row[targetIdx] : undefined;

        const rawSL = parseYesNoOrNumber(rawSLVal, true, rawEntryPrice, directionVal);
        const rawTarget = parseYesNoOrNumber(rawTargetVal, false, rawEntryPrice, directionVal);

        const rawFollowedPlan = followedPlanIdx !== -1 ? row[followedPlanIdx]?.trim().toLowerCase() : "";
        const rawEmotion = emotionIdx !== -1 ? row[emotionIdx] : "Calm";
        const rawNotes = notesIdx !== -1 ? row[notesIdx] : "";
        const rawSentiment = sentimentIdx !== -1 ? row[sentimentIdx] : "Neutral";
        const rawEntryTime = entryTimeIdx !== -1 ? cleanTime(row[entryTimeIdx]) : null;
        const rawExitTime = exitTimeIdx !== -1 ? cleanTime(row[exitTimeIdx]) : null;

        // Validation mapping
        const tradeObj: any = {
          stock: rawStock,
          direction: directionVal,
          entry_price: isNaN(rawEntryPrice) ? undefined : rawEntryPrice,
          quantity: isNaN(rawQty) ? undefined : rawQty,
        };

        if (rawExitPrice && !isNaN(rawExitPrice)) tradeObj.exit_price = rawExitPrice;
        if (rawSL && !isNaN(rawSL)) tradeObj.stop_loss = rawSL;
        if (rawTarget && !isNaN(rawTarget)) tradeObj.target_price = rawTarget;
        
        tradeObj.followed_plan = !(rawFollowedPlan === "no" || rawFollowedPlan === "false");
        if (rawEmotion) tradeObj.emotion_before = rawEmotion;
        if (rawNotes) tradeObj.notes = rawNotes;
        if (rawSentiment) tradeObj.market_sentiment = rawSentiment;
        if (rawEntryTime) tradeObj.entry_time = rawEntryTime;
        if (rawExitTime) tradeObj.exit_time = rawExitTime;

        // Validate trade object with Zod
        const validation = tradeSchema.safeParse(tradeObj);
        if (!validation.success) {
          const fieldErrors = validation.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join(", ");
          errors.push(`Row ${rowNum}: ${fieldErrors}`);
          continue;
        }

        // Calculations
        const validated = validation.data;
        const pnl = validated.exit_price
          ? validated.direction === "long"
            ? (validated.exit_price - validated.entry_price) * validated.quantity
            : (validated.entry_price - validated.exit_price) * validated.quantity
          : 0;

        const riskAmount = validated.stop_loss
          ? Math.abs(validated.entry_price - validated.stop_loss) * validated.quantity
          : 0;
        const riskPct = (riskAmount / capital) * 100;

        const slFollowed = validated.stop_loss
          ? validated.direction === "long"
            ? !validated.exit_price || validated.exit_price >= validated.stop_loss
            : !validated.exit_price || validated.exit_price <= validated.stop_loss
          : false;

        // Get daily context for this date
        const dateCtx = await getDateContext(dateVal);

        // Detect Mistakes with Context
        const mistakes = detectMistakes({
          ...validated,
          pnl,
          risk_pct: riskPct,
          date: dateVal
        }, {
          capital,
          todayTradeCount: dateCtx.tradeCount,
          todayLosingTradesCount: dateCtx.losingCount,
          todayNetPnl: dateCtx.netPnl
        });

        const tradeData = {
          ...validated,
          user_id: user.id,
          date: dateVal,
          pnl: Math.round(pnl * 100) / 100,
          risk_pct: Math.round(riskPct * 100) / 100,
          sl_followed: slFollowed,
          mistakes,
        };

        // Add this trade to date context running calculations for subsequent trades
        dateCtx.addImportedTrade(tradeData);

        validTrades.push(tradeData);

      } catch (err: any) {
        errors.push(`Row ${rowNum}: Exception while parsing (${err.message})`);
      }
    }

    if (validTrades.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No valid trades found to import.",
        errors
      }, { status: 400 });
    }

    // Insert to database in bulk
    const { error: dbError } = await supabase
      .from("trades")
      .insert(validTrades);

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      insertedCount: validTrades.length,
      failedCount: errors.length,
      errors
    });

  } catch (error: any) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: error.message || "Failed to import trades" }, { status: 500 });
  }
}
