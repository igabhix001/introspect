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

interface Snapshot {
  timestamp: number;
  nifty_price: number;
  vix: number;
  pcr: number;
  advances: number;
  declines: number;
  raw_zone: "BULLISH" | "BEARISH" | "NO_TRADE";
}

interface SentimentHistoryState {
  snapshots: Snapshot[];
  last_valid: Snapshot | null;
  confirmed_zone: "BULLISH" | "BEARISH" | "NO_TRADE";
  zone_history: ("BULLISH" | "BEARISH" | "NO_TRADE")[];
  zone_stable_start: number | null;
  zone_changes: number[];
  confirmed_zone_history: ("BULLISH" | "BEARISH" | "NO_TRADE")[];
}

const HISTORY_CACHE_KEY = "market:sentiment:history_state";

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

    // Check Cache first for cached user response
    const responseCacheKey = "market:sentiment:live";
    const cachedResponse = cache.get<Record<string, unknown>>(responseCacheKey);
    if (cachedResponse && !cachedResponse.isStale) {
      return NextResponse.json(cachedResponse.data, {
        headers: getCacheHeaders({ maxAge: CACHE_TTL_SECONDS, staleWhileRevalidate: CACHE_STALE_SECONDS, private: true }),
      });
    }

    // Initialize/Retrieve History State
    let historyState = cache.get<SentimentHistoryState>(HISTORY_CACHE_KEY)?.data;
    if (!historyState) {
      historyState = {
        snapshots: [],
        last_valid: null,
        confirmed_zone: "NO_TRADE",
        zone_history: [],
        zone_stable_start: null,
        zone_changes: [],
        confirmed_zone_history: [],
      };
    }

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
    const token = await getFyersToken();

    if (token) {
      try {
        const [niftyData, vixData, breadthData, atrData] = await Promise.all([
          fetchNiftyPrice(token),
          fetchVIX(token),
          fetchMarketBreadth(token),
          fetchATR(token),
        ]);

        if (niftyData) {
          niftyPrice = niftyData.current;
          prevClose = niftyData.prevClose;
          todayOpen = niftyData.open;
          vix = vixData ?? 14;
          pcr = breadthData?.pcr ?? 1.0;
          advances = breadthData?.advances ?? 25;
          declines = breadthData?.declines ?? 25;
          atrValue = atrData ?? 120;
          dataSource = "fyers_live";

          // Validate Section 2.1
          isDataValid = niftyPrice > 0 && (advances + declines) === 50 && pcr >= 0.2 && pcr <= 3.0 && vix > 0;
        }
      } catch (err) {
        console.error("Fyers fetch error:", err);
      }
    }

    // Fallback strategy Section 2.2
    if (!isDataValid) {
      const nowMs = Date.now();
      // Check if last valid is fresh enough (<30s)
      if (historyState.last_valid && (nowMs - historyState.last_valid.timestamp < 30000)) {
        niftyPrice = historyState.last_valid.nifty_price;
        vix = historyState.last_valid.vix;
        pcr = historyState.last_valid.pcr;
        advances = historyState.last_valid.advances;
        declines = historyState.last_valid.declines;
        // Use default reference open/close/atr
        prevClose = 22350;
        todayOpen = 22360;
        atrValue = 120;
        dataSource = "fyers_live";
        isDataValid = true;
      } else {
        // Generate simulated data (always valid)
        const sim = generateSimulatedData();
        niftyPrice = sim.niftyPrice;
        prevClose = sim.prevClose;
        todayOpen = sim.todayOpen;
        vix = sim.vix;
        pcr = sim.pcr;
        advances = sim.advances;
        declines = sim.declines;
        atrValue = sim.atrValue;
        dataSource = "simulated";
        isDataValid = true;
      }
    }

    const now = Date.now();

    // Fail-Safe Mode Section 9
    if (!isDataValid) {
      const failSafeData = {
        nifty_price: 0,
        vix: 0,
        pcr: 0,
        advances: 0,
        declines: 0,
        market_zone: "NO_TRADE" as const,
        radar_score: 0,
        confidence: "LOW" as const,
        stability: "UNSTABLE" as const,
        momentum: "STEADY" as const,
        regime: "BALANCED" as const,
        reasons: ["Market data temporarily unavailable"],
        data_source: dataSource,
        market_status: "CLOSED",
        timestamp: new Date().toISOString(),
        failsafe_mode: true,
        zone_status: "WATCH" as const,
        confirmation_count: 0,
        stability_duration: "00:00",
      };
      return NextResponse.json(failSafeData);
    }

    // ATR-Adaptive Zone Classification
    const ref_buy = Math.max(todayOpen, prevClose);
    const ref_sell = Math.min(todayOpen, prevClose);

    let buffer_percent = (atrValue / ref_buy) * CONFIG.ATR_MULTIPLIER;
    buffer_percent = Math.max(CONFIG.MIN_BUFFER_PERCENT, Math.min(CONFIG.MAX_BUFFER_PERCENT, buffer_percent));

    const bullish_threshold = ref_buy * (1 + buffer_percent);
    const bearish_threshold = ref_sell * (1 - buffer_percent);

    let raw_zone: "BULLISH" | "BEARISH" | "NO_TRADE" = "NO_TRADE";
    if (niftyPrice >= bullish_threshold) {
      raw_zone = "BULLISH";
    } else if (niftyPrice <= bearish_threshold) {
      raw_zone = "BEARISH";
    }

    // Update snapshot history
    const currentSnapshot: Snapshot = {
      timestamp: now,
      nifty_price: niftyPrice,
      vix,
      pcr,
      advances,
      declines,
      raw_zone,
    };
    historyState.snapshots.push(currentSnapshot);
    historyState.snapshots = historyState.snapshots.filter(s => now - s.timestamp <= 600000); // 10 min retention
    historyState.last_valid = currentSnapshot;

    // Zone Stabilizer (Anti-Flip Confirmation cycles - Section 3)
    historyState.zone_history.push(raw_zone);
    if (historyState.zone_history.length > 3) {
      historyState.zone_history.shift();
    }

    let confirmed_zone = historyState.confirmed_zone;
    let zone_status: "CONFIRMED" | "WATCH" = "WATCH";
    let confirmation_count = historyState.zone_history.length;

    if (historyState.zone_history.length === 3) {
      const allSame = historyState.zone_history.every(z => z === raw_zone);
      if (allSame) {
        confirmed_zone = raw_zone;
        zone_status = "CONFIRMED";
        confirmation_count = 3;
      } else {
        const last = historyState.zone_history[2];
        const prev = historyState.zone_history[1];
        if (last === prev) {
          confirmation_count = 2;
        } else {
          confirmation_count = 1;
        }
      }
    }

    if (confirmed_zone !== historyState.confirmed_zone) {
      historyState.confirmed_zone = confirmed_zone;
      historyState.zone_stable_start = now;
      historyState.zone_changes.push(now);
    }
    if (!historyState.zone_stable_start) {
      historyState.zone_stable_start = now;
    }

    // Formatted stability timer duration (Section 10.1)
    const stableDurationMs = now - historyState.zone_stable_start;
    const stableMinutes = Math.floor(stableDurationMs / 60000);
    const stableSeconds = Math.floor((stableDurationMs % 60000) / 1000);
    const stability_duration = `${stableMinutes.toString().padStart(2, '0')}:${stableSeconds.toString().padStart(2, '0')}`;

    historyState.zone_changes = historyState.zone_changes.filter(t => now - t <= 600000);
    const zone_change_count_10min = historyState.zone_changes.length;

    // Volatility Shock Protection (Section 4)
    const twoMinutesAgo = now - 120000;
    const vixSnapshots2min = historyState.snapshots.filter(s => s.timestamp >= twoMinutesAgo);
    let shock_detected = false;
    if (vixSnapshots2min.length >= 2) {
      const oldestVix = vixSnapshots2min[0].vix;
      if (oldestVix > 0) {
        const vix_change = (vix - oldestVix) / oldestVix;
        if (vix_change > 0.10) {
          shock_detected = true;
          confirmed_zone = "NO_TRADE"; // Force NO_TRADE zone on volatility shock
        }
      }
    }

    // Momentum Engine (Section 5.1)
    let momentum: "RISING" | "WEAKENING" | "STEADY" = "STEADY";
    const cycles = 3;
    if (historyState.snapshots.length > cycles) {
      const pastSnapshot = historyState.snapshots[historyState.snapshots.length - 1 - cycles];
      const price_momentum = niftyPrice - pastSnapshot.nifty_price;
      const breadth_momentum = advances - pastSnapshot.advances;
      if (price_momentum > 0 && breadth_momentum > 0) {
        momentum = "RISING";
      } else if (price_momentum < 0 && breadth_momentum < 0) {
        momentum = "WEAKENING";
      }
    }

    // Market Radar Score (Section 5.2)
    let price_strength = (niftyPrice - bearish_threshold) / (bullish_threshold - bearish_threshold);
    price_strength = Math.max(0, Math.min(1, price_strength));
    const breadth_strength = advances / 50;
    const pcr_normalized = Math.max(0.5, Math.min(2.0, pcr));
    const pcr_strength = (pcr_normalized - 0.5) / 1.5;
    const volatility_condition = Math.max(0, Math.min(1, 1 - (vix - 10) / 30));

    const radar_score = (
      price_strength * 0.3 +
      breadth_strength * 0.3 +
      pcr_strength * 0.2 +
      volatility_condition * 0.2
    ) * 100;

    // Stability Engine (Section 5.3)
    historyState.confirmed_zone_history.push(confirmed_zone);
    if (historyState.confirmed_zone_history.length > 100) {
      historyState.confirmed_zone_history.shift();
    }
    let consecutive_confirmed = 0;
    for (let i = historyState.confirmed_zone_history.length - 1; i >= 0; i--) {
      if (historyState.confirmed_zone_history[i] === confirmed_zone) {
        consecutive_confirmed++;
      } else {
        break;
      }
    }
    let stability: "STABLE" | "WATCH" | "UNSTABLE" = "UNSTABLE";
    if (consecutive_confirmed >= 10) {
      stability = "STABLE";
    } else if (consecutive_confirmed >= 5) {
      stability = "WATCH";
    }

    // Regime Detection (Section 5.4)
    const price_move_abs = Math.abs(niftyPrice - todayOpen);
    let sb = 0;
    if (advances >= 35) sb = 1;
    else if ((50 - advances) >= 35) sb = -1;
    let sd = 0;
    if (pcr >= CONFIG.PCR_BULLISH_THRESHOLD) sd = 1;
    else if (pcr <= CONFIG.PCR_BEARISH_THRESHOLD) sd = -1;
    const sentiment_score = sb + sd;

    const prices = historyState.snapshots.map(s => s.nifty_price);
    const maxPrice = Math.max(...prices, niftyPrice);
    const minPrice = Math.min(...prices, niftyPrice);
    const intraday_range = maxPrice - minPrice;

    let regime: "TREND_DAY" | "VOLATILE" | "COMPRESSION" | "BALANCED" = "BALANCED";
    if (price_move_abs > 0.7 * atrValue && Math.abs(sentiment_score) >= 1) {
      regime = "TREND_DAY";
    } else if (vix > 25 && zone_change_count_10min > 3) {
      regime = "VOLATILE";
    } else if (vix < 12 && intraday_range < 0.3 * atrValue) {
      regime = "COMPRESSION";
    }

    // Sentiment Score (for User Dashboard)
    const confidence = Math.abs(sentiment_score) >= 2 ? "HIGH" : Math.abs(sentiment_score) === 1 ? "MODERATE" : "LOW";

    // Reasons - simplified user-facing messages
    const reasons: string[] = [];
    if (shock_detected) {
      reasons.push("High volatility shock detected - market unpredictable");
    } else if (confirmed_zone === "BULLISH") {
      reasons.push("Price trading above ATR-adaptive thresholds");
      if (advances >= 35) reasons.push("Market breadth currently bullish");
      if (pcr >= 1.2) reasons.push("Derivatives sentiment supporting upside");
      if (momentum === "RISING") reasons.push("Momentum rising across intraday timeframes");
    } else if (confirmed_zone === "BEARISH") {
      reasons.push("Price trading below ATR-adaptive thresholds");
      if (declines >= 35) reasons.push("Market breadth currently bearish");
      if (pcr <= 0.7) reasons.push("Derivatives sentiment supporting downside");
      if (momentum === "WEAKENING") reasons.push("Momentum weakening across intraday timeframes");
    } else {
      reasons.push("Price trading within a defined range");
      reasons.push("Market breadth currently neutral");
      reasons.push("Momentum mixed across intraday timeframes");
    }
    reasons.push(vix > 20 ? "Volatility conditions elevated" : "Volatility conditions stable");

    // Market status
    const nowIst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const day = nowIst.getDay();
    const hours = nowIst.getHours();
    const minutes = nowIst.getMinutes();
    const isOpenDay = day >= 1 && day <= 5;
    const isAfterOpen = hours > 9 || (hours === 9 && minutes >= 15);
    const isBeforeClose = hours < 15 || (hours === 15 && minutes <= 30);
    const market_status = (isOpenDay && isAfterOpen && isBeforeClose) ? "OPEN" : "CLOSED";

    // Save Updated History State back to cache (24 hours TTL)
    cache.set(HISTORY_CACHE_KEY, historyState, 86400);

    const responseData = {
      nifty_price: Math.round(niftyPrice * 100) / 100,
      vix: Math.round(vix * 100) / 100,
      pcr: Math.round(pcr * 100) / 100,
      advances,
      declines,
      market_zone: confirmed_zone,
      raw_zone,
      radar_score: Math.max(0, Math.min(100, Math.round(radar_score * 10) / 10)),
      confidence,
      stability,
      momentum,
      regime,
      reasons,
      data_source: dataSource,
      market_status,
      timestamp: new Date().toISOString(),
      failsafe_mode: false,
      zone_status,
      confirmation_count,
      stability_duration,
    };

    // Cache user response
    cache.set(responseCacheKey, responseData, CACHE_TTL_SECONDS, CACHE_STALE_SECONDS);

    return NextResponse.json(responseData, {
      headers: getCacheHeaders({ maxAge: CACHE_TTL_SECONDS, staleWhileRevalidate: CACHE_STALE_SECONDS, private: true }),
    });
  } catch (error) {
    console.error("Market data error:", error);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}

// Simulated data fallback
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
