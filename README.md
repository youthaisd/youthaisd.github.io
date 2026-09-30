# YouthAISD — website v0.2 with Forms v1.2 prepared

Static GitHub Pages site with three public routes: LISTEN, MAP, and CONTRIBUTE. They are open for adults aged 18 and older. An earlier JOIN prototype remains closed and is no longer promoted on the public site.

The `/origin/` context note documents the Shanghai workshop and discussion paper that inspired the initiative, with source links and an explicit independence statement.

## Deployment

- Site: <https://youthaisd.github.io/>
- Privacy notice: <https://youthaisd.github.io/privacy/>
- Supabase project: `tzkdvvncvnttgjspzbot` (Sydney)
- Form responses: three separate private tables, 12-month retention with daily deletion

The Edge Function validates requests, checks the allowed site origin, and rate limits valid submissions. The browser configuration contains only a publishable key. Never add a secret or service-role key to this repository. Each accepted submission receives a UUID reference for a later deletion request. Synthetic launch submissions were removed after verification.

JOIN is separately gated by `assets/js/join-config.js` and its server settings. It must remain closed until its own privacy and deployment checks are completed.

The Contributor pathway requires a first contribution. Migration `supabase/migrations/202609300001_contributor_review.sql` was applied to the live project on 2026-09-30. Submissions remain `pending` until an authorized person confirms or declines them in Supabase. The review normally confirms status unless a submission violates basic standards of respectful and lawful participation.

Public acknowledgements use migration `202609300002_public_acknowledgements.sql`, the updated `submit` function, and the `contributors` function; these were deployed and verified on 2026-09-30 for Forms v1.1. The public `/contributors/` page reads only manually approved, opted-in display fields from the function. It never queries raw tables from the browser. The unused JOIN migration was removed before deployment.

Forms v1.2 pins English country and region labels. The China group presents Chinese mainland, Hong Kong SAR, China, Macao SAR, China, and Taiwan, China as distinct stored codes. Country-level analysis can group these under China while preserving the original selections. Earlier v1.0 `CN` responses used the broader “China” label and must be reported with their original wording in mind. **Deploy `202609300003_country_region_v12.sql` and both updated Edge Functions, then verify live submissions, before publishing the v1.2 static site.**

## Local preview

Serve the directory over HTTP; ES modules do not run correctly from `file://`.

## GitHub Pages

Publish the repository root from `main` in **Settings → Pages**. Keep `.nojekyll`.

Operational details: [forms specification](docs/forms-spec.md), [中文说明](docs/forms-spec.zh-CN.md), and [JOIN v0.2 notes](docs/membership-v02.md).
