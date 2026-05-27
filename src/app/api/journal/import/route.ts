import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { tradeSchema } from "@/lib/validation/schemas";

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

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      // Skip empty or spacer rows
      if (row.length === 0 || (row.length === 1 && !row[0])) continue;

      const rowNum = i + 2; // Row number in Excel/CSV (1-indexed + header)

      try {
        const rawStock = stockIdx !== -1 ? row[stockIdx] : "";
        const rawDirection = directionIdx !== -1 ? row[directionIdx]?.trim().toLowerCase() : "";
        const rawEntryPrice = entryPriceIdx !== -1 ? parseFloat(row[entryPriceIdx]) : NaN;
        const rawExitPrice = exitPriceIdx !== -1 && row[exitPriceIdx] ? parseFloat(row[exitPriceIdx]) : null;
        const rawQty = quantityIdx !== -1 ? parseInt(row[quantityIdx]) : NaN;
        const rawSL = stopLossIdx !== -1 && row[stopLossIdx] ? parseFloat(row[stopLossIdx]) : null;
        const rawTarget = targetIdx !== -1 && row[targetIdx] ? parseFloat(row[targetIdx]) : null;
        const rawFollowedPlan = followedPlanIdx !== -1 ? row[followedPlanIdx]?.trim().toLowerCase() : "";
        const rawEmotion = emotionIdx !== -1 ? row[emotionIdx] : "Calm";
        const rawNotes = notesIdx !== -1 ? row[notesIdx] : "";
        const rawSentiment = sentimentIdx !== -1 ? row[sentimentIdx] : "Neutral";
        const rawEntryTime = entryTimeIdx !== -1 ? row[entryTimeIdx] : null;
        const rawExitTime = exitTimeIdx !== -1 ? row[exitTimeIdx] : null;

        // Validation mapping
        const tradeObj: any = {
          stock: rawStock,
          direction: rawDirection === "short" || rawDirection === "sell" ? "short" : "long",
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

        // Detect Mistakes
        const mistakes: string[] = [];
        if (!validated.stop_loss) mistakes.push("no_stop_loss");
        if (riskPct > 1) mistakes.push("over_risk");
        if (!validated.followed_plan) mistakes.push("plan_not_followed");
        if (pnl < 0 && riskPct > 1.5) mistakes.push("over_leveraged");

        // Format Date
        let dateVal = new Date().toISOString().split("T")[0];
        if (dateIdx !== -1 && row[dateIdx]) {
          const d = new Date(row[dateIdx]);
          if (!isNaN(d.getTime())) {
            dateVal = d.toISOString().split("T")[0];
          }
        }

        validTrades.push({
          ...validated,
          user_id: user.id,
          date: dateVal,
          pnl: Math.round(pnl * 100) / 100,
          risk_pct: Math.round(riskPct * 100) / 100,
          sl_followed: slFollowed,
          mistakes,
        });

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
