# Hal qilinmagan savollar va qabul qilingan qarorlar (redesign 2027)

Bu ro'yxat — Stage 6 yakuniy deliverable'laridan biri. Ikki bo'lim:
**(A)** biznes/javob kutayotgan savollar, **(B)** agent tomonidan qabul qilingan
qarorlar va og'ishlar (sababi bilan). Ma'lumot darajasidagi batafsil savollar:
`docs/data-questions.md` (82 yozuv).

## A. Javob kutilayotgan savollar

### 1. Ma'lumot va kontent (bloklovchi)

| # | Savol | Hozirgi holat |
|---|---|---|
| 1.1 | Yakuniy 2027 katalog PDF'lari (`SPS_katalog_A.pdf`, `_RU`, `_EN`) qachon beriladi? | **2026-11-12**: mahsulot ro'yxati 3D paketlardan (`public/3d`, `data/catalog3d-2027.json`) to'ldirildi — **216 model**, 209 tasida rasm (tirik surat yoki 3D render). Trotuar RU/EN nomlari hali `null` (UI translit), qolgan bo'limlarda RU — 3D katalogdan, UZ/EN — 1.17 ga qarang. |
| 1.2 | ~~`Zabor` bo'limi bo'sh~~ — **yopildi 2026-11-12**: 10 ta yevrozabor (Z01–Z10) 3D katalogdan. Z01, Z09 (faqat yaqin kadr) va Z10 (render yo'q) — rasmsiz, tirik surat kutiladi. | Bo'lim sitemap'da; rasmsiz 3 model `noindex` (rasm kelsa o'zi indekslanadi). |
| 1.3 | ~~33 ta yetishmayotgan model~~ — **yopildi 2026-11-12** (3D katalog). Yangi taqsimot: trotuar 95, fasad plitkasi 7, termopanel 12, fasad dekor 67, zabor 10, dekor panel 18, skameyka 7. Bo'limlar admin bazasidagi `DEFAULT_SECTIONS` bilan bir xil. | Biznes bo'lim nomlarini Admin → Bo'limlar'da o'zgartirishi mumkin. |
| 1.4 | Model sahifasidagi "Katak soni" qatori (`Model.dc.html`) uchun ustun Excel'da bormi? | Ma'lumot yo'q → qator chiqarilmaydi. |
| 1.5 | Galereya uchun "yaqindan" kadrlari bormi? | Ko'p modelda 2–3 kadr (maketda 4). |
| 1.6 | Bo'lim muqova rasmlari: fasad/zabor/dekor/skameyka uchun 2027 sahna suratlari? | Hozircha sayt fotosuratlari (`factory`, `master-pouring` …) ishlatiladi. |
| 1.7 | 2027 uch tilli PDF katalog qachon tayyor bo'ladi? | Header'dagi havola 2026 (uz) PDF'ga qaraydi. |
| 1.8 | E-pochta ko'rsatiladimi? HANDOFF'da `[E-POCHTA]`, eski saytda `stoneprofyservise@mail.ru`. | Placeholder saqlanadi (`[...]` qoidasi). |
| 1.9 | Kontakt handledari qaysi biri to'g'ri: `@spsplastuz`/`@spsplast.uz` (HANDOFF) yoki `@sps_stone`/`sps.stone` (eski sayt)? | HANDOFF versiyasi ishlatilgan. |
| 1.10 | Eksport xaritasi (`map-uz.webp`) faqat o'zbekcha — RU/EN versiyalari kerakmi? | Bitta rasm uch tilda ham shu. |
| 1.11 | Maxfiylik siyosati matni yuridik tekshiruvdan o'tganmi? (`[YURIST TASDIG'I]` belgisi bor) | Matn maketdan olingan, placeholder saqlanadi. |
| 1.12 | RU/EN sahifa matnlari (model, solishtirish, zayafka, ulgurji, ishlab chiqarish, kontakt, maxfiylik, 404) agent tarjimasi — marketolog tekshiradimi? | uz matnlari maketdan; ru/en tarjima qilingan. |
| 1.13 | Mijoz sharhlari (3-5 ta haqiqiy): matn, ism, (ixtiyoriy) baho? Audit 2026-11-02, 3-bosqich: "ishonch dalillari". | **Texnik tayyorgarlik tayyor**: Admin → Sharhlar (`/admin/testimonials`) — admin kiritgan sharhlar bosh sahifada chiqadi va JSON-LD Review/AggregateRating hosil bo'ladi. Hozir 0 ta sharh — bo'lim butunlay yashirin (soxta sharh yozilmadi). |
| 1.14 | 6-9 ta haqiqiy obyekt (quyilgan plitka/fasad) fotosi bormi? | Hozircha faqat studiyadagi qolip suratlari (`public/images/site/molds/`). Rasm kelganda `partners`/bosh sahifadagi mavjud massiv-asoslangan andozaga (`whoMedia`, `moldWall`) qo'shish kifoya — yangi kod/jadval kerak emas. |
| 1.15 | Zavod videosi (YouTube/Vimeo havolasi)? | **Texnik tayyorgarlik tayyor**: Admin → Sozlamalar → "Ishonch dalillari" → "Zavod videosi" maydoni. Kiritilsa ishlab chiqarish sahifasida avtomatik ko'rinadi (CSP `frame-src` YouTube/Vimeo'ga ochiq). |
| 1.16 | Sertifikat(lar) bormi (sifat, GOST/standart)? Minimal buyurtma/muddat/to'lov bo'yicha aniq oraliqlar berilsinmi (hozir "Menejer bilan kelishiladi")? | Hali kod ishi yo'q — sertifikat uchun rasm/fayl kelsa, mavjud rasm yuklash andozasi (mahsulot rasmlari kabi) bilan tezda qo'shiladi. Aniq oraliq berilmaguncha "kelishiladi" matni qoladi (Biznes qoidasi 4: `[...]` ko'rinmaydi). |
| 1.17 | **3D katalog bilan yarashtirish (2026-11-12) — biznes tekshirsin.** (a) Eski 3-varaq modellari 3D kodga **birlashtirildi** (nom + o'lcham aniq mos, eski surat va vazn yangi modelga o'tdi, eski manzil 301): Labirint → TP-012, Brilliant → TP-009, Fasad 3D → TP-008, Kirpich fasad → TP-007, Quba fasad → TP-004, Beeline 3 → BP-003. (b) 3D'da aniq jufti yo'q, lekin **haqiqiy surati bor** — saytda qoldi: Rus 2, Rus 2-2, Rus 3 (fasad plitkasi), Zina 30–120 gladkiy, Sokol, Kapitel 40 tepa (fasad dekor) — 3D'dagi qaysi kodning takrori? (c) Suratsiz, o'lchami taxminiy, 3D oilalari bilan takrorlanadigan 12 ta model **chiqarildi** (301 → bo'lim): Skameyka 3 forma, Fasad beeline gladkiy, Yangi beeline shershaviy, Quba, Sokol kalonna, Sokol friz kubik, Karniz 1, Pilyastr 3, Kalonna, Rom karniz 1, Kapitel 20, Kapitel 40 past. (d) Dekor panel (D01–D18), skameyka (S01–S07), zabor (Z01–Z10), fasad plitkasi (F23–F26) **UZ/EN nomlari agent tarjimasi** (ruscha asl nom 3D'dan) — Admin → Mahsulotlar'da tuzatilishi mumkin. (e) TP-011 o'lchami: xlsx 250×500, 3D 200×400 — saytda 3D. (f) KRN-004 kodi ikki modelda (18×120 va 35×120). | Xarita: `data/moved-2027.json`; kod: `OLD_MERGE`/`OLD_KEEP`/`NAMES_3D` (`scripts/extract/build_models_2027.py`). |
| 1.18 | Tirik suratlar: qaysi modellar uchun tayyor? | **Quvur tayyor**: `media-src/live/<KOD>[-qolip\|-plitka\|-sahna].jpg` → GitHub Action "Tirik suratlar" fonni olib tashlaydi, WebP yasaydi, katalogni yangilab commit qiladi; render o'zi almashadi. Qoida: `media-src/live/README.md`. |

### 2. Migratsiya (301)

| # | Savol | Hozirgi holat |
|---|---|---|
| 2.1 | Eski 192 mahsulotning 304 tasi nom mos kelmagani uchun bo'lim darajasiga (`/catalog/paving`, `/catalog/facade`) 301 qilinadi. Aniq modelga tushirish uchun **eski slug ↔ yangi kod** jadvali beriladimi? | 80 tasi aniq model sahifasiga tushdi. Xarita: `scripts/redirects-2027.json`. |
| 2.2 | Eski blog (7 maqola) va loyihalar (6) kontenti qayta ishlatiladimi (masalan "Ishlab chiqarish" sahifasida keyslar bloki)? | Sahifalar o'chirildi, `/blog*` va `/projects*` → bosh sahifaga 301. Matnlar arxivda: `docs/legacy/catalog-2026.json`. |
| 2.3 | `public/catalog/2026` (18 MB, saytga chiqarilgan JPG) o'chirildi. Asl nusxasi biznes arxivida kerakmi? | Pipeline bundan zarar ko'rmaydi: `npm run models:images` manba sifatida repodagi `media-src/` (`factory/`, `studio/`, `pdf/`) dan o'qiydi. Savol faqat arxiv siyosati haqida. |
| 2.4 | `media-src/` repoda 86 MB joy egallaydi (shu jumladan `pdf/` 46 MB). Uni Git LFS'ga yoki tashqi xotiraga ko'chirish kerakmi? | Hozircha oddiy fayl sifatida kuzatiladi (bazaviy commit'dan kelgan). Ko'chirilsa, `build_images_2027.py` dagi yo'llar yangilanishi kerak. |

### 3. Infrastruktura

| # | Savol | Hozirgi holat |
|---|---|---|
| 3.1 | Vercel loyihasi ulanganmi? PR'da preview link avtomatik chiqadimi? | PR ochilgan; preview link Vercel integratsiyasidan keladi. |
| 3.2 | Production env o'zgaruvchilari: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `NEXT_PUBLIC_SITE_URL`, analitika ID'lari (GTM/GA/Metrica/Pixel) kiritilganmi? | Kodsiz sayt: ID yo'q bo'lsa analitika skriptlari umuman yuklanmaydi, Telegram yuborilmaydi (`/api/health` `degraded` qaytaradi). |
| 3.3 | Domen: kanonik `spsplast.com` (qaror 2026-11-01). Domen sotib olinganmi, DNS Vercel'ga ulanganmi? | `next.config.js`: `www.spsplast.com`, `sps.uz`, `www.sps.uz` → `https://spsplast.com/:path*` 301. Sabab: `docs/SEO-2028-RU.md` 0-bo'lim. |
| 3.4 | Lighthouse va Playwright tekshiruvlarini kim ishga tushiradi? (Sandbox'da brauzer yo'q: `cdn.playwright.dev` bloklangan.) | Skriptlar tayyor: `npm run shots`, `npm run lighthouse` (`docs/checks.md`). |

### 4. Dizayn bilan zid mezon — qaror kerak

HANDOFF §7: *"barcha tugma va linklar ≥ 44px"*, lekin HANDOFF'ning o'z CSS'i
(`source/site.css`) kichik boshqaruvlarni kichikroq qiladi: `.chip` 40px,
`.sps-btn--sm` 36px (bizda ham shunday). Ikki variant:

- **A. Vizual aniqliq** (hozirgi holat): 36/40px saqlanadi, `screens/` bilan birma-bir mos.
- **B. Tegish maydoni**: mobil (≤ 600px) uchun `min-height: 44px` yoki shaffof
  `::after` hit-area qo'shiladi — vizual o'zgarmaydi, lekin maketdan og'ish bo'lishi
  mumkin (qatorlar orasidagi masofa, zich joylashgan chiplar).

Qaror qilinmaguncha kod A variantda qoldi. `npm run shots` hisoboti aniq ro'yxatni
(qaysi element, necha px) beradi.

## B. Qabul qilingan qarorlar va og'ishlar (sababi bilan)

| # | Qaror / og'ish | Sabab |
|---|---|---|
| B1 | Eski 2026 qatlam (blog, projects, wishlist, search, about, terms, returns, delivery-payment, how-to-order, eski product sahifalari, catalog-preview) o'chirildi; barcha eski manzil 301 bilan yangi marshrutga bog'landi. | Foydalanuvchi qarori (ask_user). Ikki qatlam bir vaqtda yurishi duplikat kontent va 404 havolalar berardi. |
| B2 | `public/catalog/2026` (18 MB) va `public/media` (3.3 MB) o'chirildi. | Foydalanuvchi qarori. Yangi sayt faqat `public/catalog/2027/*.webp` va `public/images/site/*` dan foydalanadi. |
| B3 | SSR `<html lang="uz">` barcha tillarda; til gidratatsiyadan keyin `HtmlLangSync` bilan to'g'rilanadi. | Yagona root layout (`app/layout.tsx`) `params` olmaydi. Til bo'yicha root layout'lar (route groups) butun marshrut daraxtini ko'chirishni talab qiladi — Stage 5'da ataylab qoldirildi. `hreflang`/canonical to'g'ri, shuning uchun SEO signali yo'qolmaydi. |
| B4 | Modeli bo'lmagan bo'lim sitemap'ga kiritilmaydi, marshrut esa saqlanadi (2026-11-12: zabor to'ldi — hozir barcha 7 bo'lim sitemap'da). | "0 model" sahifasi yupqa kontent (thin content) — indekslash zararli. Ma'lumot kelgach bo'lim avtomatik qo'shiladi. |
| B5 | Product JSON-LD'da `price` yo'q (`offers` → `itemOffered: Service`, `priceCurrency: UZS`). | Saytda narx yo'q (HANDOFF 1.1). `price` bo'lsa Google Rich Results xato beradi. Test bilan himoyalangan. |
| B6 | Bosh sahifa `<title>` H1 dan farq qiladi (`home.seoTitle`). | H1 maket matni (uzun: 55–62 belgi) + `· SPS Plast` qo'shimchasi 65 belgidan oshib SERP'da kesilardi. Vizual o'zgarmadi — faqat metadata. |
| B7 | Ildiz 404 sahifasi uch tilli `<title>` bilan (`Sahifa topilmadi | Страница не найдена | Page not found`); tana, header va footer 2026-11-12 dan URL tiliga mos (brauzerda tanlanadi). | `[lang]` dan tashqaridagi so'rovlar (masalan `/xx`) til aniqlay olmaydi; noindex bo'lgani uchun uzun sarlavha zararsiz. |
| B8 | `compare`/`request` sahifalari `noindex, follow` va canonical bosh sahifaga. | Kontent foydalanuvchi holatiga bog'liq (bo'sh ro'yxat duplikat bo'lardi), lekin havolalar kuchi saqlanadi. |
| B9 | Xarita bloki statik (rasm + koordinata + Google/Yandex havolalari), embed/uchinchi tomon skriptlari yo'q. | Lighthouse Performance va cookie/privacy talablari; API kalit yo'q. |
| B10 | Analitika ID'lari faqat env orqali; ID bo'lmasa skript yuklanmaydi. | Secret'lar kodda bo'lmasligi kerak (foydalanuvchi talabi) va preview'da statistika ifloslanmasligi kerak. |
| B11 | Filtrlar/qidiruv mijoz tomonida (`window.location.search`), server `searchParams` o'qimaydi. | Bo'lim sahifalari to'liq statik qoladi (`dynamicParams = false`) — noma'lum slug uchun qattiq 404, CDN kesh va yuqori Lighthouse balli. |
| B12 | `npm test` node:test + type-stripping (Playwright/Vitest yo'q), `@/` aliasli modullar `tests/helpers/load-alias.mjs` orqali yuklanadi. | Sandbox'da brauzer o'rnatib bo'lmaydi; testlar haqiqiy `sitemap.ts`/`seo.ts` kodini chaqiradi (nusxa emas). |
| B13 | Mijoz sharhlari (bosh sahifa) va zavod videosi (ishlab chiqarish) uslubi ataylab sodda (mavjud `.sec`/`.sps-eyebrow`/`.h1` token'lari, maxsus vizual dizayn yo'q). | HANDOFF maketida bu bo'limlar yo'q (yangi funksiya, audit 2026-11-02 3-bosqich: "ishonch dalillari"). Maxsus dizayn o'rniga boshqa bo'limlar bilan uyg'un, minimal ko'rinish tanlandi — rasmiy dizayn bosqichida nafislashtirilishi mumkin. Kontent bo'lmasa (0 sharh, video havolasi yo'q) ikkala bo'lim ham butunlay yashirin. |
| B14 | Yandex `Clean-param` (`robots.txt`) qo'shilmadi (audit 2026-11-02, 3.5-band: "xalqaro signallar"). | Next'ning `app/robots.ts` tipidagi (`MetadataRoute.Robots`) konvensiyasida bunday maydon yo'q — qo'shish uchun `route.ts`ga o'tish kerak, foyda kam: `canonical` (so'rov parametrisiz) Yandex uchun ham `?q=` variantlarini allaqachon e'tiborsiz qoldiradi, `Clean-param` faqat crawl byudjetini tejaydi, indekslash muammosini tuzatmaydi. |
| B16 | 3D render rasmlar (fayl nomi `-3d.webp`) tirik surat kelguncha ishlatiladi va saytda "3D vizualizatsiya" deb belgilanadi (galereya yorlig'i). | Foydalanuvchi qarori (2026-11-12): rasmsiz/yolg'on "haqiqiy surat" o'rniga biznesning o'z 3D modellaridan renderlar; tirik surat `media-src/live/` ga tushishi bilan avtomatik almashadi. |
| B17 | Header: 7 bo'lim — desktopda ham tablar alohida qatorda, qisqa nomlar (`sectionShortLabel`: "Termopanel", "Fasad dekor"); to'liq nom `title` va mobil menyuda. | HANDOFF maketi 5 bo'lim uchun bitta qator edi; 7 bo'lim bilan 1440 px da gorizontal scroll paydo bo'ldi. |
| B15 | `.git` ~485 MB — tarixiy (allaqachon o'chirilgan fayllar) blob'lar tufayli; kichraytirish faqat tarix qayta yozish (`git filter-repo`/BFG) bilan mumkin, bu force-push va har bir mavjud klon/fork'ni buzadi (audit 2026-11-02, 3.6-band: "repo gigienasi"). | **Qaror kerak (biznes/jamoa)**: tarix qayta yozishga ruxsat bormi? Hozircha qilinmadi — hozirgi daraxtdagi katta fayllar (PDF, AI model) hammasi haqiqiy va kerakli, shuning uchun bu faqat saqlash hajmi masalasi, funksional muammo emas. |
## C. O'lchov metodikasi eslatmalari (2026-10-11)

- **Lighthouse mediana**: CI runner'ida bitta yurish shovqini katta (bosh sahifa
  mobil perf bir xil kodda 83–98 oralig'ida sachragan). Shuning uchun
  `scripts/visual/lighthouse.mjs` har maqsadni 3 martadan o'lchaydi
  (`LH_RUNS` env) va hisobotga **mediana** yoziladi; xom JSON'lar har yurish
  uchun alohida (`docs/audits/lighthouse/<id>-<ff>-r{1,2,3}.json`, git'da emas).
- **Piksel farqi — yo'nalish ko'rsatkichi, qat'iy mezon emas**: etalonlar
  (`screens/*.jpg`) dizayn maketlari — demo mazmun, JPG siqishi va boshqa DPR
  bilan. Farq qiymatlari (`docs/audits/visual-*.md`) katta bo'lishi kutiladi
  (masalan model sahifasida haqiqiy rasm maketdagi kulrang placeholder o'rnida).
  Qat'iy qoidalar: gorizontal scroll yo'qligi (390/1440/360) va interaktiv
  holatlar ochilishi (menyu, filtr, zayafka) — ular hisobotda alohida.
- **To'liq sahifa suratlari 4000 px bilan cheklangan** (`-full.png`): 119 kartali
  katalog 390px da o'n minglab px balandlikda; DPR 2 bilan cheksiz suratlar CI'ni
  tiqib qo'ygan (30+ daqiqa). Chegaradan baland sahifalar hisobotda sanab o'tiladi.
- **`about:blank` va innerWidth**: Playwright mobil emulyatsiyasida sahifa
  yuklanmaguncha `window.innerWidth` 980px (meta viewport yo'qligi sababli).
  Kenglik nazoratlari faqat `goto` dan keyin bajariladi.
