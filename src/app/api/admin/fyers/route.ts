import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeAuthCode } from "@/lib/fyers/fyers-service";
import { NextRequest, NextResponse } from "next/server";

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

    return NextResponse.json({ success: true, message: "Fyers token saved successfully" });
  } catch (error) {
    console.error("Fyers auth error:", error);
    return NextResponse.json({ error: "Failed to authenticate with Fyers" }, { status: 500 });
  }
}

// GET: Check Fyers connection status
export async function GET() {
  try {
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const adminDb = createAdminClient();
    const { data: tokenRow } = await adminDb
      .from("fyers_tokens")
      .select("app_id, token_expiry, last_refreshed, is_active")
      .eq("is_active", true)
      .single();

    if (!tokenRow) {
      return NextResponse.json({
        connected: false,
        message: "No Fyers token configured",
      });
    }

    const expiry = new Date(tokenRow.token_expiry);
    const isExpired = expiry.getTime() < Date.now();

    return NextResponse.json({
      connected: !isExpired,
      appId: tokenRow.app_id,
      tokenExpiry: tokenRow.token_expiry,
      lastRefreshed: tokenRow.last_refreshed,
      isExpired,
    });
  } catch {
    return NextResponse.json({ connected: false, message: "Error checking status" });
  }
}
