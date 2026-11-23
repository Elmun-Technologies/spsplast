# Sifat hisoboti — spsplast.uz

**Sana:** 2026-11-23 · **Versiya:** redesign 2027 + katalog 2026-11-23 (234 model, 7 bo'lim) + UX/naqshlar.

## Xulosa

| Yo'nalish | Natija | Holat |
|---|---|---|
| Avtomatik testlar | 197 / 197 o'tdi | ✅ |
| SEO texnik audit (52 sahifa, 3 til) | 0 xato, 0 ogohlantirish | ✅ |
| Qulaylik — WCAG 2.1 AA (axe, 48 sahifa) | 0 buzilish | ✅ |
| Lighthouse: Accessibility / Best Practices / SEO | 100 / 100 / 100 — barcha sahifada, mobil va desktop | ✅ |
| Lighthouse Performance — desktop | 99–100 | ✅ |
| Lighthouse Performance — mobil | 88–99; katalog ro'yxati sahifalari 75–89 | ⚠️ maqsad 90 |
| Gorizontal scroll (390 / 1440 / 360 px) | yo'q | ✅ |
| Sahifa JS + CSS (gzip) | 168–186 KB (byudjet 200 KB) | ✅ |
| Layout siljishi (CLS) | 0 — barcha o'lchangan sahifalarda | ✅ |

## Lighthouse (2026-11-23)

Mobil — sekin 4G va 4× sekinlashtirilgan protsessor simulyatsiyasi (Google'ning standart sinovi). Bitta o'lchov,
ishlab chiquvchi muhitida; rasmiy medianani CI (GitHub Actions, 3 o'lchov) beradi — ± 5–10 ball tebranadi
(bir sahifa ketma-ket 82 va 89 oldi).

| Sahifa | Mobil perf | Desktop perf | A11y | BP | SEO | LCP mobil | CLS |
|---|---|---|---|---|---|---|---|
| Bosh sahifa `/uz` | 88 | 99 | 100 | 100 | 100 | 3.2 s | 0 |
| Bosh sahifa `/ru` | 93 | 100 | 100 | 100 | 100 | — | 0 |
| Katalog `/uz/catalog` | 79–89 | 99 | 100 | 100 | 100 | 3.4–4.0 s | 0 |
| Bo'lim `/uz/catalog/paving` | 75–87 | 99 | 100 | 100 | 100 | 2.8–4.2 s | 0 |
| Model `/uz/catalog/paving/01-monako` | 86–89 | 100 | 100 | 100 | 100 | 3.5 s | 0 |
| Ulgurji `/uz/partners` | 98 | 100 | 100 | 100 | 100 | — | 0 |
| Ishlab chiqarish `/uz/production` | 96 | 100 | 100 | 100 | 100 | — | 0 |
| Kontakt `/uz/contact` | 99 | 100 | 100 | 100 | 100 | — | 0 |

**Nega katalog sahifalari pastroq:** sahifada 24 ta kartochka rasm bilan va butun bo'lim filtri brauzerda ishlaydi
(qidiruv, saralash, filtr — serverga so'rovsiz, darhol). Asosiy vaqt — React'ning sahifani "jonlantirish"i
(TBT 200–360 ms). Haqiqiy foydalanuvchida (Chrome UX hisoboti) raqam odatda simulyatsiyadan yaxshi bo'ladi —
Search Console → "Core Web Vitals" 28 kunlik ma'lumot yig'ilgach tekshiriladi.

**Shu bosqichda qilingan tezlik ishlari:**
- Har sahifa JS'i 213–222 KB → 168–186 KB: uch tilning lug'ati va katalog ro'yxati faqat kerak bo'lganda yuklanadi.
- Naqsh bezaklari `mask` orqali chiziladi — birinchi ekranda "eng katta element" (LCP) bo'lib qolmaydi;
  naqsh fayllari 187 KB → 70 KB (8 rangli lossless WebP, jami 8 fayl).
- Rasmlar: WebP, o'lchamga mos variantlar, birinchi kartochka rasmi ustuvor yuklanadi, qolganlari dangasa (lazy).
- Server: Docker standalone image (Coolify diski to'lmasligi uchun), statik sahifalar — har so'rovda server hisob
  qilmaydi.

## SEO

- 3 til (uz/ru/en), har sahifada canonical + hreflang (`x-default` → rus tili, MDH bozori uchun).
- Sitemap: indekslanadigan sahifalar 3 tilda; rasmsiz model va foydalanuvchi sahifalari (`/compare`, `/request`)
  `noindex`.
- Strukturalangan ma'lumot (JSON-LD): Organization, WebSite, LocalBusiness, BreadcrumbList, Product (**narxsiz** —
  biznes qoidasi), FAQPage, ItemList.
- SEO landinglar: 7 teg sahifasi + 8 eksport davlati sahifasi (3 tilda).
- Eski saytdan ~500 ta 301 yo'naltirish (eski mahsulot va kategoriya manzillari yangi sahifalarga).

## Xavfsizlik

- Sirlar faqat server muhitida (Coolify env); repoda va saytning JS'ida token yo'q (test bilan nazorat).
- Content-Security-Policy: sayt uchun — ruxsat etilgan manbalar ro'yxati; admin uchun — qat'iyroq, nonce bilan.
- Zayafka API: boshqa saytdan yuborishni rad etadi, hajm cheklovi, honeypot, IP bo'yicha limit (IP xeshlangan,
  ochiq saqlanmaydi, 24 soatdan keyin o'chadi).
- Admin: parol xeshi, sessiya cookie, IP va e-pochta bo'yicha urinish limiti, rollar (Administrator / Menejer).
- Zayafka avval bazaga yoziladi, keyin Telegram'ga — Telegram ishlamasa ham yo'qolmaydi.
- CI'da `npm audit` (yuqori darajadagi zaifliklar build'ni to'xtatadi), Dependabot har hafta.

## Ochiq qolganlar (kod emas — biznes ma'lumoti)

- Haqiqiy mijoz sharhlari, obyekt suratlari, sertifikatlar — admin'da joy tayyor, bo'sh bo'lsa sahifada ko'rinmaydi.
- Ayrim modellarning tirik surati (hozir 3D vizualizatsiya, sahifada shunday belgilangan).
- Trotuar modellarining ruscha/inglizcha nomlari (hozir avtomatik transliteratsiya).
- Minimal buyurtma, ishlab chiqarish muddati, to'lov shartlari — saytda "menejer bilan kelishiladi".

Batafsil: `docs/unresolved-questions.md`, `docs/data-questions.md`.

## Qayta tekshirish

```bash
npm test && npm run typecheck && npm run lint
npm run build && npm run start      # alohida terminalda
npm run audit                       # SEO + a11y → docs/audits/
npm run shots && npm run lighthouse # brauzer kerak (CI'da avtomatik)
```
