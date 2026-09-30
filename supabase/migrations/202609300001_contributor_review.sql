-- Contributor recognition requires a human confirmation after the first contribution.
-- Existing submissions remain pending; a successful form POST never approves a person.
alter table public.contributor_interests
  add column if not exists review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'declined')),
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text;

create index if not exists contributor_interests_review_status_idx
  on public.contributor_interests (review_status, created_at);

create or replace function public.stamp_contributor_review()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.review_status is distinct from old.review_status then
    new.reviewed_at := case when new.review_status = 'pending' then null else now() end;
  end if;
  return new;
end;
$$;

drop trigger if exists contributor_review_stamp on public.contributor_interests;
create trigger contributor_review_stamp
before update of review_status on public.contributor_interests
for each row execute function public.stamp_contributor_review();

-- Review is performed by an authorized person in the Supabase dashboard.
-- No new browser grants, public status endpoint, or automatic approval are added.
