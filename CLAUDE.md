# SPS Plast — CLAUDE.md (redesign 2027)

## Overview

Uch tilli (uz/ru/en) **lead-generating website** for SPS, an Uzbek manufacturer of
plastic molds for concrete paving slabs, facade, fence and decor elements.
Business model: **no shop**. A visitor leaves a **zayafka** (request) → the message
goes to the company's Telegram group → a manager calls back with price and mold count.
Prices, cart and checkout do not exist anywhere on the site.

The site is being rebuilt (2026 → 2027) from the approved design package in
`docs/design-handoff/`. **Single source of truth: `docs/design-handoff/HANDOFF.md`**;
visual reference `screens/`, exact CSS/sizes `source/*.dc.html` + `source/site.css`
(style B override at the end of `site.css`). On conflict: HANDOFF → screens → source.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19, TypeScript
- **Styling**: plain CSS only (`src/app/globals.css`, design tokens = HANDOFF §2, style B).
  **Tailwind removed** (no `tailwind.config.js`, no `postcss.config.js`).
- **Font**: **Onest** (400/500/600 via variable wght), self-hosted woff2 latin + cyrillic
  in `public/fonts/` (from `@fontsource-variable/onest`, OFL 1.1). `next/font/google` is banned.
- **State**: client-only localStorage lists `sps_request` / `sps_compare`
  (`src/lib/store/spsLists.ts`, memory fallback when storage is blocked).
- **Validation**: Zod (leads API) · **Catalog data**: static JSON (public site stays static).
- **Database (Stage 7+, user decision 2026-10-18)**: PostgreSQL (Neon/Supabase) via Drizzle ORM
  (`postgres` driver), only for leads + admin panel + rate limit. `DATABASE_URL` optional in dev
  (site falls back to Telegram-only leads). Tests use PGlite (`@electric-sql/pglite`).
- **Deploy target**: Vercel.

## Folder Structure

```
data/models-2027.json        # GENERATED catalog (152-model target); do not hand-edit
data/image-jobs-2027.json    # GENERATED source→webp job list
docs/data-questions.md       # GENERATED business question list (nulls live here)
docs/design-handoff/         # HANDOFF.md, PROMPT.md, screens/, source/, images/, data-sources/
scripts/extract/             # build_models_2027.py, build_images_2027.py (python3 + ImageMagick)
scripts/validate-models-2027.mjs   # XATO (exit 1) / OGOH (business-pending) split
src/app/[lang]/              # public site, locale-prefixed (uz, ru, en)
src/app/api/leads|health|track  # the ONLY /api route handlers (test-enforced); track = visit beacon
src/app/media/[file]         # admin-uploaded images from DB (/media/{sha}.webp, immutable cache)
src/data/site.generated.ts   # build-time snapshot from DB (scripts/export-snapshot.mjs); MUST be `null` in git
scripts/export-snapshot.mjs  # runs first in `npm run build`: DB → published products/sections/settings
scripts/catalog-import.ts    # one-off: data/models-2027.json + data/termopanel-2027.json → DB
data/termopanel-2027.json    # GENERATED from xlsx sheet 6 (scripts/extract/build_termopanel_2027.py)
src/app/admin/               # admin panel (login, dashboard, leads CRM, CSV, users, analytics, SEO, content CMS) — noindex
src/app/admin/seo|content|analytics/  # SEO center (meta/H1/noindex, 301, IndexNow, health), text CMS, API reports
src/server/reports/          # Google (JWT RS256: Search Console, GA4), Yandex (Metrica, Webmaster), IndexNow clients
src/data/redirects.generated.json  # admin 301s, written by export-snapshot; MUST be `[]` in git
src/app/indexnow-key.txt/    # IndexNow key file (static, from admin setting `indexnow_key`)
src/server/                  # DB layer: db/schema.ts, db/client.ts, leads.ts, auth.ts, session.ts (Next glue)
drizzle/                     # GENERATED SQL migrations (`npm run db:generate`), applied by `npm run db:migrate`
vercel.json                  # buildCommand: `npm run db:migrate:deploy && npm run build` (overrides the dashboard)
.nvmrc                       # Node version pin (also package.json `engines`, CI's node-version-file)
docs/ADMIN.md                # admin setup (Neon/Supabase, migrate, first admin) + security notes
docs/ROADMAP-2027.md         # gap analysis + stages 7–12
src/components/site/         # new layer: SiteHeader, HeaderClient, SiteFooter, LangSwitch, icons, MotionLayer
src/lib/siteContent.ts       # admin numbers/contacts → `{years}` `{countries}` `{contactLine}`… tokens in getPages()
src/lib/integrations.ts      # admin settings fields (integrations, contacts, stats) + validation regexes
public/admin-ai/             # onnxruntime-web + u2netp.onnx (16 MB) — admin-only browser background removal
src/dictionaries/ui/{uz,ru,en}.ts   # UI copy for the new layer (uz = type source)
src/dictionaries/pagesServer/      # server-only page copy: `seo` (tag/export landings) + `privacy` → getSitePages()
src/lib/catalog2027.ts       # synchronous catalog access + derived filter fields + calculator
src/lib/contacts2027.ts      # contacts per HANDOFF §1 (single source for new layer)
src/lib/store/spsLists.ts    # request list + compare list (localStorage)
src/lib/ui.ts                # getUi(lang), pluralModels(), formatNumber()
src/lib/seo.ts               # metadata + hreflang + JSON-LD builders (uz/ru/en, no price)
src/app/sitemap.ts           # 276 URLs: (6 fixed + 4 non-empty sections + 7 tags + 8 export countries + 67 models WITH an image) × 3 langs
src/lib/seoPages.ts          # SEO landing logic: TAG_DEFS (MIN_TAG_MODELS=6), EXPORT_COUNTRIES (8)
src/components/seo2028/SeoBlocks.tsx  # TagChips, CountriesStrip, PavingGuide (server components)
src/app/robots.ts            # allow all; disallow /api/, /*/compare, /*/request
src/components/site/JsonLd.tsx     # server-only <script type="application/ld+json"> renderer
src/server/testimonials.ts  # customer reviews admin CRUD (list/save/delete), "trust signals" prep (3.3)
src/app/admin/testimonials/ # admin "Sharhlar" page + TestimonialForm.tsx + actions.ts
src/lib/testimonials2027.ts # getTestimonials() (snapshot, empty-safe) + lang fallback + aggregateRating()
src/lib/video2027.ts        # factory_video_url setting → safe YouTube/Vimeo embed URL (ID-only, never raw src)
src/components/site/Testimonials.tsx  # home-page reviews section, renders null when empty
src/components/site/FactoryVideo.tsx  # production-page video embed, renders null when unset
scripts/redirects-2027.json  # GENERATED 301 map (436 entries) — read by next.config.js
scripts/extract/build_redirects_2027.py  # generator: legacy catalog × models-2027 name match
scripts/lib/routes.mjs       # audit routes (AUDIT_ROUTES) + screenshot plan (SHOT_PLAN) + viewports
scripts/lib/dom-rules.mjs    # the SEO/DOM rule set itself (unit-tested by tests/audits2027.test.js)
scripts/audit-seo-dom.mjs    # jsdom audit: meta, hreflang, headings, links, forms, JSON-LD, weight
scripts/audit-a11y.mjs       # axe-core (WCAG 2.1 AA) audit over the same routes
scripts/visual/compare-screens.mjs  # Playwright: 390/1440/360 shots + overflow + tap targets + pixelmatch
scripts/visual/lighthouse.mjs       # Lighthouse CLI runner with HANDOFF §7 budgets
.github/workflows/checks.yml        # CI: gates + audits + Playwright shots + Lighthouse (artifacts)
docs/audits/                 # GENERATED reports (seo-dom-*, a11y-*, visual-*, lighthouse-*)
docs/checks.md               # how to verify HANDOFF §7 acceptance criteria (what runs where)
docs/unresolved-questions.md # open business questions + accepted deviations with reasons
docs/legacy/                 # archive of the deleted 2026 data (catalog-2026.json, molds-2026.json)
tests/helpers/load-alias.mjs # runs `@/`-aliased TS in Node (writes .tmp-tests/<pid>/, gitignored)
screens-actual/              # GENERATED screenshots from `npm run shots` (gitignored)
media-src/                   # SOURCE photos the image pipeline reads (factory/, studio/, pdf/ — 86 MB)
media-src/studio-2026/       # 44 archived 2026 studio JPGs (mold + quyma) for jobs that say public/catalog/2026/
media-src/clean/             # bg-removal masks (PNG) + manifest.json — committed, see images:bg
public/catalog/2027/         # generated WebP (scene 1400/720w, mold/tile 800w)
public/catalog/pdf/          # PDF catalog (2026, uz) — header download link
public/fonts/                # onest-latin/cyrillic-wght-normal.woff2
```

The old 2026 layer was **deleted in Stage 5**: `src/components/{layout,catalog,product,
projects,ui,lead}`, `src/lib/{catalog/*,constants,hooks,blogContent,faq,slug,utils}`,
the old stores, `src/dictionaries/{uz,ru}.json`, the routes
`[lang]/{about,blog,projects,wishlist,search,returns,delivery-payment,how-to-order,terms,product}`,
`src/app/catalog-preview`, `scripts/{build-static-catalog.js,build-media.py,static/}`,
`data/{content-2026,category-seo-2026}.json`, `public/{catalog/2026,media,search-index.json,manifest.json}`.
Everything a visitor could still hit is answered by a 301 (`scripts/redirects-2027.json`).
`src/components/layout/` keeps only `HtmlLangSync.tsx` and `SWCleanup.tsx` (both still used).

## Routes (redesign 2027, HANDOFF §4)

| Page | Route |
|---|---|
| Home | `/{lang}` |
| Catalog / section | `/{lang}/catalog`, `/{lang}/catalog/{section}` |
| Model | `/{lang}/catalog/{section}/{slug}` |
| Compare | `/{lang}/compare` |
| Request list | `/{lang}/request` |
| Wholesale & partners | `/{lang}/partners` |
| Production & export | `/{lang}/production` (`#eksport`) |
| Contact | `/{lang}/contact` |
| Privacy | `/{lang}/privacy` |
| Tag landing (SEO) | `/{lang}/catalog/{section}/tag/{tag}` (only tags with ≥ 6 models) |
| Export country (SEO) | `/{lang}/export/{country}` (8 countries, `EXPORT_COUNTRIES`) |
| 404 | `not-found` (root + `[lang]`) |
| Sitemap / robots | `/sitemap.xml` (rewrite → `/sitemap`), `/robots.txt` |

Section slugs: `paving|facade|fence|decor|bench` → data sections
`trotuar|fasad|zabor|dekor|skameyka` (mapping lives in `SECTION_SLUGS`).
**Every catalog link must go through `SECTION_SLUGS`** — the uz section name is not a
route (`/uz/catalog/trotuar` 404s); `tests/platform.test.js` test 11 enforces it.

`/compare` and `/request` are `noindex` (user-state pages) and are absent from the
sitemap; a section with zero models (`fence`, until the zabor data arrives) keeps its
route but is left out of the sitemap — thin content should not be indexed.

## Business Rules (never break)

1. **No prices, no cart, no checkout.** Only "zayafka". Terms: "Zayafka",
   "Zayafka qoldirish", "Zayafka ro'yxati", "Ulgurji va hamkorlik".
2. **The word "yaratish" (any form) is banned in Uzbek copy** — use "ishlab chiqarilgan".
   Enforced by `tests/models2027.test.js` and `tests/foundation2027.test.js`.
3. Approved numbers only: 20 yil tajriba, 18 000 m²/oy, 740+ obyekt, 8 eksport davlati,
   catalog counts from `data/models-2027.json` (never hardcode 152 in UI).
4. Business-pending values are **never shown as `[...]` on the site** (decision 2026-10-18,
   UI audit: they made the site look fake). Use honest neutral copy ("Menejer bilan
   kelishiladi" / "По договорённости" / "By agreement") or omit the row; keep the open
   question in `docs/data-questions.md` / `docs/unresolved-questions.md`.
   `tests/pages2027.test.js` test 5 fails on any visible `[PLACEHOLDER]`.
5. Languages uz (default) / ru / en; RU model names Cyrillic, codes identical everywhere.
6. Mobile-first: 390 px matches `screens/mobile` first, then desktop 1440 px.
7. Secrets only via env: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
8. **No price anywhere — including structured data.** `jsonLdProduct()` emits an `Offer`
   without `price`/`priceSpecification` (`itemOffered: Service`, `priceCurrency: UZS`);
   `tests/seo2027.test.js` test 9 fails if a price field ever appears.

## Data Pipeline

```bash
npm run models:build   # xlsx (+2026 images) -> data/models-2027.json + image jobs + questions
npm run models:images  # ImageMagick -> public/catalog/2027/*.webp, prunes failed refs to null
npm run models:check   # validator: XATO exit 1, OGOH = business-pending
npm run redirects:build # regenerate scripts/redirects-2027.json from docs/legacy/catalog-2026.json
npm run images:variants # sharp: container-ratio crops (1:1/4:3/16:9) -> public/images/site/*-<ratio>.webp
npm run images:bg      # LOCAL rembg (isnet-general-use) -> media-src/clean/*.png masks + transparent mold/tile WebP
```

**Background removal (mold/tile cutouts).** Every `*-mold-*.webp` / `*-tile-*.webp` is a
transparent square WebP (object trimmed, centred, 7% padding, 800px, q82, alpha eroded 1px +
feathered). The masks live in `media-src/clean/<dst-name>.png` (+ `manifest.json`: method,
status, notes) and are **committed**, so `npm run models:images` rebuilds the cutouts with
ImageMagick only — rembg is needed only to regenerate a mask
(`pip install --user rembg onnxruntime`; models download from GitHub releases, nothing is
uploaded anywhere). Shared code: `scripts/extract/cutout_2027.py`. Per-file tweaks go in
`OVERRIDES` in `remove_bg_2027.py`; the 22 yellow-board 2026 studio molds use a colour key
(isnet keeps the yellow board). `*-scene*.webp` and `public/images/site` keep their
backgrounds. Image jobs whose `src` still says `public/catalog/2026/...` resolve to the
archived copies in `media-src/studio-2026/` (`resolve_src()`); a job with no source but an
existing WebP (the 2026 `-env` scenes) is kept, not nulled. Report:
`docs/audits/bg-removal-2026-10-18.md` (contact sheets: `npm run images:bg -- --compose --sheets` -> `docs/audits/bg-removal/*.jpg`, gitignored).

## Visuals & measurement (Stage 6)

```bash
npm run shots          # Playwright: 28 screen @390/1440 + 360px scroll check -> screens-actual/ + docs/audits/visual-*.md
npm run lighthouse     # 8 targets x {mobile,desktop}, 3 runs each, MEDIAN -> docs/audits/lighthouse-*.md
```

- `SHOTS_MAX_TOTAL_MS` / `SHOTS_MAX_SHOT_MS` cap the shots step (a hung page must
  not stall CI); `LH_RUNS` changes repeats (median-of-3 because single CI runs
  swing ±10 points). CI uses `LH_RUNS=1` on pull requests (fast) and 3 on pushes to `main`. Both scripts exit 0 with a hint when no Chromium exists
  (agent sandbox) — real numbers come from CI or a machine with Chrome.
- **Playwright viewports**: `width/height` must live inside a `viewport` object
  (`VIEWPORTS` in `scripts/lib/routes.mjs`); flat options are silently ignored
  and every "mobile" shot becomes 1280×720. Width assertions run only after
  `goto` — on `about:blank` mobile emulation reports 980px (no meta viewport).
- **Pre-installed Chromium** (cloud sandbox: `/opt/pw-browsers/chromium-*/chrome-linux/chrome`)
  that does not match the Playwright version: `PW_CHROMIUM_PATH=<path> npm run shots`.
- **Restart the server after every `npm run build`**: a running `next start`
  keeps serving the previous build and probes/audits then measure stale HTML.
- Pixel diffs vs `screens/` are directional (mock content, JPG refs, DPR);
  hard gates are: no horizontal scroll (390/1440/360) and interactive states
  opening (menu, filter sheet, quick-lead). Methodology: `docs/unresolved-questions.md` §C.

`npm run build` = `models:check` + `next build` (the old `build-static-catalog.js --check`
step is gone with the 2026 layer). `public/catalog/2026` (18 MB of served JPGs) was
deleted in Stage 5; the **source** photos the pipeline reads live in `media-src/`
(tracked: `factory/` 37 MB, `studio/` 3.4 MB, `pdf/` 46 MB) — `build_images_2027.py`
takes its inputs from there, so `npm run models:images` stays reproducible from a clean
checkout. What is still missing from the repo are the 2027 assets listed in
`docs/data-questions.md` (final catalog PDFs and the render archives).

Missing sources (ask business, see `docs/data-questions.md`): `SPS_katalog_A.pdf`
(+ `_RU`, `_EN`) and `SPS_blender_yakuniy*.zip` / `bgeraser_results_*.zip`.
Until they arrive: ru/en names are `null` (UI falls back to uz), section split and
counts come from the Excel sources, images from the 2026 studio set + sheet-5 DSC map.

## Environment Variables

Required for lead delivery: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
Canonical domain: **`https://spsplast.com`** (decision 2026-11-01, `docs/SEO-2028-RU.md` §0 — `.uz`
ccTLD geo-targets Uzbekistan and hurts RU/KZ rankings); it is the `SITE_URL` default and old `sps.uz` 301s to it.
Optional, env-gated: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GTM_ID`,
`NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_YANDEX_METRICA_ID`, `NEXT_PUBLIC_META_PIXEL_ID`.
`DATABASE_URL` (Postgres) is required in production for lead storage and `/admin`; see `docs/ADMIN.md`.

## Known Pitfalls

- **Audit 2026-11-02 fixes (`tests/auditFixes2611.test.js`)** — keep them:
  - `/api/leads` returns **503 `not_delivered`** in production when neither the DB nor Telegram took the
    lead (never a silent `ok`); forms then show call/Telegram/WhatsApp buttons (`LeadFeedback.tsx`).
    Telegram/DB/deploy-hook calls have timeouts.
  - Phones: `normalizePhone(input, dial?)` — `8 701…` → `+7`, local `0…` only with the form's country
    code (`dial`, sent by PartnersForm/export pages). Known codes are length-checked.
  - Lead forms are `noValidate` + `checkLead()` (our own uz/ru/en messages, not the browser's), success
    blocks get focus + scroll (`useRevealOnShow`).
  - **No `[lang]/loading.tsx`**: on static pages it streamed every page as a skeleton inside `<main>` with
    the real H1 in a hidden `<div>`. `audit:seo` now fails if the H1 is outside `<main>` or under `[hidden]`.
  - Catalog `<title>`s come from `src/lib/seoTitles.ts` + `getUi().seo.sectionMolds/modelMold`
    ("Формы для тротуарной плитки …", "… qoliplari", "… molds"), ≤ 53 chars before " · SPS Plast".
  - Admin 301 sources must not contain `( ) * + ? :` (path-to-regexp), and `/*`, `/{lang}/*` are refused;
    `export-snapshot.mjs` drops unsafe rows again at build time (`safeRedirect`).
  - Deps: next 15.5.28+, zod 4, drizzle-orm 0.45+, `overrides.postcss`; CI runs
    `npm audit --omit=dev --audit-level=high`, Dependabot is weekly.
- **Audit 2026-11-02, stage 2 (`tests/auditStage2.test.js`, `tests/leadsE2E.test.js`)** — keep them:
  - **`getPages()` vs `getSitePages()`**: `pages/{lang}.ts` is shipped to the browser by client components
    (ModelClient, RequestClient, CompareClient, PartnersForm). SEO-landing copy (`seo`) and `privacy` live in
    `src/dictionaries/pagesServer/` and are read only via `getSitePages()` (server). Never import `pagesServer` in
    a `'use client'` file. CMS keys stay `pages.seo.*` / `pages.privacy.*`. This split saved ~7 KB gzip per page.
  - Models **without any image** are `noindex, follow` and absent from the sitemap (`autoNoindex` in `sitePaths.ts`);
    they come back automatically once an image is published. The model page then shows a "WhatsApp'da so'rash" CTA.
  - Model tab panels are always rendered (`hidden` when inactive) so tab/FAQ copy is in the SSR HTML;
    `[role='tabpanel'][hidden]` has `display:none !important`. Section pages end with `ModelIndex` (all models).
  - Search matches the **displayed** names too (`modelName(m,'ru'|'en')`, ё→е): `/ru/catalog?q=монако`.
  - WhatsApp: hero + footer links, mobile floating `.wa-fab` (inside `<footer>` for the `region` landmark rule,
    hidden on model pages where `.mbar` has its own WA button with the model name).
  - Telegram message is built in `src/server/leadMessage.ts` (route + admin "qayta yuborish"). Rate-limit keys store an
    HMAC of the IP (`src/server/privacy.ts`, `IP_HASH_SECRET`), rows older than 24 h are purged; admins can anonymize a lead.
  - Admin uploads are shrunk in the browser to ≤ 3.5 MB WebP (`shrinkImage.ts`, Vercel 4.5 MB body limit).
  - Publishing: on Vercel Production with `DATABASE_URL` the snapshot is required (`SNAPSHOT_REQUIRED=0` to opt out);
    optional `VERCEL_API_TOKEN` + `VERCEL_PROJECT_ID` show the last deploy state; a published product's slug/section
    change auto-creates 3 × 301 (`redirectMovedProduct`).
  - JSON-LD Organization/WebSite are in `[lang]/layout.tsx` (localized description/address from `CONTACTS_2027`).
  - CI: `defaults.run.shell: bash` (pipefail); audit/shots steps continue for the report, the last step fails the job.
  - Only real SPS images: the port/container stock photos were deleted (export map + mold photo instead).

- **Audit 2026-11-02, stage 3 (`tests/auditStage3.test.js`)** — keep them:
  - **CSP**: `next.config.js` sets a site-wide CSP (prod only) with `'unsafe-inline'` for script/style
    (pages are statically prerendered — no per-request nonce is possible there) but a real allowlist for
    `connect-src`/`img-src`/`script-src` (only the analytics hosts actually used) plus `object-src 'none'`,
    `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`. **`/admin` REPLACES this entirely**
    (verified live: only one `Content-Security-Policy` header reaches the browser there) with a stricter,
    self-contained, nonce-based policy from `src/middleware.ts` (`script-src 'self' 'nonce-x' 'strict-dynamic'`,
    no `'unsafe-inline'` for scripts — admin has zero hand-written `<script>`, only Next's own hydration
    scripts, which Next auto-nonces when it sees the nonce in the *request* header, not just the response).
    Don't assume the two CSPs merge — if you touch either, re-verify with a real browser (zero console/CSP
    errors) that admin pages still hydrate, since a nonce-wiring mistake silently breaks every admin form.
  - `/api/leads` and `/api/track` reject cross-site writes via `src/lib/requestGuard.ts`'s `isCrossOrigin()`
    (Origin vs. Host, not a hardcoded domain — works on Preview/localhost too) and read the body through
    `readLimitedText()` (a real streamed byte cap, not a `Content-Length` check) instead of `req.json()`
    directly; `/api/leads` also requires `Content-Type: application/json` (blocks the classic `text/plain`
    CORS-preflight-bypass trick). Honeypot/validation behavior is unchanged.
  - `/api/health`'s detailed body (Telegram/DB/analytics config, error text) is gated behind an optional
    `HEALTH_CHECK_TOKEN` (`Authorization: Bearer` or `?token=`); unset (default) keeps today's open behavior.
    The admin Settings page link appends the token server-side when configured. Uptime monitors only need
    `status` + the HTTP code, both still returned without a token.
  - Admin login rate-limits by **IP and by e-mail** (`ipKey('login_email', normalizeEmail(...))`), so a
    botnet can't brute-force one account by rotating IPs — the IP limit alone didn't stop that.

- **Audit 2026-11-02, stage 3.2 (mobile & a11y)** — keep them:
  - **`[lang]` catch-all for truly unmatched paths** (`src/app/[lang]/[...slug]/page.tsx` +
    co-located `not-found.tsx`): without it, a path matching no file segment at all (e.g.
    `/ru/xato-manzil`) skipped `[lang]/layout.tsx` entirely and fell to the root
    `src/app/not-found.tsx` — always Uzbek, wrong status metadata, outside the `[lang]` tree.
    **Must have `generateStaticParams` returning `[]` AND `dynamicParams = false`** — with the
    default (`dynamicParams: true`, no static params), this sibling dynamic segment breaks the
    SSR of *other*, already-correct dynamic 404s elsewhere under `[lang]` (e.g.
    `catalog/[section]/[slug]`'s own not-found lost `<head>`/`h1`/`<main>` — confirmed by a clean
    before/after rebuild, not a caching artifact). Has its own `generateMetadata` (noindex, per-lang
    title/description) so `tests/seo2027.test.js` test 12's `pageMetadata(` scan passes.
  - **Known pre-existing limitation, not introduced by the above**: *any* `notFound()`-triggered
    page under `[lang]` (new catch-all or the long-existing `catalog/[section]/[slug]`) renders
    without `SiteHeader`/`SiteFooter` and with Uzbek `NotFoundBody` text regardless of locale —
    confirmed on the untouched `/ru/catalog/paving/<invalid-slug>` too. `[lang]/not-found.tsx` is a
    client component (Next doesn't pass `params` to `not-found.tsx`) and its `useParams()` doesn't
    resolve the matched segment in this render path, SSR or post-hydration. Not caught by
    `audit-seo-dom.mjs`/`audit-a11y.mjs` (no rule checks 404 body text language or header presence).
    Fixing properly needs a lang-context provider set by the layout, not a `useParams()` read —
    out of scope here; flagged for a future stage.
  - **`dom-rules.mjs`'s ru/en "o'zbekcha matn qolgan" description check now skips `expect.status
    === 404`** too (same reasoning as the existing description-length exemption just above it):
    a 404 page's inherited fallback description isn't SERP-relevant since it's `noindex`.
  - Mobile header/pdp/`.mbar` spacing trimmed (`.hd-logo` 60→52px, `.hd-search`/`.hd-tabs` padding,
    `.pd-sec`/`.pdp` gaps, `.mbar` padding/button height) so the model page H1 clears the sticky
    bottom bar at 390×844 (measured via Playwright `boundingBox()`, not guessed) — the gallery-
    before-H1 order itself is the approved design, only the whitespace around it was too generous.
  - Mobile menu (`HeaderClient.tsx`) has a Tab/Shift+Tab focus trap inside `#sps-mobile-menu` while
    open (axe needs a real browser for this, not `audit-a11y.mjs`'s jsdom pass).

- **Audit 2026-11-02, stage 3.3 (trust signals, `tests/testimonials2027.test.js`)** — keep them:
  - **Technical preparation only** — no fake reviews/photos were invented. Built: `testimonials` table
    (migration `0003`) + admin CRUD (`/admin/testimonials`) + `factory_video_url` setting (admin →
    Sozlamalar → "Ishonch dalillari"). Both are **empty-safe**: 0 testimonials or no video URL means
    the corresponding component (`Testimonials.tsx`/`FactoryVideo.tsx`) returns `null` — nothing fake
    ever renders, consistent with Business Rule 4. Remaining asks (project photos, certificates,
    concrete min-order/timeline/payment ranges) are pure business content with no code blocker —
    tracked in `docs/unresolved-questions.md` §1.13–1.16.
  - `src/lib/testimonials2027.ts`'s `getTestimonials()` reads `siteSnapshot?.testimonials ?? []` —
    never throws when `DATABASE_URL` is unset (same empty-safe pattern as `catalog2027.ts`).
  - `jsonLdOrganization()` takes an optional 3rd `rating` param (`AggregateRating`, computed from
    testimonials that have a `rating`) — only emitted when at least one testimonial has a rating,
    so an unrated review doesn't silently count toward a fake average.
  - **Video embed never renders an admin-supplied URL as a raw iframe `src`.** `video2027.ts`
    extracts the YouTube/Vimeo video ID via regex and rebuilds a known-shape `/embed/` URL — so even
    a compromised admin account can't point the iframe at an arbitrary origin. CSP `frame-src` in
    `next.config.js` only allows `youtube.com`/`player.vimeo.com` (plus the existing GTM host).
  - Caught during review, not after: a hidden input named `id` in `TestimonialForm.tsx` (the exact
    `form.id`-collision bug already documented below under "Admin forms") — renamed to
    `testimonialId` before it ever shipped.
  - New admin section follows the existing small-CRUD template exactly (`src/app/admin/products/
    sections/{page.tsx,SectionForm.tsx}`): `tests/admin2027.test.js` test 12's generic `requireUser()`
    scan covers it with no test changes needed.
  - No HANDOFF design exists for a reviews/video section (new functionality, not in the approved
    package) — intentionally built with existing tokens/classes only (`.sec`, `.sps-eyebrow`, `.h1`),
    no bespoke CSS, so it doesn't invent unapproved visual language; a future design pass can refine it.

- **Audit 2026-11-02, stage 3.4 (JS size, `tests/speed2027.test.js`)** — keep them:
  - `src/lib/pages.ts`/`src/lib/ui.ts` unconditionally import **all 3 locale dictionaries** at module
    top level. Four client components (`ModelClient`, `CompareClient`, `RequestClient`,
    `PartnersForm`) used to call `getPages(lang)`/`getUi(lang)` themselves, which shipped **all 3
    languages'** `pages.ts`/`ui.ts` modules (not just the one rendered) into their browser bundle on
    every page. Fixed by having the **server parent** (`page.tsx`, which already needs the dictionary
    for metadata/SSR anyway) resolve it once and pass only the needed sections down as props —
    `Pick<PagesDictionary, 'model' | 'partners'>` etc., never the whole `p`. Measured ~15-20 KB
    (raw, per Next's own "First Load JS") off `/catalog/[section]/[slug]`, `/compare`, `/request`,
    `/partners`. `tests/speed2027.test.js` guards both the `getPages(`/`getUi(` call sites and (see
    next bullet) the function-field hazard, so this doesn't silently regress.
  - **A dictionary function field crashes the production build, not just lint/typecheck**, the moment
    it's passed as a prop to a Client Component: *"Functions cannot be passed directly to Client
    Components"* — `next build`'s static export step fails with no warning beforehand. Several
    `pages/{uz,ru,en}.ts` fields were plain JS functions (`home.h1(n)`, `model.photoAskMessage(label)`,
    `compare.subtitle(n, diff)`, `compare.setValue(n, letters)`, `request.approx(n)`) for the exact
    reason template literals are normally reached for — a value that depends on an argument known
    only at render time. Converted to **plain data** instead: `{label}`/`{n}` string templates
    (`.replace('{label}', ...)`) for args known server-side (`photoAskMessageTemplate`,
    `waAboutTemplate`, `approxTemplate`), or `{one, few, many}` plural-form objects
    (`subtitleForms`) for args that are genuinely client-dynamic (list length), resolved via the new
    dictionary-free `pluralCategory(lang, n, forms)` in `src/lib/i18n.ts` (same `Intl.PluralRules`
    logic as `pluralModels`, minus the `getUi()` call so it doesn't reintroduce the bundle problem it's
    fixing). `compare.setValue` had no actual translatable content at all (identical in uz/ru/en) —
    just inlined as plain formatting in `CompareClient.tsx`, removed from the dictionary entirely.
    `home.h1`/`home.seoTitle` are still functions (fine — `getPages()` is never passed to a client
    component from the home page).
  - **Not done, still open**: "katalog ma'lumotini kartochkaga keraklisigacha qisqartirish" (trim
    catalog data to what the card needs) from the same audit item. Investigated: `Model` (
    `catalog2027.ts`) is already fairly lean (no FAQ/long text — that's dictionary-side, per-model
    `name`/`subtitle` carry all 3 locales but are short strings) — lower value, higher risk than the
    dictionary fix above, deferred rather than rushed. Real Lighthouse/LCP numbers are still
    unavailable here (`npm run lighthouse` needs a real browser + reachable network; even with the
    sandbox's pre-installed Chromium pointed at via `CHROME_PATH`, it did not complete in this
    environment) — CI or a real machine is the source of truth, per `docs/checks.md`.

- **Audit 2026-11-02, stage 3.6 (repo/docs hygiene)**:
  - `README.md`/`docs/ARCHITECTURE.md`/`docs/DEPLOYMENT.md`/`docs/SECURITY.md` described the
    **pre-redesign (2026, "backendsiz") architecture** — no database, Tailwind, Zustand, a `/blog`
    and `/product/` that no longer exist. Rewritten to match the current redesign (2027 storefront
    + Stage 7–11 admin/Postgres), pointing to `CLAUDE.md` as the detailed, actively-maintained
    source of truth rather than duplicating it. The other `docs/*-2026.md`/`MADANI-RAQOBAT-AUDITI.md`
    style files are left alone — they're genuinely historical (self-dated planning/decision logs,
    not "current state" docs), unlike these four which claimed to describe *now*.
  - **Node version pinned**: `.nvmrc` (`22.6.0`) + `package.json` `engines.node` (`>=22.6.0`) +
    CI's `actions/setup-node` now reads `node-version-file: .nvmrc` instead of a hardcoded `22` —
    one source of truth. `--experimental-strip-types` (used by `npm test` and several scripts)
    needs Node ≥ 22.6; nothing enforced that version anywhere before.
  - Removed `sps-design-handoff.zip` (8.8 MB) from the working tree — dead weight: it's the
    original zip of what's already fully extracted into `docs/design-handoff/` (9.7 MB), and
    nothing in the build/scripts ever reads the zip itself.
  - **`.git` is ~485 MB — investigated, not rewritten.** The large blobs still in the *current*
    tree (`media-src/pdf/*.pdf` ~46 MB, `public/catalog/pdf/*.pdf` ~15 MB, `public/admin-ai/*.wasm`+
    `*.onnx` ~15 MB) are all legitimate, documented, currently-used assets (source PDFs the extract
    pipeline reads, the public catalog download, the admin background-removal model) — nothing to
    remove there. The bulk of the 485 MB is **historical**: blobs from files already deleted from
    HEAD (a stray ~20 MB binary, dozens of ~3 MB auto-named `Изображение*` images from an old
    import, superseded by the Stage 5 "old 2026 layer deleted" cleanup) that `git rm` never
    shrinks — only a history rewrite (`git filter-repo`/BFG) does, which needs a force-push and
    breaks every existing clone/fork. That's a hard-to-reverse, shared-history-affecting call for
    the user/team to make deliberately, not something to do unilaterally mid-audit; left open.

- **Audit 2026-11-02, stage 3.5 (international signals)** — keep them:
  - **`x-default` hreflang is now `/ru`, not `/uz`** (`hreflang()` in `src/lib/seo.ts`, enforced
    by `scripts/lib/dom-rules.mjs`'s hreflang check and `tests/seo2027.test.js`/`platform.test.js`).
    A visitor whose browser is in Kazakh, Georgian, or another CIS language that doesn't match
    uz/ru/en falls to `x-default` — Russian is usually understood far better than Uzbek in those
    markets. `src/middleware.ts`'s `preferredLocale()` mirrors this with an explicit
    `CIS_LANGUAGE_TAGS` list (`kk, ky, tg, az, hy, ka, be` — exactly `EXPORT_COUNTRIES`'s
    languages) → `ru`; a genuinely unrelated language (French, Chinese, …) still falls to `uz`,
    the primary market default — this is a targeted CIS fallback, not a blanket default change.
  - **`robots.txt` no longer `Disallow`s `/compare`/`/request`.** They were both `Disallow`'d
    *and* `noindex, follow` — a real conflict: `Disallow` stops crawlers from ever visiting the
    page, so `follow: true` (meant to let link equity flow to the model pages linked from
    compare/request) was silently doing nothing. `noindex` alone already keeps them out of the
    index; removing the `Disallow` is what actually lets `follow` work as intended (HANDOFF B8).
  - Partners/export form's country dropdown (`p.partners.countries`) only had 5 of the 8
    `EXPORT_COUNTRIES` (missing Azerbaijan/Armenia/Georgia/Belarus) — `src/lib/phone.ts` already
    had working dial-code normalization for all 4 (`374`/`994`/`995`/`375`), just nothing in the
    UI could select them. Added to all 3 locale dictionaries + `PartnersForm.tsx`'s
    `COUNTRY_DIALS` (must stay index-aligned with `p.partners.countries` — same order, same length).
  - **Not done, still open**: Yandex `Clean-param` directive for `robots.txt`. Next's typed
    `MetadataRoute.Robots` (the `app/robots.ts` file convention) has no field for it — only
    `userAgent`/`allow`/`disallow`/`crawlDelay`/`sitemap`/`host` — so emitting it needs converting
    `robots.ts` to a manual `route.ts` text handler, a bigger change for a minor win: `canonical`
    (no query string) already tells every search engine, Yandex included, to ignore `?q=`
    variants — `Clean-param` would only save Yandex some redundant crawl budget, not fix a real
    indexing gap. Deferred rather than rushed; `docs/unresolved-questions.md` tracks it.

- **Never reintroduce Tailwind.** The database is back (Stage 7, user decision) **only** behind
  `src/server/` — public pages (`[lang]`, `components`, `lib`) must never import it
  (`tests/platform.test.js` test 6), otherwise the storefront stops being static.
- **Admin forms: never name a hidden input `id`** — `form.id` then returns that input (DOM named
  property) and React drops the submit button's `name/value` (status buttons silently did nothing).
  Use `leadId` / `userId`.
- **Catalog source**: `catalog2027.ts` reads `siteSnapshot` (DB, via build) and falls back to the
  static JSON. Sections are dynamic (`Section = string`, `SECTIONS`/`SECTION_SLUGS`/`sectionLabel`
  from the snapshot or built-in defaults) — never `getUi().sections` (removed). Navigation uses
  `getActiveSections()` (sections with ≥1 model that has an image). Models with images sort first.
- **Never commit a DB snapshot**: a local `npm run build` with `DATABASE_URL` overwrites
  `src/data/site.generated.ts` (settings/sections/seo/texts), `src/data/models2027.ts` (published
  products) **and** `src/data/redirects.generated.json` (admin 301s). Run `git checkout src/data`
  (and reset the redirects file to `[]`) before committing (`tests/catalogAdmin2027.test.js` test 8).
- **API secrets never go to `site_settings`**: that table is exported into the public JS bundle by the
  snapshot. Report keys (Yandex OAuth, Google service account) live in `integration_secrets`, which
  `export-snapshot.mjs` must never read (`tests/adminSeo2028.test.js` test 6).
- **Admin SEO/text overrides apply centrally**: `pageMetadata()` reads `seoOverride(lang, path)` (title,
  description, noindex) and `getPages()`/`getUi()` apply `texts` via `applyTextOverrides` before tokens — do not
  re-implement per page. H1/intro overrides exist only on section, tag and export pages (`H1_KINDS`).
  New indexable page types go into `src/lib/sitePaths.ts` (sitemap + admin list share it).
- **Migrations run on Vercel Production builds** (`vercel.json` → `db:migrate:deploy`): skipped without
  `DATABASE_URL` and on Preview unless `MIGRATE_PREVIEW=1` (Preview often shares the production DB); a failing
  migration fails the deploy. Keep migrations additive/backward-compatible — the old deployment keeps serving
  until the new one is live. Manual `npm run db:migrate` still exits 1 without `DATABASE_URL`.
- Every `actions.ts` under `src/app/admin` is scanned by `tests/admin2027.test.js` test 12 (each export calls `requireUser`).
- **Motion**: only below-the-fold elements get `data-rv` (never hide the first screen — LCP/flicker);
  animate transform/opacity only; `prefers-reduced-motion` disables everything (global CSS rule + early
  return in `MotionLayer`). Admin pages auto-refresh every 60 s unless a form is on the page (`AutoRefresh`).
- **Site numbers/contacts are tokens**: dictionaries use `{years}`, `{capacity}`, `{objects}`,
  `{countries}`, `{countryList}`, `{contactLine}`, `{addressLine}`, `{address}` — never write the
  literal 8/20/18 000/740+ or a phone into copy (`tests/pages2027.test.js` test 13).
- **`useSyncExternalStore` snapshots must be stable**: `spsLists.ts` `get()` caches the parsed array
  until the raw localStorage string changes. Returning a fresh `JSON.parse` result each call crashed the whole
  site with React #185 as soon as one model was in the compare/request list (`tests/stores2027.test.js`).
- **React 19 forms reset after a server action**: controlled `<select>`s then show the first
  option in the DOM. Big client forms (ProductForm) submit via `onSubmit` + `startTransition`.
- Analytics IDs/verification come from admin settings (`src/lib/integrations.ts`,
  `analyticsConfig()`/`verificationMeta()` in the root layout) with env fallback; values are
  validated with strict regexes because they are interpolated into inline scripts.
- Our own visit tracking (`src/lib/visitTracker.ts` → `/api/track`) filters bots (incl.
  HeadlessChrome — set a real UA in Playwright when testing it), stores no IP and no cookies.
- Every admin `page.tsx`/`route.ts` and server action calls `requireUser()` (test 12 in
  `tests/admin2027.test.js`); middleware only redirects cookie-less requests to `/admin/login?next=`.
- `tests/admin2027.test.js` imports `src/server/*` directly (relative `.ts` imports), not through
  `load-alias`. `load-alias` materializes into a **per-process** dir `.tmp-tests/<pid>` (removed on exit):
  a shared dir let one file's `cleanupTmp()` delete modules another parallel file was importing
  (random `ERR_MODULE_NOT_FOUND` in `stores2027`, CI run 41318919818).
- **Only `/api/leads`, `/api/health` and `/api/track` may exist** under `src/app/api` (admin uses
  server actions and `/admin/leads/export`) (`tests/foundation2027.test.js` enforces it).
- **`data/models-2027.json` is generated** — edit the extractor, not the JSON.
- **Fonts are self-hosted**; builds must work without outbound internet.
- Next 15: `params`/`searchParams` are promises (`await params` in server components).
- `[lang]/layout.tsx` exports `generateStaticParams()` + `dynamicParams = false`,
  so the whole storefront prerenders; keep pages free of request-time APIs.
- RU header: **no "Экспорт" link** (it lives inside "Производство") and tighter section tabs —
  see `SiteHeader.tsx` and `.hd-tabs--ru`. The active tab is set client-side from `usePathname()`
  (`[lang]/layout.tsx` renders the header once, so the server does not know the current page).
- **Redesign 2028 UI** ("Beton laboratoriyasi", canvas `docs/REDESIGN-2028-PLAN.md`): tokens in
  `:root` (concrete `#f2f0eb`, graphite `#15171a`, red `#d7262e`/text `#b51e25`, `--red-on-ink` on dark);
  buttons/inputs 8px, cards 12px, pill only for chips and the language switch. Card CTA is graphite —
  red is for the page's main CTA. **Images: only real SPS material** (studio mold photos in
  `public/images/site/molds/` with `mix-blend-mode: multiply`, laid-tile scenes, factory, export map) —
  no stock people/warehouses. Home hero = variant A (light, scene + spec card).
- **Never put `data-rv` in markup**: `MotionLayer` adds it itself and skips elements that already have
  it, so a static `data-rv` stays `opacity: 0` forever. Register new blocks in `REVEAL` instead.
- **`.x span` selectors hit nested spans**: e.g. `.sps-stat span` also matched `<span data-countup>`
  inside the number and shrank it to 14px — use `> span` for labels.
- Tap targets ≥ 44px on mobile (`npm run shots` report): text links get the hit area via
  `padding-block` + negative `margin-block` so the layout does not move (see "Tegish maydonlari" in CSS).
- **Sitemap alternates must be absolute**: metadata `alternates.languages` accepts
  relative paths (Next resolves them against `metadataBase`), the sitemap XML does not —
  use `hreflangAbsolute()` there, never `hreflang()`.
- **301s live in `scripts/redirects-2027.json`**, not in `next.config.js`. Add/regenerate
  entries there (`npm run redirects:build`); the config only prepends the canonical-host rule
  (`www.spsplast.com`, `sps.uz`, `www.sps.uz` → `https://spsplast.com/:path*`, one regex host rule).
- After deleting routes, run `rm -rf .next` before `npm run typecheck` — stale
  `.next/types` produces bogus TS2307 errors for files that no longer exist.
- `<html lang>` is `uz` in the SSR markup for every locale (single root layout) and is
  corrected after hydration by `HtmlLangSync`. Fixing it server-side requires route
  groups with per-locale root layouts — deliberate deferral, see Stage 5 notes.
- **jsdom audits cannot see layout**: `color-contrast` and `target-size` are disabled in
  `scripts/audit-a11y.mjs` (documented in the report) — those two need a real browser
  (`npm run lighthouse` / `npm run shots`).
- **Page weight must exclude `nomodule` bundles**: Next ships `polyfills-*.js` (39 KB gzip)
  with the `nomodule` attribute; modern browsers never download it. `audit-seo-dom.mjs`
  counts it separately — do not merge it into the per-page budget.
- **`undici` fetch hides compression**: `Content-Encoding`/`Content-Length` are stripped,
  so the audit measures transfer size with `zlib.gzipSync(body).length` (the server does
  gzip — verified with curl).
- **jsdom `body.textContent` includes the Next RSC flight payload** (`self.__next_f.push(...)`,
  e.g. `["__PAGE__",{}]`) — `dom-rules.text()` strips `script/style/noscript/template` from a
  clone first, otherwise placeholder/copy rules fire on serialization noise.
- **Every landmark needs a unique accessible name** (axe `landmark-unique`): the site has
  three language switchers, so `LangSwitch` takes a `label` prop and each call site passes
  its own (`a11y.langNavHeader` / `langNavMenu` / `langNavFooter`), and the mobile menu nav
  uses `a11y.mobileNav` (not the header's `sectionsNav`).
- **The root `not-found.tsx` renders outside `[lang]/layout.tsx`**, so it must wrap its own
  `<main id="main-content">` — otherwise axe reports `region` (content outside a landmark).
- `ASSET_PREFIXES` in `dom-rules.mjs` must stay file-specific (`/catalog/2027/`,
  `/catalog/pdf/`): a bare `/catalog/` would hide lang-less internal links like
  `/catalog/paving` from the audit.

## Common Commands

```bash
npm run dev            # local dev server
npm run build          # models:check + next build (448 static pages)
npm run typecheck      # tsc --noEmit
npm run lint           # next lint
npm test               # node --test --experimental-strip-types tests/*.test.js (182 tests)
npm run models:build && npm run models:images && npm run models:check
npm run db:generate    # after editing src/server/db/schema.ts → new SQL in drizzle/
DATABASE_URL=... npm run db:migrate
DATABASE_URL=... ADMIN_PASSWORD=... npm run admin:create -- --email E --name "Ism" --role admin

# Stage 6 checks — server must be running (`npm run start` or `npm run dev`)
npm run audit          # audit:seo + audit:a11y → docs/audits/*.md
npm run audit:seo      # SEO/DOM rules over 35 routes (jsdom, no browser needed)
npm run audit:a11y     # axe-core WCAG 2.1 AA over 31 pages (jsdom, no browser needed)
npm run shots          # NEEDS a browser: npm i -D playwright && npx playwright install chromium
npm run lighthouse     # NEEDS a browser: npm i -D lighthouse
AUDIT_ORIGIN=https://<preview>.vercel.app npm run audit   # audit a deployed preview
LH_ORIGIN=https://<preview>.vercel.app npm run lighthouse
```

**CI** (`.github/workflows/checks.yml`) runs all of the above on every PR and push to
`main`, including the browser steps: it installs chromium (`npx playwright install
--with-deps chromium`), takes the 390/1440/360 shots, runs Lighthouse
(`continue-on-error` — CI perf scores are noisy), writes the report heads into the run
summary and uploads `docs/audits/` + `screens-actual/` as the `tekshiruv-hisobotlari`
artifact (30 days). The `shots` step is strict: horizontal scroll fails the job.

Audit-only devDependencies: `axe-core`, `jsdom` (no browser needed); browser checks add
`playwright`, `lighthouse`, and `pixelmatch` + `pngjs` + `sharp` (optional pixel diff —
`pixelDiff()` returns `null` and the report prints `—` when they are absent).

## Texnik qoidalar (Stage 2–3 da tasdiqlangan)

- `src/data/models2027.ts` — GENERATED (extractor yozadi). `catalog2027.ts` JSON emas shu modulni import qiladi: node testlari JSON importni qila olmaydi.
- Testlar orqali yuklanadigan TS fayllarda: import yo'llari nisbiy va `.ts` kengaytmasi bilan (`allowImportingTsExtensions` yoqilgan), tip-only importlar `import type {...}` ko'rinishida bo'lsin (aks holda node `@/` aliasni hal qilolmaydi).
- Dinamik parametrlar bilan statik sahifalar (`catalog/[section]`) `searchParams` o'qimaydi va `dynamicParams = false` bo'ladi — aks holda noma'lum slug uchun soft-404 (200) qaytadi. Filtrlar mijoz tomonida `window.location.search` dan o'qiladi.
- `/api` da faqat `leads`, `health` va `track` bo'lishi kerak (test nazorat qiladi).
- `not-found.tsx` chegarasiga Next `params` uzatmaydi: til `useParams()` orqali olinadi, shuning uchun `[lang]/not-found.tsx` va `NotFoundBody` — client komponentlar.
- Sahifa matnlari `src/dictionaries/pages/{uz,ru,en}.ts` (`getPages(lang)`); tuzilma bir xil bo'lishi shart (test 4 tekshiradi).
- Kontaktlar faqat `CONTACTS_2027` dan; sahifalarda telefon raqamini qattiq yozish mumkin emas (test 7).
- Ichki havolalar statik string bo'lsa `next/link` ishlatilsin (eslint `no-html-link-for-pages`); dinamik `${lang}` havolalarda `<a>` qolishi mumkin.
- Node testlari yuklaydigan modullar (`lib/pages.ts`, `lib/catalog2027.ts`, `lib/catalogFilters.ts`) nisbiy yo'l + `.ts` kengaytmasidan foydalanadi.
- Analitika: ro'yxat/solishtirish voqealari `store/spsLists.ts` ichida, `generate_lead` esa `lib/leadSubmit.ts` da — chaqiruv joylarida takror kod yozilmaydi. Analitika ID'lari admin → Sozlamalar (yoki env), kodda qattiq yozish taqiqlangan (test).
- `/api/leads` xato kodlari: `bad_json`, `validation`, `bad_phone` (faqat telefon xato bo'lsa), `rate_limit` (429). Honeypot `website` to'la bo'lsa — soxta `ok`, Telegram yuborilmaydi.

## Stage Status (redesign)

- [x] UI 2028 (Claude Design canvas → code, 2026-11-01): tokens, header (dark utility row + section
  tabs), mobile menu, footer CTA band; catalog block (card with code tag, inset mold, spec dl, graphite
  CTA; filters; compare bar); home (hero A + spec card, stats, sections + help card, steps + calculator
  example, factory, wholesale with real mold photos); model (drawing-board mold view with dimension line,
  ±10 calculator); partners/production stock photos replaced; canonical domain `spsplast.com`.
  Fixed on the way: React #185 site crash with a non-empty compare/request list, footer red button
  contrast, production stats font bug, tap targets. Checks: 124 tests, audit:seo 35/0/0, audit:a11y 0,
  browser axe color-contrast 0 (14 pages × 1440/390), `npm run shots` 28 screens without horizontal scroll.

- [x] Admin A–Z (2026-11-01): SEO center (per-page title/description/H1/intro ×3 langs with SERP preview, noindex,
  301 manager → `redirects.generated.json`, sitemap submit to Search Console/Yandex Webmaster via API, IndexNow,
  health checks), Analytics (Yandex Metrica, Search Console, Yandex Webmaster, GA4 reports; secrets table),
  Matnlar CMS (620 strings incl. `{1}` templates). Migration `0002_seo_content_reports`. 142 tests; publish flow
  verified end-to-end on a local PGlite socket DB (override → build → title/H1/301/menu text live).

- [x] SEO landing (2026-11-01, `docs/SEO-2028-RU.md` §2a): 7 tag pages + 8 export country pages × 3 langs
  (static, own H1/title/canonical, Breadcrumb/ItemList/FAQPage JSON-LD), footer "Eksport" column, tag chips +
  paving guide + countries strip on the section page, sitemap 432. Checks: 130 tests, audit:seo 41/0/0,
  audit:a11y 37 pages 0, browser contrast 0, `npm run shots` 32 screens without horizontal scroll.

Next stages (7–12: database + lead storage, admin CRM, admin catalog/images, analytics
dashboard, content/global, launch) and the full gap analysis: **`docs/ROADMAP-2027.md`**.

- [x] 11 — animatsiyalar (`MotionLayer.tsx` + CSS: modal/sheet/menyu/panel ochilishi, pastdagi bloklar
  aylantirganda chiqadi — birinchi ekran hech qachon yashirilmaydi, header soyasi, tugma/ikon/badge,
  galereya o'tishi; reduced-motion hurmat qilinadi); admin: kontaktlar va raqamlar (3 tilda tokenlar),
  brauzerda AI fon olib tashlash (u2netp), yangi zayafkalar badge + 60 s avto-yangilanish, mahsulot
  nusxasi; snapshot modellari `src/data/models2027.ts` ga (bundle'da ikki marta emas). Testlar 122.
  Ishga tushirish rejasi: `docs/LAUNCH-CHECKLIST.md`.
- [x] 9+10 — admin: Tashriflar (o'z statistikamiz, mijoz yo'li), Integratsiyalar (GTM/GA4/Metrica/
  Pixel/TikTok/Search Console/Webmaster/Bing), Mahsulotlar + Bo'limlar + rasm yuklash, "Nashr qilish"
  (deploy hook + build snapshot); 89 qolip/plitka rasmi fonsiz (`npm run images:bg`); UI audit
  tuzatishlari (rasmsiz kartochkalar, `[...]`, bo'lim rasmlari, RU kirill nomlar, hamkorlar). Testlar 120.
- [x] 7+8 — Postgres (Drizzle) + zayafkalarni saqlash (ketma-ket SPS-YYMM-NNNN, avval baza → keyin
  Telegram, bazadagi rate limit) + admin panel `/admin` (login/sessiya, rollar admin/menejer,
  dashboard, zayafkalar CRM: holat/mas'ul/izoh/tarix, CSV, xodimlar). `docs/ADMIN.md`. Testlar 108.

- [x] 0 — data: models-2027.json, WebP set, validator, data-questions.md
- [x] 1 — foundation: tokens/style B, Onest, layout, header, mobile menu, footer, i18n uz/ru/en
- [x] 2 — catalog blocks (filters+facets, search, sort, grid/list, card, quick zayafka, quick view, compare bar) + `/uz/catalog`, `/uz/catalog/[section]`; `/api/leads` HANDOFF §5 sxemasi oldinga tortildi (formalar ishlashi uchun)
- [x] 3 — pages: bosh, model (`catalog/[section]/[slug]`), solishtirish, zayafka ro'yxati, ulgurji, ishlab chiqarish, kontakt, maxfiylik, 404 (uz/ru/en)
- [x] 4 — API + analitika: `/api/leads` (Zod, honeypot, rate limit, xalqaro telefon, Telegram, `requestId`, `bad_phone`) va voqealar `generate_lead` / `add_to_request` / `add_to_compare` (+ view_item, view_item_list, search); `/api/health` katalog va analitika tekshiruvlari bilan. Ro'yxat: docs/analytics-events.md
- [x] 5 — SEO + migratsiya: `src/lib/seo.ts` (pageMetadata/noindexMetadata, hreflang uz/ru/en + x-default, JSON-LD Organization/WebSite/LocalBusiness/Breadcrumb/Product/FAQ/ItemList — Product narxsiz), `JsonLd.tsx`, sitemap (387 URL, mutlaq alternate'lar, bo'sh bo'lim va compare/request kiritilmagan), robots, 436 ta 301 (`scripts/redirects-2027.json` + generator), eski 2026 qatlam va `public/catalog/2026` o'chirildi, `error.tsx`/`loading.tsx` yangi dizayn tilida qayta yozildi, header/footer bo'lim havolalari `SECTION_SLUGS` orqali tuzatildi. Testlar: 82 pass (`tests/seo2027.test.js` — 17)
- [~] 6 — checks (qisman): brauzersiz tekshiruvlar bajarildi va yashil — `npm run audit:seo` (35 marshrut, **0 xato / 0 ogohlantirish**, JS+CSS gzip ~167 KB/sahifa), `npm run audit:a11y` (31 sahifa, axe WCAG 2.1 AA, **0 buzilish**, 1139 o'tgan qoida), ichki havolalar krawli (186 manzil, 0 buzilgan), curl 200/301/404 matritsasi, `tests/audits2027.test.js` (audit qoidalarining o'zi fixture'lar bilan sinaldi). Testlar jami: **93 pass**. Brauzer talab qiladigan qism (sandbox'da Chromium yo'q) skript sifatida tayyor va foydalanuvchi tomonidan ishga tushiriladi: `npm run shots` (390/1440/360 px skrinshot + gorizontal scroll + <44px tegish maydonlari, `screens/` bilan juftlanadi) va `npm run lighthouse` (mobil Perf ≥ 90 / A11y ≥ 95 / SEO 100, desktop Perf ≥ 95). Batafsil: `docs/checks.md`; ochiq savollar: `docs/unresolved-questions.md`

## SEO qoidalari (Stage 5 da tasdiqlangan)

- Har bir sahifa `generateMetadata` da `pageMetadata({ lang, path, title, description, image })` chaqiradi; `path` til prefiksisiz (`''`, `/catalog`, `/catalog/paving/01-monako`). Canonical va hreflang shu `path` dan yig'iladi.
- `noindexMetadata(lang, title)` faqat `/compare` va `/request` layout'larida: foydalanuvchi holatiga bog'liq sahifalar indekslanmaydi, lekin `follow: true` (havolalar kuchi saqlanadi).
- Metadata matnlari **faqat lug'atdan** (`getUi`/`getPages`): sahifa kodida o'zbekcha CTA qattiq yozilmaydi (test 17 tekshiradi). SERP snippet'ida rus sahifasi o'zbekcha matn ko'rsatmasligi kerak.
- JSON-LD server komponenti `JsonLd.tsx` orqali chiqadi (`<` escape qilinadi) va sahifa matni bilan **bir manbadan** yasaladi — masalan PDP FAQ: `getPages(lang).model.faq` ham tabda, ham `FAQPage` da (test 11).
- Sahifalar bo'yicha JSON-LD: root layout — Organization + WebSite (SearchAction `/uz/catalog?q=`); model — BreadcrumbList + Product(`additionalProperty`: o'lcham, qalinlik, 1 m² uchun, qolip vazni) + FAQPage; contact — LocalBusiness (geo/ish vaqti `CONTACTS_2027` dan); partners — Breadcrumb + FAQPage; bo'lim/katalog/production/privacy — Breadcrumb.
- Telefon, manzil, geo va ijtimoiy tarmoqlar JSON-LD da ham `CONTACTS_2027` dan olinadi — ikkinchi joyda qattiq yozish taqiqlangan.
- Sitemap: 6 doimiy sahifa + modeli bor bo'limlar + 119 model, har biri 3 tilda (`alternates.languages` mutlaq URL). `zabor` (0 model) kiritilmaydi; ma'lumot to'ldirilgach o'zi qo'shiladi.
- 301 xaritasi: nom mos kelsa aniq model sahifasi (80 ta), kelmasa eski kategoriyaning yangi bo'limi (304 ta), eski kategoriya slug'lari (6), statik sahifalar (18), 2017-yilgi CMS manzillari + wildcard zaxira qoidalari (22). Hammasi `statusCode: 301` (308 emas).
- Yagona root layout tufayli SSR `<html lang="uz">`; til gidratatsiyadan keyin `HtmlLangSync` bilan to'g'rilanadi. Muqobil (route groups + til bo'yicha root layout) butun marshrut daraxtini ko'chirishni talab qiladi — Stage 5 da ataylab qoldirildi.

## Audit qoidalari (Stage 6 da tasdiqlangan)

- **Ikki audit, ikki xil maqsad.** `audit-seo-dom.mjs` — SERP/indeks sifati va kontent
  intizomi (title/description uzunligi va tili, canonical, hreflang to'plami, meta robots,
  OG/Twitter, bitta `h1` va daraja sakramasligi, `alt`, ichki havolalar, forma maydonlari,
  JSON-LD turlari va **narx yo'qligi**, sahifa og'irligi). `audit-a11y.mjs` — axe-core
  WCAG 2.1 AA + best-practice. Ikkalasi ham jsdom ustida, brauzersiz ishlaydi.
- **Yangi sahifa qo'shilsa — `scripts/lib/routes.mjs` ga qo'shing** (`AUDIT_ROUTES`:
  `expect` bloki bilan; kerak bo'lsa `SHOT_PLAN`: qaysi o'lchamda suratga olinadi va qanday
  interaktiv holat — `menu`, `filters`, `quickLead`, `seedCompare`, `seedRequest`).
  Qo'shilmasa, sahifa tekshiruvdan tashqarida qoladi.
- **Rasm `alt` qoidalari.** SSR'da chiqadigan mazmunli rasm (model, sahna, plitka, bo'lim
  muqovasi) `alt` talab qiladi — bo'sh `alt` faqat bezak uchun to'g'ri: `aria-hidden`
  havolada, nomli tugmada yoki yonidagi matn bilan bir xil ma'noni takrorlaydigan holda
  (audit buni *qayd* deb hisoblaydi, xato emas). `alt` matnlari lug'atda:
  `getUi(lang).alt.{scene,mold,tile,logo}` — sahifa kodida qattiq yozilmaydi.
- **Sarlavha ierarxiyasi.** `h1 → h2 → h3`; daraja sakrash (masalan kartochka nomini `h3`
  qilish) audit'da ogohlantirish. Katalog/bo'lim sahifalarida filtr guruhlari `.fgroup h2`
  (vizual ko'rinishi CSS bilan kichraytirilgan), kartochka nomi `h3`.
- **Forma maydonlari.** Har bir `input/select/textarea` `label[for]`, `aria-label` yoki
  `label` ichiga o'ralgan bo'lishi shart; `name/tel/email/shahar` maydonlarida
  `autocomplete` (`name`, `tel`, `email`, `address-level2`) — mobil klaviatura va
  avtoto'ldirish uchun. Honeypot `aria-hidden="true"` ichida bo'ladi.
- **`<title>` H1 dan farq qilishi mumkin va kerak.** Bosh sahifada `p.home.seoTitle(count)`
  (SERP'da 65 belgigacha sig'adi), H1 esa maket matni (`p.home.h1`) — H1'ni qisqartirish
  taqiqlangan. `tests/seo2027.test.js` testi 18 ikkalasini ham nazorat qiladi.
- **Landmark nomlari unikal.** Bir sahifada bir nechta `nav`/`aside` bo'lsa, har biriga
  alohida `aria-label` (til almashtirgichlari: header/mobil menyu/footer — uch xil nom).
- **Og'irlik byudjeti.** Sahifa boshiga zamonaviy JS+CSS gzip ~170 KB (`nomodule` polyfill
  39 KB bundan tashqari). Yangi kutubxona qo'shishdan oldin auditni ishga tushiring —
  200 KB dan oshsa ogohlantirish chiqadi.
