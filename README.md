# YouthAISD — website v0.2

Static GitHub Pages site with LISTEN, MAP, JOIN and CONTRIBUTE pathways. The original three five-step forms remain separate from the new JOIN membership route. The site has no frontend build step.
It uses system fonts and makes no third-party asset or analytics requests.

## Deployment status

The site is published at <https://youthaisd.github.io/>. Supabase project
`tzkdvvncvnttgjspzbot` has the v1.0 migration, `submit` Edge Function, allowed
site origin, and rate-limit secret installed. Synthetic submissions to all three
tables were verified and removed. Public clients cannot read or write response
tables directly.

The public forms remain **closed**. `assets/js/api-config.js` is blank
until a contact address, retention period, privacy notice, and final live checks
are ready. Its `formsOpen` flag must remain false until then. JOIN is also closed
by default and has a separate function, migration, and public configuration gate.
Do not turn on collection before those items are complete.

## Local preview

Serve this directory over HTTP (ES modules do not run correctly from `file://`). For example: `python -m http.server 8000`, then open `http://localhost:8000/`.

## GitHub Pages

Copy the contents of this directory to the root of a GitHub repository. In **Settings → Pages**, select **Deploy from a branch**, the branch containing the files, and `/(root)`. Keep `.nojekyll`. Relative links support repository-path hosting.

The site is safe to publish as a **preview** now: inactive forms hide their input controls. The original forms require a deployed HTTPS Edge Function URL, a public Supabase publishable key, and `formsOpen: true`. JOIN additionally requires its own endpoint, `privacyReady: true`, and a server-side `JOIN_OPEN=true` setting. Do not enter a service-role/secret key in the website.

To open live collection, follow [docs/forms-spec.md](docs/forms-spec.md), including the database migration, function deployment, privacy notice, and live security tests. GitHub Pages alone cannot receive and store submissions.

中文上线说明：[docs/forms-spec.zh-CN.md](docs/forms-spec.zh-CN.md)。

JOIN v0.2 architecture and opening checklist: [docs/membership-v02.md](docs/membership-v02.md).
