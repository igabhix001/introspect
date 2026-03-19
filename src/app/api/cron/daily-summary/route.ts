import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const ADMIN_EMAIL = "intradaymindview@gmail.com";

// Lazy initialization to avoid build-time errors
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
}

/**
 * Daily EOD Summary Email - Runs at 12:02 AM IST daily
 * 
 * Sends a comprehensive summary of the day's activity to the admin:
 * - New subscriptions (with user details, plan, amount)
 * - Subscription renewals
 * - New user signups
 * - Total revenue for the day
 * - Active user count
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = createAdminClient();
    
    // Get yesterday's date range (since this runs at 12:02 AM)
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayISO = yesterday.toISOString();
    const todayISO = todayStart.toISOString();

    // Fetch new subscriptions from yesterday
    const { data: subscriptions } = await adminDb
      .from("subscriptions")
      .select(`
        id,
        plan,
        amount_paid,
        status,
        created_at,
        user_id,
        razorpay_payment_id
      `)
      .gte("created_at", yesterdayISO)
      .lt("created_at", todayISO)
      .order("created_at", { ascending: false });

    // Fetch user details for subscriptions
    const userIds = subscriptions?.map(s => s.user_id) || [];
    const { data: profiles } = userIds.length > 0 
      ? await adminDb
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds)
      : { data: [] };

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Fetch new user signups from yesterday
    const { data: newUsers } = await adminDb
      .from("profiles")
      .select("id, full_name, email, created_at")
      .gte("created_at", yesterdayISO)
      .lt("created_at", todayISO)
      .order("created_at", { ascending: false });

    // Calculate totals
    const totalRevenue = subscriptions?.reduce((sum, s) => sum + (s.amount_paid || 0), 0) || 0;
    const newSubscriptionCount = subscriptions?.length || 0;
    const newUserCount = newUsers?.length || 0;

    // Get total active subscriptions count
    const { count: activeSubCount } = await adminDb
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .gte("current_period_end", now.toISOString());

    // Get total user count
    const { count: totalUserCount } = await adminDb
      .from("profiles")
      .select("id", { count: "exact", head: true });

    // Format date for email
    const dateStr = yesterday.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Build subscription details HTML
    let subscriptionDetailsHtml = "";
    if (subscriptions && subscriptions.length > 0) {
      subscriptionDetailsHtml = subscriptions.map(sub => {
        const profile = profileMap.get(sub.user_id);
        const planLabel = sub.plan === "yearly" ? "Annual" : sub.plan === "6-month" ? "6-Month" : "Monthly";
        const amount = sub.amount_paid ? `₹${sub.amount_paid.toLocaleString("en-IN")}` : "N/A";
        return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 8px;">${profile?.full_name || "Unknown"}</td>
            <td style="padding: 12px 8px;">${profile?.email || "N/A"}</td>
            <td style="padding: 12px 8px;">${planLabel}</td>
            <td style="padding: 12px 8px; font-weight: 600; color: #22c55e;">${amount}</td>
            <td style="padding: 12px 8px; font-size: 12px; color: #6b7280;">${sub.razorpay_payment_id || "N/A"}</td>
          </tr>
        `;
      }).join("");
    } else {
      subscriptionDetailsHtml = `
        <tr>
          <td colspan="5" style="padding: 20px; text-align: center; color: #6b7280;">
            No new subscriptions yesterday
          </td>
        </tr>
      `;
    }

    // Build new users HTML
    let newUsersHtml = "";
    if (newUsers && newUsers.length > 0) {
      newUsersHtml = newUsers.map(user => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px;">${user.full_name || "Unknown"}</td>
          <td style="padding: 8px;">${user.email || "N/A"}</td>
        </tr>
      `).join("");
    } else {
      newUsersHtml = `
        <tr>
          <td colspan="2" style="padding: 16px; text-align: center; color: #6b7280;">
            No new signups yesterday
          </td>
        </tr>
      `;
    }

    // Build the email HTML
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
      <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Daily Activity Summary</p>
    </div>

    <!-- Date Banner -->
    <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-bottom: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #374151; font-size: 16px; font-weight: 600;">${dateStr}</p>
    </div>

    <!-- Stats Grid -->
    <div style="padding: 24px;">
      <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px;">
        <div style="flex: 1; min-width: 120px; background-color: #f0fdf4; border-radius: 8px; padding: 16px; text-align: center;">
          <p style="margin: 0; font-size: 28px; font-weight: 700; color: #22c55e;">₹${totalRevenue.toLocaleString("en-IN")}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Revenue</p>
        </div>
        <div style="flex: 1; min-width: 120px; background-color: #eff6ff; border-radius: 8px; padding: 16px; text-align: center;">
          <p style="margin: 0; font-size: 28px; font-weight: 700; color: #3b82f6;">${newSubscriptionCount}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">New Subs</p>
        </div>
        <div style="flex: 1; min-width: 120px; background-color: #faf5ff; border-radius: 8px; padding: 16px; text-align: center;">
          <p style="margin: 0; font-size: 28px; font-weight: 700; color: #a855f7;">${newUserCount}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Signups</p>
        </div>
      </div>

      <!-- Active Stats -->
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Active Subscriptions</p>
            <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 600; color: #374151;">${activeSubCount || 0}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Total Users</p>
            <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 600; color: #374151;">${totalUserCount || 0}</p>
          </div>
        </div>
      </div>

      <!-- Subscriptions Table -->
      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #374151;">💰 New Subscriptions</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Name</th>
            <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Email</th>
            <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Plan</th>
            <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Amount</th>
            <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Payment ID</th>
          </tr>
        </thead>
        <tbody>
          ${subscriptionDetailsHtml}
        </tbody>
      </table>

      <!-- New Users Table -->
      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #374151;">👤 New Signups</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151;">Name</th>
            <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151;">Email</th>
          </tr>
        </thead>
        <tbody>
          ${newUsersHtml}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 12px; color: #6b7280;">
        This is an automated daily summary from INTROSPECT™
      </p>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">
        Generated at ${now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send the email
    const resend = getResendClient();
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: "INTROSPECT <noreply@intradaymindview.com>",
      to: [ADMIN_EMAIL],
      subject: `📊 Daily Summary: ${dateStr} | ₹${totalRevenue.toLocaleString("en-IN")} Revenue, ${newSubscriptionCount} Subs`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Failed to send daily summary email:", emailError);
      return NextResponse.json({ 
        error: "Failed to send email", 
        details: emailError 
      }, { status: 500 });
    }

    // Log to notifications table as well
    await adminDb.from("notifications").insert({
      title: "Daily Summary Sent",
      message: `EOD summary for ${dateStr}: ₹${totalRevenue} revenue, ${newSubscriptionCount} subscriptions, ${newUserCount} signups`,
      type: "system",
    });

    return NextResponse.json({
      success: true,
      emailId: emailResult?.id,
      summary: {
        date: dateStr,
        revenue: totalRevenue,
        newSubscriptions: newSubscriptionCount,
        newUsers: newUserCount,
        activeSubscriptions: activeSubCount,
        totalUsers: totalUserCount,
      },
    });
  } catch (error) {
    console.error("Daily summary cron error:", error);
    return NextResponse.json({ error: "Failed to generate daily summary" }, { status: 500 });
  }
}
