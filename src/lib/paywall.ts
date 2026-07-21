export const FREE_JOURNAL_LIMIT = 50;

export interface SubscriptionStatus {
  isPro: boolean;
  plan: string | null;
  isAdmin: boolean;
}

/**
 * Checks if the user has an active Pro subscription or Admin role.
 */
export async function checkUserSubscription(
  supabase: any,
  userId: string
): Promise<SubscriptionStatus> {
  if (!userId) {
    return { isPro: false, plan: null, isAdmin: false };
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    const isAdmin = profile?.role === "admin";

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id, plan, status, current_period_end")
      .eq("user_id", userId)
      .eq("status", "active")
      .gte("current_period_end", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    const isPro = !!subscription || isAdmin;

    return {
      isPro,
      plan: subscription?.plan || (isAdmin ? "admin" : "free"),
      isAdmin,
    };
  } catch (error) {
    console.error("Error checking subscription:", error);
    return { isPro: false, plan: null, isAdmin: false };
  }
}
