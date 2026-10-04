# SPS Plast — sayt (backendsiz)

Bilingual (uz/ru) website for **SPS**, an Uzbekistan-based manufacturer of
concrete molds (bruschatka / bordyur / plitka qoliplari) and facade decor.

The site is **not a shop**. Its job is to show the catalog, build trust and
collect a **zayafka** (lead): name, phone, product of interest, quantity, note.
The lead is delivered to the company's Telegram group and a manager calls back.

Built with Next.js 15 (App Router) + React 19, TypeScript, Tailwind CSS and
Zustand. Deployed to Vercel. **No database, no Prisma, no admin panel.**

> Documentation: [`CLAUDE.md`](CLAUDE.md) (project guide), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md),
> [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md), [`docs/OPTIMIZATION-LOG.md`](docs/OPTIMIZATION-LOG.md),
> [`docs/UI-DESIGN-SYSTEM.md`](docs/UI-DESIGN-SYSTEM.md), [`docs/SECURITY.md`](docs/SECURITY.md)
> and the audit [`docs/MADANI-RAQOBAT-AUDITI.md`](docs/MADANI-RAQOBAT-AUDITI.md).
> Eski (savat/checkout davri) hujjatlar [`docs/archive/`](docs/archive/) da.

---

## Features

- **Storefront** — home, catalog with filters, product detail (variants, area
  calculator), search, blog, projects, company pages — all prerendered static HTML.
- **Zayafka flow** — one compact form (name, phone with `+998` mask, product,
  quantity, note) reachable from every page; the Telegram message carries the
  source page, language, time and product SKU.
- **Trust content** — FAQ (uz/ru, one source for visible text and JSON-LD),
  real photos, delivery/payment terms, no unverifiable numbers (P0-8 rule).
- **i18n** — `uz` / `ru`, prerendered per locale with hreflang + `x-default`.
- **Analytics** — GTM/GA4, Yandex Metrica and Meta Pixel, all env-gated.
- **SEO** — canonical + hreflang on every page, sitemap, Product/FAQPage/HowTo
  JSON-LD, 300+ word category pages.

---

## Getting started

```bash
npm install
cp .env.example .env   # Telegram pair is the only required part

npm run dev            # http://localhost:3000
```

The catalog is read from the committed `src/data/catalog.json`, so the site runs
with an empty `.env` — only the Telegram delivery of new leads needs the bot
token and chat id.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | `catalog:check` + `next build` (441 static pages) |
| `npm start` | Production server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (`next lint`) |
| `npm test` | `node --test --experimental-strip-types tests/*.test.js` |
| `npm run catalog:build` | Regenerate `src/data/catalog.json` |
| `npm run catalog:check` | Fail if the catalog JSON is stale |
| `npm run media:build` | Regenerate `public/media` from `media-src/` masters |
| `npm run fonts:sync` | Refresh the vendored Inter woff2 files |

---

## Architecture notes

### Static catalog instead of a database

`catalog_build/products.json`, `data/molds-2026.json` and `data/content-2026.json`
are merged by `scripts/build-static-catalog.js` into a single committed file,
`src/data/catalog.json`. `src/lib/catalog/*` reads it synchronously, so pages do
not await anything and there is no way for the site to be “down” because a
database is unreachable. `npm run catalog:check` runs before `next build` and
fails fast when the JSON is out of date.

### One write endpoint

`POST /api/leads` (Zod-validated, HTML-escaped, honeypot + per-IP rate limit,
optional UTM fields) is the only public write API; `GET /api/health` reports the
Telegram configuration. A test asserts that no other route handlers exist.

### Async request APIs

Next.js 15 makes `params`, `searchParams` and `cookies()` promises:

```tsx
// server component / route handler
const { lang } = await params;

// 'use client' page
const { lang } = React.use(params);
```

`[lang]/layout.tsx`, product, blog and category pages export
`generateStaticParams()`, so the whole storefront is prerendered HTML.

### Trust rules (P0-8)

No discount percentages, delivery tariffs or durability figures are published
unless they are verifiable. Where a number depends on the order, the copy says
so (“narx hajmga bog‘liq”, “resurs modelga bog‘liq”) — see
`docs/MADANI-RAQOBAT-AUDITI.md` §7.5.

### Fonts are self-hosted

Inter (variable) ships as latin + cyrillic woff2 subsets from `/public/fonts`
with `@font-face` rules in `src/app/globals.css`. This keeps `next build` free of
outbound network calls and removes a third-party request from the critical path.

---

## Deploying (Vercel)

1. Import the repository into Vercel (framework preset: Next.js).
2. Set the environment variables — see `.env.example`. Required for lead
   delivery: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. Recommended:
   `NEXT_PUBLIC_SITE_URL=https://sps.uz` plus the analytics IDs.
3. Deploy. No build step needs a database; `npm run build` regenerates nothing.

Full runbook: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) ·
pre-launch checks: [`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md).
