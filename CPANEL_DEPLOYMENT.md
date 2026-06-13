# cPanel Deployment Guide (Fix 404 on Refresh)

This app is a **Single Page Application (SPA)**. All routing is handled in the browser by TanStack Router. When you refresh a page like `/product-types`, Apache looks for a real file at that path, doesn't find one, and returns **404 Not Found**.

The fix is a `.htaccess` file that tells Apache to serve `index.html` for any URL that isn't a real file. The JavaScript router then renders the correct page.

---

## TL;DR — Why `/` works but `/product-types` 404s

- `/` works because Apache serves `index.html` automatically (the `DirectoryIndex`).
- `/product-types` fails because Apache looks for a folder/file called `product-types` and doesn't find one.
- The `.htaccess` file rewrites every unmatched URL back to `index.html`. **If 404 still happens after deploy, the `.htaccess` file did not get uploaded** (it's hidden by default).

---

## 1. Build the App

```bash
rm -rf node_modules/.vite dist
npm install
npm run build
```

Output: **`dist/client/`** (not `dist/`).

If `npm run build` fails with `sh: 1: vite: not found`, you skipped `npm install` (or used `--production` / `--omit=dev`). Run a plain `npm install` first.

---

## 2. Confirm `.htaccess` Is in the Build Output

```bash
ls -la dist/client/.htaccess
```

It must exist. Its contents should match `public/.htaccess` in this repo:

```apache
Options -MultiViews

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule ^ index.html [L]
</IfModule>

ErrorDocument 404 /index.html
```

The `ErrorDocument 404 /index.html` line is a safety net — even if `mod_rewrite` is disabled on your host, deep links still load.

---

## 3. Upload to cPanel — INCLUDE HIDDEN FILES

Upload **all contents** of `dist/client/` into `public_html/` (or your subfolder).

> `.htaccess` starts with a dot and is **hidden by default**. 90% of "still 404 after deploy" issues are caused by this file not being uploaded.

### cPanel File Manager
1. Open **File Manager** → top-right **Settings**
2. Check **Show Hidden Files (dotfiles)** → Save
3. Upload all files from `dist/client/`

### FileZilla / FTP
1. Menu → **Server** → **Force showing hidden files**
2. Upload all files from `dist/client/`

### ZIP method (most reliable)
```bash
cd dist/client
zip -r ../site.zip . .htaccess
```
Upload `site.zip` to cPanel, then **Extract** in File Manager.

---

## 4. Verify on the Server

In cPanel File Manager (with hidden files shown), `public_html/` must contain:

```
public_html/
├── .htaccess          ← MUST be present
├── index.html
├── assets/
└── ...
```

Test:
- `https://yourdomain.com/` → loads ✓
- `https://yourdomain.com/product-types` → loads ✓
- Press **F5** on `/product-types` → still loads, no 404 ✓

---

## 5. Still Getting 404? Checklist

Run through these in order:

1. **Is `.htaccess` actually on the server?**
   File Manager → Settings → Show Hidden Files → look in `public_html/`.
   If it's not there, re-upload it (most common cause).

2. **Is `mod_rewrite` enabled?**
   On shared cPanel hosts it almost always is. If not, contact support.
   Even without it, the `ErrorDocument 404 /index.html` line in the new
   `.htaccess` should still serve the SPA.

3. **Does the host allow `.htaccess` overrides?**
   Ask support to confirm `AllowOverride All` is enabled for your account.

4. **Is your app in a subfolder?** (e.g. `public_html/app/`)
   Edit `public/.htaccess` **before building**:
   ```apache
   RewriteBase /app/
   ```
   ```apache
   ErrorDocument 404 /app/index.html
   ```
   And in `vite.config.ts`:
   ```ts
   export default defineConfig({
     base: '/app/',
   })
   ```
   Rebuild and re-upload.

5. **Are you on Nginx, not Apache?**
   `.htaccess` is ignored by Nginx. Add this to your server block:
   ```nginx
   location / {
     try_files $uri $uri/ /index.html;
   }
   ```

---

## Quick Checklist

- [ ] Ran `npm install`
- [ ] Ran `npm run build`
- [ ] `dist/client/.htaccess` exists locally
- [ ] Uploaded **all** files from `dist/client/` to `public_html/`
- [ ] Hidden files were shown during upload
- [ ] `public_html/.htaccess` exists on the server
- [ ] F5 on `/product-types` no longer returns 404
