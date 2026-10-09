-- Usage limits for the two public edge functions.
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- Both tables are written and read only by the edge functions (service role).
-- Row level security is on and there are no policies, so the app itself cannot touch them.

-- One row per AI analysis; analyze-job counts a user's rows from the last 24 hours.
create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_user_created_idx
  on public.ai_usage (user_id, created_at desc);

alter table public.ai_usage enable row level security;

-- One row per guest demo started; create-guest counts rows from the last hour.
-- The address is stored as a SHA-256 hash, never in plain form.
create table if not exists public.guest_signups (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_created_idx
  on public.ai_usage (created_at desc);

create index if not exists guest_signups_created_idx
  on public.guest_signups (created_at desc);

create index if not exists guest_signups_ip_created_idx
  on public.guest_signups (ip_hash, created_at desc);

alter table public.guest_signups enable row level security;
