-- ============================================
-- MIGRATION 009: Category Feedback Templates
-- Implements Risk Assessment & Recommendation Engine requirements
-- ============================================

-- 1. Add categories_analysis column to assessments table
ALTER TABLE public.assessments 
ADD COLUMN IF NOT EXISTS categories_analysis jsonb default '{}';

-- 2. Create category_feedback_templates table
CREATE TABLE IF NOT EXISTS public.category_feedback_templates (
  id uuid default gen_random_uuid() primary key,
  category_name text not null,
  risk_band text not null check (risk_band in ('Low', 'Medium', 'High')),
  issue_1 text,
  issue_2 text,
  issue_3 text,
  recommendation_1 text,
  recommendation_2 text,
  recommendation_3 text,
  created_at timestamptz default now(),
  UNIQUE(category_name, risk_band)
);

-- 3. Seed category feedback templates (from Risk Assessment & Recommendation Engine doc)

-- Stop-Loss & Loss Response - HIGH
INSERT INTO public.category_feedback_templates (category_name, risk_band, issue_1, issue_2, issue_3, recommendation_1, recommendation_2, recommendation_3)
VALUES (
  'Stop-Loss & Loss Response',
  'High',
  'You often delay exiting when price hits your stop-loss.',
  'After a loss, you feel strong pressure to recover immediately, leading to revenge trading.',
  'You sometimes skip setting a stop-loss altogether.',
  'Use Bracket Orders: Set your stop-loss at the time of entry and never modify it.',
  'Enforce a 30-Minute Cooldown: After any losing trade, step away from the screen for 30 minutes.',
  'Daily Stop-Loss Count: For one week, your only goal is to have a stop-loss on every single trade.'
) ON CONFLICT (category_name, risk_band) DO NOTHING;

-- Stop-Loss & Loss Response - MEDIUM
INSERT INTO public.category_feedback_templates (category_name, risk_band, issue_1, issue_2, issue_3, recommendation_1, recommendation_2, recommendation_3)
VALUES (
  'Stop-Loss & Loss Response',
  'Medium',
  'You sometimes hesitate to exit at your stop-loss.',
  'After losses, you occasionally feel the urge to recover quickly.',
  NULL,
  'Set stop-loss at entry and commit to it.',
  'Take a 15-minute break after any loss.',
  'Track your stop-loss adherence daily.'
) ON CONFLICT (category_name, risk_band) DO NOTHING;

-- Stop-Loss & Loss Response - LOW
INSERT INTO public.category_feedback_templates (category_name, risk_band, issue_1, issue_2, issue_3, recommendation_1, recommendation_2, recommendation_3)
VALUES (
  'Stop-Loss & Loss Response',
  'Low',
  'You generally follow your stop-loss discipline.',
  NULL,
  NULL,
  'Continue using bracket orders for consistency.',
  'Maintain your cooldown practice after losses.',
  'Keep tracking stop-loss adherence in your journal.'
) ON CONFLICT (category_name, risk_band) DO NOTHING;

-- Behaviour After Profits - HIGH
INSERT INTO public.category_feedback_templates (category_name, risk_band, issue_1, issue_2, issue_3, recommendation_1, recommendation_2, recommendation_3)
VALUES (
  'Behaviour After Profits',
  'High',
  'Winning streaks make you overconfident, causing you to loosen your rules.',
  'You tend to increase your position size after a few wins.',
  'You trade more frequently after profitable days.',
  'Lock Your Size: Use the same position size for 20 consecutive trades, win or lose.',
  'Post-Win Reset: After any winning day, close your platform and do not trade for the rest of the day.',
  'Confidence Journal: Write down what you did right after a win, not just what you earned.'
) ON CONFLICT (category_name, risk_band) DO NOTHING;

-- Behaviour After Profits - MEDIUM
INSERT INTO public.category_feedback_templates (category_name, risk_band, issue_1, issue_2, issue_3, recommendation_1, recommendation_2, recommendation_3)
VALUES (
  'Behaviour After Profits',
  'Medium',
  'Winning streaks sometimes make you overconfident.',
  'You occasionally increase position size after wins.',
  NULL,
  'Lock Your Size: Use the same position size for 20 consecutive trades.',
  'Post-Win Reset: After winning days, take a break before next session.',
  'Journal your wins to identify what worked.'
) ON CONFLICT (category_name, risk_band) DO NOTHING;

-- Behaviour After Profits - LOW
INSERT INTO public.category_feedback_templates (category_name, risk_band, issue_1, issue_2, issue_3, recommendation_1, recommendation_2, recommendation_3)
VALUES (
  'Behaviour After Profits',
  'Low',
  'You maintain discipline after winning trades.',
  NULL,
  NULL,
  'Continue maintaining consistent position sizing.',
  'Keep journaling your successful trades.',
  'Share your winning strategies in your notes.'
) ON CONFLICT (category_name, risk_band) DO NOTHING;

-- Risk Planning & Positioning - HIGH
INSERT INTO public.category_feedback_templates (category_name, risk_band, issue_1, issue_2, issue_3, recommendation_1, recommendation_2, recommendation_3)
VALUES (
  'Risk Planning & Positioning',
  'High',
  'You often enter trades without knowing your exact ₹ risk.',
  'Position sizing is inconsistent or not calculated.',
  'You skip using the position size calculator.',
  'Use the INTROSPECT Calculator: Before every trade, input your entry and stop-loss to see your max quantity.',
  'The "Sticky Note" Rule: Write your entry, stop, and target on a physical note before clicking buy.',
  'Never enter a trade without calculating your risk first.'
) ON CONFLICT (category_name, risk_band) DO NOTHING;

-- Risk Planning & Positioning - MEDIUM
INSERT INTO public.category_feedback_templates (category_name, risk_band, issue_1, issue_2, issue_3, recommendation_1, recommendation_2, recommendation_3)
VALUES (
  'Risk Planning & Positioning',
  'Medium',
  'You sometimes enter trades without precise risk calculation.',
  'Position sizing could be more consistent.',
  NULL,
  'Use the position size calculator before every trade.',
  'Write down your risk parameters before entry.',
  'Track your risk percentage for each trade.'
) ON CONFLICT (category_name, risk_band) DO NOTHING;

-- Risk Planning & Positioning - LOW
INSERT INTO public.category_feedback_templates (category_name, risk_band, issue_1, issue_2, issue_3, recommendation_1, recommendation_2, recommendation_3)
VALUES (
  'Risk Planning & Positioning',
  'Low',
  'You generally know your risk before entering trades.',
  NULL,
  NULL,
  'Continue using the position size calculator.',
  'Maintain your pre-trade planning habit.',
  'Keep documenting your risk calculations.'
) ON CONFLICT (category_name, risk_band) DO NOTHING;

-- Impulse & Over-Participation - HIGH
INSERT INTO public.category_feedback_templates (category_name, risk_band, issue_1, issue_2, issue_3, recommendation_1, recommendation_2, recommendation_3)
VALUES (
  'Impulse & Over-Participation',
  'High',
  'You sometimes take trades just to stay in the action when there is no clear setup.',
  'Sitting out during slow markets feels difficult.',
  'You trade more than your daily limit.',
  'Define Your Setup: Write down your 3 non-negotiable criteria for a trade. If they are not met, you do not trade.',
  'The "Log Off" Rule: If no trade in the first hour, log off and do something else for 2 hours.',
  'Set a maximum trade limit and stick to it strictly.'
) ON CONFLICT (category_name, risk_band) DO NOTHING;

-- Impulse & Over-Participation - MEDIUM
INSERT INTO public.category_feedback_templates (category_name, risk_band, issue_1, issue_2, issue_3, recommendation_1, recommendation_2, recommendation_3)
VALUES (
  'Impulse & Over-Participation',
  'Medium',
  'You occasionally take trades without clear setups.',
  'Sitting out can be challenging.',
  NULL,
  'Define your 3 non-negotiable trade criteria.',
  'If no setup in first hour, take a break.',
  'Track your trade quality, not just quantity.'
) ON CONFLICT (category_name, risk_band) DO NOTHING;

-- Impulse & Over-Participation - LOW
INSERT INTO public.category_feedback_templates (category_name, risk_band, issue_1, issue_2, issue_3, recommendation_1, recommendation_2, recommendation_3)
VALUES (
  'Impulse & Over-Participation',
  'Low',
  'You wait for quality setups before trading.',
  NULL,
  NULL,
  'Continue waiting for your defined criteria.',
  'Maintain your selective trading approach.',
  'Keep tracking setup quality in your journal.'
) ON CONFLICT (category_name, risk_band) DO NOTHING;

-- Rule Consistency - HIGH
INSERT INTO public.category_feedback_templates (category_name, risk_band, issue_1, issue_2, issue_3, recommendation_1, recommendation_2, recommendation_3)
VALUES (
  'Rule Consistency',
  'High',
  'Under pressure, you override your own rules.',
  'You find yourself repeating the same mistakes.',
  'Your trading rules are not consistently followed.',
  'Create a "Pressure Checklist": A 3-question checklist you must answer before any trade when you are stressed.',
  'Weekly Mistake Review: Every Friday, review your journal and identify your #1 repeated mistake.',
  'The "One Rule" Challenge: Master one rule perfectly for 10 consecutive trades.'
) ON CONFLICT (category_name, risk_band) DO NOTHING;

-- Rule Consistency - MEDIUM
INSERT INTO public.category_feedback_templates (category_name, risk_band, issue_1, issue_2, issue_3, recommendation_1, recommendation_2, recommendation_3)
VALUES (
  'Rule Consistency',
  'Medium',
  'You sometimes override rules under pressure.',
  'Some mistakes are repeated occasionally.',
  NULL,
  'Create a pre-trade checklist for stressful situations.',
  'Review your journal weekly for patterns.',
  'Focus on mastering one rule at a time.'
) ON CONFLICT (category_name, risk_band) DO NOTHING;

-- Rule Consistency - LOW
INSERT INTO public.category_feedback_templates (category_name, risk_band, issue_1, issue_2, issue_3, recommendation_1, recommendation_2, recommendation_3)
VALUES (
  'Rule Consistency',
  'Low',
  'You consistently follow your trading rules.',
  NULL,
  NULL,
  'Continue using your pre-trade checklist.',
  'Maintain your weekly journal review habit.',
  'Keep building on your disciplined foundation.'
) ON CONFLICT (category_name, risk_band) DO NOTHING;

-- Enable RLS
ALTER TABLE public.category_feedback_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read templates
CREATE POLICY "Templates are viewable by everyone"
  ON public.category_feedback_templates
  FOR SELECT
  USING (true);

-- RLS Policy: Only admins can modify templates
CREATE POLICY "Only admins can modify templates"
  ON public.category_feedback_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_category_feedback_lookup 
ON public.category_feedback_templates(category_name, risk_band);

COMMENT ON TABLE public.category_feedback_templates IS 'Stores detailed feedback (issues and recommendations) for each category and risk band per Risk Assessment & Recommendation Engine requirements';
