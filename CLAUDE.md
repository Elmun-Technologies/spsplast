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
public/catalog/2027/         # generated WebP (scene 1400/720w, mold/tile 800w)
public/fonts/                # onest-latin/cyrillic-wght-normal.woff2
```

Old 2026 layer (`src/components/layout|catalog|product|ui`, `src/lib/catalog/*`,
`src/dictionaries/*.json`, blog/projects/wishlist pages) is being deleted stage by
stage (see `docs/OPTIMIZATION-LOG.md` history); until then it compiles but is unstyled.

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
| 404 | `not-found` |

Section slugs: `paving|facade|fence|decor|bench` → data sections
`trotuar|fasad|zabor|dekor|skameyka` (mapping lives in the catalog layer).

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

## Data Pipeline

```bash
npm run models:build   # xlsx (+2026 images) -> data/models-2027.json + image jobs + questions
npm run models:images  # ImageMagick -> public/catalog/2027/*.webp, prunes failed refs to null
npm run models:check   # validator: XATO exit 1, OGOH = business-pending
```

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

## Common Commands

```bash
npm run dev            # local dev server
npm run build          # catalog:check + next build
npm run typecheck      # tsc --noEmit
npm run lint           # next lint
npm test               # node --test tests/*.test.js
npm run models:build && npm run models:images && npm run models:check
```

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
- [ ] 5 — SEO: metadata, hreflang, sitemap, JSON-LD, 301 from old URLs; delete old 2026 layer + images
- [ ] 6 — checks: 390/1440 screenshots vs screens/, a11y, Lighthouse (needs a real browser outside sandbox)
