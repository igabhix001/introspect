/**
 * Fyers API v3 Integration Service
 * 
 * Fyers uses OAuth2 with persistent tokens. The flow:
 * 1. Admin generates auth code from Fyers (one-time setup)
 * 2. Server exchanges code for access_token + refresh_token
 * 3. Access token is valid ~1 day, refresh token for longer
 * 4. This service auto-refreshes using the refresh_token
 *
 * Admin sets this up ONCE from admin settings panel.
 * No daily manual login required.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

const FYERS_API_BASE = "https://api-t1.fyers.in/data";
const FYERS_AUTH_BASE = "https://api-t1.fyers.in/api/v3";

interface FyersToken {
  access_token: string;
  token_expiry: string;
}

// Module-level token cache to eliminate DB query load on 5s sentiment polling loop
let cachedToken: string | null = null;
let cachedTokenExpiryTime: number = 0;
let lastCacheCheck: number = 0;
let hasCheckedToken: boolean = false;

export function clearFyersTokenCache() {
  cachedToken = null;
  cachedTokenExpiryTime = 0;
  lastCacheCheck = 0;
  hasCheckedToken = false;
}

/**
 * Get active Fyers access token, auto-refreshing if needed.
 * Returns null if no token configured.
 */
export async function getFyersToken(): Promise<string | null> {
  const nowMs = Date.now();
  const cacheStaleTimeMs = 5 * 60 * 1000; // Cache DB state for 5 minutes

  // 1. Return cached token if we recently checked the DB (positive or negative result)
  if (hasCheckedToken && nowMs - lastCacheCheck < cacheStaleTimeMs) {
    if (cachedToken) {
      const expiry = new Date(cachedTokenExpiryTime);
      const now = new Date();
      const bufferMs = 5 * 60 * 1000;
      
      const toIstDate = (d: Date) => new Date(d.getTime() + (d.getTimezoneOffset() * 60000) + (330 * 60000));
      const nowIst = toIstDate(now);
      const lastRefreshedIst = toIstDate(new Date(lastCacheCheck));
      const isSameDay = 
        lastRefreshedIst.getDate() === nowIst.getDate() && 
        lastRefreshedIst.getMonth() === nowIst.getMonth() && 
        lastRefreshedIst.getFullYear() === nowIst.getFullYear();

      const isPastPreMarket = nowIst.getHours() > 8 || (nowIst.getHours() === 8 && nowIst.getMinutes() >= 30);
      const forceDailyRefresh = !isSameDay && isPastPreMarket;

      if (expiry.getTime() > now.getTime() + bufferMs && !forceDailyRefresh) {
        return cachedToken;
      }
    } else {
      // Negative cache hit - Fyers is not configured, don't query DB
      return null;
    }
  }

  const adminDb = createAdminClient();

  const { data: tokenRow, error } = await adminDb
    .from("fyers_tokens")
    .select("*")
    .eq("is_active", true)
    .single();

  hasCheckedToken = true;
  lastCacheCheck = nowMs;

  if (error || !tokenRow) {
    console.warn("No active Fyers token found");
    cachedToken = null;
    return null;
  }

  // Check if token is still valid (with 5min buffer)
  const expiry = new Date(tokenRow.token_expiry);
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minutes

  // Fyers requires a fresh token daily. If the token is from yesterday, force a refresh before market open.
  const lastRefreshed = new Date(tokenRow.last_refreshed || tokenRow.created_at);
  
  // Convert standard Date to a pseudo-Date mapped to IST (+5:30 / 330 minutes from UTC)
  const toIstDate = (d: Date) => new Date(d.getTime() + (d.getTimezoneOffset() * 60000) + (330 * 60000));
  
  const nowIst = toIstDate(now);
  const lastRefreshedIst = toIstDate(lastRefreshed);
  
  const isSameDay = 
    lastRefreshedIst.getDate() === nowIst.getDate() && 
    lastRefreshedIst.getMonth() === nowIst.getMonth() && 
    lastRefreshedIst.getFullYear() === nowIst.getFullYear();

  // Force daily refresh if it's a new day and past 8:30 AM IST.
  const isPastPreMarket = nowIst.getHours() > 8 || (nowIst.getHours() === 8 && nowIst.getMinutes() >= 30);
  const forceDailyRefresh = !isSameDay && isPastPreMarket;

  if (expiry.getTime() > now.getTime() + bufferMs && !forceDailyRefresh) {
    // Token is mathematically valid AND fresh for today's market session
    cachedToken = tokenRow.access_token;
    cachedTokenExpiryTime = expiry.getTime();
    return tokenRow.access_token;
  }


  // Token expired or needs daily refresh
  console.log("Fyers token expired or needs daily refresh, attempting...");
  try {
    const refreshed = await refreshFyersToken(tokenRow.app_id);
    if (refreshed) {
      cachedToken = refreshed;
      const { data: updatedRow } = await adminDb
        .from("fyers_tokens")
        .select("token_expiry")
        .eq("is_active", true)
        .single();
      if (updatedRow) {
        cachedTokenExpiryTime = new Date(updatedRow.token_expiry).getTime();
      } else {
        cachedTokenExpiryTime = Date.now() + 20 * 60 * 60 * 1000;
      }
      lastCacheCheck = nowMs;
      return refreshed;
    }
  } catch (err) {
    console.error("Fyers token refresh failed:", err);
  }

  cachedToken = null;
  return null;
}

/**
 * Refresh Fyers access token.
 * Fyers v3: POST to /validate-authcode with new auth code.
 * For auto-refresh, we re-use stored refresh_token if available.
 */
async function refreshFyersToken(appId: string): Promise<string | null> {
  const adminDb = createAdminClient();
  const appSecret = process.env.FYERS_SECRET_KEY;

  if (!appSecret) {
    console.error("FYERS_SECRET_KEY not set");
    return null;
  }

  const { data: tokenRow } = await adminDb
    .from("fyers_tokens")
    .select("refresh_token")
    .eq("is_active", true)
    .single();

  if (!tokenRow?.refresh_token) {
    console.warn("No refresh_token available for Fyers auto-refresh");
    return null;
  }

  // Fyers v3 token refresh
  const res = await fetch(`${FYERS_AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      appIdHash: crypto.createHash("sha256").update(`${appId}:${appSecret}`).digest("hex"),
      refresh_token: tokenRow.refresh_token,
      pin: process.env.FYERS_PIN || "",
    }),
  });

  if (!res.ok) {
    console.error("Fyers refresh API error:", await res.text());
    return null;
  }

  const data = await res.json();
  if (data.s !== "ok" || !data.access_token) {
    console.error("Fyers refresh failed:", data);
    return null;
  }

  // Save new token
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 20); // Tokens valid ~24h, use 20h

  await adminDb
    .from("fyers_tokens")
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token || tokenRow.refresh_token,
      token_expiry: expiry.toISOString(),
      last_refreshed: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("is_active", true);

  return data.access_token;
}

/**
 * Exchange auth code for tokens (called once from admin settings).
 */
export async function exchangeAuthCode(
  authCode: string,
  appId: string,
  adminUserId: string
): Promise<{ success: boolean; error?: string }> {
  const appSecret = process.env.FYERS_SECRET_KEY;
  if (!appSecret) return { success: false, error: "FYERS_SECRET_KEY not configured" };

  try {
    const res = await fetch(`${FYERS_AUTH_BASE}/validate-authcode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        appIdHash: crypto.createHash("sha256").update(`${appId}:${appSecret}`).digest("hex"),
        code: authCode,
      }),
    });

    const data = await res.json();
    if (data.s !== "ok" || !data.access_token) {
      return { success: false, error: data.message || "Token exchange failed" };
    }

    const adminDb = createAdminClient();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 20);

    // Deactivate old tokens
    await adminDb.from("fyers_tokens").update({ is_active: false }).eq("is_active", true);

    // Insert new token
    await adminDb.from("fyers_tokens").insert({
      app_id: appId,
      access_token: data.access_token,
      refresh_token: data.refresh_token || null,
      token_expiry: expiry.toISOString(),
      last_refreshed: new Date().toISOString(),
      is_active: true,
      created_by: adminUserId,
    });

    // Invalidate memory cache so background sentiment engine picks up fresh token
    clearFyersTokenCache();

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Market Data Fetchers ─────────────────────────────────────────────────────

interface FyersQuote {
  n: string;
  v: {
    lp: number;  // Last price
    open_price: number;
    prev_close_price: number;
    volume: number;
  };
}

/**
 * Fetch Nifty 50 live price from Fyers API.
 */
export async function fetchNiftyPrice(token: string): Promise<{
  current: number;
  open: number;
  prevClose: number;
} | null> {
  try {
    const res = await fetch(
      `${FYERS_API_BASE}/quotes?symbols=NSE:NIFTY50-INDEX`,
      {
        headers: {
          Authorization: `${process.env.FYERS_APP_ID}:${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();

    if (data.s !== "ok" || !data.d?.[0]) return null;
    const q: FyersQuote = data.d[0];

    return {
      current: q.v.lp,
      open: q.v.open_price,
      prevClose: q.v.prev_close_price,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch India VIX from Fyers.
 */
export async function fetchVIX(token: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${FYERS_API_BASE}/quotes?symbols=NSE:INDIAVIX-INDEX`,
      {
        headers: { Authorization: `${process.env.FYERS_APP_ID}:${token}` },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data.d?.[0]?.v?.lp ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch Nifty 50 constituents price change for advance/decline.
 * Uses market depth or option chain for PCR.
 */
export async function fetchMarketBreadth(token: string): Promise<{
  advances: number;
  declines: number;
  pcr: number;
} | null> {
  try {
    // Fetch Nifty option chain for PCR using Options Chain v3 API
    const res = await fetch(
      `${FYERS_API_BASE}/options-chain-v3?symbol=NSE:NIFTY50-INDEX&strikecount=20`,
      {
        headers: { Authorization: `${process.env.FYERS_APP_ID}:${token}` },
      }
    );

    let totalPutOI = 0;
    let totalCallOI = 0;

    if (res.ok) {
      const data = await res.json();
      if (data.s === "ok" && Array.isArray(data.data?.optionsChain)) {
        for (const contract of data.data.optionsChain) {
          if (contract.option_type === "PE") {
            totalPutOI += contract.oi || 0;
          } else if (contract.option_type === "CE") {
            totalCallOI += contract.oi || 0;
          }
        }
      }
    }

    const pcr = totalCallOI > 0 ? totalPutOI / totalCallOI : 1.0;

    // Advance/Decline calculated dynamically from 30 index heavyweight constituents
    const breadthSymbols = [
      "NSE:RELIANCE-EQ", "NSE:TCS-EQ", "NSE:INFY-EQ", "NSE:SBIN-EQ", "NSE:HDFCBANK-EQ",
      "NSE:ICICIBANK-EQ", "NSE:TATAMOTORS-EQ", "NSE:TATASTEEL-EQ", "NSE:ITC-EQ", "NSE:LT-EQ",
      "NSE:KOTAKBANK-EQ", "NSE:AXISBANK-EQ", "NSE:HINDUNILVR-EQ", "NSE:BHARTIARTL-EQ", "NSE:BAJFINANCE-EQ",
      "NSE:MARUTI-EQ", "NSE:ASIANPAINT-EQ", "NSE:HCLTECH-EQ", "NSE:SUNPHARMA-EQ", "NSE:TITAN-EQ",
      "NSE:ADANIENT-EQ", "NSE:ULTRACEMCO-EQ", "NSE:WIPRO-EQ", "NSE:NTPC-EQ", "NSE:POWERGRID-EQ",
      "NSE:JSWSTEEL-EQ", "NSE:M%26M-EQ", "NSE:ONGC-EQ", "NSE:COALINDIA-EQ", "NSE:ADANIPORTS-EQ"
    ];

    const breadthRes = await fetch(
      `${FYERS_API_BASE}/quotes?symbols=${encodeURIComponent(breadthSymbols.join(","))}`,
      {
        headers: { Authorization: `${process.env.FYERS_APP_ID}:${token}` },
      }
    );

    let advances = 25;
    let declines = 25;

    if (breadthRes.ok) {
      const breadthData = await breadthRes.json();
      if (breadthData.s === "ok" && Array.isArray(breadthData.d)) {
        let advCount = 0;
        let decCount = 0;
        for (const item of breadthData.d) {
          const lp = item.v?.lp || 0;
          const prevClose = item.v?.prev_close_price || 0;
          if (lp > 0 && prevClose > 0) {
            if (lp > prevClose) {
              advCount++;
            } else if (lp < prevClose) {
              decCount++;
            }
          }
        }
        const totalValid = advCount + decCount;
        if (totalValid > 0) {
          advances = Math.round((advCount / totalValid) * 50);
          declines = 50 - advances;
        }
      }
    }

    return { advances, declines, pcr };
  } catch {
    return null;
  }
}

/**
 * Calculate 14-period ATR from historical candles.
 */
export async function fetchATR(token: string): Promise<number | null> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const dayAgo = now - 86400 * 3; // 3 days of data

    const res = await fetch(
      `${FYERS_API_BASE}/history?symbol=NSE:NIFTY50-INDEX&resolution=5&date_format=0&range_from=${dayAgo}&range_to=${now}&cont_flag=1`,
      {
        headers: { Authorization: `${process.env.FYERS_APP_ID}:${token}` },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();

    if (data.s !== "ok" || !data.candles || data.candles.length < 15) return null;

    // Calculate 14-period ATR
    const candles = data.candles.slice(-15); // Last 15 candles
    let atr = 0;
    for (let i = 1; i < candles.length; i++) {
      const high = candles[i][2];
      const low = candles[i][3];
      const prevClose = candles[i - 1][4];
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      atr += tr;
    }
    atr = atr / 14;

    return atr;
  } catch {
    return null;
  }
}
