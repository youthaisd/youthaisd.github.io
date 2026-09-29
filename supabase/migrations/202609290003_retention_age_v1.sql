-- The launch forms accept adults only. No date of birth is stored.
alter table public.consultation_responses add column is_adult boolean not null check (is_adult);
alter table public.project_submissions add column is_adult boolean not null check (is_adult);
alter table public.contributor_interests add column is_adult boolean not null check (is_adult);

-- Keep the retention task outside the public API schema.
create extension if not exists pg_cron;
create schema if not exists aixsd_private;
revoke all on schema aixsd_private from public, anon, authenticated;

create or replace function aixsd_private.purge_expired_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.consultation_responses where created_at < now() - interval '12 months';
  delete from public.project_submissions where created_at < now() - interval '12 months';
  delete from public.contributor_interests where created_at < now() - interval '12 months';
  delete from public.submission_rate_limits where window_start < now() - interval '48 hours';
end;
$$;
revoke all on function aixsd_private.purge_expired_data() from public, anon, authenticated;

-- 03:00 UTC daily. A response may remain for up to one day after 12 months.
select cron.schedule('aixsd-retention-v1', '0 3 * * *',
  $$select aixsd_private.purge_expired_data();$$);
