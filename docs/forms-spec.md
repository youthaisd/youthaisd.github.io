# AI×SD Forms v1.0 — implementation and analysis specification

## Status and deployment boundary

The static pages are ready for preview. **They do not accept submissions until a Supabase project, database migration, Edge Function, allowed origin, rate-limit salt, and public API configuration are installed.** The browser never contains a secret key. The success pages show confirmation only after an accepted API response in the same browser tab.

Routes on GitHub Pages use the site directory: `consultation/`, `projects/`, `contribute/`, each with `success/` (and a `success.html` equivalent). All asset links are relative and work under a repository path.

## Shared rules

- `data/taxonomy.js` is the single source for topic, role, contribution-type, and country IDs. Labels can change; IDs must not be repurposed after collection starts.
- All multi-select values store ID arrays. Other text is stored in a separate field and cleared when Other is deselected.
- Maximum-three questions display a selection count and disable further options at three.
- `none` and `nothing_currently` are exclusive.
- The five-step interface preserves values on Back. Drafts use `sessionStorage`, not `localStorage`, and are deleted after accepted submission.
- Source is one of `direct`, `consultation`, `projects`, or `website`. It is a navigation source, not a person identifier. No cross-form ID, email matching, or fingerprinting is implemented.
- Only six answer-free `CustomEvent` names are emitted by the browser: `consultation_started`, `consultation_completed`, `project_started`, `project_completed`, `contributor_started`, `contributor_completed`. They are not transmitted to analytics by this release.
- No file uploads, public data explorer, membership application, partner application, or automatic scoring exist in the original three-form v1. JOIN membership is a separate v0.2 route; see [membership-v02.md](membership-v02.md).

## Tables and key fields

| Form | Table | Version | Main analysis fields | Personal contact fields |
|---|---|---|---|---|
| LISTEN | `consultation_responses` | `consultation_v1.0` | country, role, interest topics, familiarity, engagement, top barriers, desired resources, ideal solution, future priorities, willingness to contribute | follow-up email/name only when consented |
| MAP | `project_submissions` | `projects_v1.0` | project type/stage/region/topics/SDGs, problem, AI role, progress, links, needs, public-use permission | submitter name/email/organisation |
| CONTRIBUTE | `contributor_interests` | `contribute_v1.0` | role, field, topics, contribution types, small first contribution, availability, profile links | preferred name/email |

Each table also stores its own UUID, creation time, source, and form version. There is no shared `person_id`. The SQL migration revokes `anon` and `authenticated` access to all response tables and gives the service role only `SELECT` and `INSERT` for those tables. The Edge Function uses the admin client only on the server. Test database grants and RLS in the actual Supabase project before launch.

## Branching and validation

### LISTEN

Consent must be `yes`; `no` stops the form. Country uses ISO 3166-1 alpha-2 codes plus `prefer_not_to_say`. Topics, barriers, resources, and future priorities allow up to three. Familiarity is an integer 1–5. Prior engagement's `none` is exclusive. Contribution preferences appear only for `yes` or `maybe`; they are aggregate indication and do not confer status. Follow-up email is required only after explicit follow-up consent. No newsletter consent is inferred.

### MAP

Title is at most 150 characters. The project stage changes the progress question's wording for an idea. Problem, AI role, and progress each allow up to 150 words. Project links allow up to three HTTP(S) URLs with typed labels, no uploads. Project needs allow up to three; `nothing_currently` is exclusive. Third-party submitters see a public-information reminder. Public-use permission is `yes`, `contact_first`, or `internal_only`. This permission does not itself guarantee publication; manual review is required. The accuracy/share-right confirmation is mandatory.

### CONTRIBUTE

Contribution types and topics allow up to three. A small first contribution is required: gap (80–200 words), resource (title or URL plus 50–150-word explanation), or small project (80–200 words). Resource titles and explanations are joined in `micro_contribution_text`; a web URL, when provided, is stored separately in `micro_contribution_url`. No automatic scoring or Contributor status is created. Profile links allow up to four HTTP(S) URLs.

Client and server both use `data/validation.js`; the server validates again before insertion. Text is trimmed and control characters removed. Links accept only HTTP(S). Text from submissions must remain plain text in any future public rendering and must never be inserted as raw HTML.

## Privacy and abuse prevention

- The Edge Function accepts only configured site origins and the project's publishable key, then validates content server-side. Origin and a public key are **not** proof of human identity; the honeypot and rate limit are additional friction.
- A database-backed rate limiter permits five attempts per form per hour per gateway IP. It uses an HMAC hash that includes form and hour, so its security records cannot be used to link people across forms or hours. It stores no raw IP in research tables. Automatic hosting logs may still contain IPs; do not copy them into analysis exports.
- `RATE_LIMIT_SALT` is a server secret. Set a long random value through Supabase Secrets. Never commit it.
- The rate limit depends on a trustworthy gateway IP header. Confirm header behavior in the deployed environment. Add managed bot protection if spam volume warrants it.
- The service does not implement data deletion, retention periods, or a named privacy contact because those policy decisions were not supplied. **Set and publish these before opening real submissions.** The public forms currently remain in preview mode until API settings are supplied.
- Do not publish raw response tables, private email addresses, project submissions, or contributor records. Export clean CSV/JSON only through authorized database access for research analysis.
- Public quotations from free-text responses require separate explicit permission, even when the published quote is anonymous.

## Brief #01 analysis plan

Report respondent profile by region, role, familiarity, and prior engagement. Primary descriptive figures: top barriers (`top_barriers`), desired resources (`desired_resources`), future priorities (`future_priorities`), and willingness to contribute. Code `ideal_solution` and other free-text responses thematically. Exploratory comparisons may include role × barriers/resources, familiarity × barriers, engagement × barriers, and topics × resources. Always display subgroup `n`; avoid strong claims from small or self-selected samples.

For project mapping, summarize topics × stage, topics × needs, and stage × needs. A later comparison may contrast what consultation respondents say they need with what submitted projects say they need. This is descriptive, not a matched-person analysis.

## Launch checklist

1. Create a Supabase project and apply `supabase/migrations/202609290001_forms_v1.sql`.
2. Link the project with the Supabase CLI, apply the migration (`supabase db push`), and deploy `supabase/functions/submit` (`supabase functions deploy submit`). `verify_jwt = false` is in `supabase/config.toml`; the function itself requires a valid publishable key.
3. Set `PUBLIC_SITE_ORIGINS` (comma-separated exact origins, e.g. `https://example.org`) and `RATE_LIMIT_SALT` in Supabase Secrets. Verify gateway IP header behavior.
4. Publish a privacy notice naming the responsible contact, storage location, retention period, withdrawal/deletion process, and intended research/publication use.
5. In `assets/js/api-config.js`, set the public Edge Function URL and the Supabase **publishable** key. Never paste a secret/service-role key here.
6. Test all three forms against the deployed function; confirm accepted rows land in different tables and direct `anon`/`authenticated` table reads are denied. Test negative cases, rate limit, and origin rejection.
7. Only then remove preview wording from the homepage if needed and publish the static directory to GitHub Pages.

Current [Supabase Edge Function auth](https://supabase.com/docs/guides/functions/auth), [CORS](https://supabase.com/docs/guides/functions/cors), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), and [API key](https://supabase.com/docs/guides/getting-started/api-keys) documentation informed the server setup.
