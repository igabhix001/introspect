import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * OAuth & Email Verification Callback Handler
 * Handles:
 * 1. Google OAuth redirect (code exchange)
 * 2. Email verification magic links (PKCE code exchange)
 * 3. Password reset links
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  // Handle OAuth/auth errors
  if (error) {
    console.error("[Auth Callback] Error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/auth/verify?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || error)}`,
        requestUrl.origin
      )
    );
  }

  if (!code) {
    console.error("[Auth Callback] No code provided");
    return NextResponse.redirect(new URL("/auth/login?error=No+authorization+code", requestUrl.origin));
  }

  try {
    const supabase = await createClient();

    // Exchange the code for a session (works for both OAuth and email confirmation)
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[Auth Callback] Exchange error:", exchangeError);
      return NextResponse.redirect(
        new URL(
          `/auth/login?error=${encodeURIComponent(exchangeError.message)}`,
          requestUrl.origin
        )
      );
    }

    if (!data.user) {
      return NextResponse.redirect(new URL("/auth/login?error=Authentication+failed", requestUrl.origin));
    }

    // Use admin client to reliably read role without RLS interference
    const adminDb = createAdminClient();

    // Check/create profile
    const { data: existingProfile } = await adminDb
      .from("profiles")
      .select("id, role")
      .eq("id", data.user.id)
      .maybeSingle();

    let userRole = existingProfile?.role || "user";

    if (!existingProfile) {
      // Create profile for new user (email signup or OAuth)
      const { data: newProfile } = await adminDb
        .from("profiles")
        .upsert({
          id: data.user.id,
          email: data.user.email,
          full_name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            null,
          role: "user",
        })
        .select("id, role")
        .single();
      userRole = newProfile?.role || "user";
    }

    // Admin users → admin dashboard
    if (userRole === "admin") {
      return NextResponse.redirect(new URL("/dashboard/admin", requestUrl.origin));
    }

    // Check subscription status for non-admin users
    const { data: subscription } = await adminDb
      .from("subscriptions")
      .select("id")
      .eq("user_id", data.user.id)
      .eq("status", "active")
      .gte("current_period_end", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    // Redirect based on subscription status
    if (subscription) {
      return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
    } else {
      return NextResponse.redirect(new URL("/pricing", requestUrl.origin));
    }
  } catch (err) {
    console.error("[Auth Callback] Unexpected error:", err);
    return NextResponse.redirect(
      new URL("/auth/login?error=Authentication+failed", requestUrl.origin)
    );
  }
}
