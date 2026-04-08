import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Save to database
    const adminDb = createAdminClient();
    const { error: dbError } = await adminDb
      .from("contact_submissions")
      .insert({
        name,
        email,
        subject,
        message,
        status: "new",
      });

    if (dbError) {
      console.error("[Contact API] DB error:", dbError);
      // Continue to send email even if DB save fails
    }

    // Send email via Resend
    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });
    
    const { error } = await resend.emails.send({
      from: "INTROSPECT™ <onboarding@resend.dev>", // Use your verified domain later
      to: "intradaymindview@gmail.com",
      replyTo: email,
      subject: `New Inquiry: ${subject}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                📬 New Contact Inquiry
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                ${timestamp}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Contact Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px; background-color: #f9fafb; border-radius: 12px; border-left: 4px solid #10b981;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">From</span>
                          <p style="margin: 4px 0 0; color: #111827; font-size: 16px; font-weight: 600;">${name}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Email</span>
                          <p style="margin: 4px 0 0;"><a href="mailto:${email}" style="color: #10b981; font-size: 15px; text-decoration: none;">${email}</a></p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Subject</span>
                          <p style="margin: 4px 0 0; color: #111827; font-size: 15px; font-weight: 500;">${subject}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Message -->
              <div style="margin-bottom: 32px;">
                <h3 style="margin: 0 0 12px; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Message</h3>
                <div style="padding: 20px; background-color: #fafafa; border-radius: 12px; border: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${message}</p>
                </div>
              </div>
              
              <!-- Quick Reply Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px;">
                      ↩️ Reply to ${name.split(' ')[0]}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This message was sent via the INTROSPECT™ contact form.<br>
                <a href="https://www.intradaymindview.com/dashboard/admin/messages" style="color: #10b981; text-decoration: none;">View in Admin Dashboard →</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (error) {
      console.error("[Contact API] Resend error:", error);
      // Don't fail if email fails but DB succeeded
      if (dbError) {
        return NextResponse.json(
          { error: "Failed to send message" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Contact API] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Fetch contact submissions (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

    const adminDb = createAdminClient();
    
    let query = adminDb
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Contact API] Fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
    }

    return NextResponse.json({ submissions: data || [] });
  } catch (err) {
    console.error("[Contact API] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update submission status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: "ID and status required" }, { status: 400 });
    }

    const adminDb = createAdminClient();
    const { error } = await adminDb
      .from("contact_submissions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("[Contact API] Update error:", error);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Contact API] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
