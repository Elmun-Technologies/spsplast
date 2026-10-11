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
- **Validation**: Zod (leads API) · **Data**: static JSON only, **no database**.
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
src/app/api/leads|health     # the ONLY two route handlers (test-enforced)
src/components/site/         # new layer: SiteHeader, HeaderClient, SiteFooter, LangSwitch, icons
src/dictionaries/ui/{uz,ru,en}.ts   # UI copy for the new layer (uz = type source)
src/lib/catalog2027.ts       # synchronous catalog access + derived filter fields + calculator
src/lib/contacts2027.ts      # contacts per HANDOFF §1 (single source for new layer)
src/lib/store/spsLists.ts    # request list + compare list (localStorage)
src/lib/ui.ts                # getUi(lang), pluralModels(), formatNumber()
src/lib/seo.ts               # metadata + hreflang + JSON-LD builders (uz/ru/en, no price)
src/app/sitemap.ts           # 387 URLs: (6 fixed + 4 non-empty sections + 119 models) × 3 langs
src/app/robots.ts            # allow all; disallow /api/, /*/compare, /*/request
src/components/site/JsonLd.tsx     # server-only <script type="application/ld+json"> renderer
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
tests/helpers/load-alias.mjs # runs `@/`-aliased TS in Node (writes .tmp-tests/, gitignored)
screens-actual/              # GENERATED screenshots from `npm run shots` (gitignored)
media-src/                   # SOURCE photos the image pipeline reads (factory/, studio/, pdf/ — 86 MB)
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
4. Business-pending values stay `[...]` placeholders or `null` + a question in
   `docs/data-questions.md` (generated; manual items live in `MANUAL_QUESTIONS`).
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
```

## Visuals & measurement (Stage 6)

```bash
npm run shots          # Playwright: 28 screen @390/1440 + 360px scroll check -> screens-actual/ + docs/audits/visual-*.md
npm run lighthouse     # 8 targets x {mobile,desktop}, 3 runs each, MEDIAN -> docs/audits/lighthouse-*.md
```

- `SHOTS_MAX_TOTAL_MS` / `SHOTS_MAX_SHOT_MS` cap the shots step (a hung page must
  not stall CI); `LH_RUNS` changes repeats (median-of-3 because single CI runs
  swing ±10 points). Both scripts exit 0 with a hint when no Chromium exists
  (agent sandbox) — real numbers come from CI or a machine with Chrome.
- **Playwright viewports**: `width/height` must live inside a `viewport` object
  (`VIEWPORTS` in `scripts/lib/routes.mjs`); flat options are silently ignored
  and every "mobile" shot becomes 1280×720. Width assertions run only after
  `goto` — on `about:blank` mobile emulation reports 980px (no meta viewport).
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
Optional, env-gated: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GTM_ID`,
`NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_YANDEX_METRICA_ID`, `NEXT_PUBLIC_META_PIXEL_ID`.
There is **no `DATABASE_URL`** — see `.env.example`.

## Known Pitfalls

- **Never reintroduce a database or Tailwind.** Both were removed deliberately.
- **Only `/api/leads` and `/api/health` may exist** under `src/app/api`
  (`tests/foundation2027.test.js` enforces it).
- **`data/models-2027.json` is generated** — edit the extractor, not the JSON.
- **Fonts are self-hosted**; builds must work without outbound internet.
- Next 15: `params`/`searchParams` are promises (`await params` in server components).
- `[lang]/layout.tsx` exports `generateStaticParams()` + `dynamicParams = false`,
  so the whole storefront prerenders; keep pages free of request-time APIs.
- RU header second row: gap 16px and **no "Экспорт" link** (it lives inside
  "Производство") — see `SiteHeader.tsx` and `.hd-nav--ru`.
- **Sitemap alternates must be absolute**: metadata `alternates.languages` accepts
  relative paths (Next resolves them against `metadataBase`), the sitemap XML does not —
  use `hreflangAbsolute()` there, never `hreflang()`.
- **301s live in `scripts/redirects-2027.json`**, not in `next.config.js`. Add/regenerate
  entries there (`npm run redirects:build`); the config only prepends the www→apex rule.
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
npm run build          # models:check + next build (402 static pages)
npm run typecheck      # tsc --noEmit
npm run lint           # next lint
npm test               # node --test --experimental-strip-types tests/*.test.js (93 tests)
npm run models:build && npm run models:images && npm run models:check

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
- `/api` da faqat `leads` va `health` bo'lishi kerak (test nazorat qiladi).
- `not-found.tsx` chegarasiga Next `params` uzatmaydi: til `useParams()` orqali olinadi, shuning uchun `[lang]/not-found.tsx` va `NotFoundBody` — client komponentlar.
- Sahifa matnlari `src/dictionaries/pages/{uz,ru,en}.ts` (`getPages(lang)`); tuzilma bir xil bo'lishi shart (test 4 tekshiradi).
- Kontaktlar faqat `CONTACTS_2027` dan; sahifalarda telefon raqamini qattiq yozish mumkin emas (test 7).
- Ichki havolalar statik string bo'lsa `next/link` ishlatilsin (eslint `no-html-link-for-pages`); dinamik `${lang}` havolalarda `<a>` qolishi mumkin.
- Node testlari yuklaydigan modullar (`lib/pages.ts`, `lib/catalog2027.ts`, `lib/catalogFilters.ts`) nisbiy yo'l + `.ts` kengaytmasidan foydalanadi.
- Analitika: ro'yxat/solishtirish voqealari `store/spsLists.ts` ichida, `generate_lead` esa `lib/leadSubmit.ts` da — chaqiruv joylarida takror kod yozilmaydi. Analitika ID'lari faqat env, kodda qattiq yozish taqiqlangan (test).
- `/api/leads` xato kodlari: `bad_json`, `validation`, `bad_phone` (faqat telefon xato bo'lsa), `rate_limit` (429). Honeypot `website` to'la bo'lsa — soxta `ok`, Telegram yuborilmaydi.

## Stage Status (redesign)

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
