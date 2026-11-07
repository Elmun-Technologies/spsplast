# SPS Plast — sayt

Uch tilli (uz/ru/en) lead-generating website for **SPS**, an Uzbekistan-based
manufacturer of plastic molds for concrete paving slabs, facade, fence and
decor elements.

The site is **not a shop**. Its job is to show the catalog, build trust and
collect a **zayafka** (lead): name, phone, product of interest, quantity.
The lead is saved to Postgres, then delivered to the company's Telegram
group; a manager calls back with price and mold count.

Built with Next.js 15 (App Router) + React 19, TypeScript, plain CSS (no
Tailwind). Deployed to Vercel. Admin panel + Postgres (Drizzle) power the
leads CRM, catalog editing and SEO/content tools, but the **public storefront
stays fully static** — it never queries the database at request time.

> **Full project guide (architecture, routes, business rules, pitfalls):**
> [`CLAUDE.md`](CLAUDE.md) — this is the actively-maintained source of truth.
> Also see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md),
> [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md), [`docs/ADMIN.md`](docs/ADMIN.md)
> (admin/database setup), [`docs/SECURITY.md`](docs/SECURITY.md).

---

## Features

- **Storefront** — home, catalog with filters, model detail (mold/tile specs,
  area calculator), compare, request list, partners/export, production,
  contact — all prerendered static HTML (448 pages).
- **Zayafka flow** — `POST /api/leads` saves to Postgres first, then Telegram;
  never fails silently (returns 503 if neither succeeds, with phone/WhatsApp
  fallback shown to the visitor).
- **Admin panel** (`/admin`) — leads CRM, catalog (products/sections) editor
  with image upload and AI background removal, customer reviews, SEO center
  (per-page meta, 301s, IndexNow, Search Console/Webmaster), text CMS,
  visit analytics, integration settings.
- **i18n** — uz (default) / ru / en, hreflang + `x-default` (→ ru, for CIS
  browsers that don't match uz/ru/en).
- **SEO** — canonical + hreflang on every page, sitemap (276 URLs),
  Organization/Product/FAQPage/Review JSON-LD (never includes a price).
- **Analytics** — GTM/GA4, Yandex Metrica, Meta Pixel — env or admin-settings
  gated, nothing loads without an ID.

---

## Getting started

```bash
npm install
cp .env.example .env   # Telegram pair is enough for local dev; DATABASE_URL optional

npm run dev            # http://localhost:3000
```

The catalog is read from the committed `src/data/models2027.ts`, so the site
runs with an empty `.env` — only Telegram lead delivery needs the bot token
and chat id. `/admin` needs `DATABASE_URL` (see `docs/ADMIN.md`).

Node **≥ 22.6** is required (`.nvmrc`; `npm test` uses
`--experimental-strip-types`).

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | snapshot export + `models:check` + `next build` (448 static pages) |
| `npm start` | Production server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (`next lint`) |
| `npm test` | `node --test --experimental-strip-types tests/*.test.js` (182 tests) |
| `npm run models:build` / `models:images` / `models:check` | Catalog data pipeline (Excel → `data/models-2027.json` → WebP) |
| `npm run db:generate` / `db:migrate` | Drizzle migrations (after editing `src/server/db/schema.ts`) |
| `npm run admin:create` | Create the first admin user |
| `npm run audit:seo` / `audit:a11y` | SEO/DOM and axe-core checks (no browser needed) |
| `npm run shots` / `npm run lighthouse` | Visual + performance checks (need a real browser) |

---

## Architecture notes

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full picture.
Highlights:

### Static catalog, database only behind `src/server/`

`data/models-2027.json` (generated from the business's Excel source) is
compiled into the committed `src/data/models2027.ts`; `src/lib/catalog2027.ts`
reads it synchronously. If an admin has published catalog changes in
Postgres, `scripts/export-snapshot.mjs` overwrites that same file at build
time — the storefront code path doesn't change, there's just a different
source. Public pages (`[lang]`, `components`, `lib`) never import
`src/server/*` directly (`tests/platform.test.js` enforces this).

### Three write endpoints, nothing else

`POST /api/leads`, `GET /api/health`, `POST /api/track` are the **only**
route handlers under `src/app/api` (`tests/foundation2027.test.js` enforces
it). Everything else in the admin panel uses server actions.

### Async request APIs (Next.js 15)

`params`/`searchParams` are promises; `[lang]/layout.tsx` and every dynamic
page export `generateStaticParams()` with `dynamicParams = false`, so the
whole public storefront prerenders.

### No prices anywhere

No cart, no checkout, no price — not in the UI, not in JSON-LD structured
data (`Offer` omits `price`/`priceSpecification`). A visitor leaves a
zayafka; a manager quotes by phone or Telegram.

### Fonts are self-hosted

Onest (variable weight) ships as latin + cyrillic woff2 subsets from
`/public/fonts`. `next build` needs no outbound network call for fonts.

---

## Deploying (Vercel)

1. Import the repository into Vercel (framework preset: Next.js).
2. Set up a Postgres database (Neon or Supabase) and the environment
   variables — see `.env.example` and `docs/ADMIN.md`. Required for lead
   delivery: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. Required for `/admin`:
   `DATABASE_URL`.
3. Deploy. `vercel.json`'s `buildCommand` runs `db:migrate:deploy` before
   `next build` — a failed Production migration fails the build (the
   previous deploy keeps serving).

Full runbook: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) ·
admin/database setup: [`docs/ADMIN.md`](docs/ADMIN.md) ·
pre-launch checks: [`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md).
