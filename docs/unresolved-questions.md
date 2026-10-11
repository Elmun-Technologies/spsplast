# Hal qilinmagan savollar va qabul qilingan qarorlar (redesign 2027)

Bu ro'yxat — Stage 6 yakuniy deliverable'laridan biri. Ikki bo'lim:
**(A)** biznes/javob kutayotgan savollar, **(B)** agent tomonidan qabul qilingan
qarorlar va og'ishlar (sababi bilan). Ma'lumot darajasidagi batafsil savollar:
`docs/data-questions.md` (82 yozuv).

## A. Javob kutilayotgan savollar

### 1. Ma'lumot va kontent (bloklovchi)

| # | Savol | Hozirgi holat |
|---|---|---|
| 1.1 | Yakuniy 2027 katalog PDF'lari (`SPS_katalog_A.pdf`, `_RU`, `_EN`) va render zip'lari (`SPS_blender_yakuniy*.zip`, `bgeraser_results_*.zip`) qachon beriladi? Repoda yo'q (barcha branch/release tekshirilgan). | 119 model (HANDOFF: 152). Rasm 67 modelda. RU/EN nomlar `null` → UI uz nomiga qaytadi. |
| 1.2 | `Zabor` bo'limi: HANDOFF bo'yicha 10 model kutiladi, Excel manbasida 0 ta. Ma'lumot bormi? | `/catalog/fence` marshruti ishlaydi (0 model), sitemap'ga kiritilmagan. |
| 1.3 | 33 ta yetishmayotgan model qaysi bo'limlarga tegishli (91/26/10/18/7 taqsimoti)? | UI sonlari `data/models-2027.json` dan olinadi (95/12/0/11/1) — raqam o'ylab topilmaydi. |
| 1.4 | Model sahifasidagi "Katak soni" qatori (`Model.dc.html`) uchun ustun Excel'da bormi? | Ma'lumot yo'q → qator chiqarilmaydi. |
| 1.5 | Galereya uchun "yaqindan" kadrlari bormi? | Ko'p modelda 2–3 kadr (maketda 4). |
| 1.6 | Bo'lim muqova rasmlari: fasad/zabor/dekor/skameyka uchun 2027 sahna suratlari? | Hozircha sayt fotosuratlari (`factory`, `master-pouring` …) ishlatiladi. |
| 1.7 | 2027 uch tilli PDF katalog qachon tayyor bo'ladi? | Header'dagi havola 2026 (uz) PDF'ga qaraydi. |
| 1.8 | E-pochta ko'rsatiladimi? HANDOFF'da `[E-POCHTA]`, eski saytda `stoneprofyservise@mail.ru`. | Placeholder saqlanadi (`[...]` qoidasi). |
| 1.9 | Kontakt handledari qaysi biri to'g'ri: `@spsplastuz`/`@spsplast.uz` (HANDOFF) yoki `@sps_stone`/`sps.stone` (eski sayt)? | HANDOFF versiyasi ishlatilgan. |
| 1.10 | Eksport xaritasi (`map-uz.webp`) faqat o'zbekcha — RU/EN versiyalari kerakmi? | Bitta rasm uch tilda ham shu. |
| 1.11 | Maxfiylik siyosati matni yuridik tekshiruvdan o'tganmi? (`[YURIST TASDIG'I]` belgisi bor) | Matn maketdan olingan, placeholder saqlanadi. |
| 1.12 | RU/EN sahifa matnlari (model, solishtirish, zayafka, ulgurji, ishlab chiqarish, kontakt, maxfiylik, 404) agent tarjimasi — marketolog tekshiradimi? | uz matnlari maketdan; ru/en tarjima qilingan. |

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
| 3.3 | Domen: `sps.uz` apex + `www` 301 — DNS'da `www` CNAME sozlanganmi? | `next.config.js` da `www.sps.uz → https://sps.uz` 301 qoidasi bor. |
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
| B4 | Modeli bo'lmagan bo'lim (`fence`) sitemap'ga kiritilmadi, marshrut esa saqlandi. | "0 model" sahifasi yupqa kontent (thin content) — indekslash zararli. Ma'lumot kelgach bo'lim avtomatik qo'shiladi. |
| B5 | Product JSON-LD'da `price` yo'q (`offers` → `itemOffered: Service`, `priceCurrency: UZS`). | Saytda narx yo'q (HANDOFF 1.1). `price` bo'lsa Google Rich Results xato beradi. Test bilan himoyalangan. |
| B6 | Bosh sahifa `<title>` H1 dan farq qiladi (`home.seoTitle`). | H1 maket matni (uzun: 55–62 belgi) + `· SPS Plast` qo'shimchasi 65 belgidan oshib SERP'da kesilardi. Vizual o'zgarmadi — faqat metadata. |
| B7 | Ildiz 404 sahifasi uch tilli sarlavha bilan (`Sahifa topilmadi | Страница не найдена | Page not found`). | `[lang]` dan tashqaridagi so'rovlar (masalan `/xx`) til aniqlay olmaydi; noindex bo'lgani uchun uzun sarlavha zararsiz. |
| B8 | `compare`/`request` sahifalari `noindex, follow` va canonical bosh sahifaga. | Kontent foydalanuvchi holatiga bog'liq (bo'sh ro'yxat duplikat bo'lardi), lekin havolalar kuchi saqlanadi. |
| B9 | Xarita bloki statik (rasm + koordinata + Google/Yandex havolalari), embed/uchinchi tomon skriptlari yo'q. | Lighthouse Performance va cookie/privacy talablari; API kalit yo'q. |
| B10 | Analitika ID'lari faqat env orqali; ID bo'lmasa skript yuklanmaydi. | Secret'lar kodda bo'lmasligi kerak (foydalanuvchi talabi) va preview'da statistika ifloslanmasligi kerak. |
| B11 | Filtrlar/qidiruv mijoz tomonida (`window.location.search`), server `searchParams` o'qimaydi. | Bo'lim sahifalari to'liq statik qoladi (`dynamicParams = false`) — noma'lum slug uchun qattiq 404, CDN kesh va yuqori Lighthouse balli. |
| B12 | `npm test` node:test + type-stripping (Playwright/Vitest yo'q), `@/` aliasli modullar `tests/helpers/load-alias.mjs` orqali yuklanadi. | Sandbox'da brauzer o'rnatib bo'lmaydi; testlar haqiqiy `sitemap.ts`/`seo.ts` kodini chaqiradi (nusxa emas). |
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
