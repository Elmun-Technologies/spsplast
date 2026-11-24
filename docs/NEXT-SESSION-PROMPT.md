# Keyingi Claude Code sessiyasi uchun topshiriq (copy-paste)

> **Joriy holat (2026-11-23) — quyidagi promptdagi 2026-11-12 ma'lumotidan ustun turadi:**
> - Sayt jonli: https://spsplast.uz, Hetzner + Coolify (Vercel o'chirilgan). `main`ga merge → `checks` yashil →
>   `deploy-coolify` workflow Coolify API'ni chaqiradi (avtomatik deploy, logda `Coolify javobi: HTTP 200`).
> - GA4 `G-9EMS6FEXHF`, Yandex Metrica `114622159`, Yandex Webmaster tasdiqlangan; Search Console domen property, sitemap 711 URL.
> - Admin: 2 ta admin akkaunt; parol unutilsa `npm run admin:reset -- --email E` (Coolify terminali).
> - Ochiq: Coolify paneli HTTP'da (`COOLIFY_URL`) — DNS'da `coolify.spsplast.uz` tayyor bo'lgach HTTPS'ga ko'chirish;
>   PR #81 (tayyor mahsulotlar) va #78 (Dockerfile/standalone, konflikt bor) egasi qarorini kutmoqda; `dekor` bo'limida 0 model.
> - **2026-11-24**: bosma katalog novinkalari (№001–016) qayta nomlangan (Антара, Национал 1/4, Лабиринт, Дорожка, Паркет, Кадам,
>   Бордюр Версаче + Бордюр Версаче сетка (№016, alohida model); Terratsso №1–3 = №017, h 50) — sayt (`patch`, slug o'zgarmagan) va veb PDF (130 bet) bir xil. Tafsilot: `CLAUDE.md` → "Novinkalar nomi/o'lchami".
>   Ochiq: bordyur va №001/007/013–015 o'lchamlari; bosma (150–200 MB) asl PDF alohida yangilanishi kerak.
> - SEO monitoring: kuniga 2 marta scheduled task (bulutda, Search Console'siz); GSC'ni egasining suhbati Chrome orqali tekshiradi.

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
   (205+ test). Yashil bo'lmasa, avval sababini top.

## 1. Loyiha holati (2026-11-23 holatiga)

**Eng yangi (2026-11-23):**
- Sayt ikki yo'nalish: **Qoliplar** (`/catalog`, 237 model, 7 bo'lim) va **Tayyor mahsulotlar** (`/ready`, 95 mahsulot,
  11 bo'lim: 80 fasad elementi + 6 skameyka yon qismi + 9 yevrozabor).
  Arxitektura: `catalog_sections.kind` (migratsiya 0004), CLAUDE.md → "Tayyor mahsulotlar".
- Prod katalog bazadan; `scripts/catalog-add-*.json` deploy'da o'zi qo'llanadi (`catalog_sync_log`, migratsiya 0005).
- Hosting: Hetzner + Coolify, Dockerfile (standalone). Vercel ishlatilmaydi ("Account is blocked" statusi — e'tiborsiz).
- Topshirish paketi: `docs/topshirish/` (admin qo'llanmasi, checklist, sifat hisoboti, kirishlar ro'yxati).
- Rasmlar katalog agentining fonsiz manbasidan (ZIP'lar repoda yo'q — ~550 MB): `build_ready_fasad_2027.py <zip papkasi>`
  va `build_ready_bench_fence_2027.py <zip papkasi>` (slug'lar o'zgarmaydi). Ochiq savollar: `docs/unresolved-questions.md` 1.19.

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript, oddiy CSS (Tailwind taqiqlangan), Onest shrifti
(self-host), Postgres + Drizzle ORM faqat `src/server/` orqasida, Coolify (Docker standalone).

**Ommaviy sayt** (`src/app/[lang]/*`): statik prerender (~740 sahifa). Bosh sahifa, katalog/bo'lim/model
(filtr, qidiruv, solishtirish, zayafka ro'yxati, qolip kalkulyatori), ulgurji, ishlab chiqarish, kontakt,
maxfiylik, 404, SEO landing (teg + 8 eksport davlati), 3D ko'ruvchi (`public/3d`; trotuar QR sahifalarida "Соберите сами" — plitkani o'zing ter, `npm run 3d:tering`). SEO: hreflang, sitemap (711 URL), JSON-LD (narxsiz), 499 ta 301. Animatsiyalar: `MotionLayer.tsx` + CSS.

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

**Katalog ma'lumoti (2026-11-14):** 216 model, 7 bo'lim (trotuar 95, fasad plitkasi 7, termopanel 12,
fasad dekor 67, zabor 10, dekor panel 18, skameyka 7). Rasmlar: bosma katalogdan 37 ta haqiqiy qolip surati
(29 trotuar + Z01–Z09; `media-src/live/`, nomi sayt kodi yoki 3D raqami `tNN`), 205 mahsulotda bosma katalog
sahnasi (`public/3d/<id>/r_04.jpg` → `*-scene-3d.webp`, "3D vizualizatsiya"). Rasmsiz 5 ta (`noindex`).
DIQQAT: trotuarda sayt kodi ≠ 3D raqami (sayt №70 = 3D t75) — PR #44 da shu sabab 28 surat boshqa modelga
tushgan va tuzatilgan; har yangi suratlar to'plamidan keyin surat va 3D renderni yonma-yon solishtiring.
Ochiq savollar: `docs/unresolved-questions.md` 1.17–1.18.

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
2. Holat (2026-11-12 kechasi yopilganlar ✓, qolganlari — biznes materialiga bog'liq):
   - ✓ Stok suratlar olib tashlangan; ✓ katalog/bo'lim sarlavha bandi maketdagidek (PDF + Zayafka);
     ✓ fasad dekor uchun "Turi" filtri; ✓ 404 RU/EN tilida, header/footer bilan; ✓ o'zbekcha apostroflar
     bir xil (+ test); ✓ mobil ro'yxat ko'rinishi ixcham; ✓ kartochka CTA grafit (qizil faqat asosiy CTA).
   - Kutilmoqda (biznes): tirik suratlar (`media-src/live/`), obyekt/zavod suratlari, sharhlar, video,
     sertifikat; footer yuridik nomi/STIR/e-pochta; eksport xaritasining RU/EN varianti; 2027 PDF katalog.
   - Ixtiyoriy: kontakt sahifasidagi xarita — statik blok ("Xaritada ochish"), embed CSP/tezlik uchun ataylab yo'q.
3. Har bir o'zgarishdan keyin: 390 va 1440 px skrinshot, gorizontal scroll yo'q, `npm run audit` 0 xato.
   Lighthouse (CI yoki `npm run lighthouse`): mobil Performance ≥ 90, A11y ≥ 95, SEO 100.
   JS+CSS gzip byudjeti sahifaga ≤ 200 KB (hozir 185–196 KB, model sahifasi eng og'iri) — yangi kutubxona qo'shma.

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
