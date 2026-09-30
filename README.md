# YouthAISD — website v0.2 with Forms v1.0

Static GitHub Pages site with three public routes: LISTEN, MAP, and CONTRIBUTE. They are open for adults aged 18 and older. An earlier JOIN prototype remains closed and is no longer promoted on the public site.

The `/origin/` context note documents the Shanghai workshop and discussion paper that inspired the initiative, with source links and an explicit independence statement.

## Deployment

- Site: <https://youthaisd.github.io/>
- Privacy notice: <https://youthaisd.github.io/privacy/>
- Supabase project: `tzkdvvncvnttgjspzbot` (Sydney)
- Form responses: three separate private tables, 12-month retention with daily deletion

The Edge Function validates requests, checks the allowed site origin, and rate limits valid submissions. The browser configuration contains only a publishable key. Never add a secret or service-role key to this repository. Each accepted submission receives a UUID reference for a later deletion request. Synthetic launch submissions were removed after verification.

JOIN is separately gated by `assets/js/join-config.js` and its server settings. It must remain closed until its own privacy and deployment checks are completed.

The Contributor pathway requires a first contribution. Apply `supabase/migrations/202609300001_contributor_review.sql` to the live project before using the new review workflow. Submissions then remain `pending` until an authorized person confirms or declines them in Supabase. The review normally confirms status unless a submission violates basic standards of respectful and lawful participation. This migration has been prepared in the repository but has not been verified on the live database from this workspace.

## Local preview

Serve the directory over HTTP; ES modules do not run correctly from `file://`.

## GitHub Pages

Publish the repository root from `main` in **Settings → Pages**. Keep `.nojekyll`.

Operational details: [forms specification](docs/forms-spec.md), [中文说明](docs/forms-spec.zh-CN.md), and [JOIN v0.2 notes](docs/membership-v02.md).
