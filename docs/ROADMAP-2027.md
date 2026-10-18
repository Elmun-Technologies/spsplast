# SPS Plast — to'liq tahlil va keyingi bosqichlar (2026-10-18)

Maqsad: dunyo bo'ylab (10+ davlat) B2B mijoz va distribyutorlar uchun **to'liq ishlaydigan
sayt + admin panel** topshirish. Bu hujjat — repodagi barcha kodni ko'rib chiqish natijasi,
topilgan kamchiliklar va keyingi ishlar rejasi. Har bir bosqich alohida PR bo'ladi.

---

## 1. Hozirgi holat — nima tayyor

| Soha | Holat | Isbot |
|---|---|---|
| Ommaviy sayt (uz/ru/en) | 10 sahifa turi, 402 statik sahifa, dizayn handoff (uslub B, Onest) bo'yicha | `npm run build` ✓ |
| Katalog bloki | filtr + facet, qidiruv, saralash, panjara/ro'yxat, tez zayafka, tez ko'rish, solishtirish (4 tagacha), zayafka ro'yxati | `/uz/catalog` |
| Model sahifasi | galereya, 4 asosiy raqam, qolip kalkulyatori, tablar, FAQ, o'xshash modellar | `/uz/catalog/paving/01-monako` |
| Zayafka qabul qilish | `POST /api/leads`: Zod, honeypot, rate limit, xalqaro telefon, Telegram xabari | `src/app/api/leads/route.ts` |
| Analitika | GTM / GA4 / Yandex Metrica / Meta Pixel (faqat env bo'lsa), voqealar: `view_item`, `add_to_request`, `add_to_compare`, `generate_lead`, `search` | `docs/analytics-events.md` |
| SEO | canonical, hreflang + x-default, sitemap 387 URL, JSON-LD (narxsiz), 436 ta 301 | `tests/seo2027.test.js` |
| Sifat | **95/95 test**, typecheck + lint toza, SEO audit 0 xato, axe 0 buzilish, 390/1440/360 px da gorizontal scroll yo'q | `docs/audits/*-2026-10-18.md` |

Kod sifati yaxshi: qatlamlar toza, biznes qoidalari testlar bilan himoyalangan, sayt tez
(statik, JS+CSS ~167 KB gzip/sahifa). **Asosiy kamchilik kodda emas — ma'lumotda va
"boshqaruv" (admin) qatlamining umuman yo'qligida.**

---

## 2. Topilgan muammolar

### 2.1 Mahsulot ma'lumoti (eng katta bo'shliq)

| Muammo | Raqam | Ta'siri |
|---|---|---|
| Katalogda 152 o'rniga **119 model** | −33 | Sayt "119 model" deydi, PDF/handoff 152 |
| **Rasmsiz modellar** | 52 / 119 (44%) | Kartochkada kulrang to'rtburchak + kod. "Ko'p so'raladigan" ro'yxatining **1-o'rnidagi model (№ 70)** rasmsiz — bosh sahifadagi birinchi taassurot shu |
| Sahna (terilgan plitka) rasmi | faqat 22 modelda | Galereya yarim bo'sh |
| RU / EN model nomlari | **0 / 119** | Rus va ingliz sahifalarda nom o'zbekcha (lotin) chiqadi — xorijiy mijoz uchun jiddiy |
| Zabor panellari | 0 model | Menyuda va bosh sahifada "0 model" ko'rinadi |
| Skameyka (stul/skameyka oyoqlari) | 1 model (handoff: 7) | — |
| **Fasad termopanellari** | Excel'da **76 mahsulot** (`SPS_real_malumotlar_bazasi.xlsx`, 6-varaq: TP, KRN karniz, PL pilyastr, SL tsokol, FSD), saytda **0** | Siz aytgan asosiy yo'nalishlardan biri saytda yo'q |
| Fasad qoliplari (menejer varaqlari, vazn/1 m²) | 3-varaqda 80 qator, saytda 12 model | — |
| Qolip mini-rasmlari | ko'p modelda oq fonda kichkina qora qolip | Kartochkada "sariq kvadrat" bo'lib ko'rinadi — rasmni qirqish (trim) kerak |
| Bo'lim muqovalari | Zabor = zavod surati, Skameyka = port surati | Mahsulotga mos emas |
| "8 eksport davlati" | Siz 10+ davlat deyapsiz | Tasdiqlangan raqam yangilanishi kerak |

Manba fayllar (yakuniy 2027 PDF katalog uz/ru/en, render zip'lar) repoda yo'q —
`docs/data-questions.md` da 82 ta savol turibdi.

### 2.2 Zayafka va backend (pul yo'qotadigan joylar)  — ✅ Bosqich 7–8 da hal qilindi

1. **Zayafka saqlanmaydi.** Telegram ishlamasa (token xato, Telegram bloklangan, tarmoq) —
   mijoz "qabul qilindi" ko'radi, lekin zayafka **hech qayerda qolmaydi**.
2. **Zayafka raqami tasodifiy** (`SPS-YYMM-` + random 4 raqam) — takrorlanishi mumkin, ketma-ket emas.
3. **Rate limit xotirada** (`Map`) — Vercel serverless'da har instansiya o'z xotirasi bilan,
   amalda spamdan himoya qilmaydi.
4. Zayafka holati (yangi → aloqada → taklif → yutildi/yutqazildi), mas'ul menejer, izohlar —
   yo'q. Menejer ishini Telegram chatidan kuzatib bo'lmaydi.

### 2.3 Admin panel — umuman yo'q — ✅ zayafkalar qismi tayyor (Bosqich 8), mahsulotlar — Bosqich 9

Hozir mahsulot qo'shish = Excel → Python skript → JSON → dasturchi → deploy.
Mijoz o'zi hech narsani o'zgartira olmaydi: mahsulot, rasm, tarjima, matn, kontakt,
zayafkalar, statistika — hammasi faqat kod orqali.

### 2.4 UI (bu PR'da tuzatilganlari va qolganlari)

Tuzatildi (bu PR):
- **Mobil header ikki qatorga sinardi** (390 px): til tugmasi CSS kaskadi tufayli yashirinmay,
  menyu tugmasini keyingi qatorga itarardi. Endi: logo · solishtirish · ro'yxat · qo'ng'iroq · menyu.
- **Kartochkadagi "Solishtirish" yozuvi** 44 px doiraga sig'may, rasm ustiga chiqib turardi (desktop).
- **"Butun katalog · N model" tugmasi** matni yuqoriga siljigan edi (`.hide-m { display: initial }`).
- `npm run shots` endi oldindan o'rnatilgan Chromium bilan ishlaydi (`PW_CHROMIUM_PATH`).

Qolganlari (keyingi bosqichlar):
- Rasmsiz modellar kartochkasi — rasmlar kelguncha chiroyli "brend" placeholder (kod + bo'lim
  silueti) va rasmsiz modellarni ro'yxat oxiriga surish (biznes tasdig'i bilan).
- 0 modelli bo'limni menyu/bosh sahifadan vaqtincha yashirish.
- Mobil tegish maydonlari < 44 px (36 px tugmalar, filtr radio'lari) — `docs/unresolved-questions.md` §4.
- Xorijiy mijoz uchun: valyuta/Incoterms (EXW Toshkent / DAP), minimal partiya, yetkazish muddati —
  hozir `[...]` placeholder.
- SSR `<html lang="uz">` barcha tillarda (SEO uchun hreflang to'g'ri, lekin ekran o'quvchilar uchun kamchilik).

---

## 3. Arxitektura qarori (sizdan tasdiq kerak)

`CLAUDE.md` va testlar hozir **"ma'lumotlar bazasi yo'q, faqat 2 ta API"** qoidasini
majburlaydi. Admin panel, zayafkalarni saqlash va analitika paneli — bularning hammasi
**baza + avtorizatsiya**siz bo'lmaydi. Shuning uchun bu qoidani ongli ravishda o'zgartirish kerak.

Tavsiya etilgan arxitektura:

```
                ┌──────────── Vercel (Next.js 15, bitta loyiha) ────────────┐
 Mijoz ───────► │ /{lang}/...   ommaviy sayt — statik (ISR + on-demand revalidate)
                │ /api/leads    → 1) bazaga yozadi  2) Telegram  3) e-pochta (ixtiyoriy)
                │ /api/events   → biznes voqealari (ko'rish, ro'yxat, zayafka)        │
 Menejer ─────► │ /admin/...    login + rollar (admin, menejer), noindex            │
                └───────┬───────────────────────────────┬──────────────────────────┘
                        │                               │
                 PostgreSQL (Neon yoki Supabase)   Rasm xotirasi (Vercel Blob / S3)
                 mahsulotlar, tarjimalar, zayafkalar,   original → sharp → WebP 400/800/1400w
                 voqealar, foydalanuvchilar, audit-log
```

Nima uchun shunday:
- **Ommaviy sayt tezligi saqlanadi**: sahifalar baribir statik; admin "Saqlash" bossa
  faqat o'sha sahifa qayta yig'iladi (`revalidateTag`). Lighthouse balli tushmaydi.
- **Bitta loyiha, bitta deploy** — alohida server, alohida admin-sayt kerak emas.
- **Zayafka avval bazaga** yoziladi, keyin Telegram — Telegram yiqilsa ham zayafka yo'qolmaydi,
  admin'da "Telegram'ga yetkazilmagan" belgisi bilan ko'rinadi.
- Mavjud `models-2027.json` bir martalik import bilan bazaga ko'chadi; Excel import admin'da qoladi.

---

### Qabul qilingan qarorlar (2026-10-18)

| Savol | Qaror |
|---|---|
| Baza / admin | **Postgres + o'z admin** (shu Next.js loyihada `/admin`, Drizzle ORM, Neon yoki Supabase) |
| Narx | **Faqat zayafka** — saytda narx yo'q (diler kabineti keyinroq ko'rib chiqiladi) |
| Tillar | Hozircha **uz/ru/en** (avval ru/en model nomlari); keyin qozoq, qirg'iz, tojik, turkman, turk, ozarbayjon |
| Birinchi ish | **Bosqich 7+8** — ✅ bajarildi (`docs/ADMIN.md`) |

## 4. Bosqichlar

Har bosqich = alohida PR, testlar yashil, preview'da ko'rib tasdiqlanadi.

### Bosqich 7 — Baza va zayafkalarni saqlash ✅
- PostgreSQL + Drizzle ORM, migratsiyalar; `leads`, `lead_items`, `lead_events` jadvallari.
- `/api/leads`: bazaga yozish → Telegram → `delivered` belgisi; ketma-ket zayafka raqami
  `SPS-YYMM-NNNN` (bazadagi sequence).
- Rate limit — bazada (serverless'da ishlaydi).
- Testlar: Telegram o'chiq bo'lsa ham zayafka saqlanadi; raqam takrorlanmaydi.

### Bosqich 8 — Admin panel: kirish va zayafkalar (CRM) ✅
- `/admin` login (e-pochta + parol; 2FA — keyinroq), rollar: **admin**, **menejer**.
- Zayafkalar ro'yxati: filtr (holat, davlat, mijoz turi, sana, manba/UTM), qidiruv,
  kartochka: modellar, kunlik m², qolip soni hisobi, WhatsApp/Telegram/tel havolalari.
- Holatlar: Yangi → Aloqaga chiqildi → Taklif yuborildi → Yutildi / Yutqazildi (sabab bilan).
- Mas'ul menejer, izohlar, tarix (kim, qachon, nima o'zgartirdi), CSV/Excel eksport.
- Telegram xabarida "Admin'da ochish" havolasi.

### Bosqich 9 — Admin: mahsulotlar va rasmlar (2 hafta)
- Bo'limlar: trotuar, fasad, **termopanel**, zabor, dekor, **skameyka/stul oyoqlari** — admin
  o'zi bo'lim qo'sha oladi (hozir 5 ta qattiq yozilgan).
- Mahsulot formasi: kod, slug, nom/tavsif uz·ru·en, qoliplar (o'lcham, chuqurlik, vazn),
  plitkalar (1 m² ga dona), texnik jadval, material (PP/ABS), "mashhur" tartibi, chop etilgan/qoralama.
- **Rasm boshqaruvi**: drag-and-drop yuklash → avtomatik oq fonni qirqish (trim), WebP
  400/800/1400w, 1:1 va 4:3 kesim ko'rinishi, rol (sahna / qolip / tayyor plitka / yaqindan), tartib, alt matn 3 tilda.
  Sifat nazorati: kichik (< 1200 px) yoki xira rasm haqida ogohlantirish.
- "Ma'lumot to'liqligi" ko'rsatkichi har mahsulotda: rasm bormi, ru/en nom bormi, vazn bormi.
- Excel import (mavjud 2 ta xlsx formati) — termopanel 76 ta mahsulotni bir bosishda yuklash.
- Saqlanganda sayt sahifasi avtomatik yangilanadi; sitemap ham.

### Bosqich 10 — Analitika paneli (1 hafta)
- Admin bosh sahifasi: bugun/hafta/oy zayafkalar, konversiya (ko'rish → ro'yxat → zayafka),
  **davlatlar bo'yicha** zayafkalar (xarita), top modellar (ko'rilgan / so'ralgan),
  manbalar (Google, Instagram, Telegram, to'g'ridan-to'g'ri, UTM kampaniyalar), menejer javob tezligi.
- Ma'lumot: o'z voqealar jadvalimiz (biznes voqealari, cookie'siz) + GA4 trafik uchun.
- Haftalik hisobot Telegram'ga.

### Bosqich 11 — Kontent va global bozor (1–2 hafta, ma'lumot kelishiga bog'liq)
- 152+ model va 76 termopanel: rasmlar, ru/en nomlar, sahna renderlari (admin orqali yoki import).
- Sayt sozlamalari admin'da: kontaktlar, raqamlar (yil, quvvat, davlatlar soni), FAQ, ulgurji shartlar.
- Distribyutorlar xaritasi va "Distribyutor bo'lish" oqimi; davlat bo'yicha mas'ul kontakt.
- Qo'shimcha tillar (qaror: qozoq, qirg'iz, tojik, turkman, turk, ozarbayjon) — i18n tizimini
  3 tildan N tilga kengaytirish + lug'at va tarjimalar.
- Yetkazish shartlari (EXW/DAP, valyuta, minimal partiya) — biznes tasdig'idan keyin.

### Bosqich 12 — Ishga tushirish (3–5 kun)
- Prod env (baza, Telegram, analitika ID), domen va `www → apex`, zaxira nusxa (backup) jadvali.
- Lighthouse mobil ≥ 90 / A11y ≥ 95 / SEO 100 qayta o'lchov, Google Search Console + Yandex Webmaster.
- Admin uchun qisqa qo'llanma (uz/ru), menejerlarga 1 soatlik o'rgatish.

### Keyinroq (ixtiyoriy)
- Diler kabineti: login qilgan distribyutor o'z narx-varag'ini, buyurtma tarixini ko'radi
  (ommaviy saytda narx baribir yo'q).
- AmoCRM / Bitrix24 integratsiyasi (agar kompaniya CRM ishlatsa).
- WhatsApp Business API orqali avtomatik javob.

---

## 5. Biznesdan kerak bo'lgan narsalar (kodsiz to'xtab qoladigan joylar)

1. Yakuniy 2027 katalog PDF (uz/ru/en) yoki 152 model ro'yxati + ru/en nomlar.
2. Render / foto arxivlari (`SPS_blender_yakuniy*.zip`, `bgeraser_results_*.zip`) yoki
   rasmsiz 52 model uchun yangi fotosessiya.
3. Termopanel, zabor panellari, stul/skameyka oyoqlari bo'yicha to'liq ro'yxat va rasmlar.
4. Eksport davlatlari ro'yxati (hozir "8", siz 10+ deyapsiz) va distribyutorlar (shahar, kontakt).
5. Ulgurji shartlar: minimal partiya, chegirma, to'lov, muddat, Incoterms, valyuta.
6. E-pochta, yuridik nom, maxfiylik siyosati (yurist tasdig'i).
7. Admin panelga kiradigan xodimlar ro'yxati va rollar.

---

## 6. Qanday davom ettiramiz

Har bosqich boshida Claude Code'ga: *"ROADMAP-2027.md dagi Bosqich N ni bajar"* deyish kifoya.
Har bosqich oxirida: testlar + audit + skrinshotlar, PR va Vercel preview havolasi.
