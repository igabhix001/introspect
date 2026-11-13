import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { marketRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";
import { cache } from "@/lib/cache";
import {
  getFyersAuth,
  fetchNiftyAndVix,
  fetchMarketBreadth,
  fetchATR,
  getLastFyersError,
} from "@/lib/fyers/fyers-service";

export const dynamic = "force-dynamic";

// ATR-Adaptive Sentiment Engine Config
const CONFIG = {
  ATR_MULTIPLIER: 0.8,
  MIN_BUFFER_PERCENT: 0.0020,
  MAX_BUFFER_PERCENT: 0.0060,
  PCR_BULLISH_THRESHOLD: 1.20,
  PCR_BEARISH_THRESHOLD: 0.70,
};

// Cache TTL settings — tuned for Fyers Oct 2026 Data API Limits (50 req/min, 5000 req/day)
const LIVE_CACHE_TTL_OPEN_SECONDS = 10; // 10s when NSE is open (~6 calls/min max)
const LIVE_CACHE_TTL_CLOSED_SECONDS = 60; // 60s when market is closed
const LAST_KNOWN_LIVE_TTL_SECONDS = 600; // Keep last valid Fyers snapshot up to 10 min on transient glitches
const SIMULATED_CACHE_TTL_SECONDS = 60; // Keep fallback stable instead of changing randomly every second

function isNseMarketOpen(): boolean {
  const nowIst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = nowIst.getDay();
  const hours = nowIst.getHours();
  const minutes = nowIst.getMinutes();
  const isOpenDay = day >= 1 && day <= 5;
  const isAfterOpen = hours > 9 || (hours === 9 && minutes >= 15);
  const isBeforeClose = hours < 15 || (hours === 15 && minutes <= 30);
  return isOpenDay && isAfterOpen && isBeforeClose;
}

// GET: Fetch live market data with real Fyers or stable fallback
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limit per authenticated user (so shared office/mobile IPs don't collide)
    const identifier = getRateLimitIdentifier(request, user.id);
    const rateLimitResult = await marketRateLimit(identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

    // Check fresh cache first (before hitting Fyers)
    const responseCacheKey = "market:sentiment:live";
    const lastLiveCacheKey = "market:sentiment:last_live";
    const simulatedCacheKey = "market:sentiment:simulated_snapshot";

    const cachedResponse = cache.get<Record<string, unknown>>(responseCacheKey);
    if (cachedResponse && !cachedResponse.isStale) {
      return NextResponse.json(cachedResponse.data, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      });
    }

    const marketOpen = isNseMarketOpen();
    const market_status = marketOpen ? "OPEN" : "CLOSED";

    let niftyPrice = 0;
    let prevClose = 0;
    let todayOpen = 0;
    let vix = 0;
    let pcr = 0;
    let advances = 0;
    let declines = 0;
    let atrValue = 120;
    let dataSource: "fyers_live" | "simulated" = "simulated";
    let isDataValid = false;

    // Try real Fyers API first
    const auth = await getFyersAuth();

    if (auth) {
      try {
        // Combine Nifty + VIX into 1 quote request; Breadth & ATR are cached 60s internally
        const [niftyAndVix, breadthData, atrData] = await Promise.all([
          fetchNiftyAndVix(auth.token, auth.appId),
          fetchMarketBreadth(auth.token, auth.appId),
          fetchATR(auth.token, auth.appId),
        ]);

        if (niftyAndVix && niftyAndVix.nifty.current > 0) {
          niftyPrice = niftyAndVix.nifty.current;
          prevClose = niftyAndVix.nifty.prevClose;
          todayOpen = niftyAndVix.nifty.open;
          vix = niftyAndVix.vix ?? 14;
          pcr = breadthData?.pcr ?? 1.0;
          advances = breadthData?.advances ?? 25;
          declines = breadthData?.declines ?? 25;
          atrValue = atrData ?? 120;
          dataSource = "fyers_live";
          isDataValid = niftyPrice > 0 && vix > 0;
        }
      } catch (err) {
        console.error("Fyers fetch error:", err);
      }
    }

    // If live Fyers fetch failed momentarily (e.g. brief 429 or network hiccup),
    // serve the last-known live snapshot rather than jumping to random numbers
    if (!isDataValid) {
      const lastLive = cache.get<Record<string, unknown>>(lastLiveCacheKey);
      if (lastLive) {
        const staleLivePayload = {
          ...lastLive.data,
          market_status,
          stale_fallback: true,
          last_error: getLastFyersError()?.message ?? null,
        };
        cache.set(responseCacheKey, staleLivePayload, 10, 10);
        return NextResponse.json(staleLivePayload, {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          },
        });
      }

      // True fallback when no Fyers token / data is available: use a stable cached snapshot
      const cachedSim = cache.get<ReturnType<typeof generateSimulatedData>>(simulatedCacheKey);
      const sim = cachedSim?.data ?? generateSimulatedData();
      if (!cachedSim) {
        cache.set(simulatedCacheKey, sim, SIMULATED_CACHE_TTL_SECONDS, SIMULATED_CACHE_TTL_SECONDS);
      }
      niftyPrice = sim.niftyPrice;
      prevClose = sim.prevClose;
      todayOpen = sim.todayOpen;
      vix = sim.vix;
      pcr = sim.pcr;
      advances = sim.advances;
      declines = sim.declines;
      atrValue = sim.atrValue;
      dataSource = "simulated";
    }

    // ATR-Adaptive Zone Classification
    const ref_buy = Math.max(todayOpen, prevClose);
    const ref_sell = Math.min(todayOpen, prevClose);

    let buffer_percent = ref_buy > 0 ? (atrValue / ref_buy) * CONFIG.ATR_MULTIPLIER : CONFIG.MIN_BUFFER_PERCENT;
    buffer_percent = Math.max(CONFIG.MIN_BUFFER_PERCENT, Math.min(CONFIG.MAX_BUFFER_PERCENT, buffer_percent));

    const bullish_threshold = ref_buy * (1 + buffer_percent);
    const bearish_threshold = ref_sell * (1 - buffer_percent);

    let market_zone: "BULLISH" | "BEARISH" | "NO_TRADE" = "NO_TRADE";
    if (niftyPrice >= bullish_threshold) {
      market_zone = "BULLISH";
    } else if (niftyPrice <= bearish_threshold) {
      market_zone = "BEARISH";
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
    const priceScore = ref_buy > 0 ? Math.min(100, Math.max(0, ((niftyPrice - ref_buy) / ref_buy) * 10000 + 50)) : 50;
    const breadthScore = (advances / 50) * 100;
    const pcrScore = Math.min(100, Math.max(0, (pcr - 0.5) * 100));
    const vixScore = Math.max(0, 100 - (vix - 10) * 3);
    const radar_score = Math.round(priceScore * 0.3 + breadthScore * 0.3 + pcrScore * 0.2 + vixScore * 0.2);

    // Regime Detection
    let regime: "TREND_DAY" | "VOLATILE" | "COMPRESSION" | "BALANCED" = "BALANCED";
    if (vix > 25) regime = "VOLATILE";
    else if (vix < 12) regime = "COMPRESSION";
    else if (momentum === "RISING" && advances >= 35 && radar_score > 65) regime = "TREND_DAY";

    // Reasons - simplified user-facing messages
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

    const mapZoneToBias = (zone: "BULLISH" | "BEARISH" | "NO_TRADE") => {
      if (zone === "BULLISH") return "Positive Market Bias";
      if (zone === "BEARISH") return "Negative Market Bias";
      return "Neutral Market Bias";
    };

    const zoneName = mapZoneToBias(market_zone);
    const trackingKey = "market:sentiment:tracking";
    let stability_duration = "00:00";

    const trackingState = cache.get<{ current_zone: string; start_time: number }>(trackingKey);
    const now = Date.now();
    if (trackingState && trackingState.data.current_zone === zoneName) {
      const start = trackingState.data.start_time;
      const diffSecs = Math.floor((now - start) / 1000);
      const hours = Math.floor(diffSecs / 3600);
      const mins = Math.floor((diffSecs % 3600) / 60);
      const secs = diffSecs % 60;
      if (hours > 0) {
        stability_duration = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      } else {
        stability_duration = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      }
    } else {
      cache.set(trackingKey, { current_zone: zoneName, start_time: now }, 86400, 86400);
    }

    const lastError = dataSource === "simulated" ? getLastFyersError()?.message ?? null : null;

    const responseData = {
      nifty_price: Math.round(niftyPrice * 100) / 100,
      vix: Math.round(vix * 100) / 100,
      pcr: Math.round(pcr * 100) / 100,
      advances,
      declines,
      market_zone: zoneName,
      raw_zone: zoneName,
      radar_score: Math.max(0, Math.min(100, Math.round(radar_score * 10) / 10)),
      confidence,
      stability,
      momentum,
      regime,
      reasons,
      data_source: dataSource,
      market_status,
      timestamp: new Date().toISOString(),
      failsafe_mode: dataSource === "simulated",
      last_error: lastError,
      zone_status: "CONFIRMED" as const,
      confirmation_count: 3,
      stability_duration,
    };

    if (dataSource === "fyers_live") {
      const ttl = marketOpen ? LIVE_CACHE_TTL_OPEN_SECONDS : LIVE_CACHE_TTL_CLOSED_SECONDS;
      cache.set(responseCacheKey, responseData, ttl, ttl);
      cache.set(lastLiveCacheKey, responseData, LAST_KNOWN_LIVE_TTL_SECONDS, LAST_KNOWN_LIVE_TTL_SECONDS);
    } else {
      cache.set(responseCacheKey, responseData, 15, 15);
    }

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("Market data error:", error);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}

// Stable deterministic fallback when Fyers feed is offline
function generateSimulatedData() {
  const prevClose = 24250;
  const todayOpen = 24265;
  const niftyPrice = 24280;
  const atrValue = 120;
  const vix = 14.2;
  const pcr = 1.02;
  const advances = 26;
  const declines = 24;
  return { niftyPrice, prevClose, todayOpen, vix, pcr, advances, declines, atrValue };
}
