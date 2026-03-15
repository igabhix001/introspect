/**
 * Referral Fraud Prevention System
 * Detects and prevents fraudulent referral activities
 */

import { createClient } from "@/lib/supabase/server";

export interface FraudCheckResult {
  allowed: boolean;
  reason?: string;
  risk_score: number; // 0-100, higher = more risky
  flags: string[];
}

/**
 * Check if a referral is potentially fraudulent
 */
export async function checkReferralFraud(
  referrerId: string,
  referredEmail: string,
  ipAddress: string,
  userAgent: string
): Promise<FraudCheckResult> {
  const supabase = await createClient();
  const flags: string[] = [];
  let riskScore = 0;

  // 1. Check if same IP has been used for multiple referrals
  const { data: ipReferrals, error: ipError } = await supabase
    .from("referrals")
    .select("id")
    .eq("ip_address", ipAddress)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (!ipError && ipReferrals && ipReferrals.length >= 3) {
    flags.push("multiple_referrals_same_ip");
    riskScore += 40;
  }

  // 2. Check if referrer has too many referrals in short time
  const { data: recentReferrals } = await supabase
    .from("referrals")
    .select("id")
    .eq("referrer_id", referrerId)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (recentReferrals && recentReferrals.length >= 10) {
    flags.push("high_referral_velocity");
    riskScore += 30;
  }

  // 3. Check for similar email patterns (e.g., test+1@gmail.com, test+2@gmail.com)
  const emailBase = referredEmail.split("@")[0].replace(/\+.*$/, "").toLowerCase();
  const emailDomain = referredEmail.split("@")[1];
  
  const { data: similarEmails } = await supabase
    .from("referrals")
    .select("referred_email")
    .eq("referrer_id", referrerId);

  if (similarEmails) {
    const similarCount = similarEmails.filter(r => {
      const base = r.referred_email.split("@")[0].replace(/\+.*$/, "").toLowerCase();
      const domain = r.referred_email.split("@")[1];
      return base === emailBase && domain === emailDomain;
    }).length;

    if (similarCount >= 2) {
      flags.push("similar_email_pattern");
      riskScore += 25;
    }
  }

  // 4. Check for disposable email domains
  const disposableDomains = [
    "tempmail.com", "throwaway.email", "guerrillamail.com", "10minutemail.com",
    "mailinator.com", "yopmail.com", "temp-mail.org", "fakeinbox.com",
    "trashmail.com", "getnada.com", "maildrop.cc", "dispostable.com"
  ];

  if (disposableDomains.includes(emailDomain.toLowerCase())) {
    flags.push("disposable_email");
    riskScore += 50;
  }

  // 5. Check if referred user already exists
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", referredEmail)
    .single();

  if (existingUser) {
    flags.push("user_already_exists");
    riskScore += 100; // Definite fraud
  }

  // 6. Check for self-referral (same email domain as referrer)
  const { data: referrerProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", referrerId)
    .single();

  if (referrerProfile) {
    const referrerDomain = referrerProfile.email?.split("@")[1];
    if (referrerDomain === emailDomain && !["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"].includes(emailDomain)) {
      flags.push("same_corporate_domain");
      riskScore += 20;
    }
  }

  // Determine if allowed
  const allowed = riskScore < 50;

  return {
    allowed,
    reason: allowed ? undefined : `Referral blocked due to: ${flags.join(", ")}`,
    risk_score: Math.min(riskScore, 100),
    flags,
  };
}

/**
 * Log referral attempt for fraud analysis
 */
export async function logReferralAttempt(
  referrerId: string,
  referredEmail: string,
  ipAddress: string,
  userAgent: string,
  fraudCheck: FraudCheckResult
): Promise<void> {
  const supabase = await createClient();

  await supabase.from("referral_audit_log").insert({
    referrer_id: referrerId,
    referred_email: referredEmail,
    ip_address: ipAddress,
    user_agent: userAgent,
    risk_score: fraudCheck.risk_score,
    flags: fraudCheck.flags,
    allowed: fraudCheck.allowed,
    blocked_reason: fraudCheck.reason,
  });
}

/**
 * Get fingerprint hash from request headers
 * Used for device fingerprinting
 */
export function getDeviceFingerprint(request: Request): string {
  const userAgent = request.headers.get("user-agent") || "";
  const acceptLanguage = request.headers.get("accept-language") || "";
  const acceptEncoding = request.headers.get("accept-encoding") || "";
  
  // Simple hash function
  const str = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
