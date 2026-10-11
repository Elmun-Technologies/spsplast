# Tekshiruvlar (Stage 6) — HANDOFF §7 qabul mezonlari bo'yicha

Bu fayl ikki narsani ajratadi: **sandbox/CI ichida** avtomatik tekshiriladigan
narsalar (brauzer talab qilmaydi) va **haqiqiy brauzer kerak bo'lgan** tekshiruvlar
(skrinshot solishtirish, Lighthouse, kontrast, tegish maydoni).

```bash
# 1) Har doim ishlaydigan darvoza (sandbox/CI)
npm install --no-audit --no-fund
npm run typecheck      # tsc --noEmit
npm run lint           # next lint
npm test               # 93 test: data, platform, katalog, sahifalar, analitika, leads, SEO, auditlar
npm run build          # models:check + next build → 402 statik sahifa

# 2) Ishlab turgan server ustida auditlar (SEO/DOM + a11y)
npm run start          # yoki npm run dev
npm run audit          # = audit:seo + audit:a11y

# 3) Brauzer kerak (lokalda yoki Vercel preview ustida)
npm i -D playwright && npx playwright install chromium
npm run shots          # 390/1440/360 px: skrinshot + gorizontal scroll + tegish maydoni

npm i -D lighthouse
npm run lighthouse     # mobil + desktop ballari (byudjet bilan)
LH_ORIGIN=https://<vercel-preview>.vercel.app npm run lighthouse
```

Hisobotlar `docs/audits/` ga yoziladi (`seo-dom-<sana>.md`, `a11y-<sana>.md`,
`visual-<sana>.md`, `lighthouse-<sana>.md`). Skrinshotlar `screens-actual/`
(gitignore), xom Lighthouse JSON `docs/audits/lighthouse/*.json` (gitignore).

**Hammasi CI'da ham yuradi** — `.github/workflows/checks.yml` (har PR va `main` ga push):
typecheck → lint → 93 test → build → server → `audit:seo` → `audit:a11y` →
Playwright chromium → `shots` (390/1440/360) → `lighthouse`. Natijalar:

- **Run summary** da hisobotlarning bosh qismi (ballar, gorizontal scroll, tegish maydonlari);
- **`tekshiruv-hisobotlari`** artefaktida to'liq hisobotlar + `screens-actual/` skrinshotlari
  (30 kun saqlanadi) → PR'ning *Checks → checks → Artifacts* bo'limidan yuklab olinadi va
  `docs/design-handoff/screens/` dagi etalonlar bilan yonma-yon qo'yiladi.

Lighthouse qadami `continue-on-error`: CI runner'da Performance ballari shovqinli,
shuning uchun byudjet buzilsa job qizarmaydi — sonlar hisobotda ko'rinadi. Screenshot
qadami qat'iy: gorizontal scroll topilsa job qizaradi (bu deterministik xato).

## Qabul mezonlari (HANDOFF §7) va ularning holati

| # | Mezon | Qanday tekshiriladi | Holat |
|---|---|---|---|
| 1 | 360–390 px'da gorizontal scroll yo'q | `npm run shots` (har ekran uchun 390 va 360 px o'lchov) | Brauzer kutilmoqda |
| 2 | Tugma/linklar ≥ 44px | `npm run shots` → "Tegish maydoni" jadvali | **Zid**: maket CSS'i 36/40px — `docs/unresolved-questions.md` (4) |
| 3 | Kontrast WCAG AA ≥ 4.5:1 | Lighthouse a11y (jsdom kontrastni o'lchamaydi) | Brauzer kutilmoqda |
| 4 | Focus ko'rinadi, ikon-tugmalarda `aria-label`, modal/sheet focus trap + Esc | `globals.css` `:focus-visible`; `npm run audit:a11y` (axe, 1139 qoida, 0 buzilish); `useModalShell.ts` | **Bajarildi** (focus trap brauzerda qo'shimcha tekshiriladi) |
| 5 | Lighthouse mobil: Perf ≥ 90, A11y ≥ 95, SEO 100 | `npm run lighthouse` (byudjet shu sonlar) | Brauzer kutilmoqda |
| 6 | uz/ru/en + `hreflang` + `x-default` | `tests/seo2027.test.js` (1–5), `npm run audit:seo`, `/sitemap.xml` | **Bajarildi** (387 URL, mutlaq alternate'lar) |
| 7 | Sitemap 152 × 3 model sahifasi | sitemap `getModels()` dan yig'iladi | **Qisman**: ma'lumotda 119 model bor (152 emas) — `docs/data-questions.md` |
| 8 | JSON-LD: Organization, Product, BreadcrumbList, FAQPage (+ WebSite, LocalBusiness) | `tests/seo2027.test.js` (7–11), `npm run audit:seo` | **Bajarildi** (Product narxsiz) |
| 9 | Eski URL'lar → 301, topilmaganlar → 404 | `scripts/redirects-2027.json` (436), `tests/next-config.test.js`, curl matritsa | **Bajarildi** (304 tasi bo'lim darajasida — savol 5) |
| 10 | Narx, "savat", "yaratish" yo'q | `tests/*` + `npm run audit:seo` (kontent qoidalari) | **Bajarildi** |
| 11 | `screens/` bilan vizual mos (Onest, pill tugmalar, 14px kartochka, och fonlar) | `npm run shots` → `screens-actual/` ↔ `docs/design-handoff/screens/` | Brauzer kutilmoqda |

## Sandbox'da nima tekshirildi (2026-10-11 holatiga)

- `npm run audit:seo` — 35 marshrut: **0 xato, 0 ogohlantirish** (132 qayd: dekorativ
  `alt`, `[...]` placeholder'lar). Tekshirilgan: title/description uzunligi va tili,
  canonical, hreflang (4 til, mutlaq), meta robots, OG/Twitter, bitta `h1` va sarlavha
  ierarxiyasi, `alt`, havolalar (til prefiksi, o'chirilgan marshrut yo'q, `tel:` E.164,
  `rel=noopener`), forma `autocomplete`/honeypot, JSON-LD turlari va **narx yo'qligi**,
  JS+CSS gzip hajmi (zamonaviy ~167 KB / sahifa, `nomodule` polyfill 39 KB).
- `npm run audit:a11y` — 31 sahifa, axe-core WCAG 2.1 AA + best-practice:
  **0 buzilish**, 1139 o'tgan qoida. (`color-contrast` va `target-size` jsdom'da
  o'lchanmaydi — ular Lighthouse'da.)
- Ichki havolalar krawli: 186 manzil, **0 buzilgan** (`/uz/catalog/trotuar` kabi
  xato slug'lar topilib tuzatilgan).
- curl matritsa: 200/301/404 kutilgandek; `/sitemap.xml` (387 URL, mutlaq hreflang),
  `/robots.txt` (Disallow `/api/`, `/*/compare`, `/*/request`), `www → apex` 301.

## Screenshot solishtirish tartibi

1. `npm run shots` → `screens-actual/<ekran>-mobile.png` va `-desktop.png`.
2. Hisobotdagi jadval har bir haqiqiy suratni `docs/design-handoff/screens/` dagi
   etalon bilan juftlaydi (mobile 13, desktop 11, i18n 4 ekran).
3. `pixelmatch` + `pngjs` + `sharp` o'rnatilgan bo'lsa, jadvalda piksel farqi % ko'rsatiladi.
   Bu **yo'nalish beruvchi** son: etalonlar JPG va boshqa DPR'da olingan, shuning uchun
   0% chiqmaydi. Asosiy mezon — tartib, blok nisbati, rang, tipografika (ko'z bilan).
4. `docs/audits/visual-<sana>.md` da gorizontal scroll (390 va 360 px) va 44px dan
   kichik tegish maydonlari ro'yxati ham bo'ladi.

## Lighthouse byudjeti

`scripts/visual/lighthouse.mjs` HANDOFF §7 sonlarini byudjet qiladi: mobil
Performance ≥ 90, Accessibility ≥ 95, Best-practices ≥ 95, **SEO = 100**; desktop
Performance ≥ 95. Buzilish bo'lsa exit code 1 (CI'da ishlatish mumkin).
