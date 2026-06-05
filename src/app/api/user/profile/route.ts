import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/profile
 * Returns the authenticated user's full profile row using the admin client.
 * This bypasses RLS policies that may block reading the `role` field via the anon client.
 * Used by auth-context.tsx on the client to reliably determine admin status.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client to bypass RLS and always read the role field correctly
    const adminDb = createAdminClient();
    const { data: profile, error: profileError } = await adminDb
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("[/api/user/profile] Profile fetch error:", profileError.code, profileError.message);

      // If profile doesn't exist, create it
      if (profileError.code === "PGRST116") {
        const { data: newProfile, error: upsertError } = await adminDb
          .from("profiles")
          .upsert({
            id: user.id,
            email: user.email,
            role: "user",
          })
          .select("*")
          .single();

        if (upsertError) {
          console.error("[/api/user/profile] Failed to create profile:", upsertError);
          return NextResponse.json({ error: "Profile creation failed" }, { status: 500 });
        }

        return NextResponse.json(newProfile);
      }

      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("[/api/user/profile] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
