import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * OAuth Callback Handler
 * Handles the redirect from Google OAuth and exchanges the code for a session
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("[OAuth Callback] Error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    );
  }

  if (!code) {
    console.error("[OAuth Callback] No code provided");
    return NextResponse.redirect(new URL("/auth/login?error=No+authorization+code", requestUrl.origin));
  }

  try {
    const supabase = await createClient();
    
    // Exchange the code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[OAuth Callback] Exchange error:", exchangeError);
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      );
    }

    if (!data.user) {
      return NextResponse.redirect(new URL("/auth/login?error=No+user+returned", requestUrl.origin));
    }

    // Check if user has a profile, create one if not
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile && !profileError) {
      // Create profile for new OAuth user
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
        role: "user",
      });
    }

    // Check if admin
    const isAdmin = profile?.role === "admin" || data.user.email === "intradaymindview@gmail.com";

    if (isAdmin) {
      return NextResponse.redirect(new URL("/dashboard/admin", requestUrl.origin));
    }

    // Check subscription status
    const { data: subscription } = await supabase
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
    console.error("[OAuth Callback] Unexpected error:", err);
    return NextResponse.redirect(new URL("/auth/login?error=Authentication+failed", requestUrl.origin));
  }
}
