# cPanel Deployment Guide (Fix 404 on Refresh)

This app is a **Single Page Application (SPA)**. All routing is handled client-side by TanStack Router. When you refresh a page like `/products` or `/orders`, the browser asks Apache for that path directly. Apache doesn't find a file at that path and returns **404 Not Found**.

The fix is to tell Apache: *"For any URL that isn't a real file, serve `index.html` and let the JavaScript router handle it."* This is done with a `.htaccess` file.

---

## 1. Build the App

```bash
# Clean build (recommended)
rm -rf node_modules/.vite dist
npm install
npm run build
```

Output: `dist/client/`

### If build fails with `sh: 1: vite: not found`

That error means dependencies are not installed, so the local Vite executable is missing.

Run this from the project root:

```bash
npm install
npm run build
```

Important notes:
- Run `npm install` before `npm run build`
- Do **not** run `npm install --production` or `npm install --omit=dev` before building
- Use Node.js 20+ on your local machine or hosting build environment
- After a successful build, upload the contents of `dist/client/`, not the whole `dist/` folder

---

## 2. Verify `.htaccess` Exists in the Build Output

After building, confirm this file exists:

```
dist/client/.htaccess
```

It should contain:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Don't rewrite real files or directories
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Send everything else to index.html
  RewriteRule ^ index.html [L]
</IfModule>
```

If it's missing, copy `public/.htaccess` into `dist/client/` manually.

---

## 3. Upload to cPanel — Include Hidden Files

Upload **all contents** of `dist/client/` into your cPanel `public_html/` directory (or your subfolder).

> **Important:** `.htaccess` starts with a dot and is **hidden by default**. Most upload tools skip it.

### File Manager (cPanel)
1. Open **File Manager**
2. Top-right → **Settings** → check **Show Hidden Files (dotfiles)** → Save
3. Upload all files from `dist/client/` including `.htaccess`

### FTP (FileZilla)
1. Menu → **Server** → **Force showing hidden files**
2. Upload all files from `dist/client/`

### ZIP Upload (recommended)
```bash
cd dist/client
zip -r ../site.zip . .htaccess
```
Then upload `site.zip` to cPanel and use **Extract**.

---

## 4. Verify on the Server

After upload, your `public_html/` should contain at minimum:

```
public_html/
├── .htaccess          ← MUST be present
├── index.html
├── assets/
└── ...
```

Test in browser:
- Visit `https://yourdomain.com/` → loads
- Visit `https://yourdomain.com/products` → loads
- Press **F5** on `/products` → should still load (no 404)

---

## 5. Common Problems

### Still 404 after upload
- `.htaccess` was not uploaded → re-check hidden files setting
- `mod_rewrite` not enabled → contact hosting support (it's enabled on almost all shared cPanel hosts)
- Hosting provider overrides `.htaccess` → ask support to allow `AllowOverride All`

### App is in a subfolder (e.g. `public_html/app/`)
Edit `public/.htaccess` **before building** and change:
```apache
RewriteBase /
```
to:
```apache
RewriteBase /app/
```
Then rebuild and re-upload.

### Assets not loading (blank page)
If the app is in a subfolder, also update `vite.config.ts`:
```ts
export default defineConfig({
  base: '/app/',
  // ... rest of config
})
```
Rebuild and re-upload.

### Nginx (not Apache)
`.htaccess` is ignored by Nginx. Add this to your server block instead:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## Quick Checklist

- [ ] Ran `npm install`
- [ ] Ran `npm run build`
- [ ] `dist/client/.htaccess` exists
- [ ] Uploaded **all** files from `dist/client/` to `public_html/`
- [ ] **Hidden files were shown** during upload
- [ ] `public_html/.htaccess` exists on the server
- [ ] Refresh on a deep link (e.g. `/products`) works without 404
