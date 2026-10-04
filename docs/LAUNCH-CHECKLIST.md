# SPS PLAST — ishga tushirish ro'yxati (backendsiz)

**Yangilangan:** 2026-10-04

## 1. Domen va hosting

- [ ] Repo Vercel'ga ulangan, framework: Next.js, build: `npm run build`.
- [ ] `sps.uz` (apex) va `www.sps.uz` domenlari ulangan; `www` → apex 301
      (`next.config.js` da tayyor).
- [ ] HTTPS sertifikati faol (Vercel avtomatik beradi).
- [ ] Eski `sps.uz` manzillari 404 emas, 301 bilan yangi sahifalarga o'tadi.

## 2. Muhit o'zgaruvchilari (Vercel)

- [ ] `NEXT_PUBLIC_SITE_URL=https://sps.uz`
- [ ] `TELEGRAM_BOT_TOKEN` — `@BotFather`
- [ ] `TELEGRAM_CHAT_ID` — kompaniya guruhi ID'si
- [ ] Analitika ID'lari (agar ishlatilsa): GTM / GA4 / Yandex Metrica / Meta Pixel
- [ ] Baza, `DATABASE_URL`, Prisma va Fly.io sozlamalari **yo'q** — kerak emas.

## 3. Kontent tekshiruvi

- [ ] Katalog: 192 mahsulot, 3 kategoriya, har birida rasm va ikki tilda nom.
      (`npm run catalog:check` ✅)
- [ ] Blog: 7 maqola muqova rasmi bilan; loyihalar: 6 ta "oldin/keyin" juftligi.
- [ ] Kategoriya sahifalarida 300+ so'z matn va FAQ ko'rinadi (`/{lang}/catalog/{slug}`).
- [ ] Saytda tasdiqlanmagan raqam yo'q (chegirma %, bepul yetkazish chegarasi, tarif).

## 4. Zayafka oqimi (eng muhim)

- [ ] `/uz` va `/ru` da “Zayafka berish” tugmasi ishlaydi (header, mahsulot kartasi,
      mahsulot sahifasi, mobil panel).
- [ ] Forma maydonlari: ism, telefon (+998 maskasi), mahsulot, miqdor, izoh.
      Telefon noto'g'ri kiritilsa xato ko'rsatiladi.
- [ ] Test zayafka Telegram guruhga to'liq kontekst bilan tushadi (mahsulot, manba
      sahifa, til, vaqt).
- [ ] Honeypot ishlaydi: yashirin maydon to'ldirilsa xabar yuborilmaydi.
- [ ] Rate limit: 10+ so'rov / 15 daqiqa → 429.
- [ ] Muvaffaqiyat holati ko'rsatiladi, `generate_lead` event yuboriladi.

## 5. SEO va analitika

- [ ] `https://sps.uz/sitemap.xml` 200 va mahsulot/kategoriya havolalari bor.
- [ ] Canonical + hreflang (`uz`, `ru`, `x-default`) har sahifada.
- [ ] Rich Results Test: Product, FAQPage, HowTo, BreadcrumbList xatosiz.
- [ ] `/api/health` → `{status: "ok"}`.
- [ ] Analitika panelida `view_item` va `generate_lead` ko'rinadi.

## 6. Tezlik va sifat

- [ ] Lighthouse (mobil): Performance ≥ 90, Accessibility ≥ 95.
- [ ] `public/media/` va `public/catalog/` rasmlari 200 qaytaradi.
- [ ] `/uz` va `/ru` da matn to'liq mos tilda (aralash matn yo'q).
