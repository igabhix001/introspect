import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (by role or email)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin" || user.email === "intradaymindview@gmail.com";
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all loyalty transactions with user profiles
    const { data: transactions } = await supabase
      .from("loyalty_points")
      .select(`
        *,
        profiles(full_name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    // Get user count
    const { count: membersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Calculate totals
    let issued = 0;
    let redeemed = 0;
    
    (transactions || []).forEach((tx: { points: number }) => {
      if (tx.points > 0) issued += tx.points;
      else redeemed += Math.abs(tx.points);
    });

    return NextResponse.json({
      transactions: transactions || [],
      totals: {
        issued,
        redeemed,
        members: membersCount || 0,
      },
    });
  } catch (error) {
    console.error("Admin points error:", error);
    return NextResponse.json({ error: "Failed to fetch points data" }, { status: 500 });
  }
}
