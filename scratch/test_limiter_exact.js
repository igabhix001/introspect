require('dotenv').config();
const { createSupabaseClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Service Role Key exists:", !!serviceRoleKey);

const adminDb = require("@supabase/supabase-js").createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function run() {
  const userId = "35b1b42f-5bdb-4795-b55d-3d29f891df6a";
  const stateText = JSON.stringify({ trades: [], date: "2026-05-27" });
  const today = new Date().toISOString().split("T")[0];

  try {
    const { data: subscription, error: subError } = await adminDb
      .from("subscriptions")
      .select("id, plan, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .gte("current_period_end", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (subError) throw subError;
    console.log("Sub:", subscription);

    const stateHash = crypto.createHash("md5").update(stateText).digest("hex");
    const { data: cache, error: cacheError } = await adminDb
      .from("ai_response_cache")
      .select("response_text")
      .eq("state_hash", stateHash)
      .limit(1)
      .maybeSingle();

    if (cacheError) throw cacheError;
    console.log("Cache:", cache);

    const { data: usage, error: usageError } = await adminDb
      .from("user_ai_usage")
      .select("call_count")
      .eq("user_id", userId)
      .eq("date", today)
      .limit(1)
      .maybeSingle();

    if (usageError) throw usageError;
    console.log("Usage:", usage);
  } catch (err) {
    console.error("Error running test:", err);
  }
}

run();
