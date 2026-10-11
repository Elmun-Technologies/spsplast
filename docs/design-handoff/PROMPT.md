# Claude Code uchun topshiriq (shu matnni nusxalab bering)

Paketni repo ichiga `docs/design-handoff/` papkasiga qo'ying, keyin Claude Code'ga quyidagini yuboring:

---

Repo: `Elmun-Technologies/spsplast` (Next.js 15 App Router, React 19, TypeScript, statik JSON, ma'lumotlar bazasi YO'Q).

Vazifa: SPS Plast saytini `docs/design-handoff/` dagi tasdiqlangan dizayn bo'yicha qaytadan qur. Yagona manba — `docs/design-handoff/HANDOFF.md`; vizual namuna — `screens/mobile` va `screens/desktop`; aniq o'lcham va CSS — `source/*.dc.html`, `source/site.css` (B uslubi fayl oxirida).

Qoidalar:
1. Avval `CLAUDE.md` ni o'qi. Yo'q bo'lsa — tuz va HANDOFF.md dagi biznes qoidalari, tokenlar, marshrutlar, qarorlarni u yerga yoz.
2. Ishni `redesign-2027` branchida qil, `main` ga tegma. Oxirida PR och (Vercel preview).
3. Ma'lumotlar bazasi qo'shilmaydi. `src/app/api` ichida faqat `/api/leads` va `/api/health` bo'lsin.
4. Shrift — faqat Onest, self-host woff2 (latin + cyrillic) `public/fonts` da. `next/font/google` ishlatma. Tailwind kerak emas — dizayn tokenlari bilan oddiy CSS (yoki CSS Modules).
5. Narx, savat, checkout yo'q — faqat zayafka. O'zbek matnida "yaratish" so'zi ishlatilmaydi.
6. Mobile-first: avval 390 px ekranni `screens/mobile` ga mos qil, keyin desktop.
7. Tillar: uz (asosiy), ru, en — `/{lang}/...`, hreflang, sitemap, JSON-LD.
8. Biznes hali bermagan qiymatlar `[...]` placeholder bo'lib qolsin (HANDOFF.md 1-bo'lim).
9. Secret/token koddagi faylga yozilmaydi — faqat env (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).

Bosqichlar (har biridan keyin typecheck + lint + build, keyin commit):
- **0. Ma'lumot:** `data/models-2027.json` (152 model, HANDOFF.md 5-bo'limdagi sxema) va `public/catalog/2027/*.webp` ni tayyorla. Manba: `docs/design-handoff/data-sources/` (README'da ustuvorlik) + men beradigan yakuniy katalog PDF'lari (uz/ru/en) va render/surat zip'lari. Rasmlarni WebP'ga o'tkaz (sahna 1400w + 720w, qolip/plitka 800w). Validatsiya skripti: slug unikal, 3 til to'liq, rasm fayllari bor, "yarat" so'zi yo'q, soni 152. Topilmagan qiymat — `null` + `docs/data-questions.md` ga savol.
- **1. Asos:** tokenlar, Onest, layout, Header (desktop + mobil), mobil menyu, Footer, i18n.
- **2. Katalog bloki:** filtrlar + facet sonlari, qidiruv, saralash, panjara/ro'yxat, kartochka, tez zayafka oynasi (mobilda bottom sheet), tez ko'rish, solishtirish paneli, localStorage holati.
- **3. Sahifalar:** bosh sahifa, katalog (+ bo'lim), model (galereya, kalkulyator, tablar, mobil sticky panel), solishtirish, zayafka ro'yxati, ulgurji, ishlab chiqarish, kontakt, maxfiylik, 404.
- **4. API:** `/api/leads` (Zod, honeypot, rate limit, xalqaro telefon, Telegram, `requestId` qaytaradi), analitika eventlari.
- **5. SEO va migratsiya:** metadata, hreflang, sitemap, JSON-LD, eski URL'lardan 301.
- **6. Tekshiruv:** Playwright bilan 390 va 1440 px skrinshotlar → `screens/` bilan solishtir; gorizontal scroll yo'qligi, a11y, Lighthouse (HANDOFF.md 7-bo'lim).

Har bosqich oxirida qisqa hisobot ber: nima qilindi, nima qoldi, qaysi qaror qabul qilindi.
