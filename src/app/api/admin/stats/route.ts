import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// GET: Admin dashboard KPIs
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("[Admin Stats] Auth error:", authError);
    }
    
    if (!user) {
      console.log("[Admin Stats] No user found in session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("[Admin Stats] User:", user.email);

    // Role-based admin check
    try {
      const adminDb = createAdminClient();
      const { data: profile } = await adminDb.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use admin client for all queries (bypasses RLS)
    const adminDb = createAdminClient();

    // Total users
    const { count: totalUsers } = await adminDb
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "user");

    // Active subscribers
    const { count: activeSubscribers } = await adminDb
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // MRR calculation
    const { data: activeSubs } = await adminDb
      .from("subscriptions")
      .select("plan, amount_paid")
      .eq("status", "active");

    let mrr = 0;
    (activeSubs || []).forEach((sub) => {
      if (sub.plan === "monthly") mrr += sub.amount_paid;
      else if (sub.plan === "yearly") mrr += Math.round(sub.amount_paid / 12);
    });

    // Recent signups (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: recentSignups } = await adminDb
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString());

    // Churn
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const { count: expiredLastMonth } = await adminDb
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "expired")
      .gte("cancelled_at", monthAgo.toISOString());

    const totalActive = (activeSubscribers || 0) + (expiredLastMonth || 0);
    const churnRate = totalActive > 0
      ? Math.round(((expiredLastMonth || 0) / totalActive) * 100 * 10) / 10
      : 0;

    // Recent signups list
    const { data: recentUsers } = await adminDb
      .from("profiles")
      .select("id, full_name, email, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeSubscribers: activeSubscribers || 0,
      mrr,
      churnRate,
      recentSignups: recentSignups || 0,
      recentUsers: recentUsers || [],
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
