import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { tradeSchema } from "@/lib/validation/schemas";
import { autoCheckInChallenge } from "@/lib/services/challenge-service";
import { apiRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

interface Execution {
  symbol: string;
  tradeType: "BUY" | "SELL";
  quantity: number;
  price: number;
  time: Date;
  rowNum: number;
}

interface ReconstructedTrade {
  stock: string;
  direction: "long" | "short";
  entry_price: number;
  exit_price: number;
  quantity: number;
  pnl: number;
  entry_time: string;
  exit_time: string;
  date: string;
  holding_duration_mins: number;
  holding_duration_str: string;
  mistakes: string[];
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

function parseExecutionTime(val: string): Date | null {
  if (!val) return null;
  const trimmed = val.trim();
  let d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d;

  // Try parsing DD-MM-YYYY HH:MM:SS or DD/MM/YYYY HH:MM:SS
  const parts = trimmed.split(/[\sT]+/);
  if (parts.length >= 1) {
    const dateParts = parts[0].split(/[\-\/]/);
    const timeParts = (parts[1] || "00:00:00").split(":");
    if (dateParts.length === 3) {
      let day = parseInt(dateParts[0]);
      let month = parseInt(dateParts[1]) - 1; // 0-indexed
      let year = parseInt(dateParts[2]);

      if (year < 100) year += 2000;

      // Handle YYYY-MM-DD instead of DD-MM-YYYY
      if (dateParts[0].length === 4) {
        year = parseInt(dateParts[0]);
        month = parseInt(dateParts[1]) - 1;
        day = parseInt(dateParts[2]);
      }

      const hour = parseInt(timeParts[0] || "0");
      const minute = parseInt(timeParts[1] || "0");
      const second = parseInt(timeParts[2] || "0");

      d = new Date(year, month, day, hour, minute, second);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

function formatHoldingDuration(mins: number): string {
  if (mins < 0) return "0 min";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}

function formatTimeOnly(d: Date): string {
  return d.toTimeString().split(" ")[0]; // "HH:MM:SS"
}

function formatDateOnly(d: Date): string {
  return d.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function finalizeReconstructedTrade(trade: {
  direction: "long" | "short";
  executions: Execution[];
  totalBuyQty: number;
  totalBuyVal: number;
  totalSellQty: number;
  totalSellVal: number;
  entryTime: Date;
}, exitTime: Date): ReconstructedTrade {
  const isLong = trade.direction === "long";
  const qty = isLong ? trade.totalBuyQty : trade.totalSellQty;
  const avgEntry = isLong 
    ? trade.totalBuyVal / trade.totalBuyQty 
    : trade.totalSellVal / trade.totalSellQty;
  const avgExit = isLong 
    ? trade.totalSellVal / trade.totalSellQty 
    : trade.totalBuyVal / trade.totalBuyQty;

  const grossPnl = isLong 
    ? (avgExit - avgEntry) * qty 
    : (avgEntry - avgExit) * qty;

  const holdingDurationMinutes = Math.round((exitTime.getTime() - trade.entryTime.getTime()) / 60000);
  const holdingDurationStr = formatHoldingDuration(holdingDurationMinutes);

  // Behavioral detection engine rules (Self-contained logic)
  const mistakes: string[] = [];

  // Averaging Down Detection: adding entries at worse price
  let lastPrice = -1;
  let isAveragingDown = false;
  for (const exec of trade.executions) {
    if (trade.direction === "long" && exec.tradeType === "BUY") {
      if (lastPrice !== -1 && exec.price < lastPrice) {
        isAveragingDown = true;
      }
      lastPrice = exec.price;
    } else if (trade.direction === "short" && exec.tradeType === "SELL") {
      if (lastPrice !== -1 && exec.price > lastPrice) {
        isAveragingDown = true;
      }
      lastPrice = exec.price;
    }
  }
  if (isAveragingDown) {
    mistakes.push("averaging_down");
  }

  // Early Profit Booking: winning trade duration is < 5 mins (significantly short)
  if (grossPnl > 0 && holdingDurationMinutes <= 5) {
    mistakes.push("early_profit_booking");
  }

  // Holding Losers Too Long: losing trade duration is > 45 mins
  if (grossPnl < 0 && holdingDurationMinutes >= 45) {
    mistakes.push("holding_losers_too_long");
  }

  return {
    stock: trade.executions[0].symbol,
    direction: trade.direction,
    entry_price: Math.round(avgEntry * 100) / 100,
    exit_price: Math.round(avgExit * 100) / 100,
    quantity: qty,
    pnl: Math.round(grossPnl * 100) / 100,
    entry_time: formatTimeOnly(trade.entryTime),
    exit_time: formatTimeOnly(exitTime),
    date: formatDateOnly(trade.entryTime),
    holding_duration_mins: holdingDurationMinutes,
    holding_duration_str: holdingDurationStr,
    mistakes,
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limiting
    const identifier = getRateLimitIdentifier(request, user.id);
    const rateLimitResult = await apiRateLimit(identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

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

    // Find columns using robust name matching
    const colIndex = (keywords: string[]) => {
      return headers.findIndex(h => keywords.some(kw => h.includes(kw)));
    };

    const stockIdx = colIndex(["symbol", "stock", "instrument"]);
    const typeIdx = colIndex(["trade type", "tradetype", "trade_type", "type", "direction", "transaction", "transaction_type", "buy/sell", "action"]);
    const qtyIdx = colIndex(["quantity", "qty", "vol", "volume"]);
    const priceIdx = colIndex(["price", "rate", "avg price", "avg_price", "value"]);
    const timeIdx = colIndex(["execution time", "executiontime", "time", "date", "datetime", "execution_time", "trade_time", "order_execution_time"]);

    if (stockIdx === -1 || typeIdx === -1 || qtyIdx === -1 || priceIdx === -1 || timeIdx === -1) {
      return NextResponse.json({
        error: "Missing required columns in CSV. Template must include: Symbol, Trade Type, Quantity, Price, and Execution Time."
      }, { status: 400 });
    }

    const executions: Execution[] = [];
    const ignoredRecords: Array<{ rowNum: number; symbol: string; reason: string }> = [];

    // Parse CSV rows into executions
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (row.length === 0 || (row.length === 1 && !row[0])) continue;

      const rowNum = i + 2; // Row number in Excel/CSV (1-indexed + header)
      const rawSymbol = row[stockIdx]?.trim().toUpperCase();
      const rawType = row[typeIdx]?.trim().toUpperCase();
      const rawQtyStr = row[qtyIdx]?.trim().replace(/["',\s]/g, "");
      const rawPriceStr = row[priceIdx]?.trim().replace(/["',\s]/g, "");
      const rawTimeStr = row[timeIdx]?.trim();

      if (!rawSymbol) {
        ignoredRecords.push({ rowNum, symbol: "Unknown", reason: "Missing Symbol" });
        continue;
      }

      const isBuy = rawType === "BUY" || rawType === "B" || rawType === "LONG";
      const isSell = rawType === "SELL" || rawType === "S" || rawType === "SHORT";
      if (!isBuy && !isSell) {
        ignoredRecords.push({ rowNum, symbol: rawSymbol, reason: `Invalid Trade Type: ${row[typeIdx]}` });
        continue;
      }

      const qty = parseInt(rawQtyStr);
      if (isNaN(qty) || qty <= 0) {
        ignoredRecords.push({ rowNum, symbol: rawSymbol, reason: `Invalid Quantity: ${row[qtyIdx]}` });
        continue;
      }

      const price = parseFloat(rawPriceStr);
      if (isNaN(price) || price <= 0) {
        ignoredRecords.push({ rowNum, symbol: rawSymbol, reason: `Invalid Price: ${row[priceIdx]}` });
        continue;
      }

      const time = parseExecutionTime(rawTimeStr);
      if (!time) {
        ignoredRecords.push({ rowNum, symbol: rawSymbol, reason: `Invalid Execution Time: ${row[timeIdx]}` });
        continue;
      }

      executions.push({
        symbol: rawSymbol,
        tradeType: isBuy ? "BUY" : "SELL",
        quantity: qty,
        price: price,
        time: time,
        rowNum: rowNum
      });
    }

    if (executions.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No valid execution rows found to process.",
        ignoredCount: ignoredRecords.length,
        ignoredRecords
      }, { status: 400 });
    }


    // Group executions by Symbol
    const grouped = executions.reduce((acc, exec) => {
      if (!acc[exec.symbol]) acc[exec.symbol] = [];
      acc[exec.symbol].push(exec);
      return acc;
    }, {} as Record<string, Execution[]>);

    const reconstructedTrades: ReconstructedTrade[] = [];
    const openPositionsReport: Array<{ symbol: string; direction: string; netQty: number; avgPrice: number; entryTime: string }> = [];

    // Reconstruct trades per symbol
    for (const symbol of Object.keys(grouped)) {
      const sorted = grouped[symbol].sort((a, b) => a.time.getTime() - b.time.getTime());

      let currentTrade: {
        direction: "long" | "short";
        executions: Execution[];
        totalBuyQty: number;
        totalBuyVal: number;
        totalSellQty: number;
        totalSellVal: number;
        entryTime: Date;
      } | null = null;

      let netQty = 0; // positive for net long, negative for net short

      for (const exec of sorted) {
        const isBuy = exec.tradeType === "BUY";
        const execQty = exec.quantity;
        const execPrice = exec.price;

        if (netQty === 0) {
          // Start a new trade cycle
          const dir = isBuy ? "long" : "short";
          currentTrade = {
            direction: dir,
            executions: [exec],
            totalBuyQty: isBuy ? execQty : 0,
            totalBuyVal: isBuy ? execQty * execPrice : 0,
            totalSellQty: isBuy ? 0 : execQty,
            totalSellVal: isBuy ? 0 : execQty * execPrice,
            entryTime: exec.time,
          };
          netQty = isBuy ? execQty : -execQty;
        } else {
          const currentDir = currentTrade!.direction;

          if (currentDir === "long") {
            if (isBuy) {
              netQty += execQty;
              currentTrade!.executions.push(exec);
              currentTrade!.totalBuyQty += execQty;
              currentTrade!.totalBuyVal += execQty * execPrice;
            } else {
              // SELL reduces the long position
              if (execQty < netQty) {
                netQty -= execQty;
                currentTrade!.executions.push(exec);
                currentTrade!.totalSellQty += execQty;
                currentTrade!.totalSellVal += execQty * execPrice;
              } else if (execQty === netQty) {
                netQty = 0;
                currentTrade!.executions.push(exec);
                currentTrade!.totalSellQty += execQty;
                currentTrade!.totalSellVal += execQty * execPrice;
                reconstructedTrades.push(finalizeReconstructedTrade(currentTrade!, exec.time));
                currentTrade = null;
              } else {
                // Reversal: SELL > netQty. Split the trade!
                const closeQty = netQty;
                currentTrade!.executions.push({
                  ...exec,
                  quantity: closeQty
                });
                currentTrade!.totalSellQty += closeQty;
                currentTrade!.totalSellVal += closeQty * execPrice;
                reconstructedTrades.push(finalizeReconstructedTrade(currentTrade!, exec.time));

                // Start new short trade with remainder
                const remainingQty = execQty - closeQty;
                currentTrade = {
                  direction: "short",
                  executions: [{
                    ...exec,
                    quantity: remainingQty
                  }],
                  totalBuyQty: 0,
                  totalBuyVal: 0,
                  totalSellQty: remainingQty,
                  totalSellVal: remainingQty * execPrice,
                  entryTime: exec.time,
                };
                netQty = -remainingQty;
              }
            }
          } else {
            // currentDir === "short"
            if (!isBuy) {
              netQty -= execQty;
              currentTrade!.executions.push(exec);
              currentTrade!.totalSellQty += execQty;
              currentTrade!.totalSellVal += execQty * execPrice;
            } else {
              // BUY reduces the short position
              const absNetQty = Math.abs(netQty);
              if (execQty < absNetQty) {
                netQty += execQty;
                currentTrade!.executions.push(exec);
                currentTrade!.totalBuyQty += execQty;
                currentTrade!.totalBuyVal += execQty * execPrice;
              } else if (execQty === absNetQty) {
                netQty = 0;
                currentTrade!.executions.push(exec);
                currentTrade!.totalBuyQty += execQty;
                currentTrade!.totalBuyVal += execQty * execPrice;
                reconstructedTrades.push(finalizeReconstructedTrade(currentTrade!, exec.time));
                currentTrade = null;
              } else {
                // Reversal: BUY > absNetQty. Split the trade!
                const closeQty = absNetQty;
                currentTrade!.executions.push({
                  ...exec,
                  quantity: closeQty
                });
                currentTrade!.totalBuyQty += closeQty;
                currentTrade!.totalBuyVal += closeQty * execPrice;
                reconstructedTrades.push(finalizeReconstructedTrade(currentTrade!, exec.time));

                // Start new long trade with remainder
                const remainingQty = execQty - closeQty;
                currentTrade = {
                  direction: "long",
                  executions: [{
                    ...exec,
                    quantity: remainingQty
                  }],
                  totalBuyQty: remainingQty,
                  totalBuyVal: remainingQty * execPrice,
                  totalSellQty: 0,
                  totalSellVal: 0,
                  entryTime: exec.time,
                };
                netQty = remainingQty;
              }
            }
          }
        }
      }

      // Add to open positions report if not closed
      if (netQty !== 0 && currentTrade) {
        const avgPrice = currentTrade.direction === "long"
          ? currentTrade.totalBuyVal / currentTrade.totalBuyQty
          : currentTrade.totalSellVal / currentTrade.totalSellQty;

        openPositionsReport.push({
          symbol,
          direction: currentTrade.direction,
          netQty: Math.abs(netQty),
          avgPrice: Math.round(avgPrice * 100) / 100,
          entryTime: currentTrade.entryTime.toLocaleString(),
        });
      }
    }

    // Duplicate Protection: Query existing trades on the dates present in the csv
    const dates = Array.from(new Set(reconstructedTrades.map(t => t.date)));
    
    let existingTrades: any[] = [];
    if (dates.length > 0) {
      const { data } = await supabase
        .from("trades")
        .select("stock, direction, quantity, entry_price, exit_price, entry_time, exit_time, date")
        .eq("user_id", user.id)
        .in("date", dates);
      existingTrades = data || [];
    }

    const uniqueTradesToInsert: any[] = [];
    let duplicatesCount = 0;

    for (const t of reconstructedTrades) {
      // Check if this trade details already match a record in the database
      const isDuplicate = existingTrades.some(ext =>
        ext.stock === t.stock &&
        ext.direction === t.direction &&
        ext.quantity === t.quantity &&
        Math.abs(Number(ext.entry_price) - t.entry_price) < 0.05 &&
        Math.abs(Number(ext.exit_price) - t.exit_price) < 0.05 &&
        ext.entry_time === t.entry_time &&
        ext.exit_time === t.exit_time &&
        ext.date === t.date
      );

      if (isDuplicate) {
        duplicatesCount++;
        ignoredRecords.push({
          rowNum: 0, // Mark as duplicate from DB comparison
          symbol: t.stock,
          reason: `Duplicate Trade: Already imported (${t.date} ${t.entry_time} - ${t.exit_time})`
        });
      } else {
        // Map to DB columns
        uniqueTradesToInsert.push({
          user_id: user.id,
          date: t.date,
          stock: t.stock,
          direction: t.direction,
          entry_price: t.entry_price,
          exit_price: t.exit_price,
          quantity: t.quantity,
          pnl: t.pnl,
          followed_plan: true,
          emotion_before: "Calm",
          notes: `Reconstructed from broker execution logs. Holding Duration: ${t.holding_duration_str}.`,
          market_sentiment: "Neutral",
          entry_time: t.entry_time,
          exit_time: t.exit_time,
          mistakes: t.mistakes,
          risk_pct: 0, // default
          sl_followed: true, // default
        });
      }
    }

    // Context-aware daily checks for overtrading and revenge trading in bulk imports
    let capital = 100000;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("capital")
        .eq("id", user.id)
        .single();
      if (profile?.capital) {
        capital = Number(profile.capital);
      }
    } catch (err) {
      console.error("Error fetching profile capital for import rules:", err);
    }

    for (const d of dates) {
      const existingOnDate = existingTrades.filter(ext => ext.date === d);
      const newOnDate = uniqueTradesToInsert.filter(t => t.date === d);

      const totalTrades = existingOnDate.length + newOnDate.length;
      
      const existingPnl = existingOnDate.reduce((sum, ext) => sum + Number(ext.pnl || 0), 0);
      const newPnl = newOnDate.reduce((sum, t) => sum + Number(t.pnl || 0), 0);
      const netDailyPnl = existingPnl + newPnl;

      const existingLosing = existingOnDate.filter(ext => Number(ext.pnl || 0) < 0).length;
      const newLosing = newOnDate.filter(t => Number(t.pnl || 0) < 0).length;
      const totalLosingTrades = existingLosing + newLosing;

      // Overtrading check: more than 5 trades per day
      const isOvertrading = totalTrades > 5;

      // Revenge trading check: 2 or more losses and daily drawdown exceeding 3% of capital
      const isRevengeTrading = totalLosingTrades >= 2 && netDailyPnl < -0.03 * capital;

      if (isOvertrading || isRevengeTrading) {
        for (const t of newOnDate) {
          if (isOvertrading && !t.mistakes.includes("overtrading")) {
            t.mistakes.push("overtrading");
          }
          if (isRevengeTrading && !t.mistakes.includes("revenge_trading")) {
            t.mistakes.push("revenge_trading");
          }
        }
      }
    }

    // Insert new unique trades into Supabase
    let insertedCount = 0;
    if (uniqueTradesToInsert.length > 0) {
      const { error: dbError } = await supabase
        .from("trades")
        .insert(uniqueTradesToInsert);

      if (dbError) throw dbError;
      insertedCount = uniqueTradesToInsert.length;

      // Trigger automatic challenge check-in
      try {
        await autoCheckInChallenge(supabase, user.id);
      } catch (err) {
        console.error("Challenge check-in error during bulk import:", err);
      }
    }

    return NextResponse.json({
      success: true,
      totalRows: parsed.length - 1,
      processedCount: executions.length,
      ignoredCount: ignoredRecords.length,
      completedCount: insertedCount,
      duplicatesCount,
      openPositionsCount: openPositionsReport.length,
      errors: ignoredRecords,
      openPositions: openPositionsReport,
    });

  } catch (error: any) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: error.message || "Failed to process and import trades" }, { status: 500 });
  }
}
