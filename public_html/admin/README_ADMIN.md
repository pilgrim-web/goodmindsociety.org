# Admin Access (GoDaddy cPanel)

This folder is protected with HTTP Basic Auth. Use GoDaddy cPanel to create and manage the three accounts: `admin1`, `admin2`, `admin3`.

## Option A (Recommended): Directory Privacy in cPanel
1. Log in to GoDaddy cPanel.
2. Open **Directory Privacy** (sometimes called **Password Protect Directories**).
3. Navigate to `/public_html/admin` and enable password protection.
4. Add users `admin1`, `admin2`, and `admin3` with strong passwords.
5. cPanel will create/overwrite `.htaccess` and `.htpasswd` automatically.

## Option B: Manual `.htpasswd` Update
1. In cPanel, open **File Manager**.
2. Open `/public_html/admin/.htaccess` and update the `AuthUserFile` path to your server home path.
   Example: `/home/your_cpanel_username/public_html/admin/.htpasswd`
3. Generate password hashes in cPanel **Directory Privacy** or a secure local tool.
4. Edit `/public_html/admin/.htpasswd` and replace the placeholder hashes for `admin1`, `admin2`, `admin3`.

## Changing Passwords
- Using **Directory Privacy**: remove the user and re-add with a new password.
- Manual: replace the hash for the user in `.htpasswd` and save.

## Notes
- Keep this folder private. Do not share passwords via email.
- If `admin/` is ever renamed, update the paths in `.htaccess` accordingly.
