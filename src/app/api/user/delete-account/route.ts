import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit";

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const identifier = getRateLimitIdentifier(request, user.id);
    const rateLimitResult = await apiRateLimit(identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

    const userId = user.id;
    const adminDb = createAdminClient();

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
    const { error: authError } = await adminDb.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("Failed to delete auth user from auth table:", authError);
    }

    return NextResponse.json({ success: true, message: "Account deleted successfully" });
  } catch (error: any) {
    console.error("Self-service delete account error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete account" }, { status: 500 });
  }
}
