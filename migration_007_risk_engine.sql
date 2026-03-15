-- Migration 007: Risk Assessment & Recommendation Engine

-- Create category_feedback_templates table
CREATE TABLE IF NOT EXISTS public.category_feedback_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name TEXT NOT NULL,
    risk_band TEXT NOT NULL CHECK (risk_band IN ('Low', 'Medium', 'High')),
    issue_1 TEXT NOT NULL,
    issue_2 TEXT,
    issue_3 TEXT,
    recommendation_1 TEXT NOT NULL,
    recommendation_2 TEXT,
    recommendation_3 TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(category_name, risk_band)
);

-- Enable RLS and set policies
ALTER TABLE public.category_feedback_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Enable read access for authenticated users on templates" 
ON public.category_feedback_templates FOR SELECT TO authenticated USING (true);

-- Allow only admins to insert/update/delete
CREATE POLICY "Enable insert for admins only on templates"
ON public.category_feedback_templates FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Enable update for admins only on templates"
ON public.category_feedback_templates FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Enable delete for admins only on templates"
ON public.category_feedback_templates FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Seed data for category_feedback_templates
INSERT INTO public.category_feedback_templates 
(category_name, risk_band, issue_1, issue_2, issue_3, recommendation_1, recommendation_2, recommendation_3)
VALUES
-- Stop-Loss & Loss Response
('Stop-Loss & Loss Response', 'High', 'You often delay exiting when price hits your stop-loss.', 'After a loss, you feel strong pressure to recover immediately, leading to revenge trading.', 'You sometimes skip setting a stop-loss altogether.', 'Use Bracket Orders: Set your stop-loss at the time of entry and never modify it.', 'Enforce a 30-Minute Cooldown: After any losing trade, step away from the screen for 30 minutes.', 'Daily Stop-Loss Count: For one week, your only goal is to have a stop-loss on every single trade.'),
('Stop-Loss & Loss Response', 'Medium', 'You occasionally widen your stop-loss hoping the market will turn.', 'A string of losses can sometimes lead to frustration and impulsive entries.', NULL, 'Set Hard Stops: Do not rely on mental stops. Place the order in the system immediately.', 'Review Losing Trades: Log every loss and identify if it was a systemic error or an emotional one.', NULL),
('Stop-Loss & Loss Response', 'Low', 'You maintain good discipline with your stop-losses.', 'You generally accept losses well and move on.', NULL, 'Maintain Consistency: Keep doing what you are doing.', 'Optimize Stop Selection: Review if your stops are placed based on technical structure rather than arbitrary monetary amounts.', NULL),

-- Behaviour After Profits
('Behaviour After Profits', 'High', 'Winning streaks make you feel invincible, leading to over-leveraging.', 'You tend to gamble your profits away quickly on high-risk setups.', 'You struggle to walk away after hitting your daily profit target.', 'Implement the "Profit Lock" Rule: Once you reach your target, log off and do not return until the next day.', 'Withdraw Profits Routinely: Take the money out of your trading account to make it real.', 'Re-evaluate Position Sizing: Ensure you drop your size back to baseline after a big win.'),
('Behaviour After Profits', 'Medium', 'Winning streaks make you overconfident, causing you to loosen your rules.', 'You tend to increase your position size after a few wins.', NULL, 'Lock Your Size: Use the same position size for 20 consecutive trades, win or lose.', 'Post-Win Reset: After any winning day, close your platform and do not trade for the rest of the day.', 'Confidence Journal: Write down what you did right after a win, not just what you earned.'),
('Behaviour After Profits', 'Low', 'You process wins systematically and objectively.', 'You correctly adhere to your position sizing models regardless of recent pnl.', NULL, 'Review Winners: Ensure wins came from following the plan, not from luck or breaking rules.', 'Scale Gradually: Consider slightly scaling up overall risk limits systematically as account grows, avoiding abrupt jumps.', NULL),

-- Risk Planning & Positioning
('Risk Planning & Positioning', 'High', 'You often enter trades without knowing your exact ₹ risk.', 'You risk different amounts per trade without a clear mathematical foundation.', 'You leverage up when feeling certain about a direction.', 'Use the INTROSPECT Calculator: Before every trade, input your entry and stop-loss to see your max quantity.', 'The "Sticky Note" Rule: Write your entry, stop, and target on a physical note before clicking ''buy''.', 'Fixed Fractional Risking: Commit to risking exactly 1% on every single trade without exception.'),
('Risk Planning & Positioning', 'Medium', 'You have a rough idea of risk but sometimes deviate slightly to accommodate ''better looking'' setups.', 'You occasionally ignore the R:R (Risk-to-Reward) metric.', NULL, 'Define Minimum R:R: Refuse any trade setup that does not mathematically yield at least a 1:2 R:R profile.', 'Pre-Trade Checklist: Refine a checklist assessing volatility and structure before deciding final size.', NULL),
('Risk Planning & Positioning', 'Low', 'You are precise and mathematical in determining position sizes.', 'Your risk distribution across trades is extremely homogenous and controlled.', NULL, 'Advanced Modeling: Explore kelly criterion or fractional sizing methodologies based on system win-rate.', 'Volatility Adjustments: Modify base risk slightly based on prevailing market ATR ranges.', NULL),

-- Impulse & Over-Participation
('Impulse & Over-Participation', 'High', 'You trade out of boredom, taking sub-optimal entries just to have a position.', 'You chase fast-moving price action (FOMO) and enter late.', 'You significantly overtrade, generating huge brokerage fees while bleeding capital.', 'Set a Max Daily Trade Limit: e.g., 3 trades a day. After 3, your platform is closed.', 'The "5-Minute Delay" Rule: Wait 5 minutes between spotting a setup and actually entering.', 'Focus on Premium Setups: Print out your A+ setup and only trade if it perfectly matches.'),
('Impulse & Over-Participation', 'Medium', 'You sometimes take trades just to ''stay in the action'' when there is no clear setup.', 'Sitting out during slow markets feels difficult.', NULL, 'Define Your Setup: Write down your 3 non-negotiable criteria for a trade. If they aren''t met, you don''t trade.', 'The "Log Off" Rule: If no trade in the first hour, log off and do something else for 2 hours.', NULL),
('Impulse & Over-Participation', 'Low', 'You display high patience and can easily sit on your hands when there are no setups.', 'You do not suffer from severe FOMO.', NULL, 'Refine Setup Selection: Since you are patient, demand even higher confluence before executing.', 'Opportunity Cost Check: Evaluate if your strictness causes you to miss genuinely valid high-probability moves.', NULL),

-- Rule Consistency
('Rule Consistency', 'High', 'Under pressure, you override your own rules entirely.', 'You find yourself repeating the same mistakes over and over.', 'You constantly tweak your system and jump between strategies after one or two losses.', 'Create a "Pressure Checklist": A 3-question checklist you must answer before any trade when you''re stressed.', 'Weekly Mistake Review: Every Friday, review your journal and identify your #1 repeated mistake.', 'The "One System" Commitment: Trade only one specific strategy for the next 30 days. No deviations.'),
('Rule Consistency', 'Medium', 'You follow rules nicely under normal conditions, but bend them during volatile runs.', 'You sometimes rationalize discretionary decisions that violate core system principles.', NULL, 'Systematic Playbook: Formalize your strategy into a flow-chart. If A, then B. Remove discretionary bias.', 'Identify Emotional Triggers: Journal exactly what happens right before a rule is bent. Awareness is key.', NULL),
('Rule Consistency', 'Low', 'You execute flawlessly according to system dictates, acting like a machine.', 'You respect constraints even amidst heavy market manipulation and emotional stress.', NULL, 'Automate Tracking: Deepen your analytical process to gather more precise data on strategy edge.', 'Share Insights: Consider teaching or formalizing your system parameters clearly to solidify your own understanding.', NULL)
ON CONFLICT (category_name, risk_band) DO UPDATE 
SET issue_1 = EXCLUDED.issue_1,
    issue_2 = EXCLUDED.issue_2,
    issue_3 = EXCLUDED.issue_3,
    recommendation_1 = EXCLUDED.recommendation_1,
    recommendation_2 = EXCLUDED.recommendation_2,
    recommendation_3 = EXCLUDED.recommendation_3,
    updated_at = EXCLUDED.updated_at;

-- Add categories_analysis to assessments if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'assessments' AND column_name = 'categories_analysis'
    ) THEN
        ALTER TABLE public.assessments ADD COLUMN categories_analysis JSONB;
    END IF;
END $$;
