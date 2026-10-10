-- History of an application: one row for everything that happens to it.
--
-- The rows are written by a trigger on public.jobs, never by the app, so the
-- history cannot be skipped, forgotten or forged from the client.
--
-- Event types
--   created       the application was added            (to_stage)
--   moved         it went from one open stage to another (from_stage, to_stage)
--   rejected      it was rejected                       (from_stage = where it was)
--   restored      it came back from rejected            (to_stage)
--   step_set      a next step was set or changed        (detail = the step, step_date)
--   step_cleared  the next step was finished or removed (detail = the step it was)

create table if not exists public.job_events (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.jobs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  from_stage text,
  to_stage text,
  detail text,
  step_date date,
  -- true for rows reconstructed from the state a job was in when history started
  inferred boolean not null default false,
  created_at timestamptz not null default now(),

  constraint job_events_type_check
    check (type in ('created', 'moved', 'rejected', 'restored', 'step_set', 'step_cleared')),
  constraint job_events_from_stage_check
    check (from_stage is null or from_stage in ('applied', 'hr-interview', 'technical', 'final', 'offer', 'rejected')),
  constraint job_events_to_stage_check
    check (to_stage is null or to_stage in ('applied', 'hr-interview', 'technical', 'final', 'offer', 'rejected'))
);

create index if not exists job_events_job_created_idx
  on public.job_events (job_id, created_at, id);

create index if not exists job_events_user_created_idx
  on public.job_events (user_id, created_at desc);

-- A user can read the history of their own applications. There are no insert,
-- update or delete policies: only the trigger below writes here.
alter table public.job_events enable row level security;

drop policy if exists "job_events_select_own" on public.job_events;
create policy "job_events_select_own" on public.job_events
  for select to authenticated
  using (user_id = auth.uid());

revoke insert, update, delete, truncate on public.job_events from anon, authenticated;


-- Runs with the rights of its owner so it can write past row level security.
create or replace function public.log_job_event() returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  old_has_step boolean;
  new_has_step boolean;
begin
  if tg_op = 'INSERT' then
    insert into public.job_events (job_id, user_id, type, to_stage)
    values (new.id, new.user_id, 'created', new.stage);

    if new.next_step is not null or new.next_step_date is not null then
      insert into public.job_events (job_id, user_id, type, detail, step_date)
      values (new.id, new.user_id, 'step_set', new.next_step, new.next_step_date);
    end if;

    return new;
  end if;

  -- stage
  if new.stage is distinct from old.stage then
    if new.stage = 'rejected' then
      insert into public.job_events (job_id, user_id, type, from_stage, to_stage)
      values (new.id, new.user_id, 'rejected', old.stage, 'rejected');
    elsif old.stage = 'rejected' then
      insert into public.job_events (job_id, user_id, type, from_stage, to_stage)
      values (new.id, new.user_id, 'restored', 'rejected', new.stage);
    else
      insert into public.job_events (job_id, user_id, type, from_stage, to_stage)
      values (new.id, new.user_id, 'moved', old.stage, new.stage);
    end if;
  end if;

  -- next step
  old_has_step := old.next_step is not null or old.next_step_date is not null;
  new_has_step := new.next_step is not null or new.next_step_date is not null;

  if new_has_step
     and (new.next_step is distinct from old.next_step
          or new.next_step_date is distinct from old.next_step_date) then
    insert into public.job_events (job_id, user_id, type, detail, step_date)
    values (new.id, new.user_id, 'step_set', new.next_step, new.next_step_date);
  elsif old_has_step and not new_has_step then
    insert into public.job_events (job_id, user_id, type, detail, step_date)
    values (new.id, new.user_id, 'step_cleared', old.next_step, old.next_step_date);
  end if;

  return new;
end;
$$;

revoke all on function public.log_job_event() from public, anon, authenticated;

drop trigger if exists log_job_event on public.jobs;
create trigger log_job_event
  after insert or update on public.jobs
  for each row execute function public.log_job_event();


-- Applications that existed before history started get the little that is known:
-- when they were added and, if they are no longer in "applied", where they are now.
-- These rows are marked inferred. Only jobs without any event are touched, so
-- running this again changes nothing.
with fresh as (
  select j.*
  from public.jobs j
  where not exists (select 1 from public.job_events e where e.job_id = j.id)
),
created as (
  insert into public.job_events (job_id, user_id, type, to_stage, inferred, created_at)
  select id, user_id, 'created', null, true, created_at
  from fresh
  returning job_id
)
insert into public.job_events (job_id, user_id, type, from_stage, to_stage, inferred, created_at)
select
  f.id,
  f.user_id,
  case when f.stage = 'rejected' then 'rejected' else 'moved' end,
  case when f.stage = 'rejected' then f.rejected_from_stage else null end,
  f.stage,
  true,
  greatest(coalesce(f.updated_at, f.created_at), f.created_at + interval '1 second')
from fresh f
where f.stage <> 'applied'
  and exists (select 1 from created c where c.job_id = f.id);
