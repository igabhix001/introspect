/**
 * Fyers API v3 Integration Service
 *
 * Fyers uses OAuth2 with daily-expiring access tokens (expire 6:30 AM IST daily)
 * and 15-day refresh tokens.
 *
 * Flow:
 * 1. Admin generates auth_code from Fyers OAuth login
 * 2. Server exchanges code via POST /api/v3/validate-authcode
 * 3. Access token expires daily at 6:30 AM IST (01:00 UTC)
 * 4. Service auto-refreshes via POST /api/v3/validate-refresh-token (requires FYERS_PIN)
 *
 * Note on Fyers 2026 Rate Limits (Standard Plan):
 * - Data APIs: 5 req/sec, 50 req/min, 5,000 req/day
 * - Sub-feeds (Breadth, Option Chain, ATR) are cached 60s and quotes are combined
 *   to stay well within Fyers rate limits.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

const FYERS_API_BASE = "https://api-t1.fyers.in/data";
const FYERS_AUTH_BASE = "https://api-t1.fyers.in/api/v3";

export interface FyersAuth {
  token: string;
  appId: string;
}

export interface FyersApiError {
  code?: number | string;
  message: string;
  endpoint: string;
  timestamp: string;
}

// Module-level token & subfeed cache
let cachedToken: string | null = null;
let cachedAppId: string | null = null;
let cachedTokenExpiryTime = 0;
let lastCacheCheck = 0;
let hasCheckedToken = false;
let lastFyersError: FyersApiError | null = null;
let rateLimitCooldownUntil = 0;

// Sub-feed caches to stay far below Fyers Oct 2026 Data API limits (50 req/min, 5000 req/day)
let cachedBreadth: { data: { advances: number; declines: number; pcr: number }; timestamp: number } | null = null;
let cachedATR: { data: number; timestamp: number } | null = null;

const SUBFEED_CACHE_MS = 60 * 1000; // 60 seconds for Breadth, PCR & 5m ATR

function recordFyersError(endpoint: string, message: string, code?: number | string) {
  lastFyersError = {
    code,
    message,
    endpoint,
    timestamp: new Date().toISOString(),
  };
  console.error(`[Fyers API Error] [${endpoint}] (code=${code ?? "n/a"}): ${message}`);
}

export function getLastFyersError(): FyersApiError | null {
  return lastFyersError;
}

export function clearLastFyersError() {
  lastFyersError = null;
}

export function clearFyersTokenCache() {
  cachedToken = null;
  cachedAppId = null;
  cachedTokenExpiryTime = 0;
  lastCacheCheck = 0;
  hasCheckedToken = false;
  cachedBreadth = null;
  cachedATR = null;
  rateLimitCooldownUntil = 0;
}

/**
 * Fyers access tokens expire every day at 6:30 AM IST (01:00 UTC).
 * Returns the exact next 01:00 UTC boundary from `fromDate`.
 */
export function getNextFyersExpiry(fromDate = new Date()): Date {
  const todayExpiryUtc = Date.UTC(
    fromDate.getUTCFullYear(),
    fromDate.getUTCMonth(),
    fromDate.getUTCDate(),
    1, // 01:00 UTC = 06:30 AM IST
    0,
    0,
    0
  );
  if (fromDate.getTime() >= todayExpiryUtc) {
    return new Date(todayExpiryUtc + 24 * 60 * 60 * 1000);
  }
  return new Date(todayExpiryUtc);
}

/**
 * Returns the most recent 6:30 AM IST (01:00 UTC) reset timestamp <= now.
 */
function getMostRecentFyersResetMs(now = new Date()): number {
  const todayResetUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    1,
    0,
    0,
    0
  );
  if (now.getTime() >= todayResetUtc) {
    return todayResetUtc;
  }
  return todayResetUtc - 24 * 60 * 60 * 1000;
}

function getEffectiveAppId(explicitAppId?: string | null): string {
  return (explicitAppId || cachedAppId || process.env.FYERS_APP_ID || "").trim();
}

function isTokenAuthErrorCode(code: unknown): boolean {
  const num = Number(code);
  return num === -8 || num === -15 || num === -16 || num === -17;
}

function isRateLimitError(status: number, code?: unknown): boolean {
  const num = Number(code);
  return status === 429 || num === -429 || num === -360;
}

/**
 * Get active Fyers access token + App ID, auto-refreshing if needed.
 * Returns null if no token configured or refresh failed.
 */
export async function getFyersAuth(): Promise<FyersAuth | null> {
  const nowMs = Date.now();
  const bufferMs = 5 * 60 * 1000; // 5 minutes
  const mostRecentResetMs = getMostRecentFyersResetMs(new Date(nowMs));

  // 1. Return cached token if still valid and generated after the most recent 6:30 AM IST reset
  const cacheStaleTimeMs = cachedToken ? 5 * 60 * 1000 : 15 * 1000;
  if (hasCheckedToken && nowMs - lastCacheCheck < cacheStaleTimeMs) {
    if (cachedToken && cachedAppId) {
      if (
        cachedTokenExpiryTime > nowMs + bufferMs &&
        lastCacheCheck >= mostRecentResetMs
      ) {
        return { token: cachedToken, appId: cachedAppId };
      }
    } else {
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

  if (error || !tokenRow || !tokenRow.access_token) {
    cachedToken = null;
    cachedAppId = null;
    return null;
  }

  const rowAppId = (tokenRow.app_id || process.env.FYERS_APP_ID || "").trim();
  const expiryMs = new Date(tokenRow.token_expiry).getTime();
  const lastRefreshedMs = new Date(tokenRow.last_refreshed || tokenRow.created_at).getTime();

  // Token must not be expired AND must have been generated/refreshed after the latest 6:30 AM IST reset
  const needsDailyResetRefresh = lastRefreshedMs < mostRecentResetMs;
  const isNearExpiry = Number.isNaN(expiryMs) || expiryMs <= nowMs + bufferMs;

  if (!needsDailyResetRefresh && !isNearExpiry) {
    cachedToken = tokenRow.access_token;
    cachedAppId = rowAppId;
    cachedTokenExpiryTime = expiryMs;
    return { token: tokenRow.access_token, appId: rowAppId };
  }

  // Attempt automatic refresh via Fyers v3 validate-refresh-token
  console.log("[Fyers] Access token expired or past 6:30 AM IST reset, attempting refresh...");
  try {
    const refreshed = await refreshFyersToken(rowAppId);
    if (refreshed) {
      cachedToken = refreshed.token;
      cachedAppId = refreshed.appId;
      cachedTokenExpiryTime = getNextFyersExpiry().getTime();
      lastCacheCheck = nowMs;
      return refreshed;
    }
  } catch (err) {
    recordFyersError("validate-refresh-token", String(err));
  }

  cachedToken = null;
  cachedAppId = null;
  return null;
}

/**
 * Backward-compatible helper returning only the access token string.
 */
export async function getFyersToken(): Promise<string | null> {
  const auth = await getFyersAuth();
  return auth?.token ?? null;
}

/**
 * Refresh Fyers access token using Fyers API v3 POST /validate-refresh-token.
 */
export async function refreshFyersToken(appId: string): Promise<FyersAuth | null> {
  const adminDb = createAdminClient();
  const appSecret = process.env.FYERS_SECRET_KEY?.trim();
  const fyersPin = process.env.FYERS_PIN?.trim();
  const cleanAppId = appId.trim();

  if (!appSecret) {
    recordFyersError("validate-refresh-token", "FYERS_SECRET_KEY environment variable is not set");
    return null;
  }

  if (!fyersPin) {
    recordFyersError(
      "validate-refresh-token",
      "FYERS_PIN environment variable is missing (required by Fyers v3 validate-refresh-token). Please re-authenticate manually or set FYERS_PIN."
    );
    return null;
  }

  const { data: tokenRow } = await adminDb
    .from("fyers_tokens")
    .select("refresh_token")
    .eq("is_active", true)
    .single();

  if (!tokenRow?.refresh_token) {
    recordFyersError("validate-refresh-token", "No refresh_token stored in database — manual re-login required");
    return null;
  }

  const res = await fetch(`${FYERS_AUTH_BASE}/validate-refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      appIdHash: crypto.createHash("sha256").update(`${cleanAppId}:${appSecret}`).digest("hex"),
      refresh_token: tokenRow.refresh_token,
      pin: fyersPin,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.s !== "ok" || !data.access_token) {
    const errMsg = data?.message || `HTTP ${res.status}`;
    recordFyersError("validate-refresh-token", errMsg, data?.code ?? res.status);
    return null;
  }

  const expiry = getNextFyersExpiry();
  const nowIso = new Date().toISOString();

  await adminDb
    .from("fyers_tokens")
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token || tokenRow.refresh_token,
      token_expiry: expiry.toISOString(),
      last_refreshed: nowIso,
      updated_at: nowIso,
    })
    .eq("is_active", true);

  clearLastFyersError();
  return { token: data.access_token, appId: cleanAppId };
}

/**
 * Exchange auth code for tokens (called from admin settings).
 */
export async function exchangeAuthCode(
  authCode: string,
  appId: string,
  adminUserId: string
): Promise<{ success: boolean; error?: string; warning?: string }> {
  const appSecret = process.env.FYERS_SECRET_KEY?.trim();
  const cleanAppId = appId.trim();
  const cleanAuthCode = authCode.trim();

  if (!appSecret) {
    return { success: false, error: "FYERS_SECRET_KEY not configured on server" };
  }

  try {
    const res = await fetch(`${FYERS_AUTH_BASE}/validate-authcode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        appIdHash: crypto.createHash("sha256").update(`${cleanAppId}:${appSecret}`).digest("hex"),
        code: cleanAuthCode,
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.s !== "ok" || !data.access_token) {
      const msg = data?.message || `Token exchange failed (HTTP ${res.status})`;
      recordFyersError("validate-authcode", msg, data?.code ?? res.status);
      return { success: false, error: msg };
    }

    const adminDb = createAdminClient();
    const expiry = getNextFyersExpiry();
    const nowIso = new Date().toISOString();

    // Deactivate old tokens
    await adminDb.from("fyers_tokens").update({ is_active: false }).eq("is_active", true);

    // Insert new token
    const { error: insertError } = await adminDb.from("fyers_tokens").insert({
      app_id: cleanAppId,
      access_token: data.access_token,
      refresh_token: data.refresh_token || null,
      token_expiry: expiry.toISOString(),
      last_refreshed: nowIso,
      is_active: true,
      created_by: adminUserId,
    });

    if (insertError) {
      recordFyersError("supabase:fyers_tokens", insertError.message);
      return { success: false, error: `Database error saving token: ${insertError.message}` };
    }

    clearFyersTokenCache();
    clearLastFyersError();

    // Verify token immediately with Fyers /profile & Quotes so admin knows immediately if IP / App Type / Permissions fail
    const verification = await verifyFyersTokenLive(data.access_token, cleanAppId);
    if (!verification.valid) {
      return {
        success: true,
        warning: `Token saved, but live Fyers check reported: ${verification.error}`,
      };
    }

    return { success: true };
  } catch (err) {
    recordFyersError("validate-authcode", String(err));
    return { success: false, error: String(err) };
  }
}

/**
 * Live-verify a Fyers access token against /api/v3/profile AND a lightweight /data/quotes call.
 */
export async function verifyFyersTokenLive(
  token: string,
  appId?: string | null
): Promise<{
  valid: boolean;
  dataFeedOk: boolean;
  profileName?: string;
  fyersId?: string;
  error?: string;
  errorCode?: number | string;
}> {
  const effectiveAppId = getEffectiveAppId(appId);
  if (!effectiveAppId || !token) {
    return { valid: false, dataFeedOk: false, error: "Missing App ID or Access Token" };
  }

  try {
    const profileRes = await fetch(`${FYERS_AUTH_BASE}/profile`, {
      cache: "no-store",
      headers: {
        Authorization: `${effectiveAppId}:${token}`,
      },
    });
    const profileData = await profileRes.json().catch(() => null);

    if (!profileRes.ok || !profileData || profileData.s !== "ok") {
      const msg = profileData?.message || `Profile check failed (HTTP ${profileRes.status})`;
      const code = profileData?.code ?? profileRes.status;
      recordFyersError("profile", msg, code);
      return { valid: false, dataFeedOk: false, error: msg, errorCode: code };
    }

    // Also probe a lightweight quote to verify Data API is not rate-limited or IP-blocked
    const quoteRes = await fetch(
      `${FYERS_API_BASE}/quotes?symbols=${encodeURIComponent("NSE:NIFTY50-INDEX")}`,
      {
        cache: "no-store",
        headers: {
          Authorization: `${effectiveAppId}:${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const quoteData = await quoteRes.json().catch(() => null);

    if (!quoteRes.ok || !quoteData || quoteData.s !== "ok") {
      const msg = quoteData?.message || `Market Data API failed (HTTP ${quoteRes.status})`;
      const code = quoteData?.code ?? quoteRes.status;
      recordFyersError("quotes", msg, code);
      return {
        valid: true,
        dataFeedOk: false,
        profileName: profileData.data?.name,
        fyersId: profileData.data?.fy_id,
        error: msg,
        errorCode: code,
      };
    }

    clearLastFyersError();
    return {
      valid: true,
      dataFeedOk: true,
      profileName: profileData.data?.name,
      fyersId: profileData.data?.fy_id,
    };
  } catch (err) {
    const msg = String(err);
    recordFyersError("verifyFyersTokenLive", msg);
    return { valid: false, dataFeedOk: false, error: msg };
  }
}

// ─── Market Data Fetchers ─────────────────────────────────────────────────────

interface FyersQuote {
  n: string;
  v: {
    lp: number; // Last price
    open_price: number;
    prev_close_price: number;
    volume: number;
  };
}

/**
 * Handle shared Fyers response error checking, cooldowns, and auto-invalidation.
 */
function handleFyersDataFailure(endpoint: string, status: number, data: Record<string, unknown> | null) {
  const code = data?.code as number | string | undefined;
  const msg = (data?.message as string) || `HTTP ${status}`;

  if (isRateLimitError(status, code)) {
    rateLimitCooldownUntil = Date.now() + 60 * 1000; // Back off 60s on 429
    recordFyersError(endpoint, `${msg} — backing off for 60s`, code ?? 429);
    return;
  }

  if (isTokenAuthErrorCode(code) || status === 401) {
    // Invalidate in-memory token cache so next call re-checks/refreshes from DB
    cachedToken = null;
    hasCheckedToken = false;
  }

  recordFyersError(endpoint, msg, code ?? status);
}

/**
 * Fetch Nifty 50 live price AND India VIX in a single /data/quotes API call.
 */
export async function fetchNiftyAndVix(
  token: string,
  appId?: string | null
): Promise<{
  nifty: { current: number; open: number; prevClose: number };
  vix: number | null;
} | null> {
  if (Date.now() < rateLimitCooldownUntil) {
    return null;
  }

  const effectiveAppId = getEffectiveAppId(appId);
  try {
    const symbols = encodeURIComponent("NSE:NIFTY50-INDEX,NSE:INDIAVIX-INDEX");
    const res = await fetch(`${FYERS_API_BASE}/quotes?symbols=${symbols}`, {
      cache: "no-store",
      headers: {
        Authorization: `${effectiveAppId}:${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.s !== "ok" || !Array.isArray(data.d)) {
      handleFyersDataFailure("quotes:nifty+vix", res.status, data);
      return null;
    }

    const niftyQuote = data.d.find((q: FyersQuote) => q.n === "NSE:NIFTY50-INDEX") || data.d[0];
    const vixQuote = data.d.find((q: FyersQuote) => q.n === "NSE:INDIAVIX-INDEX");

    if (!niftyQuote?.v?.lp) {
      recordFyersError("quotes:nifty+vix", "Missing Nifty 50 quote payload");
      return null;
    }

    return {
      nifty: {
        current: niftyQuote.v.lp,
        open: niftyQuote.v.open_price,
        prevClose: niftyQuote.v.prev_close_price,
      },
      vix: vixQuote?.v?.lp ?? null,
    };
  } catch (err) {
    recordFyersError("quotes:nifty+vix", String(err));
    return null;
  }
}

/**
 * Fetch Nifty 50 live price from Fyers API.
 */
export async function fetchNiftyPrice(
  token: string,
  appId?: string | null
): Promise<{
  current: number;
  open: number;
  prevClose: number;
} | null> {
  if (Date.now() < rateLimitCooldownUntil) return null;
  const effectiveAppId = getEffectiveAppId(appId);

  try {
    const res = await fetch(
      `${FYERS_API_BASE}/quotes?symbols=${encodeURIComponent("NSE:NIFTY50-INDEX")}`,
      {
        cache: "no-store",
        headers: {
          Authorization: `${effectiveAppId}:${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.s !== "ok" || !data.d?.[0]) {
      handleFyersDataFailure("quotes:nifty", res.status, data);
      return null;
    }

    const q: FyersQuote = data.d[0];
    return {
      current: q.v.lp,
      open: q.v.open_price,
      prevClose: q.v.prev_close_price,
    };
  } catch (err) {
    recordFyersError("quotes:nifty", String(err));
    return null;
  }
}

/**
 * Fetch India VIX from Fyers.
 */
export async function fetchVIX(token: string, appId?: string | null): Promise<number | null> {
  if (Date.now() < rateLimitCooldownUntil) return null;
  const effectiveAppId = getEffectiveAppId(appId);

  try {
    const res = await fetch(
      `${FYERS_API_BASE}/quotes?symbols=${encodeURIComponent("NSE:INDIAVIX-INDEX")}`,
      {
        cache: "no-store",
        headers: { Authorization: `${effectiveAppId}:${token}` },
      }
    );

    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.s !== "ok") {
      handleFyersDataFailure("quotes:vix", res.status, data);
      return null;
    }
    return data.d?.[0]?.v?.lp ?? null;
  } catch (err) {
    recordFyersError("quotes:vix", String(err));
    return null;
  }
}

/**
 * Fetch Nifty 50 constituents price change for advance/decline and Option Chain for PCR.
 * Cached for 60s to prevent hitting Fyers' 50 req/min and 5000 req/day Data API caps.
 */
export async function fetchMarketBreadth(
  token: string,
  appId?: string | null
): Promise<{
  advances: number;
  declines: number;
  pcr: number;
} | null> {
  const now = Date.now();
  if (cachedBreadth && now - cachedBreadth.timestamp < SUBFEED_CACHE_MS) {
    return cachedBreadth.data;
  }
  if (now < rateLimitCooldownUntil) {
    return cachedBreadth?.data ?? null;
  }

  const effectiveAppId = getEffectiveAppId(appId);

  try {
    // 1. Fetch Nifty option chain for PCR using Options Chain v3 API
    const res = await fetch(
      `${FYERS_API_BASE}/options-chain-v3?symbol=NSE:NIFTY50-INDEX&strikecount=20`,
      {
        cache: "no-store",
        headers: { Authorization: `${effectiveAppId}:${token}` },
      }
    );

    let totalPutOI = 0;
    let totalCallOI = 0;

    const ocData = await res.json().catch(() => null);
    if (res.ok && ocData?.s === "ok" && Array.isArray(ocData.data?.optionsChain)) {
      for (const contract of ocData.data.optionsChain) {
        if (contract.option_type === "PE") {
          totalPutOI += contract.oi || 0;
        } else if (contract.option_type === "CE") {
          totalCallOI += contract.oi || 0;
        }
      }
    } else if (!res.ok || ocData?.s !== "ok") {
      handleFyersDataFailure("options-chain-v3", res.status, ocData);
    }

    const pcr = totalCallOI > 0 ? totalPutOI / totalCallOI : (cachedBreadth?.data.pcr ?? 1.0);

    // 2. Advance/Decline calculated from 30 index heavyweight constituents
    // Note: Use raw NSE:M&M-EQ (encoded once below) and NSE:TMPV-EQ (renamed from TATAMOTORS in Oct 2025)
    const breadthSymbols = [
      "NSE:RELIANCE-EQ", "NSE:TCS-EQ", "NSE:INFY-EQ", "NSE:SBIN-EQ", "NSE:HDFCBANK-EQ",
      "NSE:ICICIBANK-EQ", "NSE:TMPV-EQ", "NSE:TATASTEEL-EQ", "NSE:ITC-EQ", "NSE:LT-EQ",
      "NSE:KOTAKBANK-EQ", "NSE:AXISBANK-EQ", "NSE:HINDUNILVR-EQ", "NSE:BHARTIARTL-EQ", "NSE:BAJFINANCE-EQ",
      "NSE:MARUTI-EQ", "NSE:ASIANPAINT-EQ", "NSE:HCLTECH-EQ", "NSE:SUNPHARMA-EQ", "NSE:TITAN-EQ",
      "NSE:ADANIENT-EQ", "NSE:ULTRACEMCO-EQ", "NSE:WIPRO-EQ", "NSE:NTPC-EQ", "NSE:POWERGRID-EQ",
      "NSE:JSWSTEEL-EQ", "NSE:M&M-EQ", "NSE:ONGC-EQ", "NSE:COALINDIA-EQ", "NSE:ADANIPORTS-EQ",
    ];

    const breadthRes = await fetch(
      `${FYERS_API_BASE}/quotes?symbols=${encodeURIComponent(breadthSymbols.join(","))}`,
      {
        cache: "no-store",
        headers: { Authorization: `${effectiveAppId}:${token}` },
      }
    );

    let advances = cachedBreadth?.data.advances ?? 25;
    let declines = cachedBreadth?.data.declines ?? 25;

    const breadthData = await breadthRes.json().catch(() => null);
    if (breadthRes.ok && breadthData?.s === "ok" && Array.isArray(breadthData.d)) {
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
    } else if (!breadthRes.ok || breadthData?.s !== "ok") {
      handleFyersDataFailure("quotes:breadth", breadthRes.status, breadthData);
    }

    const result = { advances, declines, pcr };
    cachedBreadth = { data: result, timestamp: now };
    return result;
  } catch (err) {
    recordFyersError("fetchMarketBreadth", String(err));
    return cachedBreadth?.data ?? null;
  }
}

/**
 * Calculate 14-period ATR from historical 5m candles.
 * Cached for 60s to avoid burning Data API quota.
 */
export async function fetchATR(token: string, appId?: string | null): Promise<number | null> {
  const nowMs = Date.now();
  if (cachedATR && nowMs - cachedATR.timestamp < SUBFEED_CACHE_MS) {
    return cachedATR.data;
  }
  if (nowMs < rateLimitCooldownUntil) {
    return cachedATR?.data ?? null;
  }

  const effectiveAppId = getEffectiveAppId(appId);

  try {
    const now = Math.floor(nowMs / 1000);
    const dayAgo = now - 86400 * 4; // 4 days of data (covers weekends/holidays)

    const res = await fetch(
      `${FYERS_API_BASE}/history?symbol=NSE:NIFTY50-INDEX&resolution=5&date_format=0&range_from=${dayAgo}&range_to=${now}&cont_flag=1`,
      {
        cache: "no-store",
        headers: { Authorization: `${effectiveAppId}:${token}` },
      }
    );

    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.s !== "ok" || !data.candles || data.candles.length < 15) {
      if (!res.ok || data?.s !== "ok") {
        handleFyersDataFailure("history:atr", res.status, data);
      }
      return cachedATR?.data ?? null;
    }

    // Calculate 14-period ATR
    const candles = data.candles.slice(-15);
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

    cachedATR = { data: atr, timestamp: nowMs };
    return atr;
  } catch (err) {
    recordFyersError("history:atr", String(err));
    return cachedATR?.data ?? null;
  }
}
