# SPS Plast — bosqichma-bosqich ishga tushirish (2027)

**Yangilangan:** 2026-10-18 · Admin sozlash tafsilotlari: `docs/ADMIN.md`

Tartib muhim: avval yopiq (preview) muhitda hammasi sinaladi, keyin domen ulanadi.
Har bir qadam oxirida "tekshiruv" bandi bajarilmaguncha keyingisiga o'tilmaydi.

## 1-qadam. Vercel loyiha va baza (1 kun)

- [ ] Repo Vercel'ga ulangan (framework: Next.js, build: `npm run build`), PR'lar uchun preview yoqilgan.
- [ ] Postgres baza: Vercel → Storage → **Neon** (yoki Supabase). Production va Preview uchun **alohida** baza.
- [ ] Environment Variables (Production + Preview):
  - `DATABASE_URL` — baza ulanishi
  - `NEXT_PUBLIC_SITE_URL=https://sps.uz` (preview'da preview manzili)
  - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — savdo guruhi (`@BotFather`, `@userinfobot`)
  - `VERCEL_DEPLOY_HOOK_URL` — Settings → Git → Deploy Hooks (`main`)
  - `SNAPSHOT_REQUIRED=1` — faqat Production
- [ ] Lokal kompyuterdan bir marta:
  ```bash
  DATABASE_URL=... npm run db:migrate
  DATABASE_URL=... npm run catalog:import
  DATABASE_URL=... ADMIN_PASSWORD='...' npm run admin:create -- --email boss@sps.uz --name "Rahbar" --role admin
  ```
- [ ] **Tekshiruv:** `/api/health` → `"status": "ok"`, `"database": "connected"`, `"telegram": "configured"`.

## 2-qadam. Admin panelni to'ldirish (2–5 kun, biznes jamoasi)

- [ ] `/admin` ga kirish, xodimlarni qo'shish (Xodimlar), har biri o'z parolini almashtiradi (Profil).
- [ ] **Sozlamalar → Kontaktlar:** telefonlar, Telegram, Instagram, **e-pochta**, manzil (3 tilda).
- [ ] **Sozlamalar → Raqamlar:** tajriba yili, quvvat, obyektlar, **eksport davlatlari soni va ro'yxati** (hozir 8 — 10+ bo'lsa yangilang).
- [ ] **Mahsulotlar:**
  - "Rasmsiz" filtri — 52 model: rasm yuklang (AI fonni o'zi olib tashlaydi) yoki "Arxiv"ga oling.
  - "Ruscha nomsiz / Inglizcha nomsiz" — haqiqiy tarjimalarni kiriting (hozir avtomatik transliteratsiya).
  - Termopanel va fasad dekor (76 ta qoralama): rasm + RU/EN matn → "Nashrda".
- [ ] **Nashr qilish** → 3–5 daqiqadan keyin saytda tekshirish.
- [ ] **Tekshiruv:** preview saytda har bir bo'lim, 5–10 ta model sahifasi (uz/ru/en), telefonda ham.

## 3-qadam. Zayafka oqimi (eng muhim, 1 kun)

- [ ] Har bir formadan sinov zayafkasi: tez zayafka (kartochka), zayafka ro'yxati, ulgurji forma, model sahifasi.
- [ ] Telegram guruhga xabar keladi, "Admin'da ochish" havolasi ishlaydi.
- [ ] Admin → Zayafkalar: raqam `SPS-YYMM-0001` ketma-ket, "Mijoz yo'li" ko'rinadi.
- [ ] Menejer telefondan: holat o'zgartirish, izoh, mas'ul tayinlash, CSV yuklab olish.
- [ ] Telegram token vaqtincha noto'g'ri qilinsa ham zayafka admin'da qoladi ("Telegram'ga yetmagan").
- [ ] Sinov zayafkalarini "Rad etildi (test)" holatiga o'tkazing.

## 4-qadam. Analitika va SEO (1 kun)

- [ ] Admin → Sozlamalar → Integratsiyalar: Yandex Metrica, GA4 (yoki GTM), Meta Pixel ID'lari; Search Console,
      Yandex Webmaster, Bing tasdiqlash kodlari → **Nashr qilish**.
- [ ] Search Console va Yandex Webmaster'da sayt tasdiqlandi, `https://sps.uz/sitemap.xml` yuborildi.
- [ ] Metrica'da maqsadlar: `generate_lead`, `add_to_request`, `contact_click` (sayt avtomatik yuboradi).
- [ ] Admin → Tashriflar: o'z tashrifingiz ko'rinadi (davlat, qurilma, manba).
- [ ] **Tekshiruv:** CI (GitHub Actions) yashil — testlar, SEO/a11y audit, skrinshotlar, Lighthouse hisoboti.

## 5-qadam. Domen (yarim kun, kam tashrif vaqtida)

- [ ] Vercel → Domains: `sps.uz` (apex) + `www.sps.uz`; DNS yozuvlari Vercel ko'rsatmasi bo'yicha.
- [ ] HTTPS faol; `www` → apex 301; eski manzillar (blog, eski mahsulotlar) 301 bilan yangi sahifalarga.
- [ ] `NEXT_PUBLIC_SITE_URL=https://sps.uz` → qayta deploy.
- [ ] **Tekshiruv:** `curl -I https://www.sps.uz` → 301; 5 ta eski URL → 301 → 200; `/robots.txt`, `/sitemap.xml`.

## 6-qadam. Birinchi 2 hafta (kuzatuv)

- [ ] Har kuni: admin → Zayafkalar (yangi zayafkalar 24 soat ichida "Bog'lanildi").
- [ ] Har hafta: Tashriflar → manbalar va davlatlar; Search Console → indeks xatolari.
- [ ] Biznesdan kutilayotganlar: yakuniy 2027 PDF katalog (uz/ru/en), zavod/ombor/obyekt suratlari,
      ulgurji shartlar, yuridik nom — `docs/unresolved-questions.md`.

## Orqaga qaytarish (rollback)

- Sayt: Vercel → Deployments → oldingi deploy → "Promote to Production" (1 daqiqa).
- Admin'dagi noto'g'ri nashr: mahsulotni tuzatib qayta "Nashr qilish" yoki oldingi deploy'ni promote qilish.
- Baza: Neon/Supabase avtomatik zaxira (point-in-time restore) — tarifda yoqilganini tekshiring.
