# SPS Plast — CLAUDE.md

## Overview

Bilingual (uz/ru) **lead-generating website** for SPS, an Uzbek manufacturer of
concrete molds (bruschatka / bordyur / plitka qoliplari) and facade decor.

Business model: there is **no shop**. A visitor fills a short form
(“Zayafka berish”), the message goes to the company's **Telegram group**, and a
manager calls back. Everything else — catalog, blog, projects, FAQ — exists to
build trust and produce that call.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19, TypeScript
- **Styling**: Tailwind CSS · **State**: Zustand (wishlist/compare/recently viewed only)
- **Validation**: Zod · **Fonts**: self-hosted Inter (`/public/fonts`)
- **Data**: static JSON — `src/data/catalog.json` (generated, committed). No database.
- **Deploy target**: Vercel

## Folder Structure

```
src/
  app/[lang]/            # public site, locale-prefixed (uz, ru)
  app/api/leads          # the ONLY public write endpoint (Telegram)
  app/api/health         # env/Telegram health report
  components/            # layout, product, catalog, lead, ui
  dictionaries/          # i18n dictionaries (uz/ru)
  data/catalog.json      # generated static catalog (192 products, blog, projects)
  lib/
    catalog/             # synchronous catalog access (products, categories, content)
    faq.ts               # bilingual FAQ entries + FAQPage JSON-LD helper
    categoryContent.ts   # per-category SEO copy + FAQ (P1-7)
    telegram.ts          # Telegram bot sender + HTML escaping
    rateLimit.ts         # in-memory IP rate limiter for /api/leads
    phone.ts             # +998 normalization/validation
    analytics.ts         # GTM/GA4/Yandex Metrica/Meta Pixel event layer
    env.ts               # env sanity checks (warnings, not crashes)
catalog_build/           # source data used by the catalog generator
data/                    # molds-2026.json, content-2026.json, category-seo-2026.json
media-src/               # master images (masters/ is git-ignored), public/media build
scripts/build-static-catalog.js   # regenerates src/data/catalog.json
scripts/build-media.py            # regenerates public/media from masters
tests/                   # node:test suites (catalog contract, platform, content)
docs/                    # architecture, deployment, security, design system, audit, log
docs/archive/            # eski (savat/checkout davri) hujjatlar — tarix uchun
```

## Environment Variables

Only the Telegram pair is required for the lead flow to actually deliver:

- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

Site/analytics (optional, all env-gated):

- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`,
  `NEXT_PUBLIC_YANDEX_METRICA_ID`, `NEXT_PUBLIC_META_PIXEL_ID`

There is **no `DATABASE_URL`** — see `.env.example`.

## Data Pipeline

```bash
npm run catalog:build   # catalog_build + data/*.json → src/data/catalog.json
npm run catalog:check   # build-time guard: fails if the JSON is stale
npm run media:build     # masters → public/media (blog covers, projects, production)
```

`npm run catalog:check` runs as part of `npm run build`, so a stale catalog
fails the build instead of shipping outdated products.

## Known Pitfalls

- **Never reintroduce a database.** Prisma, seeds and the admin panel were
  removed deliberately (see `docs/OPTIMIZATION-LOG.md`, Batch 3). The site must
  build and render with zero env vars.
- **Only `/api/leads` and `/api/health` may exist** under `src/app/api` — a test
  enforces this (`tests/platform.test.js`).
- **`src/data/catalog.json` is generated** — edit the sources in `catalog_build/`
  and `data/`, then run `npm run catalog:build`. Editing it by hand makes
  `npm run catalog:check` fail.
- **Media masters are not in git**: `media-src/masters/` is git-ignored
  (169 PNGs, ~306 MB). Only the optimized copies under `public/media/` and
  `public/catalog/` are committed.
- **Fonts are self-hosted** (`globals.css`, `/public/fonts`). Do not switch back
  to `next/font/google` — builds without outbound internet would fail.
- **P0-8: never publish an unproven number.** Discounts, delivery tariffs and
  durability figures must either be verifiable or phrased as
  “modelga/hajmga bog‘liq”. This is enforced by review, not by a test.
- **Product/blog/category pages are statically prerendered** via
  `generateStaticParams()`; keep them free of request-time APIs.

## Common Commands

```bash
npm run dev            # local dev server
npm run build          # catalog:check + next build
npm run typecheck      # tsc --noEmit
npm run lint           # next lint
npm test               # node --test --experimental-strip-types tests/*.test.js
npm run catalog:build  # regenerate src/data/catalog.json
npm run media:build    # regenerate public/media from masters
```
