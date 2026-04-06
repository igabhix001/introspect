import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const ADMIN_CC = "intradaymindview@gmail.com";
const SITE_URL = "https://www.intradaymindview.com";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(apiKey);
}

// Email templates for 3-part activation sequence
function getWelcomeEmail(firstName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Activate Your INTROSPECT Account</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:16px;border:1px solid #222222;overflow:hidden;max-width:600px;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#111111 0%,#1a2a1a 100%);padding:32px 40px;border-bottom:1px solid #222222;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#22c55e;letter-spacing:-0.5px;">INTROSPECT™</p>
              <p style="margin:4px 0 0;font-size:12px;color:#666666;letter-spacing:2px;text-transform:uppercase;">Discipline-First Trading</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">Activate Your INTROSPECT Account Today</h1>
              <p style="margin:0 0 20px;font-size:16px;color:#aaaaaa;line-height:1.6;">Hi ${firstName},</p>
              <p style="margin:0 0 20px;font-size:15px;color:#aaaaaa;line-height:1.7;">
                Thanks for signing up with INTROSPECT — your discipline journey starts here. Right now, your account is created but not yet activated. Without activation, you'll miss out on daily risk limits, discipline alerts, and the guardrails that protect your capital.
              </p>
              <p style="margin:0 0 8px;font-size:15px;color:#ffffff;font-weight:600;">Here's what you can do:</p>
              <ul style="margin:0 0 24px;padding-left:20px;color:#aaaaaa;line-height:1.8;font-size:14px;">
                <li>Complete your subscription in just one step.</li>
                <li>Unlock features that help you avoid costly mistakes.</li>
                <li>Start building consistency with simple daily rituals.</li>
              </ul>
              <p style="margin:0 0 32px;font-size:15px;color:#aaaaaa;line-height:1.7;">
                Remember: <strong style="color:#ffffff;">one bad trade can cost more than your subscription.</strong> Activating today is like putting on a seatbelt before driving — it keeps you safe.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background-color:#22c55e;border-radius:12px;">
                    <a href="${SITE_URL}/pricing" style="display:inline-block;padding:16px 32px;font-size:16px;font-weight:700;color:#000000;text-decoration:none;letter-spacing:-0.3px;">
                      Activate My Account →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:14px;color:#666666;line-height:1.6;">
                We're excited to support your journey toward discipline-first trading.
              </p>
              <p style="margin:8px 0 0;font-size:14px;color:#888888;">
                Warm regards,<br>
                <strong style="color:#ffffff;">Team, INTROSPECT</strong>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #222222;">
              <p style="margin:0;font-size:12px;color:#444444;text-align:center;">
                You're receiving this because you signed up at intradaymindview.com.<br>
                <a href="${SITE_URL}" style="color:#22c55e;text-decoration:none;">Visit INTROSPECT™</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getReminderEmail(firstName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reminder: Activate INTROSPECT</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:16px;border:1px solid #222222;overflow:hidden;max-width:600px;">
          <tr>
            <td style="background:linear-gradient(135deg,#111111 0%,#1a2a1a 100%);padding:32px 40px;border-bottom:1px solid #222222;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#22c55e;letter-spacing:-0.5px;">INTROSPECT™</p>
              <p style="margin:4px 0 0;font-size:12px;color:#666666;letter-spacing:2px;text-transform:uppercase;">Discipline-First Trading</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">Reminder: Activate INTROSPECT to Protect Your Capital</h1>
              <p style="margin:0 0 20px;font-size:16px;color:#aaaaaa;line-height:1.6;">Hi ${firstName},</p>
              <p style="margin:0 0 20px;font-size:15px;color:#aaaaaa;line-height:1.7;">
                Just checking in — we noticed you signed up but haven't activated your INTROSPECT account yet. Many traders tell us the biggest benefit they get after activating is <strong style="color:#ffffff;">peace of mind</strong>: knowing their daily risk limits and discipline guardrails are always in place.
              </p>
              <!-- Story callout -->
              <div style="background-color:#0d1f0d;border:1px solid #1a3a1a;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
                <p style="margin:0;font-size:14px;color:#22c55e;font-weight:600;margin-bottom:8px;">💡 Real Story</p>
                <p style="margin:0;font-size:14px;color:#aaaaaa;line-height:1.7;">
                  One of our users avoided a total wipeout because INTROSPECT reminded him to stop after hitting his 3% daily loss limit. <strong style="color:#ffffff;">That single alert saved his account.</strong>
                </p>
              </div>
              <p style="margin:0 0 32px;font-size:15px;color:#aaaaaa;line-height:1.7;">
                You can unlock the same protection today by completing your subscription.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background-color:#22c55e;border-radius:12px;">
                    <a href="${SITE_URL}/pricing" style="display:inline-block;padding:16px 32px;font-size:16px;font-weight:700;color:#000000;text-decoration:none;letter-spacing:-0.3px;">
                      Activate My Account →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:8px 0 0;font-size:14px;color:#888888;">
                Stay disciplined,<br>
                <strong style="color:#ffffff;">Team INTROSPECT</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #222222;">
              <p style="margin:0;font-size:12px;color:#444444;text-align:center;">
                You're receiving this because you signed up at intradaymindview.com.<br>
                <a href="${SITE_URL}" style="color:#22c55e;text-decoration:none;">Visit INTROSPECT™</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getUrgencyEmail(firstName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Last Chance to Activate INTROSPECT</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:16px;border:1px solid #222222;overflow:hidden;max-width:600px;">
          <tr>
            <td style="background:linear-gradient(135deg,#111111 0%,#2a1a1a 100%);padding:32px 40px;border-bottom:1px solid #222222;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#22c55e;letter-spacing:-0.5px;">INTROSPECT™</p>
              <p style="margin:4px 0 0;font-size:12px;color:#666666;letter-spacing:2px;text-transform:uppercase;">Discipline-First Trading</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <!-- Urgency badge -->
              <div style="background-color:#2a0a0a;border:1px solid #4a1a1a;border-radius:8px;padding:10px 16px;margin:0 0 24px;display:inline-block;">
                <p style="margin:0;font-size:13px;color:#ef4444;font-weight:700;letter-spacing:0.5px;">⚠ URGENT: Action Required</p>
              </div>
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">Urgent: Last Chance to Activate INTROSPECT</h1>
              <p style="margin:0 0 20px;font-size:16px;color:#aaaaaa;line-height:1.6;">Hi ${firstName},</p>
              <p style="margin:0 0 20px;font-size:15px;color:#aaaaaa;line-height:1.7;">
                Your window is closing, and without activation you'll lose access to the discipline guardrails that protect your capital. Remember: <strong style="color:#ffffff;">one bad trade can cost more than your subscription.</strong>
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#aaaaaa;line-height:1.7;">
                This is your last reminder. Don't let discipline slip away — secure your guardrails now.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background-color:#22c55e;border-radius:12px;">
                    <a href="${SITE_URL}/pricing" style="display:inline-block;padding:16px 32px;font-size:16px;font-weight:700;color:#000000;text-decoration:none;letter-spacing:-0.3px;">
                      Activate My Account →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:8px 0 0;font-size:14px;color:#888888;">
                Protect your capital today,<br>
                <strong style="color:#ffffff;">Team INTROSPECT</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #222222;">
              <p style="margin:0;font-size:12px;color:#444444;text-align:center;">
                You're receiving this because you signed up at intradaymindview.com.<br>
                <a href="${SITE_URL}" style="color:#22c55e;text-decoration:none;">Visit INTROSPECT™</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * GET /api/cron/activation-reminders
 * Runs daily and sends activation reminder emails to users without subscriptions.
 * 
 * 3-part email sequence for users who signed up but never subscribed:
 *   Day 1 → Welcome email (sent immediately via signup hook, but we catch any missed)
 *   Day 3 → Reminder email with social proof
 *   Day 7 → Urgency email (last chance)
 * 
 * We track sent emails in the user_notifications table to avoid duplicates.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = createAdminClient();
    const resend = getResendClient();
    const now = new Date();

    // Get all user IDs with ANY subscription (active, expired, or pending)
    // This ensures we never email users who have ever subscribed
    const { data: allSubs, error: subsError } = await adminDb
      .from("subscriptions")
      .select("user_id, status, current_period_end");

    if (subsError) {
      console.error("[REMINDERS] Failed to fetch subscriptions:", subsError);
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
    }

    // Create a set of ALL user IDs who have ever had a subscription
    // This prevents sending activation emails to anyone who has subscribed (even if expired)
    const subscribedUserIds = new Set((allSubs || []).map((s) => s.user_id));
    
    console.log(`[REMINDERS] Found ${subscribedUserIds.size} users with subscriptions (excluding from reminders)`);

    // Find users who signed up but have NEVER had any subscription
    const { data: unactivatedUsers, error: usersError } = await adminDb
      .from("profiles")
      .select("id, email, full_name, created_at")
      .not("email", "is", null);

    if (usersError) {
      console.error("[REMINDERS] Failed to fetch profiles:", usersError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    if (!unactivatedUsers || unactivatedUsers.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: "No users found" });
    }

    // Filter to only users who have NEVER subscribed (not just inactive)
    const targets = unactivatedUsers.filter((u) => !subscribedUserIds.has(u.id) && u.email);
    
    console.log(`[REMINDERS] ${unactivatedUsers.length} total users, ${targets.length} never subscribed`);

    let sent = { welcome: 0, reminder: 0, urgency: 0, skipped: 0 };

    for (const user of targets) {
      const signupDate = new Date(user.created_at);
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
      const firstName = (user.full_name || "Trader").split(" ")[0];

      // Determine which email to send based on days since signup
      let emailType: "welcome" | "reminder" | "urgency" | null = null;
      if (daysSinceSignup === 1) emailType = "welcome";
      else if (daysSinceSignup === 3) emailType = "reminder";
      else if (daysSinceSignup === 7) emailType = "urgency";

      if (!emailType) {
        sent.skipped++;
        continue;
      }

      // Check if this email type was already sent to this user
      const { data: alreadySent } = await adminDb
        .from("user_notifications")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", `activation_${emailType}`)
        .limit(1)
        .maybeSingle();

      if (alreadySent) {
        sent.skipped++;
        continue;
      }

      // Send email
      try {
        let subject = "";
        let html = "";

        if (emailType === "welcome") {
          subject = "Activate Your INTROSPECT Account Today";
          html = getWelcomeEmail(firstName);
        } else if (emailType === "reminder") {
          subject = "Reminder: Activate INTROSPECT to Protect Your Capital";
          html = getReminderEmail(firstName);
        } else {
          subject = "Urgent: Last Chance to Activate INTROSPECT";
          html = getUrgencyEmail(firstName);
        }

        const { error: emailError } = await resend.emails.send({
          from: "INTROSPECT <noreply@intradaymindview.com>",
          to: [user.email!],
          cc: [ADMIN_CC],
          subject,
          html,
        });

        if (emailError) {
          console.error(`[REMINDERS] Failed to send ${emailType} email to ${user.email}:`, emailError);
          continue;
        }

        // Record that we sent this email to avoid duplicates
        await adminDb.from("user_notifications").insert({
          user_id: user.id,
          title: `Activation ${emailType} email sent`,
          message: `Sent ${emailType} activation reminder email (Day ${daysSinceSignup})`,
          type: `activation_${emailType}`,
          read: true,
        });

        sent[emailType]++;
        console.log(`[REMINDERS] Sent ${emailType} email to ${user.email} (Day ${daysSinceSignup})`);
      } catch (err) {
        console.error(`[REMINDERS] Error sending email to ${user.email}:`, err);
      }
    }

    // Log summary to admin notifications
    const totalSent = sent.welcome + sent.reminder + sent.urgency;
    if (totalSent > 0) {
      await adminDb.from("notifications").insert({
        title: "Activation Reminders Sent",
        message: `Sent ${totalSent} activation reminder email(s): ${sent.welcome} welcome, ${sent.reminder} reminder, ${sent.urgency} urgency. ${sent.skipped} skipped.`,
        type: "system",
      });
    }

    return NextResponse.json({
      success: true,
      sent: totalSent,
      breakdown: sent,
      usersChecked: targets.length,
    });
  } catch (error) {
    console.error("[REMINDERS] Cron job failed:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
