-- Three independent response tables. No shared person identifier or public reads.
create extension if not exists pgcrypto;

create table if not exists public.consultation_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null check (source in ('direct','consultation','projects','website')),
  form_version text not null check (form_version = 'consultation_v1.0'),
  has_consented boolean not null check (has_consented),
  country_code text not null,
  "current_role" text not null,
  interest_topics text[] not null,
  interest_topics_other text,
  familiarity_score smallint not null check (familiarity_score between 1 and 5),
  engagement_types text[] not null,
  engagement_other text,
  top_barriers text[] not null check (cardinality(top_barriers) between 1 and 3),
  barriers_other text,
  barrier_context text,
  desired_resources text[] not null check (cardinality(desired_resources) between 1 and 3),
  resources_other text,
  ideal_solution text,
  future_priorities text[] not null check (cardinality(future_priorities) between 1 and 3),
  future_priorities_other text,
  contribution_interest text not null check (contribution_interest in ('yes','maybe','not_now')),
  contribution_preferences text[] not null default '{}',
  followup_consent boolean not null,
  contact_email text,
  contact_name text,
  final_comment text,
  check (followup_consent = false or contact_email is not null),
  check (followup_consent = true or (contact_email is null and contact_name is null))
);

create table if not exists public.project_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null check (source in ('direct','consultation','projects','website')),
  form_version text not null check (form_version = 'projects_v1.0'),
  project_title text not null,
  project_type text not null,
  project_type_other text,
  project_stage text not null,
  project_region text not null,
  project_topics text[] not null check (cardinality(project_topics) between 1 and 3),
  project_topics_other text,
  sdgs smallint[] not null default '{}',
  problem_description text not null,
  ai_role text not null,
  progress_description text not null,
  project_links jsonb not null default '[]'::jsonb,
  project_needs text[] not null check (cardinality(project_needs) between 1 and 3),
  project_needs_other text,
  public_use_permission text not null check (public_use_permission in ('yes','contact_first','internal_only')),
  submitter_relationship text not null,
  contact_name text not null,
  contact_email text not null,
  organisation text,
  submission_confirmed boolean not null check (submission_confirmed),
  check (jsonb_typeof(project_links) = 'array')
);

create table if not exists public.contributor_interests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null check (source in ('direct','consultation','projects','website')),
  form_version text not null check (form_version = 'contribute_v1.0'),
  contact_name text not null,
  contact_email text not null,
  country_code text not null,
  "current_role" text not null,
  main_field text not null,
  contribution_types text[] not null check (cardinality(contribution_types) between 1 and 3),
  contribution_types_other text,
  contribution_topics text[] not null check (cardinality(contribution_topics) between 1 and 3),
  contribution_topics_other text,
  micro_contribution_type text not null check (micro_contribution_type in ('identify_gap','share_resource','suggest_project')),
  micro_contribution_text text not null,
  micro_contribution_url text,
  time_availability text not null,
  involvement_types text[] not null,
  profile_links jsonb not null default '[]'::jsonb,
  check (jsonb_typeof(profile_links) = 'array')
);

create index if not exists consultation_responses_created_at_idx on public.consultation_responses (created_at);
create index if not exists project_submissions_created_at_idx on public.project_submissions (created_at);
create index if not exists contributor_interests_created_at_idx on public.contributor_interests (created_at);

alter table public.consultation_responses enable row level security;
alter table public.project_submissions enable row level security;
alter table public.contributor_interests enable row level security;

revoke all on public.consultation_responses from public, anon, authenticated;
revoke all on public.project_submissions from public, anon, authenticated;
revoke all on public.contributor_interests from public, anon, authenticated;
grant select, insert on public.consultation_responses to service_role;
grant select, insert on public.project_submissions to service_role;
grant select, insert on public.contributor_interests to service_role;

-- Security-only rate limit data: HMAC hash, never a raw IP or research identifier.
create table if not exists public.submission_rate_limits (
  rate_key text not null,
  window_start timestamptz not null,
  attempts integer not null default 1,
  primary key (rate_key, window_start)
);
alter table public.submission_rate_limits enable row level security;
revoke all on public.submission_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.submission_rate_limits to service_role;

create or replace function public.consume_submission_rate(p_rate_key text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempt_count integer;
begin
  insert into public.submission_rate_limits (rate_key, window_start, attempts)
  values (p_rate_key, date_trunc('hour', now()), 1)
  on conflict (rate_key, window_start)
  do update set attempts = public.submission_rate_limits.attempts + 1
  returning attempts into attempt_count;
  return attempt_count <= 5;
end;
$$;
revoke all on function public.consume_submission_rate(text) from public, anon, authenticated;
grant execute on function public.consume_submission_rate(text) to service_role;
