-- JOIN is independent of consultation, project, and contributor records.
-- Do not expose this table to browser clients or create cross-form person IDs.
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null check (source in ('direct','website','consultation','projects')),
  form_version text not null check (form_version = 'join_v0.2'),
  full_name text not null,
  contact_email text not null,
  country_code text not null,
  institution text not null,
  current_role text not null,
  interest_topics text[] not null check (cardinality(interest_topics) between 1 and 3),
  interest_topics_other text,
  profile_url text,
  note text,
  directory_consent boolean not null default false,
  directory_approved boolean not null default false,
  terms_ack boolean not null check (terms_ack),
  member_code text unique,
  check (not directory_approved or directory_consent)
);
create index if not exists memberships_created_at_idx on public.memberships (created_at);
alter table public.memberships enable row level security;
revoke all on public.memberships from public, anon, authenticated;
grant select, insert, update on public.memberships to service_role;

-- Future TODO: assign YAISD-YYYY-M-NNNN codes on the server only if needed.
-- Future TODO: membership confirmation certificates are factual records, not credentials.
-- No public directory view or automatic publication is created in v0.2.
