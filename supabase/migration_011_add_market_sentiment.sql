-- Add market_sentiment, entry_time, exit_time, and CBT reflections to trades
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS market_sentiment text CHECK (market_sentiment IN ('Bullish', 'Bearish', 'Neutral')),
ADD COLUMN IF NOT EXISTS entry_time text,
ADD COLUMN IF NOT EXISTS exit_time text,
ADD COLUMN IF NOT EXISTS reflection_text text,
ADD COLUMN IF NOT EXISTS reflection_feedback text;

