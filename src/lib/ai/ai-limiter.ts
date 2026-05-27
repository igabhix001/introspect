import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export interface LimiterResult {
  allowed: boolean;
  cachedResponse?: string;
  error?: "PAYWALL" | "LIMIT_EXCEEDED" | "DB_ERROR";
  message?: string;
}

/**
 * Computes MD5 hash of the given text state.
 */
export function computeStateHash(text: string): string {
  return crypto.createHash("md5").update(text).digest("hex");
}

/**
 * Verifies user subscription, checks daily limit, and probes the response cache.
 */
export async function checkAndTrackAiUsage(
  userId: string,
  stateText: string
): Promise<LimiterResult> {
  const adminDb = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  try {
    // 1. Subscription Verification (Paywall)
    const { data: subscription, error: subError } = await adminDb
      .from("subscriptions")
      .select("id, plan, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .gte("current_period_end", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (subError) throw subError;

    if (!subscription) {
      return {
        allowed: false,
        error: "PAYWALL",
        message: "AI coaching is exclusive to paid subscribers. Please upgrade your plan to unlock."
      };
    }

    // 2. MD5 Cache Probe
    const stateHash = computeStateHash(stateText);
    const { data: cache, error: cacheError } = await adminDb
      .from("ai_response_cache")
      .select("response_text")
      .eq("state_hash", stateHash)
      .limit(1)
      .maybeSingle();

    if (cache) {
      console.log(`AI Cache Hit for state hash: ${stateHash}`);
      return {
        allowed: true,
        cachedResponse: cache.response_text
      };
    }

    // 3. Daily Usage Cap Verification
    const { data: usage, error: usageError } = await adminDb
      .from("user_ai_usage")
      .select("call_count")
      .eq("user_id", userId)
      .eq("date", today)
      .limit(1)
      .maybeSingle();

    if (usageError) throw usageError;

    const callCount = usage?.call_count || 0;
    if (callCount >= 5) {
      return {
        allowed: false,
        error: "LIMIT_EXCEEDED",
        message: "You have reached your daily limit of 5 AI coaching reviews. Limits reset tomorrow."
      };
    }

    return {
      allowed: true
    };
  } catch (error) {
    console.error("AI Limiter error:", error);
    return {
      allowed: false,
      error: "DB_ERROR",
      message: "An error occurred checking subscription or usage limits."
    };
  }
}

/**
 * Commits the generated AI response to cache and increments user's daily usage count.
 */
export async function commitAiUsage(
  userId: string,
  stateText: string,
  responseText: string
): Promise<void> {
  const adminDb = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const stateHash = computeStateHash(stateText);

  try {
    // 1. Increment daily usage count
    const { data: usage } = await adminDb
      .from("user_ai_usage")
      .select("id, call_count")
      .eq("user_id", userId)
      .eq("date", today)
      .limit(1)
      .maybeSingle();

    if (usage) {
      await adminDb
        .from("user_ai_usage")
        .update({ call_count: usage.call_count + 1 })
        .eq("id", usage.id);
    } else {
      await adminDb
        .from("user_ai_usage")
        .insert({
          user_id: userId,
          date: today,
          call_count: 1
        });
    }

    // 2. Save response to cache
    await adminDb
      .from("ai_response_cache")
      .upsert({
        state_hash: stateHash,
        response_text: responseText,
        created_at: new Date().toISOString()
      }, { onConflict: "state_hash" });

    console.log(`Saved response to AI cache. Hash: ${stateHash}`);
  } catch (error) {
    console.error("Failed to commit AI usage:", error);
  }
}
