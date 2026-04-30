# Athena — AI Organization Assistant

A mobile-first PWA that lets you photograph a cluttered space, receive an AI efficiency score (0–100), a list of issues, real product recommendations with prices, and a before/after image preview.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + Vanilla JS (no framework) |
| PWA | `manifest.json` + Service Worker |
| Backend | Netlify Functions (Node 18, esbuild) |
| Database | Supabase (PostgreSQL) |
| Vision + Recommendations | Anthropic Claude API |
| Image Generation | OpenAI DALL-E 3 |

## Quick Start (Local)

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in values
cp .env.local.example .env.local

# 3. Start the Vite dev server
npm run dev

# 4. (Optional) run Netlify functions locally alongside the dev server
npx netlify dev
```

> **Tip:** When using `netlify dev`, Netlify spins up both the Vite dev server and the functions server together. The Vite proxy in `vite.config.js` forwards `/.netlify/functions/*` to `http://localhost:8888` automatically during `npm run dev` without Netlify CLI.

## Environment Variables

Create a `.env.local` file at the project root with the variables below.

### Frontend (exposed via `import.meta.env`)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL, e.g. `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |

### Netlify Functions (server-side only, set in Netlify dashboard)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude vision + product search |
| `OPENAI_API_KEY` | OpenAI API key for DALL-E 3 image generation |
| `SUPABASE_URL` | Same Supabase project URL (used server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (never exposed to client) |

Set all of these in your Netlify site → **Site configuration → Environment variables**.

## Database Setup

Run the migration in `supabase/migrations/001_init.sql` against your Supabase project:

```bash
# Using the Supabase CLI
supabase db push

# Or paste the SQL directly into the Supabase SQL editor
```

## Build & Deploy

```bash
# Production build (outputs to dist/)
npm run build

# Preview the production build locally
npm run preview
```

Deploy by linking the repo to your Netlify site. Netlify will run `npm run build` and serve `dist/`. Make sure all environment variables are set in the Netlify dashboard before deploying.

## PWA Icons

The manifest references `/icons/icon-192.png` and `/icons/icon-512.png`. Place your icon assets in `public/icons/` before deploying. PNG files with a pink (#E91E63) background and the Athena "A" logo work best. Without icons the app still runs, but the PWA install prompt may not appear on all browsers.

## Architecture Notes

- **State** is held in `src/state.js` — a plain JS module-level object shared across pages.
- **Routing** is hash-based (`#/`, `#/camera`, `#/analysis`, etc.) with dynamic page imports for code-splitting.
- **User identity** is stubbed — no real auth. `STUB_USER_ID` is used as a placeholder.
- **Photo storage** is round-trip base64 only. Persistent cloud photo storage is a future improvement.
- **Service worker** (`src/service-worker.js` → copied to `dist/sw.js` at build time) uses cache-first for static assets and network-first for `/.netlify/functions/*`.
