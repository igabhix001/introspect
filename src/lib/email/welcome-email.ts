import { Resend } from "resend";

const ADMIN_EMAIL = "intradaymindview@gmail.com";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not configured - emails will be skipped");
    return null;
  }
  return new Resend(apiKey);
}

interface WelcomeEmailParams {
  userEmail: string;
  userName: string;
  type?: "welcome_trial" | "existing_user_trial" | "trial_expiry_warning";
  trialStartDate?: string | Date;
  trialEndDate?: string | Date;
}

/**
 * Calculates date after N business days (trading days) excluding Saturdays and Sundays.
 */
function calculateTradingDaysEnd(startDateInput: Date, daysCount: number = 5): Date {
  let count = 0;
  const date = new Date(startDateInput.getTime());
  while (count < daysCount) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) { // Not Sunday or Saturday
      count++;
    }
  }
  return date;
}

function formatLocalDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Send welcome or warning email to trial users
 */
export async function sendWelcomeTrialEmail(params: WelcomeEmailParams): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.log("[EMAIL] Skipping email send - Resend not configured");
    return false;
  }

  const { userEmail, userName, type = "welcome_trial", trialStartDate, trialEndDate } = params;

  // Determine dates
  const startD = trialStartDate ? new Date(trialStartDate) : new Date();
  const endD = trialEndDate ? new Date(trialEndDate) : calculateTradingDaysEnd(startD, 5);

  const startStr = formatLocalDate(startD);
  const endStr = formatLocalDate(endD);

  let subject = "";
  let emailHtml = "";

  const headerHtml = `
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center;">
      <h1 style="color: #22c55e; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.05em;">INTROSPECT™</h1>
      <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 15px;">Your AI Trading Psychology & Discipline Companion</p>
    </div>
  `;

  const footerHtml = `
    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 4px 0; color: #374151; font-size: 14px;">Happy trading,</p>
      <p style="margin: 0; color: #22c55e; font-size: 14px; font-weight: 600;">The INTROSPECT Support Team</p>
      <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
        You received this email because you signed up for an account on <a href="https://www.intradaymindview.com" style="color: #3b82f6; text-decoration: none;">intradaymindview.com</a>.
      </p>
    </div>
  `;

  if (type === "welcome_trial") {
    subject = "Welcome to INTROSPECT™ – Your 5-Day Trial Starts Now";
    emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    ${headerHtml}
    
    <!-- Trial Details Banner -->
    <div style="background-color: #f0fdf4; padding: 16px; text-align: center; border-bottom: 1px solid #dcfce7;">
      <p style="margin: 0; color: #15803d; font-size: 14px; font-weight: 600;">
        🎁 Thank you for joining! Your 5 Trading Days Trial starts from ${startStr} to ${endStr}
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px;">
      <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; line-height: 1.5;">
        Dear <strong>${userName || "Trader"}</strong>,
      </p>
      
      <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
        Thank you for starting your journey with INTROSPECT™. Your 5-trading-days trial is now active starting from <strong>${startStr}</strong> until <strong>${endStr}</strong>.
      </p>

      <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
        We hope INTROSPECT™ helps you build solid execution discipline, identify psychological triggers, and protect your capital. Explore your dashboard today.
      </p>

      <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
        If you have any questions or need assistance, feel free to contact us.
      </p>

      <!-- CTA -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="https://www.intradaymindview.com/dashboard" style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 28px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.2);">
          Open Your Dashboard
        </a>
      </div>
    </div>

    ${footerHtml}
  </div>
</body>
</html>
    `;
  } else if (type === "existing_user_trial") {
    subject = "INTROSPECT™ – 5-Day Free Trial Unlocked For You";
    emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    ${headerHtml}
    
    <!-- Trial Details Banner -->
    <div style="background-color: #f0fdf4; padding: 16px; text-align: center; border-bottom: 1px solid #dcfce7;">
      <p style="margin: 0; color: #15803d; font-size: 14px; font-weight: 600;">
        🎁 Special Offer: 5 Trading Days Trial unlocked from ${startStr} to ${endStr}
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px;">
      <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; line-height: 1.5;">
        Hi <strong>${userName || "Trader"}</strong>,
      </p>
      
      <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
        We have unlocked a special 5 trading days trial of INTROSPECT™ for you! Your trial starts from <strong>${startStr}</strong> and runs until <strong>${endStr}</strong>.
      </p>

      <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
        Enjoy complete access to our advanced risk engines, position calculators, and mistake detectors. Explore how structured discipline can grow your trading edge.
      </p>

      <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
        Thank you for being a part of the Intraday MindView community.
      </p>

      <!-- CTA -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="https://www.intradaymindview.com/dashboard" style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 28px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.2);">
          Open Your Dashboard
        </a>
      </div>
    </div>

    ${footerHtml}
  </div>
</body>
</html>
    `;
  } else if (type === "trial_expiry_warning") {
    subject = "Action Required: Your INTROSPECT™ Trial Ends Today";
    emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    ${headerHtml}
    
    <!-- Expiry Details Banner -->
    <div style="background-color: #fef2f2; padding: 16px; text-align: center; border-bottom: 1px solid #fee2e2;">
      <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 600;">
        ⚠️ Your Free Trial Expires Today (${endStr})
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px;">
      <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; line-height: 1.5;">
        Dear <strong>${userName || "Trader"}</strong>,
      </p>
      
      <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
        Today is the last date of your trial period. To prevent losing access to your trade logs, behavioral risk assessments, and position calculators, please subscribe to one of our plans.
      </p>

      <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
        Consistency requires commitment. By subscribing, you secure the discipline infrastructure that protects your capital day in and day out.
      </p>

      <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
        Choose from our plans starting at just ₹333/month.
      </p>

      <!-- CTA -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="https://www.intradaymindview.com/pricing" style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 28px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.2);">
          View Plans & Subscribe
        </a>
      </div>
    </div>

    ${footerHtml}
  </div>
</body>
</html>
    `;
  }

  try {
    const isSandbox = !process.env.RESEND_API_KEY || 
                      process.env.RESEND_API_KEY.includes("re_temp") || 
                      !process.env.NEXT_PUBLIC_SITE_URL?.includes("intradaymindview.com");
    const fromSender = isSandbox 
      ? "INTROSPECT <onboarding@resend.dev>" 
      : "INTROSPECT <noreply@intradaymindview.com>";

    const { error } = await resend.emails.send({
      from: fromSender,
      to: [userEmail],
      cc: [ADMIN_EMAIL],
      subject,
      html: emailHtml,
    });

    if (error) {
      console.error(`[EMAIL] Failed to send email of type ${type}:`, error);
      return false;
    }

    console.log(`[EMAIL] Email of type ${type} sent to ${userEmail}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] Error sending email of type ${type}:`, err);
    return false;
  }
}
