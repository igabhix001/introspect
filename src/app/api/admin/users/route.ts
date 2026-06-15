import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// Helper to verify caller is admin (uses session-based client for auth check)
async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // Try profile check
  try {
    const adminDb = createAdminClient();
    const { data: profile } = await adminDb
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role === "admin") return user;
  } catch {
    // If check fails, return null
  }
  return null;
}

// GET: List all users (admin only, paginated, searchable)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Use admin client (bypasses RLS) for reading all users
    const adminDb = createAdminClient();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    let query = adminDb
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, count, error } = await query;
    if (error) throw error;

    const userIds = (users || []).map((u) => u.id);

    // Batch fetch assessments and active subscriptions in parallel, and run trade counts concurrently
    const [assessmentsRes, activeSubsRes, ...tradeCountsRes] = userIds.length > 0 ? await Promise.all([
      adminDb
        .from("assessments")
        .select("user_id, discipline_score, created_at")
        .in("user_id", userIds)
        .order("created_at", { ascending: false }),
      adminDb
        .from("subscriptions")
        .select("user_id, plan, status")
        .in("user_id", userIds)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      ...userIds.map((uid) =>
        adminDb
          .from("trades")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
      ),
    ]) : [{ data: [] }, { data: [] }];

    const assessments = (assessmentsRes as any).data || [];
    const activeSubs = (activeSubsRes as any).data || [];

    // Map user_id to latest assessment discipline_score
    const latestAssessments = new Map<string, number>();
    assessments.forEach((a: any) => {
      if (!latestAssessments.has(a.user_id)) {
        latestAssessments.set(a.user_id, a.discipline_score);
      }
    });

    // Map user_id to active subscription
    const userSubs = new Map<string, { plan: string; status: string }>();
    activeSubs.forEach((sub: any) => {
      if (!userSubs.has(sub.user_id)) {
        userSubs.set(sub.user_id, { plan: sub.plan, status: sub.status });
      }
    });

    // Map user_id to trade count
    const tradeCountMap = new Map<string, number>();
    if (userIds.length > 0) {
      userIds.forEach((uid, index) => {
        const countRes = tradeCountsRes[index] as { count: number | null };
        tradeCountMap.set(uid, countRes?.count || 0);
      });
    }

    const enrichedUsers = (users || []).map((user) => {
      const activeSub = userSubs.get(user.id);
      return {
        ...user,
        discipline_score: latestAssessments.get(user.id) ?? 0,
        total_trades: tradeCountMap.get(user.id) ?? 0,
        active_plan: activeSub?.plan ?? "none",
        subscription_status: activeSub ? "active" : "inactive",
      };
    });

    return NextResponse.json({ users: enrichedUsers, total: count, page, limit });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// PATCH: Update user (suspend, change role, edit plan)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const adminDb = createAdminClient();
    const { userId, updates } = await request.json();

    // Allow updating: is_suspended, role, trading_capital, full_name, trading_style
    const allowedFields = ["is_suspended", "role", "trading_capital", "full_name", "trading_style"];
    const safeUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        safeUpdates[key] = value;
      }
    }
    safeUpdates.updated_at = new Date().toISOString();

    const { data, error } = await adminDb
      .from("profiles")
      .update(safeUpdates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("Admin update error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE: Delete user and all associated data (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const adminDb = createAdminClient();

    // Check if user exists and is not an admin
    const { data: userProfile } = await adminDb
      .from("profiles")
      .select("role, email")
      .eq("id", userId)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userProfile.role === "admin") {
      return NextResponse.json({ error: "Cannot delete admin users" }, { status: 403 });
    }

    // Delete user data in order (respecting foreign key constraints)
    // 1. Delete trades
    await adminDb.from("trades").delete().eq("user_id", userId);
    
    // 2. Delete assessments
    await adminDb.from("assessments").delete().eq("user_id", userId);
    
    // 3. Delete personalized rules
    await adminDb.from("personalized_rules").delete().eq("user_id", userId);
    
    // 4. Delete challenges
    await adminDb.from("challenges").delete().eq("user_id", userId);
    
    // 5. Delete loyalty points
    await adminDb.from("loyalty_points").delete().eq("user_id", userId);
    
    // 6. Delete subscriptions
    await adminDb.from("subscriptions").delete().eq("user_id", userId);
    
    // 7. Delete referrals (where user is referrer or referred)
    await adminDb.from("referrals").delete().eq("referrer_id", userId);
    await adminDb.from("referrals").delete().eq("referred_id", userId);
    
    // 8. Delete profile
    const { error: profileError } = await adminDb
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) throw profileError;

    // 9. Delete auth user (using Supabase Admin API)
    // Note: This requires service_role key which adminDb should have
    const { error: authError } = await adminDb.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error("Failed to delete auth user:", authError);
      // Profile already deleted, log but don't fail
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin delete error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
