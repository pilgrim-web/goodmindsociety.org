# Netlify Setup

## Deploy
1. Create a new Netlify site from the Git repo.
2. Build settings:
   - Build command: (leave blank)
   - Publish directory: `.`
   - Functions directory: `netlify/functions`
3. Confirm `netlify.toml` is detected (redirects, headers, caching).

## Environment Variables (optional)
Set only if you enable Stripe Checkout Sessions:
- `STRIPE_SECRET_KEY`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`

## Verify
- `/admin/` loads Decap CMS.
- `/en/`, `/ko/`, `/es/` prefixes resolve to the same templates.
- `/assets/i18n/*` and `/content/data/*` are not cached.
