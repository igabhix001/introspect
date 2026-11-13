import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  exchangeAuthCode,
  getFyersAuth,
  getLastFyersError,
  verifyFyersTokenLive,
} from "@/lib/fyers/fyers-service";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  try {
    const adminDb = createAdminClient();
    const { data: profile } = await adminDb.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role === "admin") return user;
  } catch { /* fall through */ }
  return null;
}

// POST: Exchange Fyers auth code for tokens
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { authCode, appId } = await request.json();

    if (!authCode || !appId) {
      return NextResponse.json({ error: "Auth code and App ID are required" }, { status: 400 });
    }

    const result = await exchangeAuthCode(authCode, appId, admin.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.warning
        ? `Fyers token saved, with warning: ${result.warning}`
        : "Fyers connected and live data feed verified!",
      warning: result.warning,
    });
  } catch (error) {
    console.error("Fyers auth error:", error);
    return NextResponse.json({ error: "Failed to authenticate with Fyers" }, { status: 500 });
  }
}

// GET: Live-verify Fyers connection status
export async function GET() {
  try {
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const adminDb = createAdminClient();
    const { data: tokenRow } = await adminDb
      .from("fyers_tokens")
      .select("app_id, token_expiry, last_refreshed, is_active, refresh_token")
      .eq("is_active", true)
      .single();

    if (!tokenRow) {
      return NextResponse.json({
        connected: false,
        dataFeedOk: false,
        message: "No Fyers token configured",
      });
    }

    // Attempt to get valid token (this also triggers auto-refresh if past 6:30 AM IST reset)
    const auth = await getFyersAuth();
    const recentError = getLastFyersError();

    if (!auth) {
      return NextResponse.json({
        connected: false,
        dataFeedOk: false,
        appId: tokenRow.app_id,
        tokenExpiry: tokenRow.token_expiry,
        lastRefreshed: tokenRow.last_refreshed,
        isExpired: true,
        hasPinConfigured: Boolean(process.env.FYERS_PIN),
        hasRefreshToken: Boolean(tokenRow.refresh_token),
        message: recentError?.message || "Access token expired and auto-refresh failed. Please re-authenticate.",
        lastError: recentError,
      });
    }

    // Verify token live against Fyers /api/v3/profile and /data/quotes
    const liveCheck = await verifyFyersTokenLive(auth.token, auth.appId);
    const updatedError = getLastFyersError();

    return NextResponse.json({
      connected: liveCheck.valid,
      dataFeedOk: liveCheck.dataFeedOk,
      appId: auth.appId,
      tokenExpiry: tokenRow.token_expiry,
      lastRefreshed: tokenRow.last_refreshed,
      isExpired: !liveCheck.valid,
      profileName: liveCheck.profileName,
      fyersId: liveCheck.fyersId,
      hasPinConfigured: Boolean(process.env.FYERS_PIN),
      hasRefreshToken: Boolean(tokenRow.refresh_token),
      message: liveCheck.valid
        ? liveCheck.dataFeedOk
          ? "Connected & Live Market Feed Active"
          : `Authenticated (${liveCheck.fyersId || "OK"}), but Data API error: ${liveCheck.error}`
        : liveCheck.error || "Fyers rejected token — please generate a new Auth Code",
      lastError: updatedError || (liveCheck.error ? { code: liveCheck.errorCode, message: liveCheck.error, endpoint: "verify" } : null),
    });
  } catch {
    return NextResponse.json({
      connected: false,
      dataFeedOk: false,
      message: "Error checking Fyers connection status",
    });
  }
}
