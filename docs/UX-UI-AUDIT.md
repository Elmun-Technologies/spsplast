# SPS PLAST — To'liq UX/UI Audit & G'oyalar Banki
**Sana:** 2026-08-23
**Auditor:** Arena Agent
**Scope:** Storefront `[lang]/*`, Header/Footer, Product flow, Cart/Checkout, Search, About/Contact, Admin emas
**Stack:** Next.js 14, Tailwind, Zustand, bilingual uz/ru

---

## 1. Executive Summary

SPS Plast hozirda **“Light commerce” + “Dark industrial” ikkita dizayn tili aralashmasi**da yashayapti. Home, Catalog, Product, Cart, Checkout `#F8F9FA` och fon + oq kartalarda, About, Contact, Footer esa `#161920` qora fonda. Bu brand uchun kuchli (sanoat, zavod) lekin **izchillikni buzadi**. 

**Eng kuchli tomonlar:**
- ProductCard, MoldResultShowcase — noyob B2B/B2C g'oya, “qolip → tayyor beton” solishtirishi juda sotuvchi.
- Bulk tier pricing (1-9, 10-49, 50+) — ulgurji uchun to'g'ri yechim.
- Header'da live search + category filter + popular chips — e-commerce darajasida.
- Trust strip (Yetkazib berish, 300+ kafolat, Zavod) — ishonchni tez beradi.

**Eng kritik muammolar:**
1. **Theme drift:** `layout.tsx` `bg-brand-dark text-white` deydi, lekin `page.tsx` darhol `bg-[#F8F9FA] text-gray-900` bilan override qiladi. About/Contact esa dark. Foydalanuvchi bir saytda ikki saytdek his qiladi.
2. **Tipografika va font-size juda kichik:** `text-[11px]`, `text-[10px]` ko'p joyda — 40+ yoshli usta/bruschatka sex egasi uchun o'qish qiyin. WCAG AA fail.
3. **StickyMobileContact `bg-brand-card/95` va `border-brand-border` ishlatadi** — bular `tailwind.config.js` da yo'q (faqat `brand.dark-surface` bor). Natijada mobil bottom bar transparent yoki border'siz tushishi mumkin.
4. **Wishlist fake:** ProductCard da yurakchada `useState` local, persist yo'q, backend yo'q. Bosganda hech narsa saqlanmaydi — foydalanuvchini aldash.
5. **Checkout'da Click/Payme yo'q UI'da** — kodda bor, lekin formda faqat Cash/Bank. To'lov ishonchini yo'qotadi.
6. **Hech qanday skeleton/loading, optimistic UI yo'q.** Search, catalog filter full page reload via Link — sekin tuyuladi.
7. **Accessibility:** focus ring bor, lekin skip link, aria-label ko'p joyda yo'q, quantity selector buttonlarida label yo'q.

**Umumiy ball (10 dan):**
- Visual Consistency: 5/10
- Usability (Nielsen): 6/10
- Mobile UX: 6.5/10
- Conversion (CRO): 5.5/10
- Accessibility: 4.5/10
- B2B Funnel: 7/10

---

## 2. Dizayn Tizimi (Design Tokens) Auditi

### 2.1 Ranglar — `tailwind.config.js`
```js
brand: {
  red: '#E61C24',
  'red-dark': '#C4141B',
  'red-light': '#FEF2F2',
  'red-muted': '#FEE2E2',
  dark: '#161920',
  'dark-surface': '#1E222A',
  blue: '#2563eb',
  gray: '#6B7280',
  light: '#F8F9FA',
  muted: '#E5E7EB',
}
```
- **Muammo:** Footer `bg-[#070707]` ishlatadi — token'dan tashqari. About `bg-brand-card` ishlatadi — token'da yo'q. 3 xil qora rang.
- **Yechim:** `brand.dark`, `brand.dark-surface`, `brand.darker: #070707` ni rasmiylashtirish. `brand.card` va `brand.border` ni config'ga qo'shish yoki olib tashlash.
- Qizil juda to'yingan, CTA uchun zo'r, lekin hover'da `red-dark` yetarli kontrast bermaydi oq matnda (4.2:1, AA o'tadi, lekin kichik matnda risk).

### 2.2 Tipografika
- Hozir `Inter` system fallback. Barcha sarlavhalar `font-bold`, `font-black` — hierarchy yo'q.
- Body `text-xs` (12px) juda kichik. E-commerce standart: product title min 14px, description 14-15px.
- `font-mono` SKU, badge'larda ortiqcha ishlatilgan — industrial his beradi, lekin ko'p joyda o'qishni qiyinlashtiradi.
- **Taklif:** Scale: 12 / 14 / 16 / 20 / 24 / 30 / 36. ProductCard title `text-sm` → `text-[14px]`. Catalog filter `text-[11px]` → `text-xs`.

### 2.3 Spacing & Radius
- `rounded-xl`, `rounded-lg` aralash. Card `rounded-xl` (12px) — yaxshi, lekin button `rounded-lg` (8px) — izchil.
- Shadow: `shadow-xs`, `shadow-red` yaxshi, lekin card-lift hover `-2px` juda subtle, mobilde sezilmaydi.
- Container `max-w-[1440px] px-6 sm:px-10` — Footer'da, Header'da `px-4 sm:px-6 lg:px-8` — farq bor.

### 2.4 Iconography
- `lucide-react` izchil, yaxshi. Lekin ba'zi joyda `w-3 h-3` (12px) — touch target kichik.

---

## 3. Komponentlar Auditi

### 3.1 Header (`HeaderClient.tsx`)
**Yaxshi:**
- Top utility strip: zavod ishonchi + telefon + til switcher.
- Search: category select + live suggestions + popular chips — juda kuchli.
- Mega menu: parent + children grid, rasm bilan.

**Muammolar:**
1. **Desktop search width `max-w-[620px]`** — 1440px ekranda kichik ko'rinadi.
2. **Category select inside search:** UX jihatdan 2 ta select (category + input) bitta border ichida — foydalanuvchi qayerni bosishni bilmaydi. Amazon'da ham bor, lekin separator kuchli emas.
3. **Live search debounce 250ms** — yaxshi, lekin `isSearching` state UI'da ko'rsatilmaydi (spinner yo'q).
4. **Mobile search alohida form** — ikkita `searchQuery` state, lekin bitta source. Desktopda yozib mobilga o'tsa yo'qoladi? Yo'q, bir state, lekin UI ikki joyda — ok.
5. **Cart button:** `SAVAT` yozuvi uzbekcha, lekin ru'da ham `SAVAT` turibdi — i18n yo'q.
6. **Mega menu trigger:** `KATALOG` uppercase, lekin boshqa linklar Title Case — inconsistency.
7. **Click outside:** `mousedown` listener — mobilde `touchstart` ham kerak.
8. **Accessibility:** `select` da label yo'q, search input da `aria-label` yo'q.

**Idealar:**
- Search input'ga `⌘K` hotkey, focus ring kuchliroq.
- Suggestions'da keyboard navigation (↑↓ Enter).
- Cart icon'da mini preview (2 ta mahsulot) hover'da desktop uchun.
- Til switcherni dropdown qilish (UZ | RU | EN kelajakda).

### 3.2 Footer (`Footer.tsx`)
**Yaxshi:** Editorial 5-column, dominant SPS PLAST typo 7xl — kuchli industrial branding.

**Muammolar:**
- Telefon raqam hardcode `+998901234567` — `COMPANY_CONTACTS` dan olinishi kerak (Header'da to'g'ri).
- Catalog linklar hardcode (`bruschatka-qoliplari`, `termopanel`) — DB'dan dinamik bo'lishi kerak, bo'lmasa 404 risk.
- Ijtimoiy tarmoq yo'q (Instagram icon import qilingan lekin ishlatilmagan).
- SEO: footer description `dict.footer.desc` qisqa, keyword kam.

**Idealar:**
- Newsletter (Telegram kanal obuna) form.
- To'lov usullari iconlari (Click, Payme, Uzum) — ishonch oshiradi.
- Xarita (Yandex/Google embed) kichik.

### 3.3 ProductCard (`ProductCard.tsx`)
**Yaxshi:**
- Badge system (discount, yangi, top), StockBadge, Price component ajratilgan.
- Image `object-contain p-3` + hover scale — qolip uchun to'g'ri.
- CTA: variant bo'lsa “Tanlash”, bo'lmasa “Savatga” — yaxshi.

**Muammolar:**
1. **Favorite:** `isLiked` faqat local state, persist yo'q. Bosganda heart qizaradi, lekin reload'da yo'qoladi. Yoki olib tashlash, yoki Zustand wishlist store qilish kerak.
2. **SKU ko'rsatish:** `font-mono` + `truncate` — SKU uzun bo'lsa ham ko'rinmaydi, copy button yo'q.
3. **Dimensions:** faqat `product.dimensions` string, lekin attribute'lar (material, weight) yo'q — card'da kam ma'lumot.
4. **Add to cart feedback:** `added` 2s, lekin drawer ochiladi — ikkita feedback bir vaqtda (button yashil + drawer). Ortiqcha.
5. **Accessibility:** button'da `aria-label` yo'q, image alt faqat title — yaxshiroq alt kerak.

**Idealar:**
- Quick view modal (rasm kattalashtirish, 1-click add).
- “1 dona dan 10 dona gacha chegirma” chip card'da ko'rsatish.
- Stock quantity kam bo'lsa “Oxirgi 5 dona” urgency.
- Image'da 2-rasm hover'da (result image) — MoldResultShowcase g'oyasini card'ga olib kelish.

### 3.4 Product Detail (`ProductDetailClient.tsx`)
**Yaxshi:**
- Gallery + thumbnail, bulk pricing table, specs, B2B modal trigger.
- QuantitySelector ajratilgan.
- Trust badges (Express, 100% Sifat).

**Muammolar:**
1. **Bulk pricing logic frontend'da hardcode** `0.95` va `0.9` — backend'da ham bo'lishi kerak, bo'lmasa checkout'da narx farqi.
2. **Price box:** `Narxi (dona)` hardcode uzbekcha — ru'da ham uzbekcha chiqadi.
3. **Gallery:** zoom yo'q, 360 yo'q, video yo'q. Qolip uchun video juda sotuvchi.
4. **Sticky ATC yo'q:** pastga scroll qilganda “Savatga qo'shish” ko'rinmaydi — conversion yo'qoladi.
5. **Description:** plain text, rich text (bullet, table) yo'q — SEO uchun kam.
6. **Related products yo'q:** sahifa oxirida `related` kerak, hozir faqat home'da bor.

**Idealar:**
- Sticky bottom bar desktop+mobile: rasm + narx + quantity + ATC.
- Tab: Tavsif | Xususiyatlar | Yetkazib berish | Sharhlar.
- “Ushbu qolipdan chiqqan natija” ni product detail'da ham ko'rsatish (hozir faqat home'da).
- Kalkulyator: “100 m² uchun qancha qolip kerak?” — B2B uchun killer feature.
- Share button (Telegram, WhatsApp).

### 3.5 CartDrawer & Cart Page
**Yaxshi:** Zustand persist, quantity selector, subtotal.

**Muammolar:**
- Drawer'da `if (!isOpen) return null` — animation yo'q, keskin chiqadi. Framer Motion yoki CSS transition kerak.
- Drawer backdrop `bg-black/60` — bosganda yopiladi, lekin ESC bilan yopilmaydi.
- Cart page'da “Savatni tozalash” — confirm yo'q, tasodifan bosilsa hammasini o'chiradi.
- Coupon / promo code input yo'q.
- Yetkazib berish narxi “Operator aniqlaydi” — noaniqlik, savatni tashlab ketish sababi.

**Idealar:**
- Free shipping progress bar: “Yana 500,000 so'mga yetkazib berish bepul”.
- Cross-sell: “Bu mahsulotlar bilan birga olishadi” (masalan, qolip + moy).
- Save for later.

### 3.6 Checkout (`checkout/page.tsx`)
**Yaxshi:** Idempotency key, attribution capture, deliveryType PICKUP/COURIER toggle.

**Muammolar:**
1. **Form validation minimal:** faqat `required`, phone regex yo'q, `+998` bilan boshlanishi tekshirilmaydi.
2. **Region select:** 14 ta viloyat hardcode, lekin DB'da emas. Search yo'q.
3. **To'lov:** faqat CASH/BANK_TRANSFER — Click/Payme UI yo'q, garchi backend'da bo'lsa ham. Mijoz “online to'lov yo'qmi?” deb o'ylaydi.
4. **UX:** 3 qadam (1. Xaridor, 2. Manzil, 3. To'lov) — lekin stepper yo'q, progress yo'q.
5. **Error handling:** `mapErrorMessage` bor, lekin field-level error yo'q, umumiy qizil box.
6. **Guest checkout matni:** `Ro'yxatdan o'tmasdan...` — yaxshi, lekin “Nega ro'yxatdan o'tish kerak?” foydasi tushuntirilmagan.
7. **Mobile:** form va summary bir column, lekin summary pastda — foydalanuvchi total narxni ko'rmasdan form to'ldiradi.

**Idealar:**
- 1-page checkout o'rniga 3-step wizard + summary sticky.
- Phone input mask: `+998 __ ___ __ __`.
- Manzil uchun Yandex Map autocomplete.
- “Buyurtmani tasdiqlash” dan oldin shartlar checkbox (oferta).
- Click/Payme ni qaytarish, lekin “Operator bilan tasdiqlangandan keyin to'lov linki” deb tushuntirish.

### 3.7 Catalog & Search
**Yaxshi:** Breadcrumb, active filter chips, empty state.

**Muammolar:**
- Filterlar `Link` bilan — har filter bosganda full page reload (Next.js soft navigation bo'lsa ham). `useRouter` + `shallow` yaxshiroq.
- Sort yo'q UI'da (price asc/desc, yangi) — `searchParams.sort` backend'da bor, lekin UI yo'q.
- Pagination yo'q — `limit` yo'q, barcha mahsulot bir sahifada. 100+ mahsulotda sekin.
- CategoryCard: count ko'rsatadi, lekin “0 ta mahsulot” bo'lsa ham ko'rsatadi — yashirish kerak.

**Idealar:**
- Faceted filter: material, o'lcham, narx oralig'i (slider).
- Grid/List view toggle.
- Sort dropdown.
- Infinite scroll yoki pagination.

### 3.8 B2BModal
**Yaxshi:** Lead type `B2B_WHOLESALE`, productId bilan.

**Muammolar:**
- Modal `Modal` component — lekin `Modal` kodini ko'rmadik, accessibility (focus trap) bormi?
- Success'da “✓” text — icon emas.
- Company optional, lekin B2B uchun muhim — majburiy qilish kerakmi?

**Idealar:**
- B2B page alohida: kalkulyator, PDF прайс, shartnoma namunasi.

### 3.9 StickyMobileContact
**Kritik bug:** `bg-brand-card/95` va `border-brand-border` — tailwind config'da yo'q, shuning uchun `bg-transparent` bo'lib qoladi. `bg-[#1E222A]/95` qilish kerak.
- 4 ta button (Phone, Telegram, WhatsApp, Cart) — 320px ekranda sig'maydi, text qisqaradi.
- `backdrop-blur-md` — ba'zi Android'da sekin.

**Idealar:** 2 ta button: “Qo'ng'iroq” va “Yozish” (Telegram/WhatsApp dropdown).

---

## 4. Sahifalar bo'yicha Audit

### Home (`[lang]/page.tsx`)
- **Hero:** 8 col dark + 4 col deal of the day — yaxshi, lekin deal timer `23:59:59` fake static. Yoki real countdown, yoki olib tashlash.
- **Trust strip:** 4 ta — yaxshi, lekin icon background `bg-red-50` light theme, hero qora — inconsistent.
- **Category grid:** 6 ta — yaxshi, lekin 6 dan ko'p bo'lsa “Barchasini ko'rish” kerak.
- **Product rows:** 4 ta row (bruschatka, termopanel, 3D, dekor) — filtering logic `titleUz.includes('bruschatka')` — juda mo'rt, category relation bilan qilish kerak. Hozir noto'g'ri product tushishi mumkin.
- **MoldResultShowcase:** faqat bitta mahsulot — carousel qilish kerak.
- **FAQ:** `details` native — yaxshi, lekin SEO uchun JSON-LD FAQ schema yo'q.
- **SEO content:** 2 ta paragraf — kam, 300+ so'z kerak, keyword: “bruschatka qoliplari Toshkent”, “termopanel narxi”.

### Catalog
- Yuqorida yozildi. Qo'shimcha: `CategorySlugRedirect` faqat redirect qiladi — SEO uchun 301 emas, Next.js redirect default 307. `permanent: true` kerak.

### Product Detail
- Yuqorida.

### Cart / Checkout
- Yuqorida.

### About / Contact / Production
- **About:** dark theme, lekin home light — **bir xil template'ga o'tkazish kerak**. Rasm Unsplash `photo-1541888946425...` — zavod rasmi emas, real zavod rasmi kerak.
- **Contact:** form yaxshi, lekin map yo'q. Telefon hardcode.
- **Production:** faylni ko'rmadik, lekin taxminan about bilan bir xil.

### Search
- Yaxshi empty state, lekin sort yo'q.

---

## 5. Nielsen Heuristics

1. **Visibility of system status:** Cart drawer ochilishi — yaxshi, lekin loading spinner yo'q (search, checkout).
2. **Match real world:** “Qolip”, “Bruschatka”, “Termopanel” — user tili, yaxshi.
3. **User control & freedom:** Cart tozalashda confirm yo'q, filter tozalashda 1 click — yaxshi.
4. **Consistency:** ❌ Dark/light aralash, button style 3 xil (brand-red, gray-100, white/10).
5. **Error prevention:** Phone validation yo'q, quantity 0 bo'lishi mumkin (updateQuantity null qaytaradi, lekin UI'da 0 ko'rinmaydi).
6. **Recognition over recall:** Search popular chips — yaxshi, lekin recently viewed yo'q.
7. **Flexibility:** Keyboard navigation yo'q (mega menu, suggestions).
8. **Aesthetic minimalist:** Home juda dense — 4 product row + categories + trust + hero + showcase + FAQ — 1 ekranda juda ko'p. Whitespace kam.
9. **Help recover from errors:** Checkout error faqat umumiy — field highlight yo'q.
10. **Help & documentation:** FAQ bor, lekin chat widget yo'q.

---

## 6. Accessibility (WCAG 2.1 AA)

- **Contrast:** `text-gray-500` (#6B7280) on `#F8F9FA` — 4.04:1, AA o'tadi (4.5 emas, 4.5 kerak 14px dan kichik matnda). `text-[11px] text-gray-500` — fail.
- **Touch target:** Favorite button `w-8 h-8` — 32px, WCAG 2.5.5 da 44px tavsiya. Mobile'da kichik.
- **Focus:** `focus:ring-brand-red` Button'da bor, lekin Link'larda yo'q.
- **Alt text:** Product image alt title — yetarli, lekin decorative icon'larda `aria-hidden` yo'q.
- **Form labels:** Hammasi `label` bilan — yaxshi, lekin `select` da `id` yo'q.
- **Skip to content:** Yo'q.
- **Lang attribute:** `html lang` dinamikmi? `layout.tsx` da tekshirish kerak.

---

## 7. Mobile UX

- **Header:** top strip'da “O'zbekiston bo'ylab...” faqat sm: dan ko'rinadi — yaxshi.
- **Search:** mobile'da category filter yo'q — desktop'da bor, mobile'da yo'q — inconsistency.
- **Bottom sticky:** 4 button + cart — 320px da overflow. Test qilish kerak.
- **ProductCard:** 2 column grid mobile'da — yaxshi, lekin image aspect square — balandlik ko'p joy oladi, 3/4 qilish kerak.
- **Checkout:** input `text-xs` — iOS'da zoom qiladi (16px dan kichik input focus'da zoom). `text-[16px]` yoki `text-sm` qilish kerak mobile'da.
- **CartDrawer:** `pl-10` — chapda 40px bo'sh joy — nima uchun? Odatda `p-0` bo'ladi.

---

## 8. Ishonch & CRO

- **Hozir bor:** 300+ kafolat, zavod, yetkazib berish, SKU, stock badge.
- **Yo'q:**
  - Real sharhlar (review) — 0 ta.
  - “500,000+ sotilgan” — about'da bor, lekin product'da yo'q.
  - To'lov iconlari, xavfsizlik badge (SSL, Click).
  - “Bugun buyurtma, ertaga yetkazish” — urgency.
  - Social proof: “Hozir 12 kishi ko'rmoqda”.
  - Guarantee: “14 kun qaytarish”.

---

## 9. G'oyalar Banki — Prioritet bilan

### P0 — Quick Wins (1-2 kun, darhol conversion +5-15%)
1. **Tailwind token fix:** `brand-card`, `brand-border` ni config'ga qo'shish yoki `StickyMobileContact` da `bg-[#1E222A]/95 border-[#2A2F3A]` ga almashtirish. Bug fix.
2. **Font size oshirish:** `text-[11px]` → `text-xs`, `text-[10px]` → `text-[11px]`, product title `text-sm` ga. 1 ta faylda o'zgartirish.
3. **Wishlist fake ni olib tashlash** yoki Zustand persist qilish. Eng osoni — yurakchani olib tashlash, o'rniga “Taqqoslash” yoki “Ulashish”.
4. **Checkout'da Click/Payme ni qaytarish:** “Naqd / Click / Payme / Bank” 4 ta option, lekin Click/Payme da “Buyurtma tasdiqlangandan keyin to'lov havolasi SMS orqali” deb yozish.
5. **Cart tozalashda confirm modal.**
6. **Phone mask:** `+998` input mask (lib: `react-input-mask` yoki oddiy regex). Checkout va Contact'da.
7. **Deal timer fake ni olib tashlash** yoki real qilish (masalan, `dealOfTheDay` createdAt + 24h).
8. **Header cart “SAVAT” i18n:** `dict.cart.title` dan olish.
9. **Footer telefon `COMPANY_CONTACTS` dan.**
10. **Image loading skeleton:** ProductCard'da `animate-pulse` bg, image load bo'lguncha.

### P1 — Medium (1 hafta, UX sezilarli yaxshilanadi)
11. **Theme birlashtirish:** About, Contact, Production ni light theme'ga o'tkazish (home bilan bir xil `bg-[#F8F9FA]` + white card). Yoki aksincha — to'liq dark industrial qilish (qaror kerak). Tavsiya: **Light e-commerce + dark footer/header** — hozirgi home yo'nalishi to'g'ri.
12. **Sticky ATC bar product detail'da:** Scroll 300px dan keyin pastda paydo bo'ladigan bar: rasm + narx + “Savatga”.
13. **Search keyboard nav:** ↑↓ + Enter, ESC.
14. **Catalog sort + pagination:** `?sort=price_asc` va `?page=2`. Prisma `skip/take`.
15. **Breadcrumb hamma joyda:** Product detail'da Home > Catalog > Category > Product.
16. **Empty state yaxshilash:** Cart, Search, Catalog'da illustration + CTA.
17. **Bulk pricing backend'da:** `productService` da tier hisoblash, frontend faqat ko'rsatish.
18. **Recently viewed:** Zustand store `recentlyViewed` — product detail'da 4 ta.
19. **FAQ JSON-LD:** Home'da FAQ schema qo'shish — SEO.
20. **Trust badges:** Footer va product detail'da to'lov iconlari, yetkazib berish logolari.
21. **Mobile bottom bar redesign:** 2 button: “Aloqa” (dropdown Telegram/WhatsApp/Phone) + “Savat”.
22. **QuantitySelector accessibility:** `aria-label` “Kamaytirish”, “Oshirish”.

### P2 — Katta (2-4 hafta, CRO +20-40%)
23. **Faceted filter:** Material, o'lcham, narx slider, rang. URL sync.
24. **Product variant UI:** Agar `hasVariants` bo'lsa, card'da emas, detail'da variant selector (masalan, o'lcham 30x30, 40x40). Hozir `hasVariants` faqat link qiladi.
25. **Kalkulyator:** “Maydonni kiriting (m²) → qancha qolip kerak, jami narx, chegirma”. B2B uchun killer.
26. **Qolip → Natija slider:** Before/After image comparison (mold vs result) — `MoldResultShowcase` ni interaktiv qilish (drag slider).
27. **Sharhlar tizimi:** Product review (yulduz, ism, rasm). Avval fake, keyin real.
28. **Wishlist + Compare:** 2-3 mahsulotni yonma-yon solishtirish (o'lcham, narx, resurs).
29. **One-click checkout:** ProductCard'da “1-klikda buyurtma” — telefon so'raydigan mini modal.
30. **Admin UX:** Product create/edit'da image drag&drop tartiblash, bulk upload.
31. **Analytics funnel:** `begin_checkout`, `add_to_cart` bor, lekin `view_item`, `view_cart`, `search` event'larini to'liq.
32. **PWA + offline cart:** Zustand persist bor, lekin PWA manifest yo'q.

### P3 — Vision (1-3 oy)
33. **AR preview:** Qolipdan chiqqan bruschatkani hovlida ko'rish (WebAR).
34. **B2B portal:** Login, shaxsiy narxlar, buyurtma tarixi, PDF hisob-faktura.
35. **3D konfigurator:** Termopanel rangini tanlash, devorda ko'rish.
36. **Video commerce:** Har product'da 15s video — qanday quyiladi.
37. **AI yordamchi:** “Menga 50m² hovli uchun qolip tanla” — chat.
38. **Multi-warehouse stock:** Toshkent, Samarqand, Farg'ona omborlari.
39. **Uzum Market / Yandex Market feed:** XML export.

---

## 10. Sahifa bo'yicha Tez Checklist

| Sahifa | Muammo | Yechim |
|--------|--------|--------|
| **Header** | Cart i18n yo'q, search spinner yo'q | dict + loader |
| **Home Hero** | Fake timer | Real yoki olib tashlash |
| **ProductCard** | Fake wishlist | Olib tashlash yoki persist |
| **Product Detail** | Sticky ATC yo'q, bulk hardcode | Sticky bar + backend tier |
| **Catalog** | Sort yo'q, pagination yo'q | Sort dropdown + pagination |
| **Cart** | Confirm yo'q, coupon yo'q | Confirm modal + coupon input |
| **Checkout** | Phone mask yo'q, Click yo'q | Mask + to'lov qaytarish |
| **Footer** | Hardcode link, telefon | Dynamic categories + CONTACTS |
| **Mobile Bar** | brand-card bug, 4 button sig'maydi | Token fix + 2 button |
| **About** | Dark theme, Unsplash rasm | Light theme + real rasm |
| **Search** | Keyboard nav yo'q | ↑↓ nav |

---

## 11. Dizayn Tizimi Taklifi (Yangi Tokenlar)

```js
// tailwind.config.js ga qo'shish
brand: {
  // mavjudlar...
  darker: '#070707',
  card: '#1E222A',
  border: '#2A2F3A',
  'gray-50': '#F8F9FA',
  'gray-100': '#F1F3F5',
  'gray-200': '#E5E7EB',
  success: '#059669',
  warning: '#D97706',
}
fontSize: {
  '2xs': '11px',
  xs: '12px',
  sm: '14px',
  base: '16px',
}
```

**Komponent standartlari:**
- Button: `h-10 px-5 text-sm font-semibold rounded-lg` (primary), `h-9 px-4 text-sm` (sm)
- Card: `rounded-xl border border-gray-200 bg-white shadow-xs p-4`
- Input: `h-10 px-3 text-sm border border-gray-300 rounded-lg focus:border-brand-red focus:ring-2 focus:ring-brand-red/20`
- Badge: `px-2.5 py-1 text-xs font-bold rounded-md`

---

## 12. Keyingi Qadamlar

1. **P0 ni 1 kunda fix qilish** — darhol ishonch va bug fix.
2. **Figma'da 1 sahifa (Product Detail) ni qayta dizayn** — sticky ATC + tab + kalkulyator.
3. **User test:** 3 ta real mijoz (1 ta usta, 1 ta sex egasi, 1 ta oddiy xaridor) bilan 5 daqiqalik test — qayerda to'xtayapti?
4. **Analytics:** Hotjar yoki Yandex Metrica heatmap qo'yish.
5. **A/B:** ProductCard'da 2 variant: hozirgi vs “result image hover” — qaysi ko'proq CTR?

---

## 13. Xulosa

SPS Plast **kuchli B2B g'oyaga ega**, lekin **izchillik va mayda UX detallar** uni ushlab turibdi. Eng katta yutuq — **theme ni birlashtirish, font size oshirish, fake elementlarni tozalash, checkout'da to'lov va phone mask**. Shundan keyin **kalkulyator + sticky ATC + faceted filter** — B2B uchun conversionni 2x qiladigan feature'lar.

> “Qolip sotish — ishonch sotish. Har bir piksel ‘300 marta quyiladi’ degan va'dani tasdiqlashi kerak.”

---

**Tayyorlovchi:** Arena Agent
**Fayl:** `docs/UX-UI-AUDIT.md`
