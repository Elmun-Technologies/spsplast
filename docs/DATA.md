# SPS PLAST — ma'lumotlar (statik katalog)

**Yangilangan:** 2026-10-04

## Nega baza yo'q

Sayt do'kon emas: buyurtma, to'lov va admin panel yo'q. Barcha kontent katalog
generatsiyasi paytida JSON faylga yoziladi va git'da saqlanadi — shu sababli
sayt `DATABASE_URL` umuman bo'lmasa ham to'liq ishlaydi.

## Manbalar

| Fayl | Nima bor |
|---|---|
| `catalog_build/products.json` | Katalogdagi mahsulotlar (nomlar, o'lchamlar, rasm yo'llari) |
| `data/molds-2026.json` | Studiya seriyali qoliplar va variant o'qlari |
| `data/content-2026.json` | Blog maqolalari (7) va loyihalar (6) — uz/ru |
| `scripts/static/seed-data.js` | RU nomlar, bo'limlar, qo'lda kiritilgan modellar |

## Natija

`node scripts/build-static-catalog.js` → `src/data/catalog.json`:

- **192 mahsulot**, har biri ikki tilda (nom, slug, tavsif, atributlar)
- **3 kategoriya**: `cat-s1` bruschatka/trotuar (47), `cat-s2` dekorativ plita (86),
  `cat-s3` panel/profil (59)
- **7 blog maqolasi**, **6 loyiha** — muqova va "oldin/keyin" rasmlari bilan
- Har bir media yo'li `public/` ichida mavjudligi tekshiriladi

## Buyruqlar

```bash
npm run catalog:build   # qayta yasash
npm run catalog:check   # eskirganini tekshirish (build oldidan majburiy)
npm run media:build     # media-src masterlaridan public/media yasash
```

`npm run build` avval `catalog:check` ni ishlatadi: JSON manbalarga mos
kelmasa build to'xtaydi — eski katalog bilan deploy bo'lib qolmaydi.

## Media qoidalari

- **Masterlar** `media-src/` da: `masters/` (169 PNG, ~306 MB) git'ga
  kirmaydi (`.gitignore`), `factory/`, `studio/`, `pdf/` esa kuzatiladi.
- **Sayt uchun nusxalar** `public/media/` (blog, loyihalar, ishlab chiqarish) va
  `public/catalog/` (mahsulot rasmlari) da — faqat ular deploy'ga chiqadi.
- Yangi master qo'shsangiz: `scripts/build-media.py` ga yozuv qo'shib,
  `npm run media:build` ni ishga tushiring.

## Testlar

`tests/staticCatalog.test.js` generatsiya natijasini tekshiradi (hajm, unikal
SKU/slug, ikki tillilik, media mavjudligi, kategoriya sonlari).
