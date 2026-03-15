import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: points, error } = await supabase
      .from("loyalty_points")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ points });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch loyalty points" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { action_type, points, description, metadata } = await request.json();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client to bypass RLS for inserting system-generated points in some edge cases
    // Or just use the user client since RLS might allow them to insert their own points if properly scoped.
    // For safety, we use admin client to modify points balances and insert ledger records.
    const adminDb = createAdminClient();

    // Award Points
    const { data: newPoints, error } = await adminDb
      .from("loyalty_points")
      .insert({
        user_id: user.id,
        action: description || "System Award",
        action_type: action_type || "activity",
        points: points,
        description: description,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    // Update Profile Totals
    const { data: profile } = await adminDb
      .from("profiles")
      .select("current_points_balance, total_lifetime_points")
      .eq("id", user.id)
      .single();

    if (profile) {
      const newBalance = (profile.current_points_balance || 0) + points;
      const newLifetime = points > 0 ? (profile.total_lifetime_points || 0) + points : (profile.total_lifetime_points || 0);

      await adminDb
        .from("profiles")
        .update({
          current_points_balance: newBalance,
          total_lifetime_points: newLifetime,
        })
        .eq("id", user.id);
    }

    return NextResponse.json({ success: true, points: newPoints });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to handle loyalty points" },
      { status: 500 }
    );
  }
}
