# UI dizayn tizimi (dizayn yangilanishi)

> Sana: 2026-09-15 · yangilandi: 2026-10 (savat/checkout/admin olib tashlangandan keyin)
> Qamrov: Bosh sahifa → Katalog → Mahsulot → Zayafka → Kontakt (admin panel va savat yo'q)

## 1. Nima uchun?

Oldingi ko'rinish "industrial" uslubda edi: qora panel va og'ir soyalar, mono (terminal) sarlavhalar, 2px qora chiziqlar, kvadrat nishonlar. Maqsad — toza, yorqin va katta bo'sh joyga ega e-commerce ko'rinishiga o'tish:

- yumshoq oq kartalar (har bir blok alohida "qog'oz" bo'lib ko'rinadi);
- kattaroq radiuslar (16–24px, tugmalar — to'liq pill);
- toza tipografika (kattaroq sarlavha, kichikroq yorliq; mono shrift faqat raqamlar uchun);
- havo (whitespace): bo'limlar orasida 24–32px, kartalar orasida 12–20px;
- aniq bo'lim sarlavhalari: katta qora sarlavha + o'ng tomonda oddiy matnli havola ("Barchasini ko'rish").

## 2. Tokenlar (`tailwind.config.js`)

| Guruh | Nomi | Qiymat | Qayerda ishlatiladi |
|---|---|---|---|
| Rang | `surface` | `#FFFFFF` | karta, panel, header, footer |
| Rang | `surface-page` | `#F6F7F9` | sahifa foni |
| Rang | `surface-soft` | `#F3F5F8` | karta ichidagi blok, input, chip |
| Rang | `surface-softer` | `#F7F8FA` | hover holatlari |
| Rang | `line` | `#EBEFF4` | karta chegarasi, ajratgich |
| Rang | `line-soft` | `#F1F4F8` | ro'yxat ichidagi ajratgich |
| Rang | `ink` | `#0F172A` | asosiy matn, sarlavha |
| Rang | `ink-soft` | `#475569` | tavsif matni |
| Rang | `ink-sub` | `#8B95A7` | yorliq, meta ma'lumot |
| Soya | `card` | `0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.05)` | kartalar (dam holati) |
| Soya | `lift` | `0 12px 28px -8px rgba(16,24,40,.14)` | karta hover |
| Soya | `pop` | `0 24px 60px -20px rgba(16,24,40,.25)` | modal, dropdown, mega menu |
| Soya | `red` | `0 8px 20px -8px rgba(230,28,36,.55)` | asosiy (qizil) tugma |

Brend rangi o'zgarmadi: `brand-red #E61C24`. Eski `card-hover` va `red` soyalari yangi qiymatlarga moslandi — mavjud markup ishlashda davom etadi.

**Muhim:** `tailwind.config.js` da bir xil kalit ikki marta yozilgan bo'lsa, keyingisi oldingisini bosib ketadi (aynan shu xato tufayli `shadow-card` eski qiymatda qolgan edi — tuzatildi).

## 3. Komponentlar

| Komponent | Eski | Yangi |
|---|---|---|
| `ui/Button` | `rounded-lg`, `font-bold` | `rounded-full`, `font-semibold`, `active:scale-[.98]`, min balandlik 44–48px |
| `ui/Badge` | katta harflar, kvadrat | pill, `text-[11px]`, yangi `redSoft`/`greenSoft` variantlari |
| `ui/SectionHeader` | `h-px w-8` chiziq + mono yorliq + qora pill tugma | katta sarlavha (`28px`, `tracking-[-.025em]`) + oddiy matnli havola + o'q |
| `ui/Price` | — | `tracking-[-.02em]`, eski narx — ingichka chizilgan, chegirma — qizil pill |
| `ui/Skeleton` | `bg-gray-100` | `surface-soft` / `#EDF1F6`, karta radiusi 20px |
| `ui/Container` | `max-w-[1440px]` | `max-w-[1400px] px-4 sm:px-6 lg:px-10` |
| `product/ProductCard` | 2px qora yuqori chiziq, `#E5E7EB` ramka | 20px radius, `line` ramka, hover — `shadow-lift`; amal tugmalari — oq dumaloq |
| `product/CategoryCard` | ramka + 2px chiziq | to'liq `surface-soft` plitka, hover — oq + `shadow-lift` |
| `product/B2BBanner` | qora `gray-900` + blur dog'lar | `#E9EDF6` yumshoq panel, oq pill tugmalar |
| `layout/Header` | qora utility strip, kvadrat qidiruv | oq sarlavha, `surface-page` strip, pill qidiruv + dumaloq qora tugma |
| `layout/Footer` | qora fon | oq panel, ajratgichlar `line`, havolalar `ink-soft` |

## 4. Kritik oqim bo'ylab o'zgarishlar

- **Sahifa foni** hamma joyda `surface-page`, kartalar `surface` — sahifa "qatlamli" ko'rinadi.
- **Bosh sahifa**: hero qora paneldan yorqin `#EDF0F5` panelga o'tdi (yumshoq brend glow), bitta aniq asosiy CTA (qizil pill) + oq ikkinchi tugma; ishonch bloklari alohida oq kartalar; bo'lim ritmi `py-6 sm:py-8`; "Kun tanlovi" kartasi 24px radius.
- **Katalog**: og'ir sarlavha kartasi olib tashlandi (oddiy sarlavha + filtrlar), filtr paneli — 20px radius, kategoriya tugmalari pill (tanlangan — `ink`), saralash va narx maydonlari — pill, ko'rinish tugmalari — segmentlangan boshqaruv.
- **Mahsulot sahifasi**: galereya 24px radiusli yumshoq blokda, tabiiy o'lchamli thumbnail'lar ramkasiz, variant (material/qalinlik) kartalari soft + tanlanganda qizil halqa, sticky **"Zayafka berish"** paneli — oq fon + dumaloq qizil tugma.
- **Sevimlilar / Taqqoslash / Qidiruv / Zayafka formasi**: kartalar `surface` + `shadow-card`, input'lar pill, asosiy tugmalar qizil pill (matn balandroq, `font-semibold`).
- **Zayafka metaforasi**: savat ikonkasi ishlatilmaydi — barcha CTA'larda `Send` (yuborish) ikonkasi.
- **Mobil aloqa paneli**: 20px radius, `shadow-pop`.

## 5. Qamrov — qaysi sahifalar yangilandi

Dizayn tili **butun sayt**ga qo'llandi. Har bir sahifa va komponent yangi tokenlarda:

| Guruh | Fayllar |
|---|---|
| Sahifa karkasi | `[lang]/layout.tsx` (oq fon), `HeaderClient`, `Footer`, `StickyMobileContact`, `DeferredWidgets`, `SWCleanup`, `product/CompareBar` |
| Bosh sahifa | `[lang]/page.tsx` (hero panel, ishonch kartalari, bo'limlar, FAQ, `B2BBanner`) |
| Katalog | `catalog/page.tsx`, `CatalogClient` (filtr paneli, saralash, ko'rinish, sahifalash), `CategoryCard` |
| Mahsulot | `product/[slug]/page.tsx`, `ProductDetailClient` (galereya, variant kartalari, sticky zayafka paneli), `ProductCard`, `QuickViewModal`, `ProductOptions`, `ProductTabs`, `CrossSell`, `RecentlyViewed`, `MoldResultShowcase`, `BeforeAfterSlider` |
| Zayafka | `components/lead/LeadButton`, `LeadModal` (bosh sahifa, mahsulot, kontakt, sticky panel) |
| Boshqa sahifalar | `wishlist`, `compare`, `search`, `about`, `contact`, `blog`, `blog/[slug]`, `production`, `projects`, `returns`, `delivery-payment`, `privacy`, `terms`, `how-to-order`, `error.tsx`, `loading.tsx` |
| UI primitivlari | `Button`, `Badge`, `SectionHeader`, `Price`, `Skeleton`, `EmptyState`, `QuantitySelector`, `Modal`, `Breadcrumbs`, `PlaceholderImage`, `FaqAccordion`, `AIAssistant` |
| Analitika | `analytics/AnalyticsScripts` (GTM/GA4/Metrica/Pixel — faqat ID bo'lsa) |

Savat, checkout, admin panel va ularning komponentlari (`CartDrawer`,
`StockBadge`, `DealCountdown`, `ProductReviews`, `OneClickModal`, `B2BModal`,
`ui-preview`) **o'chirildi** — sayt backendsiz zayafka modelida ishlaydi.

> `blog/[slug]` sahifasida sarlavha `text-white` bo'lib qolgan edi — karkas foni oqqa
> o'tgach u ko'rinmas bo'lib qolardi, tuzatildi (endi `text-ink`).

## 6. Tekshiruv

| Tekshiruv | Natija |
|---|---|
| `npx tsc --noEmit` | ✅ 0 xato |
| `npm run lint` | ✅ 0 ogohlantirish |
| `npm test` | ✅ 45/45 |
| `npm run build` (bazasiz) | ✅ 441 statik sahifa |
| Ichki havolalar | ✅ 220 sahifa aylanib chiqildi, uzilgan havola yo'q |
| CSS chiqishi | `.bg-surface`, `.text-ink*`, `.border-line*`, `.shadow-card/lift/pop`, `.rounded-[20px]` Tailwind build'ida mavjud |

> Dizaynni ko'rish uchun endi alohida `ui-preview` sahifasi yo'q — dev serverda
> haqiqiy sahifalar ochiladi (`npm run dev` → `/uz`, `/ru`, `/uz/catalog`).

## 7. Keyingi qadam (mobil bosqichi)

- 375px kenglikda hero sarlavhasi va filtr panelini yana bir bor ko'zdan kechirish;
- `sizes` atributi yetishmayotgan sahifalar: `blog/[slug]`, `production`, `projects`;
- `RecentlyViewed` o'z `Container`ini ishlatadi → joylashtirilganda ikki marta padding;
- `Modal.tsx` da focus trap va `aria-modal` hali yo'q (QuickView, LeadModal).
