import { createAdminClient } from "@/lib/supabase/admin";
import { sendLoyaltyPointsEmail } from "@/lib/email/loyalty-email";

/**
 * Centralized Loyalty Points Service
 * 
 * Production-grade implementation following client spec:
 * - 150 points = 1 free month
 * - Points expire after 24 months
 * - Email notification on every point change
 * - CC to admin on all emails
 */

export interface AwardPointsParams {
  userId: string;
  points: number;
  reason: string;
  description: string;
  activityNote?: string;
  skipEmail?: boolean; // For batch operations where we send summary email instead
}

export interface AwardPointsResult {
  success: boolean;
  previousBalance: number;
  newBalance: number;
  pointsAwarded: number;
  emailSent: boolean;
  error?: string;
}

/**
 * Award or deduct points from a user's account
 * Automatically sends email notification with CC to admin
 */
export async function awardPoints(params: AwardPointsParams): Promise<AwardPointsResult> {
  const { userId, points, reason, description, activityNote, skipEmail = false } = params;
  
  if (points === 0) {
    return {
      success: true,
      previousBalance: 0,
      newBalance: 0,
      pointsAwarded: 0,
      emailSent: false,
    };
  }

  const adminDb = createAdminClient();

  try {
    // Get current profile with points balance
    const { data: profile, error: profileError } = await adminDb
      .from("profiles")
      .select("id, full_name, email, current_points_balance, total_lifetime_points, current_tier")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("[LOYALTY] Profile not found:", profileError);
      return {
        success: false,
        previousBalance: 0,
        newBalance: 0,
        pointsAwarded: 0,
        emailSent: false,
        error: "User profile not found",
      };
    }

    const previousBalance = profile.current_points_balance || 0;
    const newBalance = previousBalance + points;
    const newLifetime = points > 0 
      ? (profile.total_lifetime_points || 0) + points 
      : (profile.total_lifetime_points || 0);

    // Calculate new tier based on lifetime points
    const newTier = calculateTier(newLifetime);

    // Calculate expiry date (24 months from now for earned points)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 24);

    // Insert points transaction
    const { error: insertError } = await adminDb
      .from("loyalty_points")
      .insert({
        user_id: userId,
        action: reason,
        points: points,
        description: description,
        expires_at: points > 0 ? expiryDate.toISOString() : null,
        metadata: {
          previous_balance: previousBalance,
          new_balance: newBalance,
          reason: reason,
        },
      });

    if (insertError) {
      console.error("[LOYALTY] Failed to insert points transaction:", insertError);
      return {
        success: false,
        previousBalance,
        newBalance: previousBalance,
        pointsAwarded: 0,
        emailSent: false,
        error: "Failed to record points transaction",
      };
    }

    // Update profile totals
    const { error: updateError } = await adminDb
      .from("profiles")
      .update({
        current_points_balance: Math.max(0, newBalance), // Never go negative
        total_lifetime_points: newLifetime,
        current_tier: newTier,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("[LOYALTY] Failed to update profile:", updateError);
    }

    // Send email notification
    let emailSent = false;
    if (!skipEmail && profile.email) {
      emailSent = await sendLoyaltyPointsEmail({
        userEmail: profile.email,
        userName: profile.full_name || "Valued Member",
        previousBalance,
        pointsChange: points,
        reason,
        currentBalance: Math.max(0, newBalance),
        activityNote,
      });
    }

    console.log(`[LOYALTY] ${points > 0 ? "Awarded" : "Deducted"} ${Math.abs(points)} points to user ${userId} (${reason})`);

    return {
      success: true,
      previousBalance,
      newBalance: Math.max(0, newBalance),
      pointsAwarded: points,
      emailSent,
    };
  } catch (error) {
    console.error("[LOYALTY] Error in awardPoints:", error);
    return {
      success: false,
      previousBalance: 0,
      newBalance: 0,
      pointsAwarded: 0,
      emailSent: false,
      error: String(error),
    };
  }
}

/**
 * Calculate user tier based on lifetime points
 */
export function calculateTier(lifetimePoints: number): string {
  if (lifetimePoints >= 900) return "Platinum";
  if (lifetimePoints >= 600) return "Gold";
  if (lifetimePoints >= 300) return "Silver";
  return "Bronze";
}

/**
 * Points values per action type (from client spec)
 */
export const POINTS_CONFIG = {
  // Subscription rewards (Disabled per client request: "no rewards for Challenges, renewals or anything else")
  monthly_purchase: 0,
  monthly_renewal: 0,
  semiannual_purchase: 0,
  annual_purchase: 0,
  annual_renewal: 0,
  early_renewal: 0,
  
  // Referral rewards (ENABLED - only referrals earn points)
  referral_reward: 25,
  referral_milestone_3: 20,
  referral_milestone_5: 50,
  referral_milestone_10: 100,
  
  // Challenge rewards (Disabled per client request)
  challenge_30: 0,
  challenge_60: 0,
  challenge_90: 0,
  
  // Engagement rewards (Disabled per client request)
  journal_entry: 0,
  weekly_journal: 0, // Legacy - kept for backward compatibility
  birthday_bonus: 0,
  anniversary: 0,
  
  // Redemption
  free_month_cost: -150,
  three_months_cost: -400,
} as const;

/**
 * Get points value for an action
 */
export function getPointsForAction(action: keyof typeof POINTS_CONFIG): number {
  return POINTS_CONFIG[action];
}

/**
 * Check if user can redeem for free month
 */
export async function canRedeemFreeMonth(userId: string): Promise<{ canRedeem: boolean; currentBalance: number }> {
  const adminDb = createAdminClient();
  
  const { data: profile } = await adminDb
    .from("profiles")
    .select("current_points_balance")
    .eq("id", userId)
    .single();

  const currentBalance = profile?.current_points_balance || 0;
  
  return {
    canRedeem: currentBalance >= 150,
    currentBalance,
  };
}

/**
 * Redeem points for free month
 */
export async function redeemFreeMonth(userId: string): Promise<AwardPointsResult> {
  const { canRedeem, currentBalance } = await canRedeemFreeMonth(userId);
  
  if (!canRedeem) {
    return {
      success: false,
      previousBalance: currentBalance,
      newBalance: currentBalance,
      pointsAwarded: 0,
      emailSent: false,
      error: "Insufficient points for redemption",
    };
  }

  return awardPoints({
    userId,
    points: -150,
    reason: "redemption",
    description: "Redeemed 150 points for 1 free month",
    activityNote: "Points successfully applied to your membership renewal. Enjoy your free month!",
  });
}
