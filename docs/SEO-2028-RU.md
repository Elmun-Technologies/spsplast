# SEO strategiyasi — rus tilidagi bozorlar (Redesign 2028)

Maqsad: Rossiya, Qozog'iston, Belarus, Qirg'iziston, Tojikiston, Ozarbayjon, Armaniston, Gruziya
(SPS eksport xaritasidagi 8 davlat) va O'zbekistonda asosiy so'rovlar bo'yicha Google va Yandex'da **top-3**.

> **Halol baho.** Top-3'ni hech kim kafolatlay olmaydi. Dizayn va texnik SEO zamin yaratadi,
> lekin pozitsiyani asosan quyidagilar belgilaydi: domen/geo-signal, havolalar, Yandex Бизнес /
> Google Business kartochkalari, real sharhlar, xulq-atvor (CTR, bounce) va raqobat. Bu reja shu
> omillarning hammasini qamraydi va natija oylar ichida, bosqichma-bosqich keladi.

## 0. Eng katta to'siq — domen (qaror biznesdan kerak)

Hozirgi domen `sps.uz` (ccTLD). Google ccTLD'ni **avtomatik O'zbekistonga geo-bog'laydi** va Search
Console'da boshqa davlatga o'zgartirib bo'lmaydi. Yandex ham `.uz` saytni O'zbekiston regioniga
bog'laydi. Natijada Rossiya/Qozog'iston SERP'ida mahalliy `.ru`/`.kz` va `.com` saytlar ustun turadi.

Variantlar:

| Variant | RU/KZ uchun kuch | Narx/murakkablik |
|---|---|---|
| A. Faqat `sps.uz` | Past (geo = UZ) | 0 |
| B. Xalqaro gTLD: `spsplast.com/ru/` + hreflang | O'rta–yuqori, bitta sayt | Domen + 301 strategiyasi |
| C. Mahalliy domenlar: `.ru`, `.kz` (+ mahalliy kontakt) | Eng yuqori | Har biri alohida sayt/kontent, ko'proq ish |

**Qaror (2026-11-01): B — `spsplast.com`, bitta domen, barcha tillar** (`/uz`, `/ru`, `/en`).
`sps.uz` ni alohida O'zbekiston sayti qilib qoldirish o'rniga butunlay `spsplast.com` ga 301 qilamiz:
kichik kompaniya uchun havolalar va domen obro'si bitta joyda yig'ilgani ikkiga bo'linganidan kuchliroq;
O'zbekiston auditoriyasini `/uz` + `hreflang="uz"` qamraydi.

Kodda bajarilgan:
- `SITE_URL` standarti `https://spsplast.com` (`src/lib/seo.ts`) — canonical, hreflang, sitemap, robots, JSON-LD.
- `next.config.js`: `www.spsplast.com`, `sps.uz`, `www.sps.uz` → `https://spsplast.com/:path*` (301, yo'l saqlanadi;
  eski CMS manzillari keyin migratsiya xaritasidan o'tadi). Test: `tests/seo2027.test.js` 15.

Ko'chishda qilinadigan (biznes/administrator):
1. `spsplast.com` ni sotib olish, Vercel → Domains'ga 4 ta hostni ulash, `NEXT_PUBLIC_SITE_URL=https://spsplast.com`.
2. Google Search Console: ikkala domenni tasdiqlash → `sps.uz` uchun **Change of Address** → `spsplast.com`.
3. Yandex Webmaster: ikkala sayt → `sps.uz` uchun **«Переезд сайта»** → `spsplast.com`; sayt regioni bo'sh/xalqaro.
4. `sps.uz` domenini kamida 1–2 yil yangilab turish (301 ishlashi va havolalar vazni o'tishi uchun).
5. Yandex Бизнес / Google Business kartochkalari, ijtimoiy tarmoqlar, katalog PDF va vizitkalardagi saytni yangilash.

Qozog'iston/Rossiya eng katta bozor bo'lib chiqsa, keyinroq C (`.kz`, `.ru`) qo'shilishi mumkin.

## 1. So'rovlar klasterlari (RU)

Hajmlar Yandex Wordstat (davlat bo'yicha) va Google Keyword Planner'da **tekshirilishi shart** —
bu yerda raqam o'ylab topilmaydi.

| Klaster | Asosiy so'rov | Sahifa |
|---|---|---|
| Kategoriya | формы для тротуарной плитки | `/ru/catalog/paving` |
| Material | пластиковые формы для плитки | `/ru/catalog/paving` (H2 + matn) |
| Brusčatka | формы для брусчатки | teg-landing |
| O'lcham | формы для плитки 300×300 / 200×200 / 400×400 | teg-landing |
| Qalinlik | формы для плитки 30 мм / 40 мм / 50 мм | teg-landing (25–30, 35–40, 45–50) |
| Fasad | формы для фасадной плитки / панелей | `/ru/catalog/facade` |
| Dekor | формы для декоративных элементов | `/ru/catalog/decor` |
| Opt | формы для тротуарной плитки оптом / от производителя | `/ru/partners` |
| Geo | формы для тротуарной плитки + Казахстан / Алматы / Москва … | `/ru/dostavka/{country}` |
| Model | форма Монако / Ялта … | model sahifasi (`name.ru` kirillcha) |
| Narx | ... цена / купить | kategoriya + FAQ ("цена зависит от объёма"). Biznes qoidasi bo'yicha narx yo'q — bu so'rovlarda CTR past bo'lishi mumkin; sniptda "рассчитаем под ваш объём" va'dasi |

## 2. Sahifalar arxitekturasi (kanvasda chizilgan)

- **Kategoriya SEO-sahifasi** (`RU · Формы для тротуарной плитки`): H1 = asosiy so'rov; birinchi
  ekranda 1–2 jumla kirish; teg-landinglar; kartochkalar (`Форма «Монако»`, alt matnlar);
  "Доставка в 8 стран" bloki; foydali matn (qalinlik jadvali, qolip soni formulasi, PP/ABS);
  "Почему SPS" (tasdiqlangan raqamlar); FAQ; zayafka formasi (davlat tanlovi).
- **Teg-landinglar**: har biri o'z URL, H1, 300–600 so'zli noyob matn, canonical o'ziga.
  2+ filtr kombinatsiyasi va `?sort=` — `noindex, follow` (dublikat oldini olish).
- **Geo-sahifalar** `/ru/dostavka/{rossiya|kazakhstan|belarus|kyrgyzstan|tadzhikistan|azerbajdzhan|armeniya|gruziya}`:
  noyob matn (shablonni ko'chirish emas), mamlakatga oid FAQ, telefon maskasi (+7, +375…),
  boshqa davlatlarga o'zaro havolalar. Faqat tasdiqlangan faktlar: muddat/narx/valyuta — "по договорённости".
- **Model sahifalari**: `name.ru` kirillcha nomlar majburiy (hozir `null` — `docs/data-questions.md`),
  title: `Форма для плитки «Монако» 300×300×30 — SPS`.
- **Ichki havolalar**: footer'da 8 davlat + asosiy teglar; kategoriya ↔ geo ↔ model.

### 2a. Kodda bajarildi (2026-11-01)

- **Teg-landinglar** `/{lang}/catalog/paving/tag/{tag}` — 7 ta: `walk-25-30`, `yard-35-40`,
  `parking-45-50`, `300x300`, `200x200`, `figured`, `sets`. Mantiq `src/lib/seoPages.ts`
  (`TAG_DEFS`, `MIN_TAG_MODELS = 6` — modeli kam teg sahifa olmaydi, ma'lumot ko'paysa o'zi paydo bo'ladi),
  matnlar `getPages(lang).seo.tags` (uz/ru/en). Har birida o'z H1/title/description, canonical,
  BreadcrumbList + ItemList, teg chip'lari, katalog bloki, "Как выбрать форму" qo'llanmasi, davlatlar bloki.
- **Geo-sahifalar** `/{lang}/export/{country}` — 8 ta (`russia`, `kazakhstan`, `belarus`, `kyrgyzstan`,
  `tajikistan`, `azerbaijan`, `armenia`, `georgia`). URL rejadagi `/ru/dostavka/...` o'rniga uch tilda bir xil
  inglizcha slug (hreflang to'plami bitta sahifaga bog'lanadi). Har birida davlatga oid H1/lead/FAQ (shaharlar),
  BreadcrumbList + ItemList + FAQPage, forma: davlat oldindan tanlangan, telefon placeholder'i davlat kodi bilan.
  Narx/muddat/valyuta — "по договорённости" (faqat tasdiqlangan faktlar).
- **Ichki havolalar**: footer'da "Eksport" ustuni (8 davlat, har sahifadan), bo'lim sahifasida teg chip'lari +
  qo'llanma + davlatlar bloki, geo-sahifada "Доставляем также".
- **Sitemap**: 432 URL = (6 doimiy + 4 bo'lim + 7 teg + 8 davlat + 119 model) × 3 til.
- Tekshiruv: `tests/seoPages2028.test.js` (6 test: teg ≥ 6 model, 3 tilda matn, title ≤ 53 belgi + suffiks,
  description 50–170, narx/"yaratish"/token yo'q, statik marshrut, ichki havolalar, audit qamrovi).
- Qolgan: noyob uzun matnlar (300–600 so'z) har teg va davlat uchun — biznes faktlari bilan (shaharlar bo'yicha
  dilerlar, real yetkazish misollari); `name.ru` kirillcha model nomlari.

## 3. Texnik SEO

- `hreflang`: `uz`, `ru`, `en`, `x-default` (hozir bor). Mintaqaviy `ru-KZ`/`ru-RU` faqat **alohida
  kontent** bo'lsa (geo-sahifalar o'z URL'ida yetarli; bir xil matnni ru-KZ deb ko'paytirmaslik).
- JSON-LD: BreadcrumbList, ItemList (kategoriya), FAQPage, Organization + `areaServed` (8 davlat),
  Product **narxsiz** (biznes qoidasi 8 — test bilan himoyalangan).
- Core Web Vitals: LCP < 2,5 s (mobil), CLS < 0,1 — Lighthouse budjetlari (`npm run lighthouse`).
- Sitemap: kategoriya + teg-landinglar + geo-sahifalar + modellar × tillar.
- Yandex.Webmaster: sayt regioni; Google Search Console: har bir til/papka.
- `robots`: filtr kombinatsiyalari, `/compare`, `/request` — noindex (bor).

## 4. Saytdan tashqari (top-3 uchun hal qiluvchi)

1. **Yandex Бизнес** va **Google Business Profile** — Toshkent zavodi; agar RU/KZ'da diler yoki
   ombor bo'lsa — o'sha manzil bilan alohida kartochka.
2. **Real sharhlar** — mijozlardan (sex egalari) Yandex/Google kartochkalarida; saytda faqat haqiqiy
   sharhlar (o'ylab topilgan sharh yo'q).
3. **Havolalar**: qurilish forumlari, katalog-saytlar (prom/b2b), diler saytlari, YouTube (qolip bilan
   ishlash videolari — "Jarayon" bloki bilan bir xil kontent).
4. **Kontent**: oyiga 2–4 maqola (masalan "Как открыть цех тротуарной плитки", "Сколько форм нужно
   на 100 м²") — kategoriya va kalkulyatorga havola bilan.

## 5. Bosqichlar

| Bosqich | Ish | Natija |
|---|---|---|
| 1 | Domen qarori (0-bo'lim), `name.ru` kirillcha nomlar | Geo-signal to'g'ri |
| 2 | ✅ Kategoriya + teg-landinglar (RU) kodga | Asosiy klasterlar indeksda |
| 3 | ✅ 8 geo-sahifa (kod); uzunroq noyob matnlar — biznes faktlari bilan | Davlat so'rovlari |
| 4 | Yandex Бизнес / Google Business, sharhlar | Mahalliy ishonch |
| 5 | Havolalar + maqolalar, oylik pozitsiya monitoringi (Topvisor / Serpstat) | Top-10 → top-3 |

## 6. Biznesdan kerakli ma'lumotlar

- Domen bo'yicha qaror (A / B / C).
- Rus tilidagi model nomlari (`name.ru`) — 119 model.
- RU/KZ'da diler yoki ombor bormi (manzil, telefon) — mahalliy kartochka uchun.
- Haqiqiy mijoz sharhlari va obyekt suratlari (ruxsat bilan).
- Yetkazish shartlari, valyuta — tasdiqlangach geo-sahifalarda "по договорённости" o'rniga.
