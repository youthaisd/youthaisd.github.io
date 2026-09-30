# YouthAISD community membership v0.2

JOIN is a separate, low-barrier community route. LISTEN, MAP and CONTRIBUTE remain separate; a JOIN record is not merged with their records and does not imply Contributor or representative status.

## Status

JOIN is paused because its audience and fields overlap with CONTRIBUTE. The public navigation offers LISTEN, MAP and CONTRIBUTE; the old `/join/` address points visitors toward CONTRIBUTE. The membership implementation below is retained as an unpublished prototype. It must not be activated without a fresh product decision and the checks below. The function rejects submissions unless its server-side `JOIN_OPEN` secret is exactly `true`.

## Data model

The proposed JOIN database migration was removed on 2026-09-30. This document is historical design context only; there is no JOIN table to deploy from this repository. A future JOIN feature would require a new product decision, migration, privacy review, and tests. Never publish email addresses.

The proposed internal member-code format is `YAISD-YYYY-M-NNNN`. Codes remain unassigned in this release. If introduced later, generate them on the server after deciding how duplicate submissions and verification will work. A membership confirmation or certificate may later state membership factually; it is not an accreditation or qualification.

## Deploy JOIN

1. Keep the original `submit` function for LISTEN, MAP and CONTRIBUTE. Deploy the separate `supabase/functions/join/index.ts` function with the Supabase CLI. `supabase/config.toml` sets `verify_jwt = false` for this function; `withSupabase({ auth:'publishable' })` validates the public project key in the `apikey` header.
2. Reuse `PUBLIC_SITE_ORIGINS=https://youthaisd.github.io` and `RATE_LIMIT_SALT` from the original function. Set `JOIN_OPEN=false` initially. These values are Supabase function secrets, never files in GitHub Pages.
3. Complete `/privacy/` with the actual contact address, storage region, retention period, and correction/deletion method. Confirm the wording matches how data will actually be handled.
4. In `assets/js/join-config.js`, set the deployed HTTPS JOIN function URL and `privacyReady: true`. The existing `assets/js/api-config.js` must have the project's public publishable key. No secret or service-role key belongs in browser code.
5. Test required fields, email and URL validation, topic selection limit, Other text, directory opt-in default, draft recovery, honeypot, forbidden Origin, rate limit, and public `SELECT` denial. Make one test membership submission and verify it appears only in `memberships`, with `directory_approved=false` and no member code. Remove the test record through the project dashboard after verification.
6. After the tests and privacy notice are complete, set `JOIN_OPEN=true`. Confirm the live website displays the form and a real submission reaches the success page. If the service must be paused, set `JOIN_OPEN=false` and set `privacyReady:false` in the public configuration so visitors do not see a dead-end form.

The current implementation does not send welcome emails, publish directory records, issue certificates, verify identity, or provide member accounts. Never use the internal membership record to suggest institutional endorsement.
