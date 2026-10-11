# SPS Plast — sayt dizayni: Claude Code uchun topshiriq (handoff)

Versiya: 2026-10-08 · Uslub: **B — "Yorug' premium" (Onest)** · Maket: Claude Design kanvasi "SPS Plast Website"

Bu paket saytni kodga o'tkazish uchun yagona manba. Ziddiyat bo'lsa ustuvorlik: **HANDOFF.md → screens/ → source/**.

```
sps-design-handoff/
  HANDOFF.md            ← shu fayl: qoidalar, tokenlar, sahifalar, komponentlar, holatlar
  PROMPT.md             ← Claude Code'ga beriladigan tayyor topshiriq
  screens/mobile/*.jpg  ← 13 ta mobil ekran (390 px, to'liq sahifa)
  screens/desktop/*.jpg ← 11 ta desktop ekran (1440 px)
  screens/i18n/*.jpg    ← RU va EN bosh sahifa (desktop + mobil) — matn uzunligi namunasi
  source/*.dc.html      ← maket manbasi (HTML+CSS, aniq o'lchamlar shu yerda)
  source/site.css       ← umumiy uslublar + B uslubi override (fayl oxirida)
  source/ds/            ← dizayn tizimi tokenlari va komponent CSS
  images/brand|site|stock ← logo va sayt rasmlari
  images/blob-map.csv   ← maketdagi /_blob/<id> → qaysi rasm ekanligi
  data-sources/         ← katalog ma'lumot manbalari (Excel) + README (ustuvorlik)
```

> Ekran rasmlarida **kulrang to'rtburchaklar** = katalog rasmi (model sahnasi yoki qolip surati). Ular ma'lumotdan keladi, dizayn xatosi emas.

---

## 1. Biznes qoidalari (buzilmasin)

1. **Narx saytda yo'q.** Onlayn to'lov, savat, checkout yo'q. Faqat **zayafka** (so'rov) olinadi → menejer qolip soni va narxini hisoblaydi.
2. Atamalar: **"Zayafka"**, **"Zayafka qoldirish"**, **"Zayafka ro'yxati"**, **"Ulgurji va hamkorlik"**. "So'rov", "Narx so'rash", "Savat", "Hamkorlar uchun" ishlatilmaydi.
3. O'zbek matnida **"yaratish" so'zi umuman ishlatilmaydi** (o'rniga "ishlab chiqarilgan").
4. Katalog: **152 model, 5 bo'lim** — Trotuar plitkasi 91, Fasad 26, Zabor panellari 10, Dekor panellar 18, Skameyka oyoqlari 7.
5. Tasdiqlangan raqamlar: 20 yil tajriba, 18 000 m² oylik quvvat, 740+ obyekt, 8 eksport davlati. Boshqa raqam o'ylab topilmaydi.
6. Tillar: **uz (asosiy), ru, en**. Arab tili yo'q.
7. Mobil birinchi (mobile-first): asosiy mijoz telefondan kiradi.

### Biznesdan kutilayotgan ma'lumotlar (saytda `[...]` placeholder qoldirilsin)
- E-pochta `[E-POCHTA]`
- Minimal buyurtma `[MIN. HAJM]`, ulgurji chegirma `[% DAN]`, to'lov `[SHARTLAR]`, muddat `[ISH KUNI]`
- Yetkazish sharti `[EXW TOSHKENT / DAP]`, valyuta `[USD · RUB · UZS]`, `[KELIB CHIQISH SERTIFIKATI]`
- PP va ABS qachon tanlanishi `[TEXNOLOG TAVSIYASI]`

### Kontaktlar
- Savdo: +998 98 300 77 72 (asosiy, WhatsApp), +998 33 338 77 72, +998 33 888 77 72 · Ofis: +998 78 777 00 07
- Telegram @spsplastuz · Instagram @spsplast.uz
- Manzil: Toshkent, Uchtepa tumani, Xalqa yo'li ko'chasi, 7A · koordinata 41.299833, 69.150472
- Ish vaqti: Du–Sha 09:00–18:00 (UTC+5)

---

## 2. Dizayn tokenlari (uslub B)

### Ranglar
| Token | Qiymat | Qayerda |
|---|---|---|
| `--surface` | `#ffffff` | kartochka, header, forma |
| `--surface-alt` | `#efece6` | hero, sec-alt bo'limlar, kalkulyator foni |
| `--surface-ink` | `#141414` | footer, tanlangan chip/filtr, solishtirish paneli |
| `--ink` | `#141414` | asosiy matn |
| `--ink-muted` | `#5e5b56` | ikkilamchi matn, label |
| `--line` | `#dedbd5` | chegaralar |
| `--line-strong` | `#8f8b84` | input chegarasi |
| `--red` / hover | `#e3202a` / `#c41a23` | asosiy CTA (sahifada bitta asosiy qizil tugma) |
| `--red-ink` | `#c8161f` | qizil matn, eyebrow, linklar |
| success | `#1f7a4d` matn, `#e7f3ec` fon | "Zayafka qabul qilindi" |
| error | `#c8161f` matn, `#fbe9ea` fon | forma xatosi |
| compare diff | `#fff7e6` | solishtirishda farq qatori |

### Shrift — faqat **Onest** (400/500/600)
- O'zimizda saqlansin (self-host woff2, latin + cyrillic, `font-display: swap`). `next/font/google` ishlatilmaydi.
- Raqamlar: `font-variant-numeric: tabular-nums` hamma joyda.
- Mono shrift yo'q (eski IBM Plex Mono va Unbounded olib tashlandi).

| Rol | Desktop | Mobil (≤760) |
|---|---|---|
| display-l (H1 sahifa) | 600 52/56, ls −0.03em | 32/36 (bosh sahifa hero 30/34) |
| h1 (bo'lim sarlavhasi) | 600 40/44, ls −0.025em | 28/32 |
| h2 | 600 28/34 | 24/30 |
| h3 | 600 20/28 | 20/28 |
| lead | 400 18/28 | 16/25 |
| body | 400 16/26 | 16/26 |
| small / help | 400 13–14/18–20 | — |
| label / eyebrow | 500 12/16, UPPERCASE, ls .06em | 11/16 |
| kartochka nomi | 600 19/23 | 15/19 |

Eyebrow: `<b>` qismi qizil (`--red-ink`), qolgani `--ink-muted`.

### Shakl
- Tugmalar, header qidiruvi, chip, teg, segmented control, header ikon-tugmalari: **pill (999px)**
- Input / select / textarea: **10px**
- Kartochkalar, kontent rasmlari, hamkor kartochkalari: **14px** (overflow hidden)
- Kartochkadagi qolip mini-rasmi: 8px
- Soya faqat kartochka hover'da: `0 1px 0 rgba(20,20,20,.06), 0 12px 32px rgba(20,20,20,.08)`

### O'lchamlar
- Spacing: 4/8/12/16/24/32/48/64/96/128
- Konteyner max 1320px; gutter 24px (≤760: 16px)
- Tugma balandligi: sm 36, md 48, lg 56; touch target ≥ 44px
- Breakpointlar: **≤640** (telefon), **≤760** (katta telefon), **≤1100** (planshet), >1100 desktop

---

## 3. Global komponentlar

### Header (`source/Header.dc.html`)
- **Desktop:** 72px qator: logo · "Katalog · 152" (qora pill) · qidiruv (pill, "Model nomi yoki kodi: Monako, 70" + "Qidirish") · telefon + ish vaqti · UZ/RU/EN · solishtirish ikonasi (badge) · zayafka ro'yxati ikonasi (badge) · "Zayafka qoldirish" (qizil). 44px ikkinchi qator: 5 bo'lim + soni | Ulgurji va hamkorlik · Ishlab chiqarish · Eksport · Kontakt · o'ngda "PDF katalog ↓". Joriy sahifa — 2px qizil pastki chiziq.
- **Mobil (≤760):** logo (32px) · solishtirish · zayafka ro'yxati · qo'ng'iroq (`tel:`) · menyu. Ostida to'liq kenglikdagi qidiruv (44px). Ostida bo'limlar qatori (gorizontal scroll).
- Badge: qizil doira 20px, 0 bo'lsa ko'rinmaydi. Header sticky.

### Mobil menyu (`MMenu`)
Butun ekran. Yuqorida logo, til tanlash, yopish (qora). 5 bo'lim (katta, 22px, soni bilan). 2 ustunli ikkilamchi linklar: Zayafka ro'yxati (badge), Solishtirish (badge), Ulgurji, Ishlab chiqarish va eksport, Kontakt, PDF katalog. Pastda: telefon, Telegram/WhatsApp, "Zayafka qoldirish".

### Footer (`Footer`)
Qora fon. Logo + tavsif + til tanlash · Katalog (5 bo'lim) · Kompaniya · Aloqa. Pastki qator: © 2026, Maxfiylik siyosati. ("Yetkazib berish va to'lov" sahifasi yo'q — shartlar tasdiqlangach qo'shiladi.)

### Katalog bloki (`source/Shop.dc.html`) — eng muhim komponent
Bosh sahifada (12 ta mashhur model, mobilda ichki qidiruv yashiriladi) va katalog sahifasida (24 tadan) ishlatiladi.

**Filtrlar** (desktop: chap sidebar 248px, sticky; ≤1100: "Filtr" tugmasi → to'liq ekran sheet):
- Bo'lim: trotuar, fasad, zabor, dekor, skameyka
- Qo'llanish (faqat trotuar, qalinlik bo'yicha): Piyoda yo'lak 25–30 mm, Hovli 35–40 mm, Avtoturargoh 45–50 mm
- Plitka o'lchami: 300×300, 400×400, 200×200, Figurali/boshqa
- To'plam: 1 / 2 / 3 qolipli
- Har bir variant yonida joriy filtrlar bo'yicha soni (facet count). Bitta guruhda bitta tanlov (radio kabi, qayta bosish — bekor qilish).
- Sheet pastida: "Tozalash" + "N ta modelni ko'rsatish".

**Asboblar paneli:** "N ta model topildi / katalogda 152" · qidiruv (kod yoki nom, "№" e'tiborsiz) · saralash (Ko'p so'raladigan [default], Kod, Qalinlik, O'lcham) · panjara/ro'yxat. Mobilda tartib: qidiruv (to'liq kenglik) → [Filtr · N] [Saralash] → soni. Faol filtrlar × bilan teg bo'lib ko'rinadi.

**Kartochka:**
- Rasm 4:3 (mobil 1:1), chap pastda qolip mini-rasmi (30%, mobil 38%), o'ng tepada "Solishtirish" checkbox (mobilda faqat ikon), o'ng pastda "Tez ko'rish" (faqat desktop).
- Tana: "№ 70 · Trotuar" · nom · 3 ta ko'rsatkich (O'lcham, Qalinlik, 3-chi: To'plam N qolip | 1 m² ga N dona | Material) — mobilda 2 ta (O'lcham + 3-chi).
- Pastda: "Zayafka" (qizil) + zayafka ro'yxatiga qo'shish ikonasi (qo'shilganda qora).
- Butun nom va rasm model sahifasiga link.
- Panjara: 3 ustun (desktop) / 2 (≤1100) / 2 ixcham (≤640). Ro'yxat ko'rinishi: rasm chapda 240px.
- "Yana ko'rsatish" (+12), ostida "Butun katalog · 152 model →".
- Bo'sh natija: "Bu filtrlar bo'yicha model topilmadi" + "Filtrni tozalash" + "Zayafka qoldirish".

**Tez zayafka oynasi** (kartochkadagi "Zayafka"): desktop — markazda modal (max 560), mobil — pastdan chiqadigan sheet (92vh). Ichida: model rasmi, kod, nom, o'lcham · Ism* · Telefon/WhatsApp* · Kunlik hajm m² · Shahar/davlat · izoh "Narx va qolip sonini menejer hisoblab, telefon yoki Telegram orqali aytadi." · "Zayafka yuborish" + "Ro'yxatga qo'shish". Yuborilgach: yashil belgi, "Zayafka qabul qilindi", ish vaqti, "Katalogga qaytish".

**Tez ko'rish:** 2 ustunli modal (rasm + qolip | kod, nom, 4 qatorli jadval, Zayafka + Batafsil).

**Solishtirish paneli:** 1+ model belgilansa ekran pastida qora panel (fixed, max 760px): kichik rasmlar, "N / 4 model", Tozalash, "Solishtirish →". Maks 4 model.

---

## 4. Sahifalar va marshrutlar

Hamma marshrut `/{lang}/…` (uz|ru|en). Ekranlar `screens/` da.

| # | Sahifa | Marshrut | Maket | Ekran |
|---|---|---|---|---|
| 1 | Bosh sahifa | `/{lang}` | Main / Mobile | 01-bosh-sahifa |
| 2 | Katalog | `/{lang}/catalog`, `/{lang}/catalog/{section}` | Catalog / MCatalog | 02 / 03 |
| 3 | Model | `/{lang}/catalog/{section}/{slug}` | Model / MModel | 03 / 06 |
| 4 | Solishtirish | `/{lang}/compare` | Compare / MCompare | 04 / 07 |
| 5 | Zayafka ro'yxati | `/{lang}/request` | RequestList / MRequestList | 05 / 08 |
| 6 | Ulgurji va hamkorlik | `/{lang}/partners` | Partners / MPartners | 06 / 09 |
| 7 | Ishlab chiqarish va eksport | `/{lang}/production` (`#eksport`) | Production / MProduction | 07 / 10 |
| 8 | Kontakt | `/{lang}/contact` | Contact / MContact | 08 / 11 |
| 9 | Maxfiylik siyosati | `/{lang}/privacy` | Privacy / MPrivacy | 10 / 12 |
| 10 | 404 | `not-found` | NotFound / MNotFound | 11 / 13 |

Section slug: `paving` (trotuar), `facade` (fasad), `fence` (zabor), `decor` (dekor), `bench` (skameyka).

### 4.1 Bosh sahifa
1. Hero (`--surface-alt`): eyebrow "SPS · Qoliplar zavodi · Toshkent", H1 "Beton plitka va fasad uchun plastik qoliplar — 152 model.", lead, 3 ta statistika (20 yil · 18 000 m² · 8), ostida 5 bo'lim plitkasi (rasm + pastdan qora gradient, nom + "N model"). Mobil: bo'limlar 2 ustun, birinchisi to'liq kenglik.
2. "Qolipni tanlang" + Katalog bloki (12 model).
3. 4 ta afzallik (ikon + sarlavha + matn).
4. "Uch qadamda narx oling" (3 qadam + Zayafka/Telegram).
5. Ulgurji bloki (oq fon): matn + 2 rasm (zavod, konteyner) + "Ulgurji shartlar" / "PDF katalog · 3 tilda".
6. Footer.

### 4.2 Model sahifasi
- Desktop grid: 96px thumbs | rasm (1:1) | 440px o'ng panel (sticky). Mobil: rasm (to'liq kenglik) → thumbs (gorizontal) → panel.
- Galereya: Terilgan ko'rinish (3D sahna) · Qolip (haqiqiy surat) · Tayyor plitka · Yaqindan. Rasm ustida teg.
- Panel: "№ 01 · Trotuar plitkasi qolipi", "PP / ABS" teg, H1, tavsif, 4 ta asosiy raqam (2×2 grid), **kalkulyator**, CTA: "Zayafka qoldirish — narxni bilish" + "Zayafka ro'yxatiga" + "Solishtirish", kontakt qatori.
- **Kalkulyator:** kunlik m² (default 100) → qolip soni = `ceil(m² × dona_1m2)`; qoliplar vazni = `m² × kg_1m2`. "kuniga 1 aylanma" izohi. To'plamli (2–3 qolipli) modellarda qolip soni o'rniga "Bu to'plam uchun qolip sonini menejer hisoblaydi."
- Tablar: Texnik ma'lumot (jadval + tayyor plitka rasmi) · Qo'llanish va terish · Yetkazish va narx · Savollar.
- "300 × 300 mm — boshqa modellar" (4 ta, shu o'lcham/bo'lim).
- Mobil: pastda sticky panel — qo'ng'iroq ikonasi · "Ro'yxatga" · "Zayafka".
- Hajmi taxminiy (zabor/dekor/skameyka) bo'lsa `*` va izoh.

### 4.3 Solishtirish
Ustunlar = modellar (rasm, kod, nom, Zayafka, ×). Qatorlar: Tayyor element, Qalinlik, Qoliplar soni, 1 m² ga, Bitta qolip vazni, 1 m² uchun qoliplar, Qo'llanish, Material. Farq qatorlari `#fff7e6`. "Faqat farqlarni ko'rsatish" checkbox. Birinchi ustun sticky; mobilda 96px label + 150px model ustunlari, gorizontal scroll.

### 4.4 Zayafka ro'yxati
"Bu savat emas — to'lov yo'q." Har bir qator: rasm, kod, nom, o'lcham, kunlik m² input, ostida "≈ N qolip" yoki "soni menejer hisoblaydi", ×. O'ngda (mobilda pastda) forma: Modellar soni, Qoliplar (taxminan), "Siz kimsiz" (Sex · Diler · Quruvchi · Xususiy), Ism*, Telefon/WhatsApp*, Shahar/davlat, Izoh, "Zayafka yuborish". Yuborilgach: zayafka raqami (API qaytaradi) + ish vaqti. Bo'sh holat bor.

### 4.5 Ulgurji va hamkorlik
Hero (och fon + o'ngda usta rasmi) → 3 hamkor kartochkasi (rasm 16:9 tepada: Plitka sexlari / Distribyutorlar [ajratilgan, 2px chegara] / Qurilish kompaniyalari, har birida 2 qatorli shartlar jadvali) → 5 qadam → Eksport jadvali → Zayafka formasi (`#sorov`) → FAQ (5 savol).

### 4.6 Ishlab chiqarish va eksport
Rasmli hero (zavod, qorong'i gradient) + 4 statistika → PP vs ABS jadvali → "Qolip bilan ishlash — 4 qadam" (rasmli) → Eksport (`#eksport`): xarita + 2 rasm + "Distribyutor bo'lish" → tashrif CTA (och fon).

### 4.7 Kontakt
Mobilda tepada 3 tez tugma (Qo'ng'iroq [qizil] · Telegram · WhatsApp). Qatorlar: Savdo bo'limi (3 raqam, `tel:`), Ofis, Messenjer, E-pochta, Manzil. O'ngda: xarita (kodda — Yandex/Google Maps embed yoki statik xarita + "Xaritada ochish" link), "Narx kerakmi?" qora blok + "Zayafka qoldirish".

### 4.8 Maxfiylik siyosati
Och hero (H1 + "Oxirgi yangilanish: [SANA] · [YURIDIK NOMI]"). Desktop: chapda sticky mundarija (6 bo'lim), o'ngda matn (max 72ch); mobil: mundarija gorizontal chiplar. Bo'limlar: qanday ma'lumot olamiz · nima uchun · qayerda saqlanadi (Telegram, saytda DB yo'q, [SAQLASH MUDDATI]) · cookie va analitika ([RO'YXAT]) · huquqlar · bog'lanish. Oxirida "[YURIST TASDIG'I]" eslatmasi — matn yuristdan o'tishi shart.

### 4.9 404
Och fon: katta "404" (o'rtadagi 0 qizil), "Bu sahifa topilmadi", eski havolalar katalogga ko'chgani haqida izoh, qidiruv, 5 bo'lim chiplari, "Katalogni ochish" + "Bosh sahifa". O'ngda (mobilda tepada) Monako sahnasi. Pastda: "Kerakli modelni topa olmayapsizmi?" + Telegram / telefon.

---

## 4.10 Tillar (RU / EN)

Namuna: `MainRu`, `MainEn`, `MobileRu`, `MobileEn` + `HeaderRu/En`, `FooterRu/En`, `ShopRu/En` (`screens/i18n/`). Kodda bitta komponent + lug'at (`uz.ts`, `ru.ts`, `en.ts`) bo'ladi; bu fayllar faqat matn uzunligini tekshirish uchun.

Topilgan farqlar:
- **RU header 2-qatori sig'maydi:** RU'da elementlar orasidagi gap 16px va "Экспорт" linki 2-qatordan olib tashlanadi (u "Производство" ichida). UZ/EN — 24px, link bor.
- **Ko'plik shakllari:** "52 моделей" emas, `Intl.PluralRules` bilan: 1 модель, 2–4 модели, 5+ моделей; EN: 1 model / N models.
- **Model nomlari RU'da kirillcha** (Монако, Фаровон) — `name.ru` maydonidan; maketda lotincha qolgan.
- Tugma matnlari RU'da uzun ("Оставить заявку") — tugmalar `white-space: nowrap`, mobilda to'liq kenglik.
- Atamalar: RU — «Заявка», «Список заявки», «Опт и партнёрство»; EN — "Request a quote", "Request list", "Wholesale & partners".

---

## 5. Holat va ma'lumot

### Mijoz tomonidagi holat (localStorage, server yo'q)
- `sps_request` — zayafka ro'yxati: `[{slug, code, name, m2?}]`
- `sps_compare` — solishtirish: `[slug]`, maks 4
- Header badge'lari shu ikkisidan. localStorage yopiq bo'lsa xotirada ishlasin (try/catch).

### Zayafka API — `POST /api/leads`
```json
{
  "type": "quick | list | partners",
  "clientType": "workshop | dealer | builder | private",
  "name": "string, 2–120, majburiy",
  "phone": "xalqaro format, 7–32 belgi, majburiy (+998, +7, +992 ...)",
  "city": "string?",
  "volumeM2": "number?",
  "company": "string?", "country": "string?", "material": "pp | abs | advice?",
  "items": [{"slug": "01-monako", "code": "01", "m2": 100}],
  "message": "string?",
  "lang": "uz | ru | en", "pageUrl": "string",
  "utm_source": "...", "utm_medium": "...", "utm_campaign": "...", "gclid": "...", "fbclid": "...",
  "website": "honeypot — bo'sh bo'lishi shart"
}
```
Javob: `{ ok: true, requestId: "SPS-2610-0147" }` (format: `SPS-YYMM-NNNN`). Telegram'ga HTML-escape bilan yuboriladi, rate limit + honeypot + Zod. Analitika: `generate_lead`, `add_to_request`, `add_to_compare`.

**Telegram xabari formati** (savdo bo'limi chatiga, `parse_mode: HTML`):
```
🟥 Yangi zayafka · SPS-2610-0147
Turi: Zayafka ro'yxati (3 model) | Tez zayafka | Ulgurji forma
Mijoz: Sex · Aziz Karimov
Telefon: +998 90 123 45 67  (WhatsApp: wa.me/998901234567)
Shahar: Samarqand, O'zbekiston
Kunlik hajm: 120 m²

Modellar:
• № 01 Monako — 100 m²/kun ≈ 1 100 qolip
• № 70 Farovon (to'plam A+B) — 60 m²/kun, soni menejer hisoblaydi
• F17 Pilyastr 3

Izoh: Qora PP, 2 rang, iyulgacha
Til: uz · Sahifa: /uz/request
Manba: google / cpc / sps-brand
Vaqt: 08.10.2026 14:32 (Toshkent)
```
Telefon raqami bosiladigan bo'lsin (`tel:`), WhatsApp havolasi avtomatik. Bo'sh maydonlar qatori chiqarilmaydi.

### Katalog ma'lumoti — `data/models-2027.json`
```ts
type Model = {
  key: string;          // "t01"
  code: string;         // "01" | "F17" | "Z05" | "D01" | "S02"
  slug: string;         // "01-monako"
  section: 'trotuar'|'fasad'|'zabor'|'dekor'|'skameyka';
  name: {uz,ru,en}; subtitle: {uz,ru,en}; note?: {uz,ru,en};
  kg: string|null;      // 1 m² uchun qoliplar vazni, "3,52"
  molds: {l:'A'|'B'|'C', size:string, depth:string|null, g:number|null, note?:{uz,ru,en}, star?:boolean}[];
  tiles: {l:string, size:string, per:string|null, cap?:{uz,ru,en}}[];   // per = 1 m² ga dona
  specs: {k:{uz,ru,en}, v:{uz,ru,en}}[];   // fasad uchun
  sizeEstimated?: boolean;                  // zabor/dekor/skameyka: o'lcham taxminiy (*)
  images: {scene:string|null, sceneSm:string|null, molds:Record<string,string>, tiles:Record<string,string>};
}
```
Filtr uchun hosila maydonlar: `thickness` (molds[0].depth), `use` (≤30 → walk, ≤40 → yard, aks holda car; faqat trotuar), `sizeGroup` (300/400/200/other), `setSize` (molds.length), `popularity` (tartib ro'yxati: 70, 01, 85, 83, 42, 89, F17, Z05, 30, 22, 64, 05).

**Muhim:** ilgari tayyorlangan `models-2027.json` va `public/catalog/2027/*.webp` repoga commit qilinmagan. Ularni qayta yig'ish kerak (manba: SPS katalog 2026–2027 PDF va Archive fayllari). Maketda ishlatilgan 52 modelning rasm ↔ kod mosligi `images/blob-map.csv` da.

---

## 6. Rasmlar
- `images/brand/` — logo (qora va oq PNG). Sayt uchun SVG yoki @2x WebP'ga o'tkazilsin.
- `images/site/` — zavod, quyish, usta, port, konteyner, eksport xaritasi (UZ). RU/EN xaritalar ham kerak (shaharlar nomi tilga qarab).
- `images/stock/` — Unsplash (bepul litsenziya): distribyutor ombori, qurilish obyekti.
- Barcha rasmlar WebP, `srcset` (mobil 640w / desktop 1280w), `loading="lazy"` (hero va birinchi 3 kartochkadan tashqari), alt matn uz/ru/en.

---

## 7. Qabul mezonlari
- 360–390 px kenglikda gorizontal scroll yo'q; barcha tugma va linklar ≥ 44px.
- Matn kontrasti WCAG AA (≥ 4.5:1), focus holati ko'rinadi, ikon-tugmalarda `aria-label`, modal/sheet: focus trap + Esc.
- Lighthouse mobil: Performance ≥ 90, Accessibility ≥ 95, SEO 100.
- uz/ru/en, `hreflang` + `x-default`, sitemap (152 × 3 model sahifasi), JSON-LD: Organization, Product, BreadcrumbList, FAQPage.
- Eski URL'lar (eski 192 mahsulot, blog, projects, about, delivery-payment …) → katalog yoki yangi sahifalarga 301; topilmaganlari 404 sahifasiga.
- Hech qayerda narx, "savat", "yaratish" so'zi yo'q.
- Ekranlar (`screens/`) bilan vizual mos: shrift Onest, pill tugmalar, 14px kartochkalar, och fonlar.
