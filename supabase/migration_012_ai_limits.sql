-- Create user_ai_usage and ai_response_cache tables for AI limits and caching
CREATE TABLE IF NOT EXISTS public.user_ai_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null default current_date,
  call_count integer not null default 0,
  created_at timestamptz default now(),
  unique (user_id, date)
);

CREATE TABLE IF NOT EXISTS public.ai_response_cache (
  state_hash text primary key,
  response_text text not null,
  created_at timestamptz default now()
);

-- Enable RLS for these new tables
alter table public.user_ai_usage enable row level security;
alter table public.ai_response_cache enable row level security;

-- Add RLS policies for user_ai_usage
create policy "Users can view own AI usage"
  on public.user_ai_usage for select
  using (auth.uid() = user_id);

create policy "Admins can view all AI usage"
  on public.user_ai_usage for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Add RLS policies for ai_response_cache
create policy "Authenticated users can select cache"
  on public.ai_response_cache for select
  using (auth.role() = 'authenticated');
