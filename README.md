# SPS Plast — E-commerce Platform

Bilingual (uz/ru) B2C + B2B storefront for **SPS**, a Uzbekistan-based manufacturer of
concrete molds (bruschatka / bordyur / plitka qoliplari) and facade decor.

Built with Next.js 15 (App Router) + React 19, TypeScript, Prisma (PostgreSQL), Tailwind CSS
and Zustand. Deployed to Vercel.

> Deep documentation lives in [`docs/`](docs) and [`CLAUDE.md`](CLAUDE.md) (project overview,
> env vars, deploy process, known pitfalls).

---

## Features

- **Storefront** — home, catalog with faceted filters, product detail with variants,
  search, blog, projects, company pages.
- **Commerce** — guest checkout, cart/wishlist/compare (persisted in `localStorage`),
  bulk-tier pricing (10+ = −5 %, 50+ = −10 %), promo codes, Click/Payme payment
  integration, order tracking.
- **B2B** — wholesale lead form, one-click order modal, amoCRM sync.
- **Admin panel** — products, variants, categories, attributes, orders, leads, media
  uploads, integration settings.
- **PWA** — manifest, service worker, install prompt.
- **i18n** — `uz` / `ru`, prerendered per locale.

---

## Getting started

```bash
npm install            # postinstall runs `prisma generate`
cp .env.example .env   # then fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET, …

npx prisma db push     # apply prisma/schema.prisma (no migrations folder)
npm run db:seed        # seed admin user + sample content

npm run dev            # http://localhost:3000
```

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate && next build` |
| `npm start` | Production server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (`next lint`) |
| `npm test` | Unit tests (`node --test tests/*.test.js`) |
| `npm run db:push` / `db:seed` / `db:studio` | Prisma schema / seed / studio |
| `npm run verify:production` | Full pre-deploy check (prisma validate, tsc, lint, tests, docs) |
| `npm run fonts:sync` | Refresh the vendored Inter woff2 files |

---

## Architecture notes

### Pricing has exactly one source of truth

`src/lib/pricing.ts` holds the bulk tiers and the promo-code table. The storefront
(cart drawer, cart, checkout) and `createOrderServerSide` both call it, so the total a
customer sees is the total that gets written to `Order.totalAmount`. Promo codes are
re-validated server-side and stored as `Order.couponCode` / `Order.discountAmount` — a
discount computed in the browser never reaches the database.

### Async request APIs

Next.js 15 makes `params`, `searchParams` and `cookies()` promises:

```tsx
// server component / route handler
const { lang } = await params;

// 'use client' page
const { lang } = React.use(params);
```

`[lang]/layout.tsx` exports `generateStaticParams()` for the closed locale set, which
keeps the marketing pages prerendered as static HTML instead of being server-rendered on
every request.

### Security

- `src/middleware.ts` blocks cross-origin mutations against every cookie-authenticated
  `/api` route (CSRF).
- Per-IP rate limits on admin login, order creation and lead creation.
- Order payloads are validated by `src/lib/schemas/order.ts` (bounded line count,
  integer quantities, length caps) before any query runs.
- Passwords are bcrypt-hashed; sessions are random tokens stored as SHA-256 hashes in
  HttpOnly cookies; admin actions are written to `AuditLog`.

See [`docs/SECURITY.md`](docs/SECURITY.md).

### Fonts are self-hosted

Inter (variable, `wght` axis) ships as two woff2 subsets from `/public/fonts` —
latin (48 KB) and cyrillic (19 KB) — with `@font-face` rules in `src/app/globals.css`.
This keeps `next build` free of outbound network calls (Google Fonts is fetched **at
build time** by `next/font/google`, which fails in air-gapped CI) and removes a
third-party request from the critical path. Update the files with `npm run fonts:sync`.

---

## Deploying (Vercel)

1. Set every variable from [`.env.example`](.env.example) in the Vercel project.
   `DATABASE_URL` is the pooled URL; `DIRECT_URL` is the non-pooled one used by
   `prisma db push`.
2. `npm install` → `postinstall` runs `prisma generate`; `npm run build` runs it again.
3. Apply schema changes with `npx prisma db push` (there is **no** `migrations/` folder).
4. Seed with `npm run db:seed` using `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

Full runbook: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) ·
pre-launch checks: [`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md).
