-- Permit only the server-side service role to fulfil verified correction and
-- deletion requests. Public browser roles remain unable to read or mutate data.
grant update, delete on public.consultation_responses to service_role;
grant update, delete on public.project_submissions to service_role;
grant update, delete on public.contributor_interests to service_role;
