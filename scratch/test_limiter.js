// Directly check DB queries

// Let's implement a direct test of the logic since it's TS and might need ts-node,
// or we can write a JS version of checkAndTrackAiUsage to pinpoint the error.
const { createClient } = require("@supabase/supabase-js");

const url = "https://bgwqaycjwfpnioffluvs.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnd3FheWNqd2ZwbmlvZmZsdXZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0NTcxNiwiZXhwIjoyMDg4ODIxNzE2fQ.OYNrcXM-Eu90q53I4BxfMKkTFU7bxf7shhCXJibSADU";

const supabase = createClient(url, key);

async function check(userId, stateText) {
  const today = new Date().toISOString().split("T")[0];
  try {
    console.log("1. Checking subscription for user", userId);
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("id, plan, status, current_period_end")
      .eq("user_id", userId)
      .eq("status", "active")
      .gte("current_period_end", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error("subError:", subError);
      throw subError;
    }
    console.log("Subscription:", subscription);

    console.log("2. MD5 Cache probe");
    const crypto = require("crypto");
    const stateHash = crypto.createHash("md5").update(stateText).digest("hex");
    const { data: cache, error: cacheError } = await supabase
      .from("ai_response_cache")
      .select("response_text")
      .eq("state_hash", stateHash)
      .limit(1)
      .maybeSingle();

    if (cacheError) {
      console.error("cacheError:", cacheError);
      throw cacheError;
    }
    console.log("Cache:", cache);

    console.log("3. Daily Usage Cap");
    const { data: usage, error: usageError } = await supabase
      .from("user_ai_usage")
      .select("call_count")
      .eq("user_id", userId)
      .eq("date", today)
      .limit(1)
      .maybeSingle();

    if (usageError) {
      console.error("usageError:", usageError);
      throw usageError;
    }
    console.log("Usage:", usage);

  } catch (err) {
    console.error("Caught error:", err);
  }
}

const userId = "35b1b42f-5bdb-4795-b55d-3d29f891df6a";
const stateText = JSON.stringify({ trades: [], date: "2026-05-27" });

check(userId, stateText);
