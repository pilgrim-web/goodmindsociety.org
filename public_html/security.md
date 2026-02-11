# Security Checklist

## Hosting & Access
- Enable HTTPS for the domain and force HTTPS redirects.
- Protect `/public_html/admin/` using Basic Auth (see `admin/README_ADMIN.md`).
- Store `.htpasswd` outside public download listings if possible.

## File Permissions
- Directories: `755`
- Files: `644`
- Do not allow public write permissions.

## Email Forms
- Only accept `POST` requests on `/api/*.php`.
- Validate required fields and email format.
- Sanitize input to reduce XSS and header injection risks.
- Use a honeypot field (`website`) to catch bots.
- Rate-limit requests per session (implemented in `api/utils.php`).

## Recommended Headers (via cPanel or .htaccess)
- `Content-Security-Policy` (adjust for site needs)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: no-referrer-when-downgrade`
- `Permissions-Policy` (disable unused features)

## Backups
- Keep a regular backup of `/public_html/` and the FTP content.
- Verify that `content/blog/index.json` can be restored quickly.
