import { NextRequest, NextResponse } from "next/server";
import { getFyersToken } from "@/lib/fyers/fyers-service";

// Cron job to proactively refresh Fyers token before market hours
// Runs daily at 8:00 AM IST (2:30 AM UTC)
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting Fyers token refresh cron job...");

    // This will trigger auto-refresh if needed
    const token = await getFyersToken();

    if (token) {
      console.log("Fyers token refreshed successfully");
      return NextResponse.json({
        success: true,
        message: "Token refreshed successfully",
        timestamp: new Date().toISOString(),
      });
    } else {
      console.warn("Fyers token refresh returned null - may need manual re-auth");
      return NextResponse.json({
        success: false,
        message: "Token refresh failed - manual re-authentication may be required",
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Fyers token refresh cron error:", error);
    return NextResponse.json({
      success: false,
      error: String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
