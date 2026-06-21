-- DealCalc.io V9 Supabase schema
-- Run this in Supabase SQL Editor after creating your project.

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  address text,
  property_type text,
  analysis_type text,
  score integer,
  verdict text,
  inputs jsonb,
  report_html text,
  created_at timestamptz not null default now()
);

alter table public.deals enable row level security;

drop policy if exists "Users can view their own deals" on public.deals;
create policy "Users can view their own deals"
on public.deals for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own deals" on public.deals;
create policy "Users can insert their own deals"
on public.deals for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own deals" on public.deals;
create policy "Users can update their own deals"
on public.deals for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own deals" on public.deals;
create policy "Users can delete their own deals"
on public.deals for delete
to authenticated
using (auth.uid() = user_id);
