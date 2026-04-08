import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Debug logging for admin routes
  if (pathname.startsWith("/dashboard/admin") || pathname.startsWith("/api/admin")) {
    console.log(`[Middleware] ${pathname} - User: ${user?.email || 'none'}`);
  }

  // Protect /dashboard routes: redirect unauthenticated users to login
  if (pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Protect /dashboard/admin routes: redirect non-admin users to /dashboard
  if (pathname.startsWith("/dashboard/admin") && user) {
    // First check email-based admin (fastest, no DB call)
    const isEmailAdmin = user.email === "intradaymindview@gmail.com";
    
    if (!isEmailAdmin) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("[Middleware] Profile fetch error:", profileError);
      }

      const isAdmin = profile?.role === "admin";
      if (!isAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  // SaaS subscription gate: non-admin users accessing dashboard (except /payments) must have active subscription
  if (user && pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard/admin") && pathname !== "/dashboard/payments") {
    const isAdmin = user.email === "intradaymindview@gmail.com";
    if (!isAdmin) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gte("current_period_end", new Date().toISOString())
        .limit(1)
        .maybeSingle();

      if (!sub) {
        const url = request.nextUrl.clone();
        url.pathname = "/pricing";
        return NextResponse.redirect(url);
      }
    }
  }

  // Redirect authenticated users away from login/signup pages ONLY
  if (user && (pathname === "/auth/login" || pathname === "/auth/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
