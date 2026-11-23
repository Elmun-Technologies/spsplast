# Ishga tushirish va topshirish checklisti

**Yangilangan:** 2026-11-23 · Hosting: **Hetzner + Coolify** (Vercel ishlatilmaydi) · Avvalgi Vercel varianti:
`docs/LAUNCH-CHECKLIST.md` (tarix uchun).

Har bo'lim oxiridagi **Tekshiruv** bajarilmaguncha keyingisiga o'tilmaydi. `[D]` — dasturchi, `[B]` — biznes jamoasi.

## 0. Kod (topshirishdan oldin) `[D]`

- [ ] PR'lar ketma-ket birlashtirilgan: #76 (katalog 2026-11-23) → #79 (JS hajmi) → #78 (Docker/standalone) →
      UX/naqshlar PR'i. Har biridan keyin CI yashil.
- [ ] `main` da CI yashil: testlar, typecheck, lint, SEO/a11y audit, skrinshotlar (gorizontal scroll yo'q), Lighthouse.
- [ ] Repoda sir yo'q: `src/data/site.generated.ts` = `null`, `src/data/redirects.generated.json` = `[]`,
      `.env*` commit qilinmagan.

## 1. Coolify sozlamalari `[D]`

- [ ] **Build Pack: Dockerfile** (Nixpacks emas). Port 3000.
- [ ] Environment Variables (Production):
  - `DATABASE_URL` — `sps-postgres` ulanishi; **Build Variable** belgisi + **"Use Docker Build Secrets"** yoqilgan
    (build vaqtida katalog bazadan olinadi, sir image qatlamlariga yozilmaydi)
  - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — savdo guruhi
  - `NEXT_PUBLIC_SITE_URL=https://spsplast.uz`
  - `SNAPSHOT_REQUIRED=1` — baza javob bermasa build to'xtaydi, eski versiya ishlashda qoladi
  - `DEPLOY_HOOK_URL`, `DEPLOY_HOOK_TOKEN` — admin'dagi "Nashr qilish" tugmasi uchun (`docs/ADMIN.md`)
  - `IP_HASH_SECRET` — tasodifiy uzun satr (zayafka rate-limit kalitlari uchun)
  - ixtiyoriy: `HEALTH_CHECK_TOKEN` — `/api/health` batafsil javobini yopish
- [ ] **Server → Docker Cleanup:** avtomatik, disk **75%** dan oshganda, kuniga; saqlanadigan image'lar — **2**.
      **"Delete unused volumes" YOQILMAYDI** (Postgres ma'lumotlari volume'da).
- [ ] Traefik label'lari: http→https middleware nomi **`redirect-to-https-sps`** (umumiy nom boshqa ilovalar bilan
      to'qnashadi — CLAUDE.md "Traefik"). Har domen uchun `http-N` va `https-N` router'lari bor.
- [ ] Katalogni bazaga sinxronlash (Coolify terminali, bir marta):
      `npm run catalog:sync -- scripts/catalog-add-2026-11-23.json` → **Redeploy**.
- [ ] **Tekshiruv:** `https://spsplast.uz/api/health` → `"status": "ok"`, baza `connected`, Telegram `configured`.
      Server diskida build'dan keyin bo'sh joy ≥ 25%.

## 2. Domen va yo'naltirishlar `[D]`

- [ ] DNS: `A @` va `A www` → server IP. HTTPS sertifikati faol.
- [ ] `www.spsplast.uz`, `spsplast.com`, `www.spsplast.com`, `sps.uz`, `www.sps.uz` → `https://spsplast.uz/…` 301/308
      (yo'l saqlanadi).
- [ ] **Tekshiruv:** `curl -I http://spsplast.uz` → https'ga; `curl -I https://sps.uz/produkciya` → yangi sahifaga;
      `/robots.txt` va `/sitemap.xml` ochiladi.
- [ ] `sps.uz` va `spsplast.com` domenlari kamida 1–2 yil uzaytirilib turiladi (eski havolalar vazni o'tishi uchun).

## 3. Admin panel `[B]` + `[D]`

- [ ] `[D]` Birinchi administrator yaratilgan (`npm run admin:create`), parolni rahbar o'zi almashtirgan.
- [ ] `[B]` Har xodim o'z hisobi bilan (umumiy login yo'q), rollar to'g'ri (Administrator / Menejer).
- [ ] `[B]` Sozlamalar → Kontaktlar va Raqamlar tekshirilgan (telefon, manzil, eksport davlatlari).
- [ ] `[B]` Mahsulotlar → "Rasmsiz", "Ruscha nomsiz", "Inglizcha nomsiz" filtrlari ko'rib chiqilgan.
- [ ] `[B]` Nashr qilish → 10 daqiqadan keyin o'zgarish saytda.
- [ ] **Tekshiruv:** menejer telefondan admin'ga kira oladi va zayafka holatini o'zgartira oladi.

## 4. Zayafka oqimi (eng muhim) `[B]` + `[D]`

- [ ] Har formadan sinov zayafkasi: model kartochkasi (tez zayafka), zayafka ro'yxati, ulgurji forma, model sahifasi,
      eksport sahifasi — uz, ru, en; telefon va kompyuterdan.
- [ ] Telegram guruhiga xabar keladi, "Admin'da ochish" havolasi ishlaydi.
- [ ] Admin → Zayafkalar: raqamlar `SPS-YYMM-NNNN` ketma-ket, mijoz yo'li ko'rinadi.
- [ ] Telegram ishlamay qolganda (bot vaqtincha guruhdan chiqarilsa) zayafka admin'da "Telegram'ga yetmagan"
      bo'lib qoladi va "qayta yuborish" ishlaydi.
- [ ] Sinov zayafkalari "Rad etildi" (izoh: test) qilingan.

## 5. Analitika va qidiruv tizimlari `[B]` + `[D]`

- [ ] Admin → Sozlamalar → Integratsiyalar: Yandex Metrica, GA4 yoki GTM, Meta Pixel; Search Console, Yandex
      Webmaster, Bing tasdiqlash kodlari → Nashr qilish.
- [ ] Search Console va Yandex Webmaster'da `https://spsplast.uz/sitemap.xml` yuborilgan; eski domenlar uchun
      "Change of Address" / "Переезд сайта".
- [ ] Metrica/GA4 maqsadlari: `generate_lead` (zayafka), `add_to_request`, `add_to_compare` (sayt o'zi yuboradi).
- [ ] Admin → Analitika → Ulanishlar: API kalitlari (`docs/ADMIN.md` → "Analitika va SEO'ni ulash").
- [ ] Admin → SEO → Salomatlik: qizil band yo'q. Admin → SEO → Indekslash: IndexNow yuborilgan.

## 6. Monitoring `[D]`

- [ ] Uptime monitor (UptimeRobot / Better Stack, bepul): `https://spsplast.uz/api/health` har 5 daqiqada,
      xato bo'lsa Telegram/e-pochtaga xabar.
- [ ] Postgres zaxira nusxasi: Coolify → `sps-postgres` → Backups — kunlik, kamida 7 kun saqlanadi;
      bir marta tiklab ko'rilgan.
- [ ] Coolify'da server diski va RAM ogohlantirishlari yoqilgan.

## 7. Topshirish `[B]` + `[D]`

- [ ] `docs/topshirish/KIRISHLAR.md` to'ldirilgan: har xizmatning egasi kompaniya hisobi (shaxsiy hisob emas),
      kamida 2 kishida kirish bor.
- [ ] Menejerlar bilan 30 daqiqalik ko'rsatuv: `ADMIN-QOLLANMA.md` 1, 2, 4, 5-bo'limlar.
- [ ] `SIFAT-HISOBOTI.md` rahbarga berilgan.
- [ ] Ochiq biznes savollari (`docs/unresolved-questions.md`): tirik suratlar, sertifikatlar, haqiqiy sharhlar,
      minimal buyurtma / muddat / to'lov shartlari — kim, qachon beradi, kelishilgan.

## 8. Birinchi 2 hafta

- [ ] Har kuni: yangi zayafkalar 24 soat ichida "Bog'lanildi"; "Telegram'ga yetmagan" = 0.
- [ ] Haftasiga: Search Console / Webmaster xatolari, admin → Tashriflar (manbalar, voronka).
- [ ] 2 haftadan keyin: qaysi model ko'p so'ralmoqda → bosh sahifa tartibi va reklama shunga moslanadi.
