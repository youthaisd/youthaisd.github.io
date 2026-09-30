# AI×SD Forms v1.2 — implementation and analysis specification

## Status and deployment boundary

The LISTEN, MAP, and CONTRIBUTE forms and Supabase backend are deployed for live submissions. A separate JOIN prototype is paused and not promoted on the public site; see [membership notes](membership-v02.md). The three forms are restricted to adults aged 18 or older. The browser contains only a publishable key; the success pages show confirmation and a deletion-request reference only after an accepted API response.

The Contributor review and public acknowledgement migrations were applied and verified on the live database on 2026-09-30 for Forms v1.1.

The v1.2 country-label and controlled public-region changes are prepared in code only. Apply `202609300003_country_region_v12.sql`, deploy both updated Edge Functions, test, and only then publish the v1.2 static site. Publishing the v1.2 forms first would make live submissions fail.

Routes on GitHub Pages use the site directory: `consultation/`, `projects/`, `contribute/`, each with `success/` (and a `success.html` equivalent). All asset links are relative and work under a repository path.

## Shared rules

- `data/taxonomy.js` is the single source for topic, role, contribution-type, and country IDs. `data/country-labels.js` pins English display labels; IDs must not be repurposed after collection starts.
- Country and region choices use the same 249 existing two-letter IDs. The picker groups `CN` (Chinese mainland), `HK` (Hong Kong SAR, China), `MO` (Macao SAR, China), and `TW` (Taiwan, China) under a non-selectable “China” heading. Keep the four raw codes distinct. For country-level reporting, map all four to `CN` via `reportingCountryCode`; do not overwrite response rows. The `CN` label in v1.0 was “China”, so earlier `CN` answers must not be retrospectively described as specifically mainland responses. Use `form_version` to distinguish collection wording.
- The China-region English wording follows [National Bureau of Statistics English material](https://www.stats.gov.cn/english/understanding/202403/P020240328547250958291.pdf). Existing two-letter IDs are retained with reference to [GB/T 2659.1—2022](https://std.samr.gov.cn//gb/search/gbDetailed?id=F159DFC2A91047EFE05397BE0A0AF334). Other display labels are pinned for this version so they do not vary with browser locale data.
- All multi-select values store ID arrays. Other text is stored in a separate field and cleared when Other is deselected.
- Maximum-three questions display a selection count and disable further options at three.
- `none` and `nothing_currently` are exclusive.
- The five-step interface preserves values on Back. Drafts use `sessionStorage`, not `localStorage`, and are deleted after accepted submission.
- Source is one of `direct`, `consultation`, `projects`, or `website`. It is a navigation source, not a person identifier. No cross-form ID, email matching, or fingerprinting is implemented.
- Only six answer-free `CustomEvent` names are emitted by the browser: `consultation_started`, `consultation_completed`, `project_started`, `project_completed`, `contributor_started`, `contributor_completed`. They are not transmitted to analytics by this release.
- No file uploads, public data explorer, membership application, partner application, or automatic scoring exist in v1.

## Tables and key fields

| Form | Table | Version | Main analysis fields | Personal contact fields |
|---|---|---|---|---|
| LISTEN | `consultation_responses` | `consultation_v1.2` | country, role, interest topics, familiarity, engagement, top barriers, desired resources, ideal solution, future priorities, willingness to contribute | follow-up email/name only when consented; separate display name if public acknowledgement chosen |
| MAP | `project_submissions` | `projects_v1.2` | project type/stage/region/topics/SDGs, problem, AI role, progress, links, needs, public-use permission | submitter name/email/organisation |
| CONTRIBUTE | `contributor_interests` | `contribute_v1.2` | role, field, topics, contribution types, small first contribution, availability, profile links | preferred name/email |

Each table also stores its own UUID, creation time, source, form version, and adult confirmation. There is no shared `person_id`. The SQL migrations revoke `anon` and `authenticated` access to all response tables and grant the service role access for verified data requests. The Edge Function uses the admin client only on the server.

## Branching and validation

### LISTEN

Consent must be `yes`; `no` stops the form. Country uses ISO 3166-1 alpha-2 codes plus `prefer_not_to_say`. Topics, barriers, resources, and future priorities allow up to three. Familiarity is an integer 1–5. Prior engagement's `none` is exclusive. Contribution preferences appear only for `yes` or `maybe`; they are aggregate indication and do not confer status. Follow-up email is required only after explicit follow-up consent. No newsletter consent is inferred.

### MAP

Title is at most 150 characters. The project stage changes the progress question's wording for an idea. Problem, AI role, and progress each allow up to 150 words. Project links allow up to three HTTP(S) URLs with typed labels, no uploads. Project needs allow up to three; `nothing_currently` is exclusive. Third-party submitters see a public-information reminder. Public-use permission is `yes`, `contact_first`, or `internal_only`. This permission does not itself guarantee publication; manual review is required. The accuracy/share-right confirmation is mandatory.

### CONTRIBUTE

Contribution types and topics allow up to three. A small first contribution is required: gap (80–200 words), resource (title or URL plus 50–150-word explanation), or small project (80–200 words). Resource titles and explanations are joined in `micro_contribution_text`; a web URL, when provided, is stored separately in `micro_contribution_url`. There is no automatic scoring or approval. An authorized person normally confirms Contributor status after reading the first contribution, declining only submissions that violate basic standards of respectful and lawful participation. Profile links allow up to four HTTP(S) URLs.

The review migration `202609300001_contributor_review.sql` adds `review_status` (`pending`, `approved`, `declined`), `reviewed_at`, and a private `review_note` to `contributor_interests`. New and existing records start as `pending`. The public success page confirms receipt only. In Supabase Table Editor, the authorized reviewer filters this table to `pending`, reads the first contribution, and changes `review_status` to `approved` or `declined`; the trigger stamps `reviewed_at`. The dashboard review is the required personal confirmation. Do not present a pending row as an approved Contributor, and do not publish contact details. This release has no automatic approval email.

### Public acknowledgements

Each form ends with a separate choice: `name`, `name_affiliation`, or `unlisted`. A display name is required for either public choice; affiliation is required only for `name_affiliation`; `public_region_code` is an optional controlled selection using the shared two-letter IDs. Neither follow-up consent nor project public-use permission implies a public name listing. Public display does not include answer text, project details, email, or profile links. Existing v1.0 rows default to `unlisted`; no consent is inferred retroactively.

Migration 003 adds `public_region_code` without altering the v1.1 `public_region` text column or old rows. The v1.2 public endpoint displays only the controlled code's fixed label; any legacy free-text region remains private. No historical region is automatically recoded.

Migration `202609300002_public_acknowledgements.sql` adds the display fields to all three tables. Consultation and project rows also receive `public_listing_status`: the submit function sets opted-in rows to `pending`, unlisted rows to `unlisted`. The reviewer checks the received submission and consent once, then changes that status to `approved` or `declined`. Contributor rows use the existing `review_status` for the same single manual decision. Any eligible adult can submit; no identity pre-approval is required. For a Contributor row that opted in, the one `review_status = approved` confirmation also makes the acknowledgement visible. No status change is automatic.

The `contributors` Edge Function returns only approved display name, approved affiliation/region, and source type plus month. It never returns email, response ID, or answer text. It reads the three tables separately and does not match people across them. The public page renders returned text via `textContent`. A listing drops from the endpoint when the source row is deleted or passes the 12-month retention limit; a reviewer can remove it sooner by setting the relevant review status to `declined`. Do not publish profile URLs until a separate link-specific consent process exists.

Client and server both use `data/validation.js`; the server validates again before insertion. Text is trimmed and control characters removed. Links accept only HTTP(S). Text from submissions must remain plain text in any future public rendering and must never be inserted as raw HTML.

## Privacy and abuse prevention

- The Edge Function accepts only configured site origins and the project's publishable key, then validates content server-side. Origin and a public key are **not** proof of human identity; the honeypot and rate limit are additional friction.
- A database-backed rate limiter permits five valid submissions per form per hour per gateway IP. It uses an HMAC hash that includes form and hour, so its security records cannot be used to link people across forms or hours. It stores no raw IP in research tables. Automatic hosting logs may still contain IPs; do not copy them into analysis exports.
- `RATE_LIMIT_SALT` is a server secret. Set a long random value through Supabase Secrets. Never commit it.
- The rate limit depends on a trustworthy gateway IP header. Confirm header behavior in the deployed environment. Add managed bot protection if spam volume warrants it.
- The public [privacy notice](../privacy/) provides the contact, storage location, uses, withdrawal route, and 12-month retention policy. A scheduled database task removes expired responses daily. Submission references allow a respondent to identify an anonymous response for a verified deletion request.
- Do not publish raw response tables, private email addresses, project submissions, or contributor records. Export clean CSV/JSON only through authorized database access for research analysis.
- Public quotations from free-text responses require separate explicit permission, even when the published quote is anonymous.

## Brief #01 analysis plan

Report respondent profile by region, role, familiarity, and prior engagement. Primary descriptive figures: top barriers (`top_barriers`), desired resources (`desired_resources`), future priorities (`future_priorities`), and willingness to contribute. Code `ideal_solution` and other free-text responses thematically. Exploratory comparisons may include role × barriers/resources, familiarity × barriers, engagement × barriers, and topics × resources. Always display subgroup `n`; avoid strong claims from small or self-selected samples.

For project mapping, summarize topics × stage, topics × needs, and stage × needs. A later comparison may contrast what consultation respondents say they need with what submitted projects say they need. This is descriptive, not a matched-person analysis.

## Launch checklist

1. Create a Supabase project and apply all migrations in `supabase/migrations/` in order.
2. Link the project with the Supabase CLI, apply the migrations (`supabase db push`), and deploy `supabase/functions/submit` and `supabase/functions/contributors`. `verify_jwt = false` is in `supabase/config.toml`; both functions require a valid publishable key.
3. Set `PUBLIC_SITE_ORIGINS` (comma-separated exact origins, e.g. `https://example.org`) and `RATE_LIMIT_SALT` in Supabase Secrets. Verify gateway IP header behavior.
4. Publish a privacy notice naming the responsible contact, storage location, retention period, withdrawal/deletion process, and intended research/publication use.
5. In `assets/js/api-config.js`, set the public Edge Function URL and the Supabase **publishable** key. Never paste a secret/service-role key here.
6. Test all three v1.2 forms against the deployed function; confirm accepted rows land in different tables and direct `anon`/`authenticated` table reads are denied. Test the four China-region options, other-region search, all three acknowledgement choices, conditional display fields, negative cases, rate limit, and origin rejection. Confirm the public endpoint returns no pending, unlisted, declined, expired, or unconfirmed Contributor records. Confirm a manually approved listing appears and disappears after reversal.
7. Publish the static directory to GitHub Pages after the checks pass.

Current [Supabase Edge Function auth](https://supabase.com/docs/guides/functions/auth), [CORS](https://supabase.com/docs/guides/functions/cors), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), and [API key](https://supabase.com/docs/guides/getting-started/api-keys) documentation informed the server setup.
