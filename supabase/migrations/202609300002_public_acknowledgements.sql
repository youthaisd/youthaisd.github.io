-- Opt-in public acknowledgement is separate for each response table.
-- Existing submissions are unlisted. This migration never publishes a record.
-- Contributor submissions use the existing review_status for the ONE manual
-- confirmation; consultation and project listings use public_listing_status.
create or replace function public.stamp_public_listing_review()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.public_listing_status is distinct from old.public_listing_status then
    new.public_listing_reviewed_at := case when new.public_listing_status in ('approved', 'declined') then now() else null end;
  end if;
  return new;
end;
$$;

do $$
declare
  table_name text;
  version_prefix text;
begin
  for table_name, version_prefix in
    select * from (values
      ('consultation_responses', 'consultation'),
      ('project_submissions', 'projects'),
      ('contributor_interests', 'contribute')
    ) as forms(table_name, version_prefix)
  loop
    execute format('alter table public.%I drop constraint if exists %I', table_name, table_name || '_form_version_check');
    execute format('alter table public.%I add constraint %I check (form_version in (%L, %L))',
      table_name, table_name || '_form_version_check', version_prefix || '_v1.0', version_prefix || '_v1.1');
    execute format('alter table public.%I add column public_acknowledgement text not null default ''unlisted'' check (public_acknowledgement in (''name'', ''name_affiliation'', ''unlisted''))', table_name);
    execute format('alter table public.%I add column public_display_name text', table_name);
    execute format('alter table public.%I add column public_affiliation text', table_name);
    execute format('alter table public.%I add column public_region text', table_name);
    if table_name = 'contributor_interests' then
      execute format('alter table public.%I add constraint %I check (
        (public_acknowledgement = ''unlisted'' and public_display_name is null and public_affiliation is null and public_region is null)
        or (public_acknowledgement = ''name'' and public_display_name is not null and length(btrim(public_display_name)) > 0 and public_affiliation is null)
        or (public_acknowledgement = ''name_affiliation'' and public_display_name is not null and length(btrim(public_display_name)) > 0 and public_affiliation is not null and length(btrim(public_affiliation)) > 0)
      )', table_name, table_name || '_public_acknowledgement_check');
    else
      execute format('alter table public.%I add column public_listing_status text not null default ''unlisted'' check (public_listing_status in (''unlisted'', ''pending'', ''approved'', ''declined''))', table_name);
      execute format('alter table public.%I add column public_listing_reviewed_at timestamptz', table_name);
      execute format('alter table public.%I add constraint %I check (
        (public_acknowledgement = ''unlisted'' and public_listing_status = ''unlisted'' and public_display_name is null and public_affiliation is null and public_region is null)
        or (public_acknowledgement = ''name'' and public_listing_status <> ''unlisted'' and public_display_name is not null and length(btrim(public_display_name)) > 0 and public_affiliation is null)
        or (public_acknowledgement = ''name_affiliation'' and public_listing_status <> ''unlisted'' and public_display_name is not null and length(btrim(public_display_name)) > 0 and public_affiliation is not null and length(btrim(public_affiliation)) > 0)
      )', table_name, table_name || '_public_acknowledgement_check');
      execute format('create trigger public_listing_review_stamp before update of public_listing_status on public.%I for each row execute function public.stamp_public_listing_review()', table_name);
    end if;
  end loop;
end $$;

-- No SELECT grants or public view are added. The static Contributors page is
-- curated only after a person checks the submission and recorded consent.
