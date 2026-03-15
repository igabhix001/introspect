-- =============================================
-- Fyers Token Storage Table
-- Stores admin-managed Fyers API tokens
-- Auto-refreshed server-side (no manual daily login)
-- =============================================

CREATE TABLE IF NOT EXISTS fyers_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  last_refreshed TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Only one row should be active at a time
CREATE UNIQUE INDEX IF NOT EXISTS fyers_tokens_active_idx ON fyers_tokens (is_active) WHERE is_active = true;

-- RLS: Only service_role can access (admin APIs use service_role)
ALTER TABLE fyers_tokens ENABLE ROW LEVEL SECURITY;

-- No SELECT policy — anon/authenticated users cannot read tokens
-- All access goes through server API routes using service_role

-- =============================================
-- System Settings Table (for pricing config)
-- =============================================

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Seed default pricing
INSERT INTO system_settings (key, value) VALUES
  ('pricing_monthly', '{"amount": 333, "amount_paise": 33300}'),
  ('pricing_yearly', '{"amount": 3663, "amount_paise": 366300}')
ON CONFLICT (key) DO NOTHING;

-- RLS: Anyone can read settings, only service_role can write
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_settings"
ON system_settings FOR SELECT
TO authenticated
USING (true);
