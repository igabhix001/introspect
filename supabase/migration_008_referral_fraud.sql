-- Migration 008: Referral Fraud Prevention & Loyalty Enhancements
-- Run this migration to add fraud prevention and loyalty features

-- =============================================
-- 1. REFERRAL FRAUD PREVENTION
-- =============================================

-- Add columns to referrals table for fraud tracking
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referred_email TEXT;

-- Create referral audit log table
CREATE TABLE IF NOT EXISTS referral_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  risk_score INTEGER DEFAULT 0,
  flags TEXT[] DEFAULT '{}',
  allowed BOOLEAN DEFAULT true,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for fraud analysis queries
CREATE INDEX IF NOT EXISTS idx_referral_audit_ip ON referral_audit_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_referral_audit_referrer ON referral_audit_log(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_audit_created ON referral_audit_log(created_at);

-- =============================================
-- 2. LOYALTY POINTS ENHANCEMENTS
-- =============================================

-- Add columns to loyalty_points for expiry tracking
ALTER TABLE loyalty_points ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE loyalty_points ADD COLUMN IF NOT EXISTS expired BOOLEAN DEFAULT false;
ALTER TABLE loyalty_points ADD COLUMN IF NOT EXISTS description TEXT;

-- Add index for expiry cron job
CREATE INDEX IF NOT EXISTS idx_loyalty_expiry ON loyalty_points(expires_at, expired) WHERE expired = false;

-- =============================================
-- 3. CHALLENGES ENHANCEMENTS
-- =============================================

-- Add columns to challenges for daily checkin
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS last_checkin_date DATE;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS total_days INTEGER DEFAULT 30;

-- =============================================
-- 4. PROFILES ENHANCEMENTS
-- =============================================

-- Add birthday and points columns if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- =============================================
-- 5. RLS POLICIES
-- =============================================

ALTER TABLE referral_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access audit logs (admin only)
DROP POLICY IF EXISTS "Service role full access to audit logs" ON referral_audit_log;
CREATE POLICY "Service role full access to audit logs"
  ON referral_audit_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can view audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON referral_audit_log;
CREATE POLICY "Admins can view audit logs"
  ON referral_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON TABLE referral_audit_log IS 'Tracks all referral attempts for fraud analysis';
