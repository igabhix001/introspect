-- ============================================
-- INTROSPECT™ Database Migration 005
-- Loyalty Engine v3.0 & 6-Month Subscription
-- ============================================

-- 1. UPDATE PROFILES FOR LOYALTY TIERS & BALANCES
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_points_balance integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_lifetime_points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_tier text DEFAULT 'Bronze' CHECK (current_tier IN ('Bronze', 'Silver', 'Gold', 'Platinum'));

-- 2. UPDATE LOYALTY_POINTS LEDGER
ALTER TABLE public.loyalty_points
ADD COLUMN IF NOT EXISTS action_type text DEFAULT 'activity', -- 'purchase', 'activity', 'referral', 'redemption', 'bonus'
ADD COLUMN IF NOT EXISTS running_balance integer,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- 3. UPDATE SUBSCRIPTIONS EXTENSIONS
-- Since the existing 'plan' column has a check constraint: check (plan in ('monthly', 'yearly'))
-- We need to drop and recreate the constraint to allow '6-month'
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('monthly', '6-month', 'yearly'));

-- 4. CREATE REDEMPTIONS TABLE
-- Tracks when users cash out their 150 points for a free month
CREATE TABLE IF NOT EXISTS public.redemptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  points_cost integer NOT NULL DEFAULT 150,
  reward_type text NOT NULL DEFAULT '1_free_month',
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  applied_to_subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on redemptions
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions"
  ON public.redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all redemptions"
  ON public.redemptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. EVENT QUEUE (For asynchronous point rewards to prevent race conditions/fraud)
CREATE TABLE IF NOT EXISTS public.loyalty_events_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  event_payload jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Enable RLS on event queue (Internal System Only ideally, but Admin can view)
ALTER TABLE public.loyalty_events_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all event queues"
  ON public.loyalty_events_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to handle tier updates automatically when lifetime points increase
CREATE OR REPLACE FUNCTION public.update_loyalty_tier()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Tiers: Bronze (0-299), Silver (300-599), Gold (600-899), Platinum (900+)
  IF NEW.total_lifetime_points >= 900 THEN
    NEW.current_tier := 'Platinum';
  ELSIF NEW.total_lifetime_points >= 600 THEN
    NEW.current_tier := 'Gold';
  ELSIF NEW.total_lifetime_points >= 300 THEN
    NEW.current_tier := 'Silver';
  ELSE
    NEW.current_tier := 'Bronze';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to run before update on profiles
DROP TRIGGER IF EXISTS tr_update_loyalty_tier ON public.profiles;
CREATE TRIGGER tr_update_loyalty_tier
BEFORE UPDATE OF total_lifetime_points ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_loyalty_tier();
