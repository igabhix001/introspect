-- ============================================
-- INTROSPECT™ Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. PROFILES (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null default '',
  email text not null,
  phone text,
  trading_capital integer default 100000,
  trading_style text default 'intraday',
  years_experience integer default 0,
  role text not null default 'user' check (role in ('user', 'admin')),
  referral_code text unique,
  avatar_url text,
  is_suspended boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. ASSESSMENTS
create table if not exists public.assessments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  answers jsonb not null default '[]',
  discipline_score integer not null default 0,
  risk_level text not null default 'medium' check (risk_level in ('low', 'medium', 'high')),
  trader_level text not null default 'beginner' check (trader_level in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz default now()
);

-- 3. PERSONALIZED RULES
create table if not exists public.personalized_rules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  assessment_id uuid references public.assessments(id) on delete cascade not null,
  rules jsonb not null default '[]',
  created_at timestamptz default now()
);

-- 4. TRADES (Trade Journal)
create table if not exists public.trades (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null default current_date,
  stock text not null,
  direction text not null check (direction in ('long', 'short')),
  entry_price numeric(12,2) not null,
  exit_price numeric(12,2),
  stop_loss numeric(12,2),
  target_price numeric(12,2),
  quantity integer default 1,
  emotion_before text,
  emotion_after text,
  followed_plan boolean default true,
  pnl numeric(12,2) default 0,
  risk_pct numeric(5,2) default 0,
  sl_followed boolean default true,
  mistakes jsonb default '[]',
  notes text,
  created_at timestamptz default now()
);

-- 5. CHALLENGES
create table if not exists public.challenges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('30', '60', '90')),
  name text not null default '30-Day Discipline Challenge',
  start_date date not null default current_date,
  current_day integer default 1,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  daily_progress jsonb default '[]',
  rules_to_follow jsonb default '[]',
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- 6. SUBSCRIPTIONS
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan text not null check (plan in ('monthly', 'yearly')),
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled', 'pending')),
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_subscription_id text,
  amount_paid integer not null default 0,
  currency text default 'INR',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  cancelled_at timestamptz
);

-- 7. LOYALTY POINTS
create table if not exists public.loyalty_points (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  action text not null,
  points integer not null,
  description text,
  expires_at timestamptz default (now() + interval '24 months'),
  created_at timestamptz default now()
);

-- 8. REFERRALS
create table if not exists public.referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid references public.profiles(id) on delete cascade not null,
  referred_id uuid references public.profiles(id) on delete cascade,
  referred_email text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'rewarded')),
  points_awarded integer default 0,
  created_at timestamptz default now()
);

-- 9. NOTIFICATIONS
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'warning', 'success', 'alert')),
  target text not null default 'all',
  target_user_id uuid references public.profiles(id) on delete cascade,
  sent_by uuid references public.profiles(id),
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 10. DAILY REPORTS
create table if not exists public.daily_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null default current_date,
  trades_taken integer default 0,
  rules_followed integer default 0,
  total_rules integer default 0,
  mistakes_count integer default 0,
  discipline_score integer default 0,
  total_pnl numeric(12,2) default 0,
  updated_capital integer default 0,
  feedback jsonb default '{}',
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.assessments enable row level security;
alter table public.personalized_rules enable row level security;
alter table public.trades enable row level security;
alter table public.challenges enable row level security;
alter table public.subscriptions enable row level security;
alter table public.loyalty_points enable row level security;
alter table public.referrals enable row level security;
alter table public.notifications enable row level security;
alter table public.daily_reports enable row level security;

-- PROFILES
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Allow insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ASSESSMENTS
create policy "Users can manage own assessments"
  on public.assessments for all
  using (auth.uid() = user_id);

create policy "Admins can view all assessments"
  on public.assessments for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- PERSONALIZED RULES
create policy "Users can manage own rules"
  on public.personalized_rules for all
  using (auth.uid() = user_id);

create policy "Admins can view all rules"
  on public.personalized_rules for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- TRADES
create policy "Users can manage own trades"
  on public.trades for all
  using (auth.uid() = user_id);

create policy "Admins can view all trades"
  on public.trades for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- CHALLENGES
create policy "Users can manage own challenges"
  on public.challenges for all
  using (auth.uid() = user_id);

create policy "Admins can view all challenges"
  on public.challenges for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- SUBSCRIPTIONS
create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Admins can manage all subscriptions"
  on public.subscriptions for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- LOYALTY POINTS
create policy "Users can view own points"
  on public.loyalty_points for select
  using (auth.uid() = user_id);

create policy "Admins can manage all points"
  on public.loyalty_points for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- REFERRALS
create policy "Users can view own referrals"
  on public.referrals for select
  using (auth.uid() = referrer_id);

create policy "Admins can manage all referrals"
  on public.referrals for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- NOTIFICATIONS
create policy "Users can view own notifications"
  on public.notifications for select
  using (
    target = 'all' or target_user_id = auth.uid()
  );

create policy "Admins can manage all notifications"
  on public.notifications for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- DAILY REPORTS
create policy "Users can manage own reports"
  on public.daily_reports for all
  using (auth.uid() = user_id);

create policy "Admins can view all reports"
  on public.daily_reports for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, referral_code)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'INTROSPECT-' || upper(substring(md5(random()::text) from 1 for 6))
  );
  return new;
end;
$$;

-- Trigger on auth.users insert
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- INDEXES for performance
-- ============================================
create index if not exists idx_trades_user_id on public.trades(user_id);
create index if not exists idx_trades_date on public.trades(date);
create index if not exists idx_assessments_user_id on public.assessments(user_id);
create index if not exists idx_challenges_user_id on public.challenges(user_id);
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_daily_reports_user_date on public.daily_reports(user_id, date);
create index if not exists idx_notifications_target on public.notifications(target);
create index if not exists idx_loyalty_points_user_id on public.loyalty_points(user_id);
