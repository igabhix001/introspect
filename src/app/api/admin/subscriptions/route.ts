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

// GET: List all subscriptions with user info
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const adminDb = createAdminClient();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";

    let query = adminDb
      .from("subscriptions")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data: subscriptions, error } = await query;
    if (error) throw error;

    // Stats
    const { count: total } = await adminDb.from("subscriptions").select("*", { count: "exact", head: true });
    const { count: active } = await adminDb.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active");
    const { data: allSubs } = await adminDb.from("subscriptions").select("plan, amount_paid").eq("status", "active");

    const monthly = (allSubs || []).filter((s) => s.plan === "monthly").length;
    const yearly = (allSubs || []).filter((s) => s.plan === "yearly").length;
    const totalRevenue = (allSubs || []).reduce((sum, s) => sum + s.amount_paid, 0);

    return NextResponse.json({
      subscriptions: subscriptions || [],
      stats: { total: total || 0, active: active || 0, monthly, yearly, totalRevenue },
    });
  } catch (error) {
    console.error("Admin subscriptions error:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

// PATCH: Update subscription (cancel, extend, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const adminDb = createAdminClient();
    const { subscriptionId, updates } = await request.json();

    const allowedFields = ["status", "plan", "current_period_end"];
    const safeUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        safeUpdates[key] = value;
      }
    }

    const { data, error } = await adminDb
      .from("subscriptions")
      .update(safeUpdates)
      .eq("id", subscriptionId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ subscription: data });
  } catch (error) {
    console.error("Admin subscription update error:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
