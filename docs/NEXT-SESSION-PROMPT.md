# Keyingi Claude Code sessiyasi uchun topshiriq (copy-paste)

> Quyidagi `---` dan keyingi hamma matnni yangi Claude Code sessiyasiga (repo: `Elmun-Technologies/spsplast`)
> birinchi xabar qilib bering. Prompt o'zi yetarli — oldingi suhbatni bilish shart emas.

---

Sen **SPS Plast** saytining yetakchi dasturchisisan. Bu jiddiy tijorat loyihasi: O'zbekistondagi
zavod (beton plitka, fasad, termopanel, dekor va skameyka/stul oyoqlari uchun plastik qoliplar)
10+ davlatdagi B2B mijoz va distribyutorlarga sotadi. Sayt — **internet-do'kon emas**: narx, savat,
to'lov yo'q; mijoz **zayafka** qoldiradi → bazaga yoziladi → Telegram guruhga ketadi → menejer qo'ng'iroq
qiladi. Tillar: uz (asosiy), ru, en. Sening vazifang: **saytni ishga tushirish** va **UI'ni sifatli,
ishonchli (soxta ko'rinmaydigan) holatga yetkazish**.

## 0. Ishni boshlashdan oldin (majburiy, token tejash uchun shu tartibda)

1. `CLAUDE.md` ni to'liq o'qi — bu loyihaning qonunlari (biznes qoidalari, tuzoqlar, buyruqlar). Unga zid ish qilma.
2. So'ng faqat kerak bo'lganda: `docs/LAUNCH-CHECKLIST.md` (ishga tushirish rejasi), `docs/ADMIN.md`
   (admin panel), `docs/ROADMAP-2027.md` (tahlil va bosqichlar), `docs/unresolved-questions.md` (ochiq savollar),
   `docs/design-handoff/HANDOFF.md` (tasdiqlangan dizayn — UI bo'yicha yagona manba).
3. **Katta generatsiya qilingan fayllarni o'qima**: `src/data/models2027.ts`, `data/*.json`,
   `scripts/redirects-2027.json`, `drizzle/meta/*`, `public/admin-ai/*`, `media-src/*`. Kerak bo'lsa `grep`/`jq` bilan.
4. Muhitni tekshir: `npm ci && npm test && npm run typecheck && npm run lint` — hammasi yashil bo'lishi kerak
   (122 test). Yashil bo'lmasa, avval sababini top.

## 1. Loyiha holati (2026-10-18 dagi PR'dan keyin)

**Stack:** Next.js 15 (App Router) + React 19 + TypeScript, oddiy CSS (Tailwind taqiqlangan), Onest shrifti
(self-host), Postgres (Neon/Supabase) + Drizzle ORM faqat `src/server/` orqasida, Vercel.

**Ommaviy sayt** (`src/app/[lang]/*`): statik prerender (~400 sahifa). Bosh sahifa, katalog/bo'lim/model
(filtr, qidiruv, solishtirish, zayafka ro'yxati, qolip kalkulyatori), ulgurji, ishlab chiqarish, kontakt,
maxfiylik, 404. SEO: hreflang, sitemap, JSON-LD (narxsiz), 436 ta 301. Animatsiyalar: `MotionLayer.tsx` + CSS.

**Admin panel** (`/admin`, noindex):
- Zayafkalar CRM: holat (Yangi → Bog'lanildi → Taklif → Kelishildi/Rad etildi), mas'ul, izoh, tarix, CSV,
  "mijoz yo'li" (zayafkadan oldin saytda nimani ko'rgan).
- Tashriflar: o'z statistikamiz (cookie'siz, IP'siz) — onlayn, voronka, manba, davlat, model, qurilma.
- Mahsulotlar va bo'limlar: CRUD, 3 tilda nom, qolip/plitka jadvallari, rasm yuklash (brauzerda AI fon olib
  tashlash, WebP), to'liqlik ko'rsatkichi, nusxa olish, ommaviy nashr/arxiv.
- Sozlamalar: kontaktlar, saytdagi raqamlar (yil, quvvat, obyektlar, eksport davlatlari), integratsiyalar
  (GTM, GA4, Yandex Metrica, Meta/TikTok Pixel, Search Console, Yandex Webmaster, Bing).
- **"Nashr qilish"**: admin o'zgarishlari Vercel Deploy Hook orqali qayta build bilan saytga chiqadi
  (`scripts/export-snapshot.mjs` build boshida bazadan o'qiydi). Zayafka va tashriflar darhol ko'rinadi.

**Katalog ma'lumoti:** 119 model nashrda (52 tasi rasmsiz), 76 ta termopanel/fasad dekor qoralama
(rasm va RU/EN matn kutilmoqda). RU nomlar hozircha avtomatik kirillcha transliteratsiya.

## 2. Vazifalar (tartib bilan; har birini alohida commit, oxirida bitta PR)

### A. Ishga tushirish (P0) — `docs/LAUNCH-CHECKLIST.md` 1–5 qadamlar
Foydalanuvchidan (loyiha egasi) quyidagilarni **so'ra** — o'zing taxmin qilma, maxfiy qiymatlarni
repoga yozma: Vercel loyihasiga kirish, Neon/Supabase `DATABASE_URL` (prod va preview alohida),
`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, Deploy Hook URL, domen DNS'iga kirish.
Keyin: `db:migrate` → `catalog:import` → `admin:create` → `/api/health` ok → preview'da har bir formadan
sinov zayafkasi (Telegram + admin) → integratsiyalar → domen va 301 tekshiruvi. Har qadam natijasini
foydalanuvchiga qisqa xabar qil. Hech qachon `--force` push qilma, prod bazani o'chirma.

### B. UI'ni qayta ko'rib chiqish (P0/P1) — maqsad: "haqiqiy zavod saytidek" ko'rinish
1. Avval o'lcha: `npm run build && npm run start`, so'ng `PW_CHROMIUM_PATH=... npm run shots`
   (390/1440/360 px) va `npm run audit`. Skrinshotlarni o'zing ko'rib chiq va
   `docs/design-handoff/screens/` bilan solishtir.
2. Ma'lum qolgan muammolar (2026-10-18 UI auditidan):
   - Stok suratlar (ulgurji, ishlab chiqarish, bosh sahifadagi port/ombor/usta) — biznesdan haqiqiy zavod,
     ombor, yuklash, obyekt suratlarini so'ra; kelguncha mahsulot suratlari yoki rasmsiz tartib.
   - Bosh sahifa hero: kuchli haqiqiy surat va aniq CTA (Zayafka + Katalog) yo'q.
   - Katalog sahifasi sarlavhasi maketdagidan kambag'al (och fon bandi, lead matn, PDF+Zayafka tugmalari).
   - Fasad/dekor/skameyka bo'limlarida filtrlar trotuarga moslangan; "Bo'lim" filtri va "Yordam kerakmi?" bloki yo'q.
   - Kartochkalarda har birida to'liq qizil "Zayafka" tugmasi (HANDOFF shuni talab qiladi, lekin sahifada
     juda ko'p qizil) — foydalanuvchiga 2 variant skrinshot bilan ko'rsatib, qaror so'ra.
   - Root 404 da header/footer yo'q; eksport xaritasi faqat o'zbekcha yozuvli rasm (RU/EN uchun SVG yoki alohida rasm).
   - Kontakt sahifasidagi "xarita" — oddiy blok (statik xarita rasmi + "Xaritada ochish").
   - Footer: yuridik nom, STIR, e-pochta (admin'dan) — biznesdan so'ra.
   - Ro'yxat ko'rinishida (list view) bo'sh joylar; o'zbekcha apostroflar uch xil (', ’, ʻ) — bittaga keltir va test yoz.
   - 22 ta eski studiya qolip surati va plitka suratlari kichik manbadan — xira; yangi suratlar kelguncha
     kartochkada sahna rasmini ustun qo'y.
3. Har bir o'zgarishdan keyin: 390 va 1440 px skrinshot, gorizontal scroll yo'q, `npm run audit` 0 xato.
   Lighthouse (CI yoki `npm run lighthouse`): mobil Performance ≥ 90, A11y ≥ 95, SEO 100.
   JS+CSS gzip byudjeti sahifaga ≤ 200 KB (hozir ~181 KB) — yangi kutubxona qo'shma.

### C. Keyingi imkoniyatlar (P2, A va B dan keyin, foydalanuvchi tasdig'i bilan)
- Admin'dan haftalik hisobot Telegram'ga (Vercel Cron; `/api` ga yangi marshrut qo'shish testlarda
  ruxsat etilgan ro'yxatni yangilashni talab qiladi — ataylab qil).
- Qo'shimcha tillar (qozoq, qirg'iz, tojik, turkman, turk, ozarbayjon): hozir `src/lib/i18n.ts` 3 til bilan
  yopiq; lug'atlar `src/dictionaries/{ui,pages}/*.ts` (uz — tur manbai), sitemap/hreflang/redirect'lar ham kengayadi.
- Admin 2FA; diler kabineti (narx faqat login qilgan distribyutorga — ommaviy saytda narx hech qachon yo'q).

## 3. O'zgarmas qoidalar (qisqacha — to'liq ro'yxat CLAUDE.md da)
- Narx, savat, checkout — hech qayerda (JSON-LD ham). O'zbek matnida "yaratish" so'zi taqiqlangan.
- Saytda `[...]` placeholder ko'rinmaydi; raqam/kontaktlar lug'atda tokenlar (`{countries}` …), qattiq yozilmaydi.
- Ommaviy sahifalar bazani import qilmaydi (statik qoladi); baza faqat `src/server/` da.
- Har bir admin sahifa/route/server action `requireUser()` chaqiradi. Admin formalarda yashirin input nomi `id` bo'lmasin.
- `DATABASE_URL` bilan lokal build `src/data/*` ni o'zgartiradi — commitdan oldin `git checkout src/data`.
- Har bir bo'lim havolasi `SECTION_SLUGS` orqali. Yangi sahifa → `scripts/lib/routes.mjs` ga qo'sh.
- Commit xabarlari o'zbekcha. Push faqat ishlayotgan branch'ga; PR'ni foydalanuvchi so'raganda och.

## 4. Ishlash uslubi (limitni tejash)
- Rejani qisqa ro'yxat qilib ber, keyin bajar; har bir bosqich oxirida 3–5 qatorli natija.
- Katta fayllarni to'liq o'qima — `grep -n` bilan kerakli joyni top, `sed -n` bilan oraliqni o'qi.
- Testlarni avval tegishli faylga ishga tushir (`node --test --experimental-strip-types tests/<fayl>.test.js`),
  oxirida to'liq `npm test`.
- Brauzer tekshiruvlari: `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium-*/chrome-linux/chrome` (bulut sandbox),
  `npm run build` dan keyin serverni qayta ishga tushir. Tashrif statistikasini sinasang Playwright'da haqiqiy
  user-agent ber (HeadlessChrome bot deb filtrlanadi).
- Biznes ma'lumoti (raqam, narx sharti, sertifikat, davlatlar) **o'ylab topilmaydi** — foydalanuvchidan so'ra
  yoki admin panelda o'zlari kiritishini ayt.

Birinchi javobing: holatni tekshirish natijasi (testlar, build) + A va B bo'yicha qisqa reja + foydalanuvchidan
kerakli ma'lumotlar ro'yxati.
