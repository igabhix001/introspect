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

interface CacheEntry {
  close: number;
  low: number;
  high: number;
  atr: number;
  data_source: "fyers_live" | "simulated";
  timestamp: number;
}

const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15000; // 15 seconds Cache-TTL

export async function GET(request: NextRequest) {
  // Rate limit check
  const identifier = getRateLimitIdentifier(request);
  const rateLimitResult = await apiRateLimit(identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: rateLimitResult.message }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tf = searchParams.get("timeframe") || "15m";
    const symbol = searchParams.get("symbol") || "Nifty 50";
    const cacheKey = `${symbol.toUpperCase()}_${tf}`;

    // Check cache first to avoid Auth network latency on cache hit
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        timeframe: tf,
        close: cached.close,
        low: cached.low,
        high: cached.high,
        atr: cached.atr,
        data_source: cached.data_source,
        cached: true,
        timestamp: new Date(cached.timestamp).toISOString()
      });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const fyersResolution = TIMEFRAME_MAPPING[tf] || "15";

    let fyersSymbol = "NSE:NIFTY50-INDEX";
    if (symbol === "Bank Nifty" || symbol === "Nifty Bank") {
      fyersSymbol = "NSE:NIFTYBANK-INDEX";
    } else if (symbol === "Fin Nifty") {
      fyersSymbol = "NSE:NIFTYFINSERVICE-INDEX";
    } else if (symbol === "Midcap Nifty") {
      fyersSymbol = "NSE:MIDCPNIFTY-INDEX";
    } else if (symbol === "Nifty Next 50") {
      fyersSymbol = "NSE:NIFTYNEXT50-INDEX";
    } else if (symbol === "Nifty 50") {
      fyersSymbol = "NSE:NIFTY50-INDEX";
    } else if (symbol.includes(":")) {
      fyersSymbol = symbol;
    } else {
      fyersSymbol = `NSE:${symbol.toUpperCase()}-EQ`;
    }

    let closePrice = 0;
    let lowPrice = 0;
    let highPrice = 0;
    let atrVal = 0;
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

        let data: any = null;
        if (res.ok) {
          data = await res.json();
          if (data.s === "ok" && data.candles && data.candles.length > 0) {
            const latestCandle = data.candles[data.candles.length - 1];
            const completedCandle = data.candles.length >= 2 ? data.candles[data.candles.length - 2] : latestCandle;
            // Candle format: [timestamp, open, high, low, close, volume]
            closePrice = latestCandle[4];
            highPrice = completedCandle[2];
            lowPrice = completedCandle[3];
            dataSource = "fyers_live";
 
            // Calculate ATR from historical candles
            if (data.candles.length >= 15) {
              let trSum = 0;
              for (let i = data.candles.length - 14; i < data.candles.length; i++) {
                const high = data.candles[i][2];
                const low = data.candles[i][3];
                const prevClose = data.candles[i - 1][4];
                const tr = Math.max(
                  high - low,
                  Math.abs(high - prevClose),
                  Math.abs(low - prevClose)
                );
                trSum += tr;
              }
              atrVal = trSum / 14;
            } else {
              atrVal = closePrice * 0.015;
            }
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
      if (symbol === "Bank Nifty" || symbol === "Nifty Bank") {
        basePrice = 48000;
        volMultiplier = 3.0;
      } else if (symbol === "Fin Nifty") {
        basePrice = 21200;
        volMultiplier = 1.25;
      } else if (symbol === "Midcap Nifty") {
        basePrice = 10800;
        volMultiplier = 0.75;
      } else if (symbol === "Nifty Next 50") {
        basePrice = 62000;
        volMultiplier = 1.5;
      } else {
        // Deterministic simulated price based on symbol name
        let hash = 0;
        const cleanSymbol = symbol.split(":")[1] || symbol;
        for (let i = 0; i < cleanSymbol.length; i++) {
          hash = cleanSymbol.charCodeAt(i) + ((hash << 5) - hash);
        }
        basePrice = 100 + (Math.abs(hash) % 2000); // price between 100 and 2100
        volMultiplier = 0.5 + ((Math.abs(hash) >> 4) % 3); // vol between 0.5 and 3.5
      }

      closePrice = basePrice + Math.floor(Math.random() * 6 * volMultiplier - 3 * volMultiplier);
      const tfMinutes = tf.endsWith("m") ? parseInt(tf) : tf.endsWith("h") ? parseInt(tf) * 60 : 1440;
      // Low is close price minus a simulated buffer relative to the timeframe
      const range = (2 + Math.sqrt(tfMinutes) * 0.8) * volMultiplier;
      lowPrice = closePrice - (Math.random() * 0.4 + 0.6) * range;
      highPrice = closePrice + (Math.random() * 0.4 + 0.6) * range;
      
      closePrice = Math.round(closePrice * 100) / 100;
      lowPrice = Math.round(lowPrice * 100) / 100;
      highPrice = Math.round(highPrice * 100) / 100;
      atrVal = closePrice * 0.015; // Simulated ATR: 1.5% of stock price
    }

    // Safety check: ensure stop loss gap is never zero or too small
    const minGap = atrVal > 0 ? atrVal * 0.5 : closePrice * 0.005; // at least 0.5 ATR or 0.5% of price
    if (Math.abs(closePrice - lowPrice) < minGap) {
      lowPrice = closePrice - minGap;
    }
    if (Math.abs(highPrice - closePrice) < minGap) {
      highPrice = closePrice + minGap;
    }

    closePrice = Math.round(closePrice * 100) / 100;
    lowPrice = Math.round(lowPrice * 100) / 100;
    highPrice = Math.round(highPrice * 100) / 100;

    responseCache.set(cacheKey, {
      close: closePrice,
      low: lowPrice,
      high: highPrice,
      atr: Math.round(atrVal * 100) / 100,
      data_source: dataSource,
      timestamp: Date.now()
    });

    return NextResponse.json({
      timeframe: tf,
      close: closePrice!,
      low: lowPrice!,
      high: highPrice!,
      atr: Math.round(atrVal * 100) / 100,
      data_source: dataSource,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Timeframe-low error:", error);
    return NextResponse.json({ error: "Failed to resolve timeframe prices" }, { status: 500 });
  }
}
