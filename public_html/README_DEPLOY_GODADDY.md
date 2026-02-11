# GoDaddy cPanel Deployment

This site is static-first with a small PHP mail API. No build step is required.

## Deploy Steps
1. Log in to GoDaddy cPanel.
2. Open **File Manager**.
3. Navigate to `/public_html/`.
4. Upload the contents of this `public_html/` folder (or sync via FTP).
5. Ensure the folder structure matches exactly (see repository tree).
6. Verify permissions:
   - Directories: `755`
   - Files: `644`
7. Confirm PHP is enabled for `/public_html/api/`.
8. Test the contact and get-involved forms on the live site.

## Optional: Stripe Redirect
- `donation.html` automatically redirects to the Stripe Payment Link.

## Admin Protection
- Protect `/public_html/admin/` using Basic Auth.
- Follow `admin/README_ADMIN.md` to configure `.htaccess` and `.htpasswd`.

## Blog Workflow
- Posts are added via FTP and listed in `/content/blog/index.json`.
- Follow `/content/blog/README_BLOG.md` for step-by-step instructions.
