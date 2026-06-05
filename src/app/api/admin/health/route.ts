import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import Razorpay from "razorpay";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is admin
    const adminDb = createAdminClient();
    const { data: profile } = await adminDb
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const health: Record<string, string> = {
      database: "error",
      resend: "unknown",
      razorpay: "unknown",
      marketFeed: "unknown"
    };

    // 1. Database Check
    try {
      const { data, error } = await adminDb.from("profiles").select("id").limit(1);
      if (!error && data) {
        health.database = "connected";
      }
    } catch {
      health.database = "error";
    }

    // 2. Resend Check
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const resend = new Resend(apiKey);
        if (apiKey.startsWith("re_")) {
          health.resend = "configured";
        } else {
          health.resend = "invalid_key";
        }
      } else {
        health.resend = "missing";
      }
    } catch {
      health.resend = "error";
    }

    // 3. Razorpay Check
    try {
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (keyId && keySecret) {
        const razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });
        // Quick lookup check
        await razorpay.orders.all({ count: 1 });
        health.razorpay = "active";
      } else {
        health.razorpay = "missing";
      }
    } catch (e: any) {
      console.warn("Razorpay check failed:", e.message);
      health.razorpay = "error";
    }

    // 4. Market Feed Check (Fyers)
    try {
      const appId = process.env.FYERS_APP_ID;
      const secretKey = process.env.FYERS_SECRET_KEY;
      if (appId && secretKey) {
        health.marketFeed = "live";
      } else {
        health.marketFeed = "configured";
      }
    } catch {
      health.marketFeed = "error";
    }

    return NextResponse.json({ health });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
