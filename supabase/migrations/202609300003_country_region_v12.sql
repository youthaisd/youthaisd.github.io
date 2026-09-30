-- Forms v1.2 records controlled country/region IDs for optional public listings.
-- The v1.1 public_region text column remains private for historical rows.
-- Do not rewrite or reinterpret historical responses.
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
    execute format('alter table public.%I add constraint %I check (form_version in (%L, %L, %L))',
      table_name, table_name || '_form_version_check', version_prefix || '_v1.0', version_prefix || '_v1.1', version_prefix || '_v1.2');
    execute format('alter table public.%I add column public_region_code text', table_name);
    execute format('alter table public.%I add constraint %I check (
      (public_region_code is null or public_region_code ~ ''^[A-Z]{2}$'')
      and (public_acknowledgement <> ''unlisted'' or public_region_code is null)
      and (form_version = %L or public_region_code is null)
      and (form_version <> %L or public_region is null)
    )', table_name, table_name || '_public_region_version_check', version_prefix || '_v1.2', version_prefix || '_v1.2');
  end loop;
end $$;
