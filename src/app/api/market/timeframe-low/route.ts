import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getFyersToken } from "@/lib/fyers/fyers-service";
import { apiRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

const TIMEFRAME_MAPPING: Record<string, string> = {
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "1h": "60",
  "4h": "240",
  "1d": "1D"
};

export async function GET(request: NextRequest) {
  // Rate limit check
  const identifier = getRateLimitIdentifier(request);
  const rateLimitResult = await apiRateLimit(identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: rateLimitResult.message }, { status: 429 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tf = searchParams.get("timeframe") || "15m";
    const symbol = searchParams.get("symbol") || "Nifty 50";
    const fyersResolution = TIMEFRAME_MAPPING[tf] || "15";

    let fyersSymbol = "NSE:NIFTY50-INDEX";
    if (symbol === "Bank Nifty") {
      fyersSymbol = "NSE:NIFTYBANK-INDEX";
    } else if (symbol === "Fin Nifty") {
      fyersSymbol = "NSE:NIFTYFINSERVICE-INDEX";
    } else if (symbol === "Midcap Nifty") {
      fyersSymbol = "NSE:MIDCPNIFTY-INDEX";
    }

    let closePrice: number;
    let lowPrice: number;
    let highPrice: number;
    let dataSource: "fyers_live" | "simulated" = "simulated";

    const token = await getFyersToken();

    if (token) {
      const now = Math.floor(Date.now() / 1000);
      // Fetch sufficient window (e.g. 5 days for 1D, 2 days for intraday)
      const lookbackSeconds = fyersResolution === "1D" ? 86400 * 7 : 86400 * 2;
      const rangeFrom = now - lookbackSeconds;

      try {
        const res = await fetch(
          `https://api-t1.fyers.in/data/history?symbol=${fyersSymbol}&resolution=${fyersResolution}&date_format=0&range_from=${rangeFrom}&range_to=${now}&cont_flag=1`,
          {
            headers: {
              Authorization: `${process.env.FYERS_APP_ID}:${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.s === "ok" && data.candles && data.candles.length > 0) {
            const latestCandle = data.candles[data.candles.length - 1];
            // Candle format: [timestamp, open, high, low, close, volume]
            highPrice = latestCandle[2];
            lowPrice = latestCandle[3];
            closePrice = latestCandle[4];
            dataSource = "fyers_live";
          }
        }
      } catch (err) {
        console.error("Fyers history fetch error:", err);
      }
    }

    // Fallback if simulated or Fyers fetch failed
    if (dataSource === "simulated") {
      let basePrice = 22450;
      let volMultiplier = 1.0;
      if (symbol === "Bank Nifty") {
        basePrice = 48000;
        volMultiplier = 3.0;
      } else if (symbol === "Fin Nifty") {
        basePrice = 21200;
        volMultiplier = 1.25;
      } else if (symbol === "Midcap Nifty") {
        basePrice = 10800;
        volMultiplier = 0.75;
      }

      closePrice = basePrice + Math.floor(Math.random() * 60 * volMultiplier - 30 * volMultiplier);
      const tfMinutes = tf.endsWith("m") ? parseInt(tf) : tf.endsWith("h") ? parseInt(tf) * 60 : 1440;
      // Low is close price minus a simulated buffer relative to the timeframe
      const range = (20 + Math.sqrt(tfMinutes) * 8) * volMultiplier;
      lowPrice = closePrice - (Math.random() * 0.4 + 0.6) * range;
      highPrice = closePrice + (Math.random() * 0.4 + 0.6) * range;
      
      closePrice = Math.round(closePrice * 100) / 100;
      lowPrice = Math.round(lowPrice * 100) / 100;
      highPrice = Math.round(highPrice * 100) / 100;
    }

    return NextResponse.json({
      timeframe: tf,
      close: closePrice!,
      low: lowPrice!,
      high: highPrice!,
      data_source: dataSource,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Timeframe-low error:", error);
    return NextResponse.json({ error: "Failed to resolve timeframe prices" }, { status: 500 });
  }
}
