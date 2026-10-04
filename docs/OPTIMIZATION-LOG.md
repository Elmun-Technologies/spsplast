# SPS PLAST — Optimizatsiya jurnali

Bu hujjat `docs/MADANI-RAQOBAT-AUDITI.md` dagi P0/P1 vazifalar bo'yicha **nima
qilinganini** va **qanday tekshirilganini** qayd etadi. Har bir yozuv vazifa ID
bilan bog'langan — audit jadvali bilan birga o'qiladi.

---

## Batch 1 — Foundation: migratsiya, kontaktlar, sharhlar, PDF

**Sana:** 2026-10-04
**Branch:** `arena/01a10775-spsplast`
**Holat:** ✅ Bajarildi va tekshirildi (tsc · eslint · 93 test · production build · HTTP tekshiruvlari)

### Bajarilgan vazifalar

| ID | Vazifa | Holat |
|---|---|---|
| **P0-2** | Eski `sps.uz` URL'lari uchun 301 redirectlar | ✅ 21 manzil + `www` → apex |
| **P0-3** | Kontaktlarni to'ldirish (manzil, 4 telefon, ish vaqti, xarita) | ✅ `contacts.ts` yagona manba |
| **P0-4** | Soxta (mock) sharhlarni olib tashlash → real moderatsiyali tizim | ✅ DB + API + admin panel |
| **P0-7** | Katalog PDF ni saytga ulash | ✅ 108 bet, 15 MB |
| **U1** | `<html lang>` ni tilga moslashtirish | ✅ `HtmlLangSync` |
| **U3 (qism)** | Skip-link (allaqachon bor edi — auditda xato yozilgan) | ✅ Tasdiqlandi |
| **P1-4 (qism)** | Rekvizitlar bloki (INN, MFO, hisob raqami, bank) | ✅ Kontakt sahifasida |
| **P0-6 (qism)** | Repo gigienasi: takroriy 13 MB PDF olib tashlandi, katalog PDF `public/` ga o'tdi | ✅ |

---

### 1. P0-2 — Eski URL → yangi URL (301)

**Muammo:** `sps.uz` 2017-yildan beri indeksda; yangi saytga o'tishda o'sha
manzillar 404 bo'lib, organik trafik va link-massasi yo'qoladi.

**Yechim:** `next.config.js` ga `redirects()` bloki. Manbalar eski saytning
haqiqiy `sitemap.xml`idan olindi:

| Eski | Yangi (301) |
|---|---|
| `/` (til aniqlanadi) | `/ru` yoki `/uz` |
| `/about` | `/ru/about` |
| `/produkciya`, `/formi`, `/formi/p/*`, `/formi/image/*`, `/plitki`, `/kolodtsy`, `/bordyury-i-lotki` | `/ru/catalog` |
| `/uslugi`, `/proizvoditeli` | `/ru/production` |
| `/doc` | `/ru/delivery-payment` |
| `/otzyvy-o-nas` | `/ru/about` |
| `/fotogalereya` | `/ru/projects` |
| `/novosti`, `/novosti/news_post/*` | `/ru/blog` |
| `/napishite-nam`, `/kontakty` | `/ru/contact` |
| `/search` | `/ru/search` |
| `/karta-sayta`, `/user` | `/ru` |
| `www.sps.uz/*` | `https://sps.uz/*` |

**Nega `/ru`:** eski sayt butunlay rus tilida edi — shu manzillarga kelgan
foydalanuvchi ham, ularga havola bergan saytlar ham rus tilidagi sahifani
kutar edi.

**Qo'shimcha:** `middleware.ts` endi `/` manzilini til bo'yicha yo'naltiradi —
avval foydalanuvchi tanlagan til (`sps_lang` cookie, til almashtirgichda
yoziladi), keyin `Accept-Language`, aks holda `uz`.

**Tekshirildi (haqiqiy server):**
```
/formi                    301 -> /ru/catalog
/formi/p/2                301 -> /ru/catalog
/kontakty                 301 -> /ru/contact
/proizvoditeli            301 -> /ru/production
/novosti/news_post/...    301 -> /ru/blog
/user                     301 -> /ru
/  + Accept-Language: ru  301 -> /ru
/  + Accept-Language: uz  301 -> /uz
/  + Cookie: sps_lang=ru  301 -> /ru
```

---

### 2. P0-3 — Kontaktlar

**Muammo:** `contacts.ts` da manzil "Toshkent sh., Uzbekistan" edi (ko'cha, tuman,
uy raqami yo'q), bitta telefon, ish vaqti va xarita yo'q. Mijoz zavodga qanday
borishni bilmasdi.

**Yechim:** `src/lib/constants/contacts.ts` to'liq qayta yozildi — u endi butun
sayt uchun yagona manba:

- To'liq manzil: Uchtepa tumani, Xalqa yo'li ko'chasi, 7A (uz/ru + yuridik manzil)
- `phones[]` — 4 raqam, har biri izohli (savdo / buyurtmalar / ombor / ofis)
- Ish vaqti: Dushanba–Shanba, 09:00–18:00
- Yandex xarita: tashqi havola + `mapEmbedUrl` (iframe, API kalitsiz)
- `requisites`: hisob raqami, bank, MFO 00083, INN 301330578

**Ko'rinadigan joylar:** Footer (barcha raqamlar + ish vaqti + xarita havolasi),
Kontakt sahifasi (raqamlar ro'yxati, xarita iframe, rekvizitlar jadvali),
StickyMobileContact/Header (o'zgarmadi — asosiy raqam).

---

### 3. P0-4 — Real sharhlar tizimi

**Muammo:** `ProductReviews.tsx` ichida `MOCK_REVIEWS` — 3 ta o'ylab topilgan
sharh. Sayt hech qachon bo'lmagan mijoz fikrlarini ko'rsatardi (ishonch uchun
eng xatarli holat) va DB'da sharh modeli umuman yo'q edi.

**Yechim — to'liq oqim:**

1. **DB:** yangi `ProductReview` modeli (`prisma/schema.prisma`) — `status`
   (`PENDING` → `APPROVED` / `REJECTED`), `rating` 1–5, `phone` (saytda hech
   qachon ko'rinmaydi), indekslar `[productId, status]` va `[status, createdAt]`.
   `Product` ga `reviews` bog'lanishi qo'shildi.
2. **Public API** `POST /api/reviews` — rate-limit (IP uchun 30 daqiqada 5 ta),
   zod validatsiyasi, **honeypot** maydoni, mahsulot faolligini tekshirish,
   `PENDING` holatida saqlash, Telegram'ga moderatsiya xabari.
3. **Admin API** `PATCH/DELETE /api/admin/reviews/[id]` — sessiya tekshiruvi +
   `AuditLog` yozuvи + CSRF darvozasi (`middleware.ts`).
4. **Admin panel** `/admin/reviews` — filtr tablari (Kutilmoqda / Tasdiqlangan /
   Rad etilgan), tasdiqlash/rad etish/o'chirish tugmalari, mijoz telefoni faqat
   shu yerda ko'rinadi. `Navbar` ga "Sharhlar" bo'limi qo'shildi.
5. **Sayt:** `ProductReviews` faqat serverdan kelgan **tasdiqlangan** sharhlarni
   ko'rsatadi; bo'sh holatda "Hozircha sharh yo'q" + forma; yuborilgach
   "moderatsiyadan keyin e'lon qilinadi" (yolg'on "qo'shildi" effekti yo'q).
6. **SEO:** mahsulot JSON-LD'siga `AggregateRating` **faqat** tasdiqlangan
   sharhlar mavjud bo'lganda qo'shiladi (soxta reyting structured data — Google
   uchun spam signali).
7. **ProductTabs:** "Sharhlar" tab endi haqiqiy bo'lim bilan bog'langan
   (avval har doim "sharh yo'q" deb yozardi, hatto sharhlar bo'lsa ham).

**Muhim:** moderatsiya tizimi tufayli saytda darhol sharh paydo bo'lmaydi —
mijoz yozgach Telegram'ga xabar keladi va admin tasdiqlaydi.

---

### 4. P0-7 — PDF katalog

`SPS_Qoliplar_Katalogi_2026_full_compressed.pdf` (108 bet, 15 MB) →
`public/catalog/pdf/sps-qoliplar-katalogi-2026.pdf` ga ko'chirildi va ikkita
joyda havola qilindi: bosh sahifadagi yangi blok va Footer. Hajm va bet soni
oldindan ko'rsatiladi.

> Raqibda bu CTA bor, lekin u PDF bermaydi (katalog sahifasiga olib boradi) —
> bizda fayl haqiqiy va tekshirildi: `200 application/pdf 14 831 881 bayt`.

---

### 5. U1 — `<html lang>`

Butun ilova uchun bitta `<html>` elementi `app/layout.tsx` da turadi, shuning uchun
`/ru` sahifalarda ham `lang="uz"` qolardi. Yangi `HtmlLangSync` klient komponenti
tilni hydration'dan keyin `useEffect` orqali tuzatadi (`[lang]/layout.tsx` ga
o'rnatilgan).

> **Nega inline `<script>` emas:** HTML parse paytida atributni o'zgartirish React
> 19'da hydration mismatch keltirib, React atributni server qiymatiga qaytarishi
> mumkin edi. Uzoq muddatli yechim — route groups bilan har bir til uchun alohida
> root layout; bu alohida refaktor vazifasi.

---

### 6. Tekshiruv natijalari

| Tekshiruv | Buyruq | Natija |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | **0 xato** |
| ESLint | `npm run lint` | **0 ogohlantirish/xato** |
| Testlar | `npm test` | **93/93 o'tdi** |
| Prisma | `node scripts/prisma-generate.js` | Sxema valid, klient yangilandi |
| Build | `npm run build` | ✅ Compiled successfully, `/admin/reviews`, `/api/reviews`, `/api/admin/reviews/[id]` marshrutlari qurildi |
| 301 redirectlar | `curl` (production server) | ✅ 10/10 manzil to'g'ri |
| Til aniqlash | `curl -H "Accept-Language…"` | ✅ ru/uz/cookie holatlari |
| Kontakt sahifasi | `curl /uz/contact`, `/ru/contact` | ✅ xarita iframe, INN, 4 raqam, ish vaqti |
| PDF | `curl -I` | ✅ `200`, `application/pdf`, 14.8 MB |
| Sharh API | `curl POST/GET/PATCH` | ✅ 400 (validatsiya), 200 (honeypot, yozmaydi), 401 (sessiyasiz), 403 (CSRF) |
| Admin sahifa | `curl /admin/reviews` | ✅ `307` → `/admin/login` |

---

### 7. Deploy qadamlari (muhim!)

Sxema o'zgargani uchun productionda **albatta**:

```bash
npx prisma db push        # ProductReview jadvalini yaratadi
npm run build             # postinstall/build ichida prisma generate bor
```

`prisma db push` bajarilmasa, sharh API'si va mahsulot sahifasi
`ProductReview` jadvalini topmay xato beradi (`P2021`).

Keyin: yangi `/admin/reviews` bo'limi Navbar'da paydo bo'ladi.

---

### 8. Keyingi batch (Batch 2 dan keyin qolgani)

| Prioritet | Vazifa |
|---|---|
| P0-1 | Production deploy (`sps.uz` DNS, env, `db push`, `db:seed`, `db:import:content`) |
| P0-8 | Trust da'volari auditi — har raqam uchun dalil |
| P0-9 | E2E: buyurtma → Telegram → CRM → stock |
| P0-10/P0-12 | To'lov kalitlari holati, analitika ID'lari |
| P1-1/P1-2 | Ulgurji narx so'rovi va cennik PDF |
| P1-7 | Kategoriya sahifalariga SEO matn + FAQ |
| P1-13 | Home page'dagi 34 ta inline matnni lug'atga ko'chirish |
| P0-6 (davomi) | Ildizdagi 169 ta katta PNG (306 MB) ni `media-src/` ga surat yasab ko'chirish |
| P1-6 (davomi) | Og'irlik asosidagi yetkazib berish kalkulyatori |

---

## Batch 2 — Kontent: blog, loyihalar, buyurtma sahifasi, SEO

**Sana:** 2026-10-04 · **Holat:** kod tayyor, baza importi deploy'da bajariladi

Foydalanuvchi tanlovi bo'yicha: **kontent batch** (P0-5, P1-3, P1-6, P0-11) va
**ildiz media → `public/media/`** siyosati.

### 1. P0-6 — Media tartibi va yengil nusxalar

Repo ildizida 391 MB media (129 JPG + 169 PNG + 2 PDF) turardi. Endi:

| Joy | Nima | Hajm |
|---|---|---|
| `media-src/factory/` | 116 zavod kadri (`DSC*.JPG`) — master | 37 MB |
| `media-src/studio/` | 14 studiya surati (oq fonda qoliplar) | 3.4 MB |
| `media-src/pdf/` | 2 katalog PDF (139 bet / 137 bet) | 46 MB |
| `public/media/blog/` | 7 muqova (1600×900, q80) | 1.3 MB |
| `public/media/projects/` | 6 loyiha × "oldin/keyin" (900×900) | 1.4 MB |
| `public/media/production/` | 10 galereya surati (1200×900) | 476 KB |

Nusxalar `scripts/build-media.py` bilan yasaladi (idempotent, `--list` rejimi
bor). Skript master fayllarni `media-src/studio|factory|pdf` dan ham, repo
ildizidan ham topadi — shuning uchun ko'chirishdan oldin ham ishlagan.

**Loyihalar rasmining formati:** har bir `Изображение ChatGPT…png` — 2-in-1
kadr: chap yarmi real muhit, o'ng yarmi tayyor beton mahsulot. Skript shu
kadrni ikki yarmga bo'lib, `-before.jpg` va `-after.jpg` yasaydi — shuning
uchun loyihalar sahifasida "oldin/keyin" ko'rsatkichi haqiqiy materialga ega.

**Qoldi:** 169 ta katta PNG (306 MB) hali ildizda — ular uchun nusxa yasalgan,
keyingi qadamda `media-src/` ga ko'chiriladi.

### 2. P0-5 — 7 maqola va 6 loyiha

Kontent alohida faylda: `prisma/data/content-2026.json` (uz + ru).

| Maqola | Mavzu |
|---|---|
| `bruschatka-sexini-noldan-boshlash` | Sex ochish: bozor, xona, uskuna, qolip tanlash |
| `qolip-resursini-oshirish` | Qolip parvarishi va resursni uzaytirish |
| `devor-paneli-fasad-narxi-2026` | Panel/profil narxini belgilovchi omillar (S3 katalogi asosida) |
| `polipropilen-yoki-abs` | Material tanlash: kuchli va kuchsiz tomonlari |
| `beton-quyishda-5-xato` | Brak sabablari va yechimlari |
| `trotuar-plitka-ornatish` | O'rnatish: asos, chok, nishab |
| `dekorativ-qoliplar-bilan-hovli` | Hovli dizaynida dekorativ qoliplar |

Loyihalar: `1-xususiy-hovli-toshkent`, `2-devor-panellari-maxalla`,
`3-bog-dekor-skameykalar`, `4-kafe-hovlisi-mosaic`, `5-naqshli-trotuar-plita`,
`6-3d-fasad-panellari` — har biri joylashuv, ishlatilgan mahsulot va
"oldin/keyin" rasmi bilan.

**Muhim qoida:** maqolalarda isbotlanmagan raqam yo'q. Masalan "har bir qolip
N marta quyishga chidaydi" degan da'vo o'rniga "raqam model va ishlatish
shartlariga bog'liq" deb yozilgan (P0-8 tamoyili).

Maqola matni formati: `## ` h2, `### ` h3, `- ` ro'yxat, `> ` iqtibos; bloklar
bo'sh qator bilan ajratiladi. Parser — `src/lib/blogContent.ts`, testi —
`tests/blogContent.test.js` (parser haqiqiy matnni to'g'ri o'qishini tekshiradi).

### 3. P1-3 — "Qanday buyurtma berish" sahifasi

`/[lang]/how-to-order`: 4 qadam (tanlash → savat/1-klik → menejer tasdiqlashi →
yetkazish yoki olib ketish), 3 to'lov usuli, 5 savol-javob va aloqa CTA.
FAQ + HowTo **JSON-LD** qo'shilgan, sahifa tayyor statik (bazaga murojaat
qilmaydi). Havolalar: footer ("Hujjatlar" ustuni) va mobil menyu.

### 4. P1-6 — Yetkazib berish va to'lov sahifasi qayta yozildi

Ilgari matn faqat o'zbekcha edi (rus versiyada ham o'zbekcha chiqardi) va
"UZUM" ko'rsatilgan edi — backend esa faqat naqd, Click/Payme va bank
o'tkazmasini qabul qiladi. Endi:

- ikki tilda matn, "Toshkent / viloyatlar / olib ketish" uchun alohida bloklar;
- to'lov usullari haqiqiy ro'yxat bilan bir xil, ostida ogohlantirish:
  "to'lov faqat menejer tasdiqlagach, shaxsiy kartaga emas";
- sifat kafolati, ish vaqti/manzil va qaytarish bloklari.

Shu bilan birga **UZUM belgisi checkout va footer'dan ham olib tashlandi**
(o'rniga NAQD) — saytdagi imkoniyat backend'dagi imkoniyatga teng bo'lishi kerak.

### 5. P0-11 — SEO metama'lumotlar

Yangi `src/lib/seo.ts`:

- `pageMetadata()` — sarlavha, tavsif, canonical, **hreflang uz/ru/x-default**,
  `og:image`, Twitter kartasi;
- `noindexMetadata()` — savat, checkout, solishtirish, saralanganlar,
  buyurtma natijasi sahifalari uchun.

Qo'shilgan sahifalar: `/about`, `/production`, `/projects`, `/blog`, `/contact`,
`/delivery-payment`, `/returns`, `/privacy`, `/terms`, `/how-to-order`.
Bundan tashqari:

- `sitemap.ts`: `lastmod` faqat haqiqiy `updatedAt` bo'lgan dinamik sahifalarda
  (statik sahifalarda "bugun" sanasi yozilmaydi — raqibdagi xato), har bir
  yozuvda hreflang alternates, yangi sahifalar qo'shildi, keshlash 1 soat;
- bosh sahifa va katalogda `x-default` hreflang paydo bo'ldi.

### 6. Qo'shimcha: real suratlar saytda

`/production` sahifasida ilgari 2 ta umumiy katalog rasmi bor edi. Endi
`public/media/production/` dan 10 ta real sex/studия surati galereya bo'lib
chiqadi. `/projects` sahifasida esa "Oldin / Keyin" almashtirgichi qo'shildi
(`ProjectImageToggle`) — `beforeImage` mavjud bo'lganda ko'rinadi.

### 7. Tekshiruv natijalari

| Tekshiruv | Natija |
|---|---|
| `npx tsc --noEmit` | ✅ 0 xato |
| `npm run lint` | ✅ 0 ogohlantirish |
| `npm test` | ✅ 103/103 (5 ta yangi: kontent, 5 ta parser) |
| `npm run build` | ✅ Compiled successfully |
| `/uz/how-to-order`, `/ru/how-to-order` | ✅ 200, FAQ + HowTo JSON-LD (2 ta) |
| `/uz/delivery-payment` | ✅ 200, "UZUM" yo'q, kafolat bloklari bor |
| canonical / hreflang (x-default) | ✅ uchta `alternate` + canonical |
| `/sitemap.xml` | ✅ 72 ta `xhtml:link` alternates, statik sahifalarda `lastmod` yo'q |
| `/uz/cart`, `/uz/checkout`, `/uz/compare`, `/uz/wishlist` | ✅ `noindex, follow` |
| `public/media/**` (blog, projects, production) | ✅ 200 |
| `/production` galereyasi | ✅ 10 ta real surat `_next/image` orqali |

### 8. Deploy qadamlari (Batch 2 qo'shimchasi)

```bash
npx prisma db push            # sxema o'zgarmagan, lekin P0-1 bilan birga
npm run db:seed               # katalog + yangi 7 maqola + 6 loyiha
# YOKI mavjud bazaga faqat kontentni qo'shish uchun (hech narsani o'chirmaydi):
npm run db:import:content
```

`npm run db:import:content` — idempotent: mavjud loyiha/maqolani yangilaydi,
buyurtma va mahsulotlarga tegmaydi. `db:seed` esa katalogni to'liq qayta
yozadi (ehtiyot bo'ling: u avval eskisini o'chiradi).

### 9. Keyingi batch (taklif)

| Prioritet | Vazifa |
|---|---|
| P0-1 | Production deploy (`sps.uz` DNS, env, `db push`, seed/import, health-check) |
| P0-8 | Trust da'volari auditi — har raqam uchun dalil |
| P0-9 | E2E: buyurtma → Telegram → CRM → stock |
| P0-10/P0-12 | To'lov kalitlari holati, analitika ID'lari |
| P1-1/P1-2 | Ulgurji narx so'rovi va cennik PDF |
| P1-7 | Kategoriya sahifalariga SEO matn + FAQ |
| P0-6 (davomi) | 169 ta katta PNG (306 MB) ni `media-src/` ga ko'chirish |

---

## Batch 3 — Backendsiz arxitektura (T1) + zayafka oqimi (T3) + analitika/media (T4)

**Sana:** 2026-10-04
**Branch:** `arena/01a107c3-spsplast`
**Holat:** ✅ Bajarildi va tekshirildi (tsc · eslint · 41 test · production build · statik HTML)

Biznes modeli o'zgardi: sayt endi **do'kon emas, zayafka (lead) yig'uvchi sayt**.
Xaridor forma to'ldiradi → xabar Telegram guruhga tushadi → menejer qo'ng'iroq
qilib sotadi. Shu sababli Prisma, savat, buyurtma, to'lov va admin panel
butunlay olib tashlandi: sayt `DATABASE_URL` siz ham to'liq ishlaydi.

### 1. T1 — Prisma → statik katalog

| Nima | Natija |
|---|---|
| Manba | `catalog_build/products.json` + `data/molds-2026.json` + `data/content-2026.json` |
| Generator | `node scripts/build-static-catalog.js` → `src/data/catalog.json` (`--check` build'da majburiy) |
| Katalog hajmi | 192 mahsulot · 3 kategoriya (47/86/59) · 7 maqola · 6 loyiha |
| Runtime | `src/lib/catalog/*` — sinxron, tashqi so'rovsiz; `getProductsServer`, `getProductTranslation`, `getCategoryTree`, `getProjects`… |
| API | Faqat 2 ta marshrut qoldi: `POST /api/leads` va `GET /api/health` |
| Olib tashlandi | `prisma/`, seed/import skriptlari, admin panel, buyurtma/to'lov/cron/feed API'lari, `Dockerfile`, `fly.toml`, ikkala GitHub Actions workflow |

### 2. T3 — Zayafka oqimi

- `LeadModal` + `LeadButton` — bitta kompakt forma: **ism, telefon (+998 maskasi),
  mahsulot, miqdor, izoh**. Mahsulot sahifasida mahsulot nomi va SKU avtomatik
  qo'shiladi.
- Chaqiruv nuqtalari: ProductCard, QuickViewModal, mahsulot sahifasi (barcha
  CTA'lar + yopishqoq panel), Header, mobil yopishqoq panel, wishlist,
  solishtirish, B2B banner, kategoriya sahifalari.
- Telegram xabari kontekstni to'liq oladi: turi, ism, telefon, mahsulot + SKU,
  miqdor, izoh, **manba sahifa**, til, vaqt (Asia/Toshkent), UTM/gclid/fbclid.
- Himoya: HTML escape (`escapeTelegramHtml`), honeypot (`website`), IP bo'yicha
  rate limit (10 so'rov / 15 daqiqa), `x-forwarded-for` birinchi hop'i.
- Muvaffaqiyat holati formada ko'rsatiladi, `generate_lead` event yuboriladi.

### 3. T4 — P0-8 trust da'volari auditi

Olib tashlandi yoki tuzatildi (dalilsiz raqamlar):

| Ilgari | Endi |
|---|---|
| "100+ dona −5% / 500+ dona −10%" | "Narx hajmga bog'liq" |
| "10–49 dona −5%, 50+ dona −10%" (AI yordamchi) | individual kelishuv |
| "50 000 so'mdan, 1 000 000 so'mdan bepul" | "tarif manzil va hajmga bog'liq" |
| "Toshkent 1–3 kun / 24 soat" ziddiyati | yagona manba: Toshkent — 1 ish kuni, viloyatlar — 1–3 ish kuni |
| "chegirma avtomatik qo'llanadi" | zayafka + menejer hisob-kitobi |
| Sharhlar bo'limi (moderatsiya imkonsiz) | butunlay olib tashlandi |

Bosh sahifa FAQ endi `src/lib/faq.ts` dan o'qiydi (uz/ru) — ko'rinadigan matn
va JSON-LD bir manbadan yasaladi.

### 4. T4 — P0-12 analitika

`src/components/analytics/AnalyticsScripts.tsx` root layout'da:
GTM → GA4 (GTM bo'lmasa to'g'ridan-to'g'ri `gtag`) → Yandex Metrica → Meta Pixel.
Har biri faqat env ID mavjud bo'lsa yuklanadi (`afterInteractive`), ID bo'lmasa
saytga bitta ham tashqi skript qo'shilmaydi. Hodisalar: `view_item`,
`view_item_list`, `search`, `share`, `add_to_wishlist`, `add_to_compare`,
`generate_lead` (`src/lib/analytics.ts`).

### 5. T4 — P0-6 media va P1-7 kategoriya SEO

- 169 ta katta PNG (306 MB) `media-src/masters/` ga ko'chirildi va git
  kuzatuvidan chiqarildi (`.gitignore`); `scripts/build-media.py` yangi joyni
  o'qiydi; repo ildizida master fayl qolmadi.
- Har bir kategoriya uchun statik sahifa: `/{lang}/catalog/{slug}` — mahsulot
  to'ri, **300+ so'z** (uz/ru) SEO matn, 5 ta FAQ + `FAQPage` JSON-LD, boshqa
  kategoriyalarga ichki havolalar. Test buni so'z soni bo'yicha tekshiradi.

### 6. Tekshiruv natijalari

| Tekshiruv | Natija |
|---|---|
| `npx tsc --noEmit` | ✅ 0 xato |
| `npm run lint` | ✅ 0 ogohlantirish |
| `npm test` | ✅ 41/41 (platform + static catalog + kontent + config) |
| `npm run build` (`DATABASE_URL` siz) | ✅ 441 statik sahifa, ~30 s |
| `/{lang}/catalog/{slug}` | ✅ 6 ta statik HTML (3 kategoriya × 2 til) |
| `/{lang}/product/{slug}` | ✅ 384 ta statik HTML (192 × 2) |
| `/uz/api/health` | ✅ Telegram holati, majburiy env yo'q bo'lsa `degraded` |

### 7. Deploy (Vercel)

```bash
# Vercel → Environment Variables
NEXT_PUBLIC_SITE_URL=https://sps.uz
TELEGRAM_BOT_TOKEN=...          # @BotFather
TELEGRAM_CHAT_ID=...            # kompaniya guruhi
NEXT_PUBLIC_GTM_ID=...          # ixtiyoriy
NEXT_PUBLIC_GA_MEASUREMENT_ID=...
NEXT_PUBLIC_YANDEX_METRICA_ID=...
NEXT_PUBLIC_META_PIXEL_ID=...   # ixtiyoriy
```

Baza, `prisma db push`, seed va Fly.io sozlamalari **kerak emas**.

### 8. Keyingi batch (taklif)

| Prioritet | Vazifa |
|---|---|
| P0-1 | `sps.uz` domenini Vercel'ga ulash, env'larni kiritish, health-check |
| P0-9 | Zayafka E2E sinovi: forma → Telegram guruh (uz/ru), honeypot/rate-limit |
| P1-1/P1-2 | Ulgurji narx so'rovi oqimini zayafka formasiga birlashtirish, cennik PDF |
| P1-13 | Bosh sahifadagi inline matnlarni lug'atga ko'chirish |
| P0-11 | Rich Results Test'da JSON-LD (Product, FAQPage, HowTo) validatsiyasi |
