import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkReferralFraud, logReferralAttempt, getDeviceFingerprint } from "@/lib/referral-fraud";

// POST: Create a referral with fraud prevention
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { referred_email } = await request.json();

    if (!referred_email || !referred_email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Get IP and user agent for fraud detection
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ipAddress = forwarded?.split(",")[0] || realIp || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const deviceFingerprint = getDeviceFingerprint(request);

    // Run fraud check
    const fraudCheck = await checkReferralFraud(user.id, referred_email, ipAddress, userAgent);

    // Log the attempt regardless of outcome
    await logReferralAttempt(user.id, referred_email, ipAddress, userAgent, fraudCheck);

    if (!fraudCheck.allowed) {
      return NextResponse.json({
        error: "Referral not allowed",
        reason: fraudCheck.reason,
        risk_score: fraudCheck.risk_score,
      }, { status: 403 });
    }

    // Get referrer's referral code
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", user.id)
      .single();

    if (!profile?.referral_code) {
      return NextResponse.json({ error: "Referral code not found" }, { status: 400 });
    }

    // Create the referral
    const { data: referral, error } = await supabase
      .from("referrals")
      .insert({
        referrer_id: user.id,
        referral_code: profile.referral_code,
        referred_email: referred_email.toLowerCase(),
        status: "pending",
        ip_address: ipAddress,
        device_fingerprint: deviceFingerprint,
        risk_score: fraudCheck.risk_score,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") { // Unique violation
        return NextResponse.json({ error: "This email has already been referred" }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      referral,
      message: "Referral created successfully",
    });
  } catch (error) {
    console.error("Referral error:", error);
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  }
}

// GET: Get user's referrals
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: referrals, error } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Calculate stats (Client spec: 25 points per referral)
    const REFERRAL_REWARD_POINTS = 25;
    const completedCount = referrals?.filter(r => r.status === "completed").length || 0;
    
    // Referral milestones per client loyalty doc
    const MILESTONES = [
      { count: 3, bonus: 20 },
      { count: 5, bonus: 50 },
      { count: 10, bonus: 100 },
    ];
    
    const milestoneBonus = MILESTONES.filter(m => completedCount >= m.count)
      .reduce((sum, m) => sum + m.bonus, 0);
    
    const nextMilestone = MILESTONES.find(m => completedCount < m.count);

    const stats = {
      total: referrals?.length || 0,
      pending: referrals?.filter(r => r.status === "pending").length || 0,
      completed: completedCount,
      points_earned: completedCount * REFERRAL_REWARD_POINTS + milestoneBonus,
      milestone_bonus: milestoneBonus,
      next_milestone: nextMilestone ? {
        referrals_needed: nextMilestone.count - completedCount,
        target: nextMilestone.count,
        bonus: nextMilestone.bonus,
      } : null,
    };

    return NextResponse.json({ referrals, stats });
  } catch (error) {
    console.error("Fetch referrals error:", error);
    return NextResponse.json({ referrals: [], stats: { total: 0, pending: 0, completed: 0, points_earned: 0 } });
  }
}
