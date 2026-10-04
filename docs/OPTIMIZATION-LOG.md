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

### 8. Keyingi batch (taklif)

| Prioritet | Vazifa |
|---|---|
| P0-1 | Production deploy (`sps.uz` DNS, env, `db push`, seed) |
| P0-5 | Blog (6 maqola) + loyihalar (6 keys) kontenti |
| P0-8 | Trust da'volari auditi — har raqam uchun dalil |
| P0-9 | E2E: buyurtma → Telegram → CRM → stock |
| P0-10/P0-12 | To'lov kalitlari holati, analitika ID'lari |
| P0-11 | `og:image` har mahsulot uchun, statik sahifalarda hreflang |
| P1-3 | "Qanday buyurtma berish" sahifasi (raqibda bor, bizda yo'q) |
| P1-6 | Yetkazib berish jadvali va narx siyosati |
| P1-7 | Kategoriya sahifalariga SEO matn + FAQ |
| P1-13 | Home page'dagi 34 ta inline matnni lug'atga ko'chirish |
| P0-6 (davomi) | Ildizdagi 129 rasm va 2 PDF ni arxivga/S3 ga chiqarish |
