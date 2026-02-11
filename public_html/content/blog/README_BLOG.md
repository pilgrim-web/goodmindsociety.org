# Blog Editing (FTP Workflow)

This site uses a lightweight, FTP-friendly workflow. New posts are static HTML files, and the blog list is driven by `/public_html/content/blog/index.json`.

## Steps
1. Duplicate `/public_html/blog/post-template.html`.
2. Rename the new file to `YYYY-MM-DD-slug.html`.
3. Upload the file to `/public_html/blog/posts/` via FTP.
4. Open `/public_html/content/blog/index.json` and add a new entry:

```
{
  "title": "Your post title",
  "date": "YYYY-MM-DD",
  "excerpt": "Short summary for the blog list.",
  "url": "/blog/posts/YYYY-MM-DD-slug.html",
  "lang": "en"
}
```

5. Upload the updated `index.json` via FTP.

## Notes
- The `lang` field supports `en`, `ko`, `es`, `zh`.
- Keep dates in `YYYY-MM-DD` format.
- The blog list page will filter posts by the selected site language.
