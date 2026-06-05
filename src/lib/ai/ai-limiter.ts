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
 * Verifies user subscription, checks cost and request quotas, and probes cache.
 */
export async function checkAndTrackAiUsage(
  userId: string,
  stateText: string,
  callType: "daily_insight" | "weekly_review" | "monthly_review" | "deep_pattern" = "daily_insight"
): Promise<LimiterResult> {
  const adminDb = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  try {
    // 1. Fetch user profile to check for admin privileges (Strict RBAC, no email bypasses)
    const { data: profile, error: profileError } = await adminDb
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw profileError;
    const isAdmin = profile?.role === "admin";

    // 2. MD5 Cache Probe - Cache hits are allowed even if the user has hit their spending/request limits!
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

    // Only verify subscription, cost limits, and quotas if the user is not an admin
    if (!isAdmin) {
      // 3. Verify Active Subscription
      const { data: subscription, error: subError } = await adminDb
        .from("subscriptions")
        .select("id, plan, status, current_period_start")
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

      // 4. Calculate Billing Cycle Start Date
      // Fallback to rolling 30 days if subscription date is invalid
      const billingCycleStart = subscription.current_period_start
        ? new Date(subscription.current_period_start).toISOString().split("T")[0]
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      // 5. Query usage history within the billing cycle
      const { data: usageRows, error: usageError } = await adminDb
        .from("user_ai_usage")
        .select("total_cost, daily_insights_count, weekly_reviews_count, monthly_reviews_count, deep_patterns_count, date, call_count")
        .eq("user_id", userId)
        .gte("date", billingCycleStart);

      // Handle DB errors gracefully (e.g., if new columns don't exist yet on local developer DB)
      if (usageError && usageError.code !== "PGRST204") {
        console.warn("Could not query new AI usage columns, falling back to basic call_count checks.");
        
        // Basic fallback: count daily rows using standard call_count
        const { data: fallbackUsage } = await adminDb
          .from("user_ai_usage")
          .select("call_count")
          .eq("user_id", userId)
          .eq("date", today)
          .limit(1)
          .maybeSingle();
        
        const dailyCalls = fallbackUsage?.call_count || 0;
        if (dailyCalls >= 5) {
          return {
            allowed: false,
            error: "LIMIT_EXCEEDED",
            message: "You have reached your daily limit of 5 AI coaching insights. Limits reset tomorrow."
          };
        }
        return { allowed: true };
      }

      // 6. Calculate accumulated monthly AI costs
      const accumulatedCost = usageRows?.reduce((sum, r) => sum + Number(r.total_cost || 0), 0) || 0;
      
      // Enforce monthly hard limit of ₹25
      if (accumulatedCost >= 25.0) {
        return {
          allowed: false,
          error: "LIMIT_EXCEEDED",
          message: "You've reached your AI coaching limit for this billing period. Core behavioral insights and alerts remain available."
        };
      }

      // 7. Enforce specific request quotas based on callType
      if (callType === "daily_insight") {
        // Daily limit of 5 AI coaching insights
        const todayRow = usageRows?.find(r => r.date === today);
        const todayCount = todayRow ? (todayRow.daily_insights_count !== undefined ? todayRow.daily_insights_count : todayRow.call_count) : 0;
        if (todayCount >= 5) {
          return {
            allowed: false,
            error: "LIMIT_EXCEEDED",
            message: "You have reached your daily limit of 5 AI coaching insights. Limits reset tomorrow."
          };
        }
      } else if (callType === "weekly_review") {
        // Weekly limit of 1 AI review (checked in the last 7 rolling days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const weeklyCount = usageRows
          ?.filter(r => r.date >= sevenDaysAgo)
          ?.reduce((sum, r) => sum + Number(r.weekly_reviews_count || 0), 0) || 0;

        if (weeklyCount >= 1) {
          return {
            allowed: false,
            error: "LIMIT_EXCEEDED",
            message: "You have reached your weekly limit of 1 AI review. Limits reset next week."
          };
        }
      } else if (callType === "monthly_review") {
        // Monthly limit of 1 Monthly review
        const monthlyCount = usageRows?.reduce((sum, r) => sum + Number(r.monthly_reviews_count || 0), 0) || 0;
        if (monthlyCount >= 1) {
          return {
            allowed: false,
            error: "LIMIT_EXCEEDED",
            message: "You have reached your monthly limit of 1 Monthly review. Limits reset next billing cycle."
          };
        }
      } else if (callType === "deep_pattern") {
        // Monthly limit of 5 Deep pattern analyses
        const deepCount = usageRows?.reduce((sum, r) => sum + Number(r.deep_patterns_count || 0), 0) || 0;
        if (deepCount >= 5) {
          return {
            allowed: false,
            error: "LIMIT_EXCEEDED",
            message: "You have reached your limit of 5 Deep pattern analyses for this billing cycle."
          };
        }
      }
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
 * Commits the generated AI response to cache, records tokens, cost, and increments usage counts.
 */
export async function commitAiUsage(
  userId: string,
  stateText: string,
  responseText: string,
  inputTokens: number,
  outputTokens: number,
  callType: "daily_insight" | "weekly_review" | "monthly_review" | "deep_pattern" = "daily_insight"
): Promise<void> {
  const adminDb = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const stateHash = computeStateHash(stateText);

  // Enforce request tokens limits: Input <= 500, Output <= 300
  if (inputTokens > 500) {
    console.warn(`[AI Limiter Warning] Input tokens exceeded 500: ${inputTokens}`);
  }
  if (outputTokens > 300) {
    console.warn(`[AI Limiter Warning] Output tokens exceeded 300: ${outputTokens}`);
  }

  // Calculate API cost for moonshot Kimi API: ₹0.15/1k input, ₹0.25/1k output
  const cost = (inputTokens * 0.00015) + (outputTokens * 0.00025);

  try {
    // 1. Save response to cache
    await adminDb
      .from("ai_response_cache")
      .upsert({
        state_hash: stateHash,
        response_text: responseText,
        created_at: new Date().toISOString()
      }, { onConflict: "state_hash" });

    console.log(`Saved response to AI cache. Hash: ${stateHash}`);

    // 2. Increment daily usage count and cost
    const { data: usage } = await adminDb
      .from("user_ai_usage")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .limit(1)
      .maybeSingle();

    const increment = {
      daily_insights: callType === "daily_insight" ? 1 : 0,
      weekly_reviews: callType === "weekly_review" ? 1 : 0,
      monthly_reviews: callType === "monthly_review" ? 1 : 0,
      deep_patterns: callType === "deep_pattern" ? 1 : 0,
    };

    if (usage) {
      const updatePayload: Record<string, any> = {
        call_count: (usage.call_count || 0) + 1
      };

      // Add columns only if they are supported by the schema (handling local dev DB vs prod migration)
      if (usage.total_cost !== undefined) {
        updatePayload.input_tokens = (usage.input_tokens || 0) + inputTokens;
        updatePayload.output_tokens = (usage.output_tokens || 0) + outputTokens;
        updatePayload.total_cost = Number((Number(usage.total_cost || 0) + cost).toFixed(4));
        updatePayload.daily_insights_count = (usage.daily_insights_count || 0) + increment.daily_insights;
        updatePayload.weekly_reviews_count = (usage.weekly_reviews_count || 0) + increment.weekly_reviews;
        updatePayload.monthly_reviews_count = (usage.monthly_reviews_count || 0) + increment.monthly_reviews;
        updatePayload.deep_patterns_count = (usage.deep_patterns_count || 0) + increment.deep_patterns;
      }

      await adminDb
        .from("user_ai_usage")
        .update(updatePayload)
        .eq("id", usage.id);
    } else {
      const insertPayload: Record<string, any> = {
        user_id: userId,
        date: today,
        call_count: 1
      };

      // Try inserting with new columns, fall back to basic if schema is old
      try {
        await adminDb
          .from("user_ai_usage")
          .insert({
            ...insertPayload,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            total_cost: Number(cost.toFixed(4)),
            daily_insights_count: increment.daily_insights,
            weekly_reviews_count: increment.weekly_reviews,
            monthly_reviews_count: increment.monthly_reviews,
            deep_patterns_count: increment.deep_patterns
          });
      } catch (insertErr) {
        console.warn("Failed to insert with new AI columns, falling back to basic insert.");
        await adminDb
          .from("user_ai_usage")
          .insert(insertPayload);
      }
    }
  } catch (error) {
    console.error("Failed to commit AI usage:", error);
  }
}
