import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Default pricing (fallback if DB not configured)
const DEFAULT_PRICING = {
  monthly: { amount: 333, amount_paise: 33300 },
  "6-month": { amount: 1836, amount_paise: 183600 },
  yearly: { amount: 3654, amount_paise: 365400 },
};

// GET /api/pricing — Public endpoint, no auth required
// Returns current pricing from system_settings (or defaults)
export async function GET() {
  try {
    const adminDb = createAdminClient();
    const { data: settings, error } = await adminDb
      .from("system_settings")
      .select("key, value")
      .in("key", ["pricing_monthly", "pricing_6month", "pricing_yearly", "fyers_default_instrument"]);

    if (error) {
      console.error("[PRICING] DB error:", error);
    }

    console.log("[PRICING] Raw settings from DB:", JSON.stringify(settings));

    const pricing = { ...DEFAULT_PRICING };
    let defaultInstrument = "Nifty 50";

    if (settings && settings.length > 0) {
      settings.forEach((s) => {
        if (s.key === "pricing_monthly" && s.value?.amount) {
          pricing.monthly = { amount: s.value.amount, amount_paise: s.value.amount_paise || s.value.amount * 100 };
        }
        if (s.key === "pricing_6month" && s.value?.amount) {
          pricing["6-month"] = { amount: s.value.amount, amount_paise: s.value.amount_paise || s.value.amount * 100 };
        }
        if (s.key === "pricing_yearly" && s.value?.amount) {
          pricing.yearly = { amount: s.value.amount, amount_paise: s.value.amount_paise || s.value.amount * 100 };
        }
        if (s.key === "fyers_default_instrument" && s.value?.instrument) {
          defaultInstrument = s.value.instrument;
        }
      });
    }

    console.log("[PRICING] Final pricing:", JSON.stringify(pricing), "Default Instrument:", defaultInstrument);

    // No cache - always fetch fresh pricing
    return NextResponse.json({ pricing, defaultInstrument }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[PRICING] Fetch error:", error);
    // Always return defaults on error - never break the pricing page
    return NextResponse.json({ pricing: DEFAULT_PRICING });
  }
}
