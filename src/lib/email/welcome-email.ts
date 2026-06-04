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
  trialEndDate?: string; // ISO string or formatted date
}

/**
 * Send welcome email to trial users on signup
 */
export async function sendWelcomeTrialEmail(params: WelcomeEmailParams): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.log("[EMAIL] Skipping welcome email - Resend not configured");
    return false;
  }

  const { userEmail, userName, trialEndDate } = params;

  let endLocalDateStr = "7 days from today";
  if (trialEndDate) {
    try {
      const d = new Date(trialEndDate);
      if (!isNaN(d.getTime())) {
        endLocalDateStr = d.toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    } catch (e) {
      console.error("[EMAIL] Error parsing trial end date:", e);
    }
  }

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
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center;">
      <h1 style="color: #22c55e; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.05em;">INTROSPECT™</h1>
      <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 15px;">Your AI Trading Psychology & Discipline Companion</p>
    </div>

    <!-- Trial Details Banner -->
    <div style="background-color: #f0fdf4; padding: 16px; text-align: center; border-bottom: 1px solid #dcfce7;">
      <p style="margin: 0; color: #15803d; font-size: 14px; font-weight: 600;">
        🎁 Your 7-Day Free Trial is Active until ${endLocalDateStr}
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px;">
      <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; line-height: 1.5;">
        Dear <strong>${userName || "Trader"}</strong>,
      </p>
      
      <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
        We are pleased to inform you that your trial access for the <strong>Introspect Tool</strong> has been successfully unlocked.
      </p>

      <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
        Your trial period will remain active until <strong>${endLocalDateStr}</strong>.
      </p>

      <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
        We hope this trial helps you explore the features and benefits of the Introspect Tool. If you have any questions or need any assistance, please feel free to contact us.
      </p>

      <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
        Thank you for choosing Introspect Tool.
      </p>

      <p style="margin: 0 0 4px 0; color: #374151; font-size: 15px; line-height: 1.5;">
        Best regards,
      </p>
      <p style="margin: 0 0 24px 0; color: #22c55e; font-size: 15px; font-weight: 600; line-height: 1.5;">
        Introspect team
      </p>

      <!-- CTA -->
      <div style="text-align: center; margin-bottom: 24px; mt-4: 16px;">
        <a href="https://www.intradaymindview.com/dashboard" style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 28px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.2);">
          Open Your Dashboard
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 4px 0; color: #374151; font-size: 14px;">Happy trading,</p>
      <p style="margin: 0; color: #22c55e; font-size: 14px; font-weight: 600;">The INTROSPECT Support Team</p>
      <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
        You received this email because you signed up for an account on <a href="https://www.intradaymindview.com" style="color: #3b82f6; text-decoration: none;">intradaymindview.com</a>.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const isSandbox = !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("re_");
    const fromSender = isSandbox 
      ? "INTROSPECT <onboarding@resend.dev>" 
      : "INTROSPECT <noreply@intradaymindview.com>";

    const { error } = await resend.emails.send({
      from: fromSender,
      to: [userEmail],
      cc: [ADMIN_EMAIL],
      subject: "Welcome to INTROSPECT™ – Build Discipline, Protect Capital",
      html: emailHtml,
    });

    if (error) {
      console.error("[EMAIL] Failed to send welcome trial email:", error);
      return false;
    }

    console.log(`[EMAIL] Welcome trial email sent to ${userEmail} (trial active until ${endLocalDateStr})`);
    return true;
  } catch (err) {
    console.error("[EMAIL] Error sending welcome trial email:", err);
    return false;
  }
}
