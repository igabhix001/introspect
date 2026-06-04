import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeTrialEmail } from "@/lib/email/welcome-email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = createAdminClient();
    const cacheKey = `welcome_email_sent:${user.id}`;

    // 1. Check if email was already sent
    const { data: existing } = await adminDb
      .from("ai_response_cache")
      .select("state_hash")
      .eq("state_hash", cacheKey)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ status: "already_sent" });
    }

    // 2. Fetch subscription details to check for trial status and get end date
    const { data: sub } = await adminDb
      .from("subscriptions")
      .select("plan, current_period_end")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch user profile for name
    const { data: profile } = await adminDb
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const userName = profile?.full_name || user.user_metadata?.full_name || "Trader";
    const trialEndDate = sub?.plan === "trial" ? sub.current_period_end : undefined;

    // 3. Send the email
    const emailSent = await sendWelcomeTrialEmail({
      userEmail: user.email!,
      userName,
      trialEndDate,
    });

    if (emailSent) {
      // 4. Record state in cache
      await adminDb.from("ai_response_cache").insert({
        state_hash: cacheKey,
        response_text: `sent_at:${new Date().toISOString()}`,
      });
      return NextResponse.json({ status: "sent" });
    }

    return NextResponse.json({ status: "skipped_or_failed" });
  } catch (error: any) {
    console.error("[Welcome Email API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
