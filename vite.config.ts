import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// SPA mode: produces a static index.html in dist/client suitable for
// static hosts like cPanel/Apache. The .htaccess in public/ rewrites
// all routes back to index.html so client-side routing works.
export default defineConfig({
  tanstackStart: {
    spa: {
      enabled: true,
    },
  },
});
