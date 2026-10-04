# SPS PLAST — kontent va media almashtirish ro'yxati

> 2026-10 yangilangan. Saytda admin panel, media yuklash va baza **yo'q**:
> barcha rasm va matn repozitoriy ichidagi statik fayllardan o'qiladi.
> Bu hujjat fotografdan yangi kadrlar kelganda nima va qanday formatda
> kerakligini belgilaydi.

## 1. Logo va brend fayllari

| Fayl | Hozirgi holat | Kerakli real fayl | O'lcham / format | Qayerda ishlatiladi |
|---|---|---|---|---|
| Asosiy logo | Vektor SVG belgi + `SPS PLAST` yozuvi | Rasmiy vektor logo | SVG yoki PNG (shaffof, 400×100) | Header, Footer, mobil menyu |
| Favicon | Brend belgisidan yasalgan `.ico` / PNG | Rasmiy ikonka | 32×32 ICO, 192×192 PNG | Brauzer yorlig'i |
| OG rasm | `public/images/og-logo.jpg` | Zavod yoki mahsulot kompozitsiyasi | 1200×630 JPEG/PNG | Ijtimoiy tarmoq preview (layout + `seo.ts`) |

Fayllar: `public/favicon.ico`, `public/icons/`, `public/images/og-logo.jpg`.

## 2. Sayt bo'ylab kerakli kadrlar

| Bo'lim | Hozirgi manba | Kerakli real kadr | Manzil | Nisbat |
|---|---|---|---|---|
| Kategoriya kartasi | `public/catalog/*` (`catalog-*.jpg`) | Tosh qolipining aniq kadri | `data/molds-2026.json` → `image` | 1:1 (800×800) |
| Mahsulot kartasi / galereya | `public/catalog/*` | Qolip + tayyor natija | `catalog.json` → `images[]` | 1:1 (min. 1200×1200) |
| Ishlab chiqarish galereyasi | `public/media/production/*` | Sex, stanok, saqlash ombori | `build-media.py` → `production` | 4:3 (1200×900) |
| Loyihalar (oldin/keyin) | `public/media/projects/*` | Obyekt va undan quyilgan beton buyum | `build-media.py` → `projects` | 1:1 (900×900) |
| Blog muqovalari | `public/media/blog/*` | Mavzuga mos real kadr | `build-media.py` → `blog` | 16:9 (1600×900) |

## 3. Mahsulot surati standarti

Har bir mahsulot kartasi uchun minimal to'plam:

1. **MAIN (asosiy rasm)** — neytral/oq fonda butun qolip, 1:1 yoki 4:3.
2. **MOLD (qolip)** — aniq o'sha jismoniy qolip kadri.
3. **FINISHED_RESULT (tayyor natija)** — shu qolipda quyilgan beton buyum.
4. **DIMENSION (o'lcham)** — balandlik/kenglik/qalinlik ko'rinadigan chizma yoki rasm.
5. **DETAIL (detal)** — tekstura, material zichligi yoki qulfning yaqin kadri.
6. **USAGE (ishlatilish)** — beton quyish yoki o'rnatish jarayoni.

**Texnik talablar:** katalog/detal uchun min. 1200×1200 px, hero/banner uchun
1920×1080 px; bitta fayl ≤ 10 MB; formatlar WebP/JPEG/PNG (yuklashdan oldin
`python3 scripts/build-media.py` avtomatik optimallashtiradi).

## 4. Qanday yangilanadi (admin panel yo'q)

1. Asl katta fayllarni `media-src/` ichiga qo'ying — skript o'qiydigan papkalar:
   `masters/` (169 ta asl PNG), `studio/` (2026 studiya seriyasi), `factory/`,
   `pdf/`. Papka git'da kuzatilmaydi (`.gitignore`), ya'ni repo hajmi o'smaydi.
2. `python3 scripts/build-media.py` ishga tushiring — yengil nusxalar
   `public/media/` va `public/catalog/` ga tushadi (maks. 1200 px, WebP/JPEG).
3. Mahsulot matni va rasm yo'lini `data/molds-2026.json`
   (yoki 2026 studiya seriyasi uchun `catalog_build/products.json`) da yangilang.
4. `node scripts/build-static-catalog.js` → `src/data/catalog.json` qayta yasaladi;
   `node scripts/build-static-catalog.js --check` tekshiradi.
5. `npx tsc --noEmit && npm run lint && npm test && npm run build` — gate.

## 5. Kontaktlar va da'volar — yagona manba

- **Kontaktlar:** `src/lib/constants/contacts.ts` (telefon, Telegram, WhatsApp,
  manzil, ish vaqti, xarita koordinatalari, rekvizitlar). Header, Footer,
  kontakt sahifasi va JSON-LD shu fayldan o'qiydi — matnni faqat shu yerda
  o'zgartirish kerak.
- **Da'vo qoidasi:** tasdiqlanmagan raqam saytga chiqmaydi. Raqam yo'q bo'lsa
  "modelga bog'liq" yoziladi (masalan, qolipning xizmat muddati). Tasdiqlangan
  raqamlar: telefon, manzil, ish vaqti, katalogdagi o'lchamlar va material.
- **Narx:** katalogda narx ko'rsatilmaydi → har bir kartada "Narx so'rash".
  Zayafka formasi orqali menejer hisob-kitob qiladi.

## 6. Almashtirilgandan keyin tekshirish

- [ ] Yangi rasm `public/media/` da mavjud va sahifada ko'rinadi (dev serverda ochib ko'rish).
- [ ] Muqova rasm blog/loyiha kartasida 16:9 / 3:2 nisbatda kesilmaydi.
- [ ] `alt` matni mahsulot nomiga mos (i18n: uz/ru ikkalasi ham).
- [ ] `npm test` — `tests/staticCatalog.test.js` rasm yo'llarini tekshiradi.
