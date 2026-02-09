# Architecture

## Architecture Rules
- Single Source of Truth: All editable content lives in `/content` and `/assets/i18n`. Templates read from those sources.
- No inline scripts/styles: JavaScript and CSS must live in `/assets/js` and `/assets/css` (minimal JSON-LD is the only exception).
- Stable i18n keys: Do not rename keys. Deprecate by keeping old keys and mapping to new ones in code if needed.
- Accessibility required: Keyboard navigation, visible focus styles, ARIA labels, and semantic headings are mandatory.
- Security: No secrets in client code. Stripe secrets live only in Netlify Functions. Sanitize any rendered text.
- Performance budgets: No third-party JS except Decap CMS and optional Stripe redirect. Keep modules small and cacheable.

## Refactoring Policy
Allowed:
- Extract duplicate CSS into `assets/css/components.css`.
- Split or reorganize JS modules.
- Improve semantics, accessibility, and content clarity.
- Add tests or documentation.

Not allowed:
- Changing the locked folder tree.
- Changing the URL scheme or language prefix routing.
- Renaming i18n keys or changing their naming convention.

All refactors must:
- Keep public URLs stable.
- Keep CMS collection names stable.
- Update documentation and run a quick regression checklist.
