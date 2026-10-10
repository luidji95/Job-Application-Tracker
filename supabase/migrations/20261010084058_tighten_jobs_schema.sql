-- Tighten public.jobs and public.profiles:
--   1. stage / status / rejected_from_stage only accept the values the app knows
--   2. required columns are NOT NULL, meaningless uuid defaults are dropped
--   3. deleting a user cascades to their profile and jobs


-- ---------------------------------------------------------------------------
-- Data fixes (found by the audit of 2026-10-10). Safe to replay: both are no-ops
-- once applied and on an empty database.
-- ---------------------------------------------------------------------------

-- Old guest demo rows were seeded with a stage the app no longer has.
update public.jobs
   set stage = 'hr-interview'
 where stage = 'interview';

-- Seeded rejected rows recorded 'rejected' as the stage they were rejected from.
-- The real stage is unknown; the app restores such a job to 'applied'.
update public.jobs
   set rejected_from_stage = null
 where rejected_from_stage = 'rejected';


-- ---------------------------------------------------------------------------
-- 1. Allowed values
-- ---------------------------------------------------------------------------

alter table public.jobs
  add constraint jobs_stage_check
    check (stage in ('applied', 'hr-interview', 'technical', 'final', 'offer', 'rejected'))
    not valid,
  add constraint jobs_status_check
    check (status in ('active', 'accepted', 'rejected'))
    not valid,
  add constraint jobs_rejected_from_stage_check
    check (rejected_from_stage in ('applied', 'hr-interview', 'technical', 'final', 'offer'))
    not valid,
  -- A job sits in the rejected column exactly when its status is rejected.
  add constraint jobs_stage_status_check
    check ((stage = 'rejected') = (status = 'rejected'))
    not valid,
  -- rejected_from_stage is only kept while the job is rejected.
  add constraint jobs_rejected_from_stage_only_when_rejected_check
    check (rejected_from_stage is null or stage = 'rejected')
    not valid;

alter table public.jobs validate constraint jobs_stage_check;
alter table public.jobs validate constraint jobs_status_check;
alter table public.jobs validate constraint jobs_rejected_from_stage_check;
alter table public.jobs validate constraint jobs_stage_status_check;
alter table public.jobs validate constraint jobs_rejected_from_stage_only_when_rejected_check;


-- ---------------------------------------------------------------------------
-- 2. Required columns and defaults
-- ---------------------------------------------------------------------------

alter table public.jobs
  alter column user_id drop default,
  alter column user_id set not null,
  alter column company_name set not null,
  alter column position set not null,
  alter column stage set not null,
  alter column status set not null,
  alter column applied_date set not null;

alter table public.profiles
  alter column id drop default;


-- ---------------------------------------------------------------------------
-- 3. Cascade deletes: auth.users -> profiles -> jobs
-- ---------------------------------------------------------------------------

alter table public.profiles drop constraint profiles_id_fkey;
alter table public.profiles
  add constraint profiles_id_fkey
    foreign key (id) references auth.users (id) on delete cascade
    not valid;
alter table public.profiles validate constraint profiles_id_fkey;

alter table public.jobs drop constraint jobs_user_id_fkey;
alter table public.jobs
  add constraint jobs_user_id_fkey
    foreign key (user_id) references public.profiles (id) on delete cascade
    not valid;
alter table public.jobs validate constraint jobs_user_id_fkey;
