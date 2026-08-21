# SPS Plast — CLAUDE.md

## Overview

SPS Plast is a bilingual (uz/ru) B2C/B2B e-commerce platform for construction molds and
related products (thermopanels, paving/curb molds, concrete molds, etc.), built with
Next.js 14 App Router. It includes a public storefront, a guest checkout flow, a B2B
wholesale lead form, an admin panel (CRUD for products/categories/orders/leads), and
integrations with Click/Payme payment providers, amoCRM, and Telegram order notifications.

## Tech Stack

- **Framework**: Next.js 14 (App Router), TypeScript
- **Database/ORM**: PostgreSQL via Prisma (`@prisma/client` v5) — no `migrations/` folder,
  schema is applied with `prisma db push`
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Validation**: Zod
- **Storage**: Local filesystem (`/public/uploads`, dev only) or S3-compatible object
  storage (AWS S3 / Cloudflare R2) via `@aws-sdk/client-s3`, selected by `STORAGE_PROVIDER`
- **Auth**: Custom JWT/session cookie auth (bcryptjs password hashing) for the admin panel
- **Deploy target**: Vercel

## Folder Structure

```
src/
  app/
    [lang]/            # public storefront, locale-prefixed routes (uz, ru)
    admin/              # admin panel pages (products, categories, orders, leads, settings)
    api/                # route handlers (admin, products, categories, orders, leads,
                         # payments, cron, health)
    sitemap.ts          # dynamic sitemap (must not fail the build if DB is unreachable)
    robots.ts
  components/           # UI and feature components
  dictionaries/         # i18n dictionaries (uz/ru)
  lib/
    db.ts               # Prisma client singleton
    env.ts               # zod-validated environment config
    auth.ts, csrf.ts, rateLimit.ts
    amocrm/              # amoCRM OAuth + sync client
    payments/            # Click and Payme provider implementations
    integrations/        # outbox job queue (IntegrationJob processing)
    storage/              # local/S3/R2 storage abstraction
    services/             # domain services (product, category, order, attribute, settings)
prisma/
  schema.prisma          # PostgreSQL datasource + models (no migrations/ dir)
  seed.js
docs/                    # architecture, deployment, integrations, database docs
scripts/                 # backup/export/import/verify-production scripts
```

## Environment Variables

Database:
- `DATABASE_URL`
- `DIRECT_URL`

Auth & security:
- `AUTH_SECRET`
- `INTEGRATION_ENCRYPTION_KEY`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

Site config:
- `NEXT_PUBLIC_SITE_URL`
- `CRON_SECRET`
- `STORAGE_PROVIDER`

Telegram:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

S3 / R2 media storage:
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `S3_PUBLIC_URL`

Analytics:
- `NEXT_PUBLIC_GTM_ID`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_META_PIXEL_ID`

amoCRM:
- `AMOCRM_SUBDOMAIN`
- `AMOCRM_CLIENT_ID`
- `AMOCRM_CLIENT_SECRET`
- `AMOCRM_REDIRECT_URI`

Click / Payme:
- `CLICK_MERCHANT_ID`
- `CLICK_SERVICE_ID`
- `CLICK_SECRET_KEY`
- `PAYME_MERCHANT_ID`
- `PAYME_SECRET_KEY`

See `.env.example` for the full annotated list.

## Deploy Process (Vercel)

1. Set all required env vars above in the Vercel project (Production/Preview).
2. `npm install` triggers `postinstall` → `prisma generate`, so the Prisma Client is
   always regenerated even when Vercel restores a dependency cache.
3. `npm run build` runs `prisma generate && next build` as a second safety net.
4. Schema changes are applied with `npx prisma db push` (there is no `migrations/`
   folder — this project does not use `prisma migrate`).
5. Seed data (admin user, sample content) via `npm run db:seed` (`prisma/seed.js`),
   using `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

## Known Pitfalls

- **Vercel dependency cache + Prisma Client**: if `postinstall`/`build` don't call
  `prisma generate`, Vercel can restore a cached `node_modules` without a fresh
  Prisma Client, causing `PrismaClientInitializationError` at request time. Both
  `postinstall` and `build` run `prisma generate` to guard against this.
- **Never make the build depend on the database**: any code that runs at build time
  (e.g. `src/app/sitemap.ts`) must not throw if the DB is unreachable — wrap DB calls
  in try/catch with safe fallbacks (empty arrays), and mark routes that must always
  run per-request (not prerendered) with `export const dynamic = 'force-dynamic'`.
- **No `prisma/migrations/` folder**: schema is synced with `prisma db push`, not
  `prisma migrate deploy`. Don't introduce a migrations workflow without updating
  the deploy process everywhere it's documented.
- **Datasource is PostgreSQL**, not SQLite — `DATABASE_URL` must point at Postgres
  (`DIRECT_URL` is used for direct/non-pooled connections, e.g. with pgbouncer).

## Common Commands

```bash
npm run dev              # local dev server
npm run build             # prisma generate && next build
npm run typecheck         # tsc --noEmit
npm run lint               # next lint
npm run test                # node --test tests/*.test.js
npm run db:push             # apply prisma/schema.prisma to the database
npm run db:seed              # run prisma/seed.js
npm run db:studio             # open Prisma Studio
npm run verify:production      # scripts/verify-production.js
```
