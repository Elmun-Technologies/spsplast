# Lighthouse hisoboti

> Sana: 2026-11-23 · manba: `http://127.0.0.1:3000` · rejimlar: mobil (throttled) + desktop
> Byudjet (HANDOFF 7): mobil perf ≥ 90, desktop perf ≥ 95, a11y ≥ 95, best-practices ≥ 95, SEO = 100
> Yurishlar: 16 · byudjet buzilishi: **4**
> Har maqsad **1 marta** o'lchandi (PR rejimi, tez): ball ±10 ga sakrashi mumkin — byudjetga yaqin son shovqin bo'lishi ham mumkin. To'liq 3 martalik mediana `main` ga push'da yuradi.

## Ballar

| Sahifa | Rejim | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|---|
| `/uz` | mobile | 88 | 100 | 100 | 100 | 1.0 s | 3.3 s | 220 ms | 0 |
| `/uz` | desktop | 99 | 100 | 100 | 100 | 0.3 s | 0.9 s | 10 ms | 0 |
| `/uz/catalog` | mobile | 79 | 100 | 100 | 100 | 1.0 s | 3.7 s | 430 ms | 0 |
| `/uz/catalog` | desktop | 99 | 100 | 100 | 100 | 0.3 s | 0.8 s | 20 ms | 0 |
| `/uz/catalog/paving` | mobile | 75 | 100 | 100 | 100 | 1.2 s | 4.5 s | 380 ms | 0 |
| `/uz/catalog/paving` | desktop | 99 | 100 | 100 | 100 | 0.3 s | 1.0 s | 10 ms | 0 |
| `/uz/catalog/paving/01-monako` | mobile | 89 | 100 | 100 | 100 | 0.9 s | 3.5 s | 150 ms | 0 |
| `/uz/catalog/paving/01-monako` | desktop | 100 | 100 | 100 | 100 | 0.3 s | 0.8 s | 0 ms | 0 |
| `/uz/partners` | mobile | 98 | 100 | 100 | 100 | 0.9 s | 0.9 s | 170 ms | 0 |
| `/uz/partners` | desktop | 100 | 100 | 100 | 100 | 0.3 s | 0.3 s | 0 ms | 0 |
| `/uz/production` | mobile | 96 | 100 | 100 | 100 | 0.9 s | 2.7 s | 100 ms | 0 |
| `/uz/production` | desktop | 100 | 100 | 100 | 100 | 0.3 s | 0.7 s | 0 ms | 0 |
| `/uz/contact` | mobile | 99 | 100 | 100 | 100 | 0.9 s | 0.9 s | 100 ms | 0 |
| `/uz/contact` | desktop | 100 | 100 | 100 | 100 | 0.3 s | 0.3 s | 0 ms | 0 |
| `/ru` | mobile | 93 | 100 | 100 | 100 | 1.0 s | 2.8 s | 200 ms | 0 |
| `/ru` | desktop | 100 | 100 | 100 | 100 | 0.3 s | 0.7 s | 10 ms | 0 |

## Byudjet buzilishlari

- /uz (mobile): performance = 88 (byudjet 90)
- /uz/catalog (mobile): performance = 79 (byudjet 90)
- /uz/catalog/paving (mobile): performance = 75 (byudjet 90)
- /uz/catalog/paving/01-monako (mobile): performance = 89 (byudjet 90)

## Mobil performance tafsilotlari

### `/uz` — perf 88 (LCP 3.3 s, TBT 220 ms)

- Diagnostika: Largest Contentful Paint (3.3 s) · ~3344 ms
- Diagnostika: Total Blocking Time (220 ms) · ~224 ms
- Diagnostika: Use efficient cache lifetimes (Est savings of 2 KiB) · ~1785 ms
- Diagnostika: Forced reflow
- Diagnostika: Improve image delivery (Est savings of 68 KiB) · ~69901 ms
- Diagnostika: LCP request discovery

### `/uz/catalog` — perf 79 (LCP 3.7 s, TBT 430 ms)

- Diagnostika: Largest Contentful Paint (3.7 s) · ~3735 ms
- Diagnostika: Total Blocking Time (430 ms) · ~431 ms
- Diagnostika: Use efficient cache lifetimes (Est savings of 2 KiB) · ~1785 ms
- Diagnostika: Forced reflow
- Diagnostika: Improve image delivery (Est savings of 103 KiB) · ~105675 ms
- Diagnostika: Legacy JavaScript (Est savings of 14 KiB) · ~14189 ms

### `/uz/catalog/paving` — perf 75 (LCP 4.5 s, TBT 380 ms)

- Diagnostika: Largest Contentful Paint (4.5 s) · ~4482 ms
- Diagnostika: Total Blocking Time (380 ms) · ~375 ms
- Diagnostika: Use efficient cache lifetimes (Est savings of 1 KiB) · ~1143 ms
- Diagnostika: Forced reflow
- Diagnostika: Improve image delivery (Est savings of 103 KiB) · ~105675 ms
- Diagnostika: Legacy JavaScript (Est savings of 14 KiB) · ~14189 ms

### `/uz/catalog/paving/01-monako` — perf 89 (LCP 3.5 s, TBT 150 ms)

- Diagnostika: Largest Contentful Paint (3.5 s) · ~3487 ms
- Diagnostika: Use efficient cache lifetimes (Est savings of 0 KiB) · ~443 ms
- Diagnostika: Forced reflow
- Diagnostika: Improve image delivery (Est savings of 86 KiB) · ~87971 ms
- Diagnostika: Legacy JavaScript (Est savings of 14 KiB) · ~14189 ms
- Diagnostika: Network dependency tree

### `/uz/partners` — perf 98 (LCP 0.9 s, TBT 170 ms)

- Diagnostika: Use efficient cache lifetimes (Est savings of 0 KiB) · ~443 ms
- Diagnostika: Improve image delivery (Est savings of 35 KiB) · ~35972 ms
- Diagnostika: Legacy JavaScript (Est savings of 14 KiB) · ~14189 ms
- Diagnostika: Network dependency tree
- Diagnostika: Render-blocking requests
- Diagnostika: Max Potential First Input Delay (200 ms) · ~197 ms

### `/uz/production` — perf 96 (LCP 2.7 s, TBT 100 ms)

- Diagnostika: Largest Contentful Paint (2.7 s) · ~2697 ms
- Diagnostika: Use efficient cache lifetimes (Est savings of 0 KiB) · ~443 ms
- Diagnostika: LCP request discovery
- Diagnostika: Legacy JavaScript (Est savings of 14 KiB) · ~14189 ms
- Diagnostika: Network dependency tree
- Diagnostika: Render-blocking requests (Est savings of 60 ms) · ~59 ms

### `/uz/contact` — perf 99 (LCP 0.9 s, TBT 100 ms)

- Diagnostika: Use efficient cache lifetimes (Est savings of 0 KiB) · ~443 ms
- Diagnostika: Legacy JavaScript (Est savings of 14 KiB) · ~14189 ms
- Diagnostika: Network dependency tree
- Diagnostika: Render-blocking requests (Est savings of 30 ms) · ~29 ms
- Diagnostika: Max Potential First Input Delay (180 ms) · ~182 ms
- Diagnostika: Reduce unused CSS (Est savings of 13 KiB)

### `/ru` — perf 93 (LCP 2.8 s, TBT 200 ms)

- Diagnostika: Largest Contentful Paint (2.8 s) · ~2842 ms
- Diagnostika: Use efficient cache lifetimes (Est savings of 2 KiB) · ~1785 ms
- Diagnostika: Forced reflow
- Diagnostika: Improve image delivery (Est savings of 68 KiB) · ~69901 ms
- Diagnostika: LCP request discovery
- Diagnostika: Legacy JavaScript (Est savings of 14 KiB) · ~14189 ms


## Ballni tushirgan auditlar (score < 1)

### `/uz/catalog/paving/01-monako` — desktop

- **best-practices / valid-source-maps** (score 0, weight 0) — Missing source maps for large first-party JavaScript
  - 

## Qayta ishga tushirish

```bash
npm run build && npm run start
npm run lighthouse         # yoki LH_ORIGIN=https://<vercel-preview> npm run lighthouse
```

Xom JSON natijalar: `docs/audits/lighthouse/*.json` (git'ga tushmaydi — hajmi katta).
