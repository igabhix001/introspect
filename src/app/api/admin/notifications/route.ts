import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

// POST: Send notification
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const adminDb = createAdminClient();
    const { title, message, type, target, targetUserId } = await request.json();

    const { data, error } = await adminDb
      .from("notifications")
      .insert({
        title,
        message,
        type: type || "info",
        target: target || "all",
        target_user_id: targetUserId || null,
        sent_by: admin.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ notification: data });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}

// GET: List notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminDb = createAdminClient();

    let roleIsAdmin = false;
    try {
      const { data: profile } = await adminDb.from("profiles").select("role").eq("id", user.id).single();
      roleIsAdmin = profile?.role === "admin";
    } catch { /* not admin */ }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let query;
    if (roleIsAdmin) {
      query = adminDb
        .from("notifications")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
    } else {
      query = adminDb
        .from("notifications")
        .select("*", { count: "exact" })
        .or(`target.eq.all,target_user_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
    }

    const { data: notifications, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ notifications, total: count, page, limit });
  } catch {
    return NextResponse.json({ notifications: [], total: 0 });
  }
}
