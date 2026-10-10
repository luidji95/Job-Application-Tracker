-- Next step and job ad link for an application.
--   next_step       what the user has to do next ("HR call", "Send follow-up")
--   next_step_date  when it is due; a calendar date, no time of day
--   job_url         link to the job ad
-- All three are optional. Adding nullable columns does not touch existing rows,
-- and the app version that is live before this migration simply ignores them.

alter table public.jobs
  add column if not exists next_step text,
  add column if not exists next_step_date date,
  add column if not exists job_url text;

alter table public.jobs
  add constraint jobs_next_step_length_check
    check (next_step is null or char_length(next_step) between 1 and 120),
  add constraint jobs_job_url_check
    check (job_url is null or (job_url ~* '^https?://' and char_length(job_url) <= 2000));
