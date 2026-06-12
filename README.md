# Adroit Gems - Jewellery Wholesale ERP

A full-stack jewellery wholesale management system built with **TanStack Start**, **React 19**, and **Tailwind CSS v4**.

## Features

- **Product Management** — Add, edit, and manage jewellery products with HUID tracking
- **Product Types** — Categorize products (Bangles, Rings, Necklaces, etc.) with HUID support
- **Customer Management** — Maintain customer records and contact details
- **Orders** — Create, approve, cancel, and track orders with stock auto-deduction
- **Stock Control** — Real-time stock levels with piece-level HUID tracking and net weight management
- **Billing** — Generate invoices with automatic GST calculation (3% for gold/silver)
- **Reports** — Sales, stock, and financial summaries
- **Restrictions** — Access control and business rule enforcement

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start v1 (SPA mode) |
| UI Library | React 19 |
| Bundler | Vite 7 |
| Styling | Tailwind CSS v4 |
| Components | Radix UI + shadcn/ui |
| Icons | Lucide React |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| State | TanStack Query |
| Package Manager | Bun |

## Design

- **Theme:** Dark mode with gold (`#d4a843`) accents
- **Typography:** Playfair Display for headings, Inter for body text
- **Currency:** Indian Rupee (₹) formatting
- **Tax:** GST at 3% for gold and silver items

## Prerequisites

- [Bun](https://bun.sh) v1.1 or later
- Node.js 20+ (for compatibility; Bun is preferred)

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd tanstack_start_ts

# Install dependencies
bun install
```

## Development

```bash
# Start the dev server
bun run dev
```

The app will be available at `http://localhost:5173` (or the next open port).

## Build

```bash
# Production build (outputs to dist/client)
bun run build
```

The build command:
1. Bundles the application in **SPA mode** using Vite
2. Copies `dist/client/_shell.html` to `dist/client/index.html` for static hosting

### Build with cache removed

```bash
# Clear all caches and rebuild
rm -rf node_modules/.vite dist .bun-cache
bun install
bun run build
```

## Preview Production Build

```bash
bun run preview
```

## Project Structure

```
src/
  components/     # Reusable UI components
  hooks/           # Custom React hooks
  lib/             # Utilities, store logic, helpers
  routes/          # TanStack file-based routes
  router.tsx       # Router configuration
  routeTree.gen.ts # Auto-generated route tree
  styles.css       # Global styles + Tailwind directives
public/
  .htaccess        # Apache rewrite rules for SPA routing
```

## Deployment

### Static Hosting (cPanel / Apache / Nginx)

Upload the contents of `dist/client/` to your web server.

- The included `public/.htaccess` handles client-side routing by rewriting all paths to `index.html`
- For Nginx, use an equivalent `try_files` configuration

### Netlify

A `netlify.toml` is included. Connect your repo for automatic deploys.

### GitHub Actions → AWS EC2

The `.github/workflows/deploy.yml` builds the project and rsyncs `dist/` to the configured server on every push to `main`.

## Data Persistence

This application runs in **demo mode** using `localStorage` for all data persistence. No backend server or database is required for local usage.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE` | Base URL for API calls (if backend integration is enabled) |

Create `.env.local` to override values for local development:

```env
VITE_API_BASE=http://localhost:5000/api
```

## Linting

```bash
bun run lint
```

## Scripts Reference

| Script | Description |
|--------|-------------|
| `bun run dev` | Start Vite development server |
| `bun run build` | Production build → `dist/client` |
| `bun run build:dev` | Development mode build |
| `bun run preview` | Preview production build locally |
| `bun run lint` | Run ESLint |

## Notes

- Built as a **Single Page Application (SPA)** — all routing is handled client-side
- Indian Rupee (₹) is used throughout; gold/silver GST is calculated at 3%
- HUID (Hallmark Unique ID) tracking is supported at the individual piece level for stock management
