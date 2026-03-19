import { Resend } from "resend";

const ADMIN_EMAIL = "intradaymindview@gmail.com";

// Lazy initialization to avoid build-time errors
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not configured - emails will be skipped");
    return null;
  }
  return new Resend(apiKey);
}

interface LoyaltyEmailParams {
  userEmail: string;
  userName: string;
  previousBalance: number;
  pointsChange: number; // positive for earned, negative for deducted
  reason: string;
  currentBalance: number;
  activityNote?: string;
}

/**
 * Send loyalty points update email to user with CC to admin
 * 
 * Triggered on:
 * - Points earned (subscription, referral, challenge, birthday, etc.)
 * - Points deducted (redemption, expiry)
 */
export async function sendLoyaltyPointsEmail(params: LoyaltyEmailParams): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.log("[EMAIL] Skipping loyalty email - Resend not configured");
    return false;
  }

  const {
    userEmail,
    userName,
    previousBalance,
    pointsChange,
    reason,
    currentBalance,
    activityNote,
  } = params;

  const isEarned = pointsChange > 0;
  const pointsDisplay = isEarned ? `+${pointsChange}` : `${pointsChange}`;
  const activityType = isEarned ? "Earned" : "Deducted";
  const dateStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Default activity notes based on reason
  const defaultNotes: Record<string, string> = {
    "referral_reward": "Congratulations on successfully referring a friend! Keep sharing to earn more rewards.",
    "monthly_purchase": "Thank you for your subscription! Points have been credited to your account.",
    "annual_purchase": "Thank you for your annual subscription! You've earned bonus points.",
    "semiannual_purchase": "Thank you for your 6-month subscription! Points have been credited.",
    "challenge_30": "Amazing! You've completed the 30-Day Discipline Challenge. Keep up the great work!",
    "challenge_60": "Incredible achievement! 60 days of consistent discipline. You're building great habits!",
    "challenge_90": "Elite status achieved! 90 days of discipline mastery. You're an inspiration!",
    "birthday_bonus": "Happy Birthday! 🎂 Enjoy your special day with bonus points from INTROSPECT.",
    "redemption": "Points successfully applied to your membership renewal.",
    "points_expired": "Some of your points have expired. Remember to use your points before they expire!",
    "admin_adjustment": "Your points balance has been adjusted by the admin team.",
    "weekly_journal": "Great job maintaining your trading journal this week!",
    "early_renewal": "Thank you for renewing early! You've earned bonus points.",
    "anniversary": "Happy Anniversary with INTROSPECT! Thank you for being a loyal member.",
  };

  const note = activityNote || defaultNotes[reason] || `Points ${isEarned ? "earned" : "deducted"} for: ${reason}`;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px; text-align: center;">
      <h1 style="color: #22c55e; margin: 0; font-size: 24px; font-weight: 700;">INTROSPECT™</h1>
      <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Reward Points Update</p>
    </div>

    <!-- Date Banner -->
    <div style="background-color: #f8fafc; padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">${dateStr}</p>
    </div>

    <!-- Content -->
    <div style="padding: 24px;">
      <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px;">
        Dear <strong>${userName || "Valued Member"}</strong>,
      </p>
      
      <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
        We are writing to provide you with an update regarding your reward points balance. Here is the breakdown of today's activity:
      </p>

      <!-- Transaction Summary Card -->
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
        <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 16px; font-weight: 600;">
          📊 Transaction Summary
        </h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Previous Balance:</td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600; text-align: right;">
              ${previousBalance} points
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Activity Today:</td>
            <td style="padding: 8px 0; font-size: 14px; font-weight: 600; text-align: right; color: ${isEarned ? '#22c55e' : '#ef4444'};">
              ${pointsDisplay} points
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Reason:</td>
            <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">
              ${reason.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
            </td>
          </tr>
          <tr style="border-top: 2px solid #e5e7eb;">
            <td style="padding: 12px 0 8px 0; color: #374151; font-size: 16px; font-weight: 700;">Current Balance:</td>
            <td style="padding: 12px 0 8px 0; color: #22c55e; font-size: 18px; font-weight: 700; text-align: right;">
              ${currentBalance} points
            </td>
          </tr>
        </table>
      </div>

      <!-- Activity Details -->
      <div style="background-color: ${isEarned ? '#f0fdf4' : '#fef2f2'}; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid ${isEarned ? '#22c55e' : '#ef4444'};">
        <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
          <strong>Note:</strong> ${note}
        </p>
      </div>

      <!-- Progress to Free Month -->
      ${currentBalance < 150 ? `
      <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">
          <strong>🎯 Progress to Free Month:</strong>
        </p>
        <div style="background-color: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
          <div style="background-color: #22c55e; height: 100%; width: ${Math.min((currentBalance / 150) * 100, 100)}%;"></div>
        </div>
        <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
          ${currentBalance}/150 points (${150 - currentBalance} more to go!)
        </p>
      </div>
      ` : `
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0; color: #22c55e; font-size: 16px; font-weight: 600;">
          🎉 You have enough points for a FREE month!
        </p>
        <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
          Visit your dashboard to redeem your reward.
        </p>
      </div>
      `}

      <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
        Thank you for being a disciplined part of our community.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 4px 0; color: #374151; font-size: 14px;">Best regards,</p>
      <p style="margin: 0; color: #22c55e; font-size: 14px; font-weight: 600;">The INTROSPECT Support Team</p>
      <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
        <a href="https://www.intradaymindview.com/dashboard/loyalty" style="color: #3b82f6; text-decoration: none;">View Your Points Dashboard</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: "INTROSPECT <noreply@intradaymindview.com>",
      to: [userEmail],
      cc: [ADMIN_EMAIL],
      subject: `Update: Your Reward Points Activity for ${dateStr}`,
      html: emailHtml,
    });

    if (error) {
      console.error("[EMAIL] Failed to send loyalty email:", error);
      return false;
    }

    console.log(`[EMAIL] Loyalty points email sent to ${userEmail} (${pointsDisplay} points)`);
    return true;
  } catch (err) {
    console.error("[EMAIL] Error sending loyalty email:", err);
    return false;
  }
}

/**
 * Helper to award points and send email notification
 * Use this centralized function for all point awards
 */
export interface AwardPointsParams {
  userId: string;
  userEmail: string;
  userName: string;
  points: number;
  reason: string;
  description: string;
  activityNote?: string;
}
