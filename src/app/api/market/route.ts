import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { cache, getCacheHeaders } from "@/lib/cache";
import {
  getFyersToken,
  fetchNiftyPrice,
  fetchVIX,
  fetchMarketBreadth,
  fetchATR,
} from "@/lib/fyers/fyers-service";

// ATR-Adaptive Sentiment Engine Config
const CONFIG = {
  ATR_MULTIPLIER: 0.8,
  MIN_BUFFER_PERCENT: 0.0020,
  MAX_BUFFER_PERCENT: 0.0060,
  PCR_BULLISH_THRESHOLD: 1.20,
  PCR_BEARISH_THRESHOLD: 0.70,
};

// Cache TTL settings
const CACHE_TTL_SECONDS = 5; // Fresh data for 5 seconds
const CACHE_STALE_SECONDS = 30; // Stale-while-revalidate for 30 seconds

// GET: Fetch live market data with real Fyers or fallback
export async function GET(request: NextRequest) {
  // Rate limiting (more lenient for market data - 200 requests per 15 min)
  const identifier = getRateLimitIdentifier(request);
  const rateLimitResult = await apiRateLimit(identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: rateLimitResult.message },
      { status: 429 }
    );
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check cache first (shared across all users for market data)
    const cacheKey = "market:sentiment:live";
    const cached = cache.get<Record<string, unknown>>(cacheKey);
    if (cached && !cached.isStale) {
      return NextResponse.json(cached.data, {
        headers: getCacheHeaders({ maxAge: CACHE_TTL_SECONDS, staleWhileRevalidate: CACHE_STALE_SECONDS, private: true }),
      });
    }

    let niftyPrice: number;
    let prevClose: number;
    let todayOpen: number;
    let vix: number;
    let pcr: number;
    let advances: number;
    let declines: number;
    let atrValue: number;
    let dataSource: "fyers_live" | "simulated" = "simulated";

    // Try real Fyers API first
    const token = await getFyersToken();

    if (!token) {
      return NextResponse.json({ error: "Fyers not connected", code: "NOT_CONNECTED" }, { status: 400 });
    }

    const [niftyData, vixData, breadthData, atrData] = await Promise.all([
      fetchNiftyPrice(token),
      fetchVIX(token),
      fetchMarketBreadth(token),
      fetchATR(token),
    ]);

    if (!niftyData) {
      return NextResponse.json({ error: "Fyers returned no data. Check API keys or market hours.", code: "NO_DATA" }, { status: 500 });
    }

    niftyPrice = niftyData.current;
    prevClose = niftyData.prevClose;
    todayOpen = niftyData.open;
    vix = vixData ?? 14;
    pcr = breadthData?.pcr ?? 1.0;
    advances = breadthData?.advances ?? 25;
    declines = breadthData?.declines ?? 25;
    atrValue = atrData ?? 120;
    dataSource = "fyers_live";

    // ATR-Adaptive Zone Classification
    const ref_buy = Math.max(todayOpen, prevClose);
    const ref_sell = Math.min(todayOpen, prevClose);

    let buffer_percent = (atrValue / ref_buy) * CONFIG.ATR_MULTIPLIER;
    buffer_percent = Math.max(CONFIG.MIN_BUFFER_PERCENT, Math.min(CONFIG.MAX_BUFFER_PERCENT, buffer_percent));

    const bullish_threshold = ref_buy * (1 + buffer_percent);
    const bearish_threshold = ref_sell * (1 - buffer_percent);

    let market_zone: "BULLISH" | "BEARISH" | "NO_TRADE";
    if (niftyPrice >= bullish_threshold) {
      market_zone = "BULLISH";
    } else if (niftyPrice <= bearish_threshold) {
      market_zone = "BEARISH";
    } else {
      market_zone = "NO_TRADE";
    }

    // Sentiment Score
    let sb = 0;
    if (advances >= 35) sb = 1;
    else if ((50 - advances) >= 35) sb = -1;

    let sd = 0;
    if (pcr >= CONFIG.PCR_BULLISH_THRESHOLD) sd = 1;
    else if (pcr <= CONFIG.PCR_BEARISH_THRESHOLD) sd = -1;

    const sentiment_score = sb + sd;

    // Confidence
    const confidence = Math.abs(sentiment_score) >= 2 ? "HIGH" : Math.abs(sentiment_score) === 1 ? "MODERATE" : "LOW";

    // Momentum
    const momentum = market_zone === "BULLISH" ? "RISING" : market_zone === "BEARISH" ? "WEAKENING" : "STEADY";

    // Stability
    const stability = vix > 20 ? "UNSTABLE" : vix > 15 ? "WATCH" : "STABLE";

    // Radar Score
    const priceScore = Math.min(100, Math.max(0, ((niftyPrice - ref_buy) / ref_buy) * 10000 + 50));
    const breadthScore = (advances / 50) * 100;
    const pcrScore = Math.min(100, Math.max(0, (pcr - 0.5) * 100));
    const vixScore = Math.max(0, 100 - (vix - 10) * 3);
    const radar_score = Math.round(priceScore * 0.3 + breadthScore * 0.3 + pcrScore * 0.2 + vixScore * 0.2);

    // Regime Detection
    let regime: "TREND_DAY" | "VOLATILE" | "COMPRESSION" | "BALANCED" = "BALANCED";
    if (vix > 25) regime = "VOLATILE";
    else if (vix < 12) regime = "COMPRESSION";
    else if (momentum === "RISING" && advances >= 35 && radar_score > 65) regime = "TREND_DAY";

    // Reasons - simplified per client doc Section 6 (no internal params exposed)
    const reasons: string[] = [];
    if (market_zone === "BULLISH") {
      reasons.push("Price trading above short-term resistance levels");
      if (advances >= 35) reasons.push("Market breadth currently bullish");
      if (pcr >= 1.2) reasons.push("Derivatives sentiment supporting upside");
      if (momentum === "RISING") reasons.push("Momentum rising across intraday timeframes");
    } else if (market_zone === "BEARISH") {
      reasons.push("Price trading below short-term support levels");
      if (declines >= 35) reasons.push("Market breadth currently bearish");
      if (pcr <= 0.7) reasons.push("Derivatives sentiment supporting downside");
      if (momentum === "WEAKENING") reasons.push("Momentum weakening across intraday timeframes");
    } else {
      reasons.push("Price trading within a defined range");
      reasons.push("Market breadth currently neutral");
      reasons.push("Momentum mixed across intraday timeframes");
    }
    reasons.push(vix > 20 ? "Volatility conditions elevated" : "Volatility conditions stable");

    const nowIst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const day = nowIst.getDay();
    const hours = nowIst.getHours();
    const minutes = nowIst.getMinutes();
    
    // Market is open Mon-Fri (1-5), 09:15 to 15:30
    const isOpenDay = day >= 1 && day <= 5;
    const isAfterOpen = hours > 9 || (hours === 9 && minutes >= 15);
    const isBeforeClose = hours < 15 || (hours === 15 && minutes <= 30);
    const market_status = (isOpenDay && isAfterOpen && isBeforeClose) ? "OPEN" : "CLOSED";

    // Response - only expose user-facing fields per client doc Section 2-5
    // Internal params (ATR, buffer %, thresholds, ref_buy/sell) are NOT exposed
    const responseData = {
      // Market Snapshot (Section 5)
      nifty_price: Math.round(niftyPrice * 100) / 100,
      vix: Math.round(vix * 100) / 100,
      pcr: Math.round(pcr * 100) / 100,
      advances,
      declines,
      // Sentiment Zone & Score (Section 3)
      market_zone,
      radar_score: Math.max(0, Math.min(100, radar_score)),
      // Market Conditions (Section 4)
      confidence,
      stability,
      momentum,
      regime,
      // Model Insight (Section 6)
      reasons,
      // Meta
      data_source: dataSource,
      market_status,
      timestamp: new Date().toISOString(),
    };

    // Cache the response for subsequent requests
    cache.set(cacheKey, responseData, CACHE_TTL_SECONDS, CACHE_STALE_SECONDS);

    return NextResponse.json(responseData, {
      headers: getCacheHeaders({ maxAge: CACHE_TTL_SECONDS, staleWhileRevalidate: CACHE_STALE_SECONDS, private: true }),
    });
  } catch (error) {
    console.error("Market data error:", error);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}

// Simulated data fallback (used when Fyers token not available)
function generateSimulatedData() {
  const prevClose = 22350;
  const todayOpen = prevClose + Math.floor(Math.random() * 100 - 50);
  const niftyPrice = todayOpen + Math.floor(Math.random() * 300 - 100);
  const atrValue = 100 + Math.random() * 80;
  const vix = 11 + Math.random() * 16;
  const pcr = 0.6 + Math.random() * 0.8;
  const advances = 15 + Math.floor(Math.random() * 30);
  const declines = 50 - advances;
  return { niftyPrice, prevClose, todayOpen, vix, pcr, advances, declines, atrValue };
}
