# Athena — AI Organization Assistant

A mobile-first Progressive Web App that uses AI to analyze cluttered spaces, generate an efficiency score (0–100), identify issues, recommend real products with prices, and produce before/after visualizations.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + Vanilla JS, Mobile-first PWA |
| Service Worker | Cache-first static / Network-first functions |
| Backend | Netlify Functions (Node.js, esbuild bundled) |
| Database | Supabase (PostgreSQL) |
| Vision & Products | Anthropic Claude API |
| Image Generation | OpenAI DALL-E 3 |

## Quick Start

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [Anthropic](https://console.anthropic.com) API key
- An [OpenAI](https://platform.openai.com) API key

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Create a `.env.local` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For Netlify Functions (set in Netlify dashboard, not in `.env.local`):
```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Set up the database
Run the migration in your Supabase SQL Editor:
- Open `supabase/migrations/001_init.sql`
- Paste the contents into the Supabase SQL Editor and run it

### 4. Start local development
```bash
npm run dev
```
> **Note:** Netlify Functions are not served by Vite dev server. For full-stack local testing:
```bash
npm install -g netlify-cli
netlify dev
```

## Environment Variables Reference

### Frontend (Vite) — must be prefixed with `VITE_`
| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

### Netlify Functions — set in Netlify dashboard under Site Settings → Environment Variables
| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key (Claude vision + product recommendations) |
| `OPENAI_API_KEY` | OpenAI API key (DALL-E 3 image generation) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (full DB access for functions) |

## Deploy to Netlify

1. Push this repo to GitHub.
2. In the [Netlify dashboard](https://app.netlify.com), click **Add new site → Import an existing project**.
3. Select your GitHub repo. Build settings are pre-configured via `netlify.toml`.
4. In **Site settings → Environment variables**, add all six variables listed above.
5. Trigger a deploy.

The Netlify site is also available at: **http://athena-organize-mold80ec.netlify.app**

## Icon Assets

> **Important:** Placeholder SVG icons are provided in `public/icons/`. For a production-quality PWA, replace `icon-192.svg` and `icon-512.svg` with proper PNG icons at 192×192 and 512×512 pixels, then update `manifest.json` to reference them as `image/png` with the `.png` extension.

## Architecture Notes

- **Auth:** A stub constant `user_id` is used throughout. Real Supabase Auth is a planned future enhancement.
- **Photo Storage:** Images are passed as base64 strings end-to-end. Persistent cloud photo storage (e.g. Supabase Storage) is a future enhancement — noted in `netlify/functions/save-project.js`.
- **Service Worker:** Registered from `/service-worker.js` (served from `public/`). Cache-first for static assets, network-first for `/.netlify/functions/*`.
