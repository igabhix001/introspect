-- Migration: AI Cost Tracking & Pricing Plan Updates
-- Adds token usage tracking columns to public.user_ai_usage and updates the system pricing settings.

-- 1. Alter user_ai_usage to add token and cost tracking columns
ALTER TABLE public.user_ai_usage 
  ADD COLUMN IF NOT EXISTS input_tokens integer not null default 0,
  ADD COLUMN IF NOT EXISTS output_tokens integer not null default 0,
  ADD COLUMN IF NOT EXISTS total_cost numeric(10,4) not null default 0,
  ADD COLUMN IF NOT EXISTS daily_insights_count integer not null default 0,
  ADD COLUMN IF NOT EXISTS weekly_reviews_count integer not null default 0,
  ADD COLUMN IF NOT EXISTS monthly_reviews_count integer not null default 0,
  ADD COLUMN IF NOT EXISTS deep_patterns_count integer not null default 0;

-- 2. Update default prices in system_settings
INSERT INTO public.system_settings (key, value) VALUES
  ('pricing_monthly', '{"amount": 333, "amount_paise": 33300}'),
  ('pricing_6month', '{"amount": 1836, "amount_paise": 183600}'),
  ('pricing_yearly', '{"amount": 3654, "amount_paise": 365400}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
