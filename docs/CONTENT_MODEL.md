# Content Model

## Global Settings (`/content/data/site.json`)
- `orgName` (string): i18n key for organization name.
- `tagline` (string): i18n key for tagline.
- `email` (string): contact email address.
- `socialLinks` (list): `{ labelKey, url }`.
- `donate`:
  - `paymentLinkOneTime` (string)
  - `paymentLinkMonthly` (string)
  - `checkoutMode` (`payment_link` | `checkout_session`)

## i18n (`/assets/i18n/{lang}.json`)
- JSON object of translation keys.
- If edited via CMS, it may be stored as `{ "translations": { ... } }`. The app supports both.

## Projects (`/content/data/projects.json`)
Each project item:
- `id`
- `titleKey`
- `summaryKey`
- `status` (i18n key)
- `featured` (boolean)
- `image` (string)
- `link` (string)

CMS may wrap this list as `{ "items": [...] }`. The app supports both.

## Updates (`/content/data/updates.json`)
Each update item:
- `id` / `slug`
- `titleKey`
- `excerptKey`
- `bodyKey`
- `dateISO`
- `tags` (list of i18n keys)

CMS may wrap this list as `{ "items": [...] }`. The app supports both.

## Impact Metrics (`/content/data/impact-metrics.json`)
Each metric item:
- `labelKey`
- `value`
- `noteKey`

CMS may wrap this list as `{ "items": [...] }`. The app supports both.
