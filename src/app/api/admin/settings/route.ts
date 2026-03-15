import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (user.email === "intradaymindview@gmail.com") return user;
  try {
    const adminDb = createAdminClient();
    const { data: profile } = await adminDb.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role === "admin") return user;
  } catch { /* fall through */ }
  return null;
}

// GET: Fetch system settings
export async function GET() {
  try {
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const adminDb = createAdminClient();
    const { data: settings } = await adminDb.from("system_settings").select("*");

    const settingsMap: Record<string, unknown> = {};
    (settings || []).forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PATCH: Update system settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const adminDb = createAdminClient();
    const { key, value } = await request.json();

    if (!key) return NextResponse.json({ error: "Key is required" }, { status: 400 });

    const { error } = await adminDb
      .from("system_settings")
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
        updated_by: admin.id,
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
