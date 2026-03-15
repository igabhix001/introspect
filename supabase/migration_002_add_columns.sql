-- Migration: Add preferred_instruments and default_risk to profiles table
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_instruments text DEFAULT 'NIFTY, BANKNIFTY',
ADD COLUMN IF NOT EXISTS default_risk numeric DEFAULT 1;

-- Add stock_index alias for trades table (for dashboard queries)
-- The trades table uses 'stock' column, but dashboard hook references 'stock_index'
-- Add a generated/virtual column or just rename if needed
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS stock_index text GENERATED ALWAYS AS (stock) STORED;

-- Ensure the Assessment table has personalized_rules and capital fields
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS personalized_rules jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS capital numeric DEFAULT 100000;
