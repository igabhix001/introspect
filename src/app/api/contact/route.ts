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
    const { error } = await resend.emails.send({
      from: "INTROSPECT Contact <onboarding@resend.dev>", // Use your verified domain later
      to: "intradaymindview@gmail.com",
      replyTo: email,
      subject: `[Contact Form] ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br />")}</p>
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
