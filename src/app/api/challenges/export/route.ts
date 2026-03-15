import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET: Export challenge history as CSV or JSON
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    // Fetch all challenges for user
    const { data: challenges, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (format === "csv") {
      // Generate CSV
      const headers = ["Name", "Type", "Status", "Start Date", "End Date", "Current Day", "Total Days", "Points Earned", "Created At"];
      const rows = (challenges || []).map(c => [
        c.name || "",
        c.type || "",
        c.status || "",
        c.start_date || "",
        c.end_date || "",
        c.current_day || 0,
        c.total_days || 0,
        c.points_earned || 0,
        c.created_at || "",
      ]);

      const csv = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="challenges_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // Default: JSON
    return NextResponse.json({ 
      challenges,
      exported_at: new Date().toISOString(),
      total: challenges?.length || 0,
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export challenges" }, { status: 500 });
  }
}
