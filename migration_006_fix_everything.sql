-- ============================================
-- INTROSPECT™ Database Migration 006
-- Fix Infinite Recursion & Apply Loyalty Engine
-- ============================================

BEGIN;

-- 1. FIX INFINITE RECURSION ON PROFILES
-- Drop all existing policies that might cause loops
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;

-- Create safe, non-recursive policies for profiles
CREATE POLICY "Enable read access for all users" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (id = auth.uid()) 
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (id = auth.uid());


-- 2. APPLY LOYALTY ENGINE V3 COLUMNS (IF NOT ALREADY PRESENT)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_points_balance integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_lifetime_points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_tier text DEFAULT 'Bronze' CHECK (current_tier IN ('Bronze', 'Silver', 'Gold', 'Platinum'));

ALTER TABLE public.loyalty_points
ADD COLUMN IF NOT EXISTS action_type text DEFAULT 'activity',
ADD COLUMN IF NOT EXISTS running_balance integer,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';


-- 3. APPLY 6-MONTH SUBSCRIPTION PLAN
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('monthly', '6-month', 'yearly'));


-- 4. CREATE NEW TABLES FOR LOYALTY
CREATE TABLE IF NOT EXISTS public.redemptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  points_cost integer NOT NULL DEFAULT 150,
  reward_type text NOT NULL DEFAULT '1_free_month',
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  applied_to_subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

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


-- 5. SAFE RLS FOR NEW TABLES
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own redemptions" ON public.redemptions;
DROP POLICY IF EXISTS "Admins can view all redemptions" ON public.redemptions;

CREATE POLICY "Users can view own redemptions"
  ON public.redemptions FOR SELECT
  USING (auth.uid() = user_id);
-- (Admin routes use Service Role Key which bypasses RLS automatically, no admin policy needed)

ALTER TABLE public.loyalty_events_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all event queues" ON public.loyalty_events_queue;
-- (Service role key will handle event queue processing)


-- 6. TIER UPDATE FUNCTION & TRIGGER
CREATE OR REPLACE FUNCTION public.update_loyalty_tier()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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

DROP TRIGGER IF EXISTS tr_update_loyalty_tier ON public.profiles;
CREATE TRIGGER tr_update_loyalty_tier
BEFORE UPDATE OF total_lifetime_points ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_loyalty_tier();

COMMIT;
