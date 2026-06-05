import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// POST: Create a new admin user (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify caller is admin
    try {
      const adminDb = createAdminClient();
      const { data: profile } = await adminDb.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, password, full_name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Use admin client (service_role) to create user + set role
    const adminDb = createAdminClient();

    // Create auth user via admin API (bypasses email verification)
    const { data: newUser, error: signUpError } = await adminDb.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { full_name: full_name || "Admin" },
    });

    if (signUpError) throw signUpError;

    if (newUser?.user) {
      // Set role to admin in profiles
      const { error: updateError } = await adminDb
        .from("profiles")
        .upsert({
          id: newUser.user.id,
          role: "admin",
          full_name: full_name || "Admin",
          email,
        })
        .select()
        .single();

      if (updateError) {
        console.error("Profile update error:", updateError);
        // Try insert if upsert fails
        await adminDb
          .from("profiles")
          .insert({
            id: newUser.user.id,
            role: "admin",
            full_name: full_name || "Admin",
            email,
          });
      }
    }

    return NextResponse.json({ success: true, userId: newUser?.user?.id });
  } catch (error) {
    console.error("Create admin error:", error);
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}
