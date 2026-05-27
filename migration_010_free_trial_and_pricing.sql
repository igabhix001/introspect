-- ============================================
-- INTROSPECT™ Database Migration 010
-- Implement 7-Day Free Trial & Update Pricing
-- ============================================

BEGIN;

-- 1. Update plans check constraint to support 'trial'
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('trial', 'monthly', '6-month', 'yearly'));

-- 2. Update trigger to automatically add 7-day free trial on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'INTROSPECT-' || UPPER(SUBSTRING(md5(random()::text) FROM 1 FOR 6))
  );

  -- Insert 7-day free trial subscription
  INSERT INTO public.subscriptions (user_id, plan, status, amount_paid, currency, current_period_start, current_period_end)
  VALUES (
    NEW.id,
    'trial',
    'active',
    0,
    'INR',
    NOW(),
    NOW() + INTERVAL '7 days'
  );

  RETURN NEW;
END;
$$;

-- 3. Update system settings with the new default pricing
INSERT INTO public.system_settings (key, value) VALUES
  ('pricing_monthly', '{"amount": 499, "amount_paise": 49900}'),
  ('pricing_6month', '{"amount": 2499, "amount_paise": 249900}'),
  ('pricing_yearly', '{"amount": 3999, "amount_paise": 399900}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 4. Give all existing users who have never had a subscription a 7-day free trial starting now
INSERT INTO public.subscriptions (user_id, plan, status, amount_paid, currency, current_period_start, current_period_end)
SELECT id, 'trial', 'active', 0, 'INR', NOW(), NOW() + INTERVAL '7 days'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.id
);

COMMIT;
