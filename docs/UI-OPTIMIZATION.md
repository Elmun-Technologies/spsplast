# SPS PLAST — UI Performance & Polish Pass

**Sana:** 2026-09-15
**Branch:** `arena/01a0a5f6-spsplast`
**Qamrov:** Kritik oqim — Home → Catalog → Product → Cart → Checkout (+ Header/Footer shell)

Maqsad: UI'ni tezlashtirish (bundle, rasm, render), mobil UX nuqsonlarini tuzatish va
dizayn izchilligini tiklash. Funksional xatti-harakat o'zgartirilmagan.

---

## 1. Bundle / Kod bo'lish (code splitting)

Har bir sahifa yuklaydigan JS hajmi kamaytirildi.

| Nima | Oldin | Hozir |
|------|-------|-------|
| AIAssistant, PWAInstallBanner, CompareBar | `[lang]/layout.tsx` da statik import → har sahifada yuklanardi | `DeferredWidgets.tsx` — `next/dynamic({ ssr: false })` + `requestIdleCallback` (fallback 1.5s) |
| Footer | Layoutda statik | `next/dynamic` (SSR saqlanadi, alohida chunk) |
| QuickViewModal / B2BModal (ProductCard) | Har bir kartada doim mount (24 kartada 48 instans) | Faqat ochilganda mount + `next/dynamic` |
| B2BModal / OneClickModal (mahsulot sahifasi) | Statik import | `next/dynamic` + faqat ochilganda mount |
| MoldResultShowcase, RecentlyViewed, B2BBanner (home) | Statik | `next/dynamic` (below-the-fold, SSR saqlanadi) |
| MoldResultShowcase, ProductReviews (product) | Statik | `next/dynamic` |

## 2. Rasmlar (LCP va trafik)

- **`sizes` qo'shildi** — `fill` bilan `sizes` bo'lmasa Next.js 100vw deb hisoblaydi:
  bosh sahifadagi "Kun tanlovi" (420px karta uchun 1920px rasm yuklanardi), mahsulot
  galereyasi (600px), thumbnail'lar (80px), sticky bar (48px), cart (96px), cart drawer
  (64px), RecentlyViewed, CategoryCard, CompareBar, Blog, Wishlist, Compare, About,
  Header qidiruv takliflari (44px) va mega-menyu (28px).
- **LCP uchun `priority`** — bosh sahifadagi "Kun tanlovi" rasmi (yagona above-the-fold rasm)
  oldindan yuklanadi.
- **Hover rasmi endi faqat hover'da yuklanadi** — oldin har bir kartaning 2-rasmi
  viewport'ga kirganda yuklanardi (24 kartada 24 qo'shimcha rasm). Endi `useCanHover()`
  + hover intent.
- `next.config.js`: `/catalog/*` va `/images/*` uchun uzoq muddatli `Cache-Control`.

## 3. Render samaradorligi

- **`React.memo(ProductCard)`** — katalogdagi narx filtri inputiga yozganda 24 karta qayta
  render bo'lmaydi.
- **Zustand narrow selectors** — Cart, Checkout, CartDrawer, RecentlyViewed butun store'ni
  destructure qilardi (`useCartStore()`), ya'ni savat drawer ochilishi/istalgan o'zgarish
  butun sahifani qayta render qilardi. Endi har bir maydon alohida selector + `useMemo`
  hisob-kitoblar.
- **`useMediaQuery`/`useCanHover`** — `useSyncExternalStore` asosida, bitta
  `MediaQueryList` barcha komponentlar uchun (24 ta kartada 24 listener emas).
- **Sticky ATC bar** — har bir scroll eventida `setState` qilardi. Endi
  `IntersectionObserver` + sentinel (`#atc-sentinel`).
- **`cv-auto`** utility (`content-visibility: auto`) — uzoqdagi og'ir seksiyalar (home'dagi
  qolipplar qatorlari + FAQ bloki, mahsulot sahifasidagi sharhlar).
- **`backdrop-blur` olib tashlandi** kartadagi amal tugmalari va mobil kontakt bardan —
  mobil GPU'da qimmat operatsiya (7 joydan).
- **Katalog filtrlari** — `useTransition` bilan: serverdan javob kelguncha grid xiralashadi
  (`opacity-60`, `aria-busy`), UI bloklanmaydi.
- **Header live search** — `AbortController`: eski so'rovlar bekor qilinadi (natijalar
  aralashib ketmaydi).

## 4. Tuzatilgan xatolar (kritik oqim)

1. **Mahsulot sahifasidagi sticky bar desktopda header ostida qolardi.** Bar
   `fixed ... lg:top-0 z-30`, header esa `sticky top-0 z-50` edi — ya'ni bar
   ko'rinmasdi. Endi bar barcha breakpoint'larda pastda (`bottom-0`).
2. **Mobil pastdagi ikki bar ustma-ust tushardi** (kontakt bar `z-40` + ATC bar `z-30`).
   Yangi `uiStore.bottomBarOwner` orqali: ATC bar ko'ringanda kontakt bar pastga
   suriladi (300ms), qayta qaytadi.
3. **Touch qurilmalarda karta amallari ko'rinmasdi** — wishlist/compare/quick view
   `opacity-0 group-hover:opacity-100` bilan yashiringan, telefonda hover yo'q.
   `@media (hover: none) { .hover-reveal { opacity: 1 } }`.
4. **Fake chegirma** — bosh sahifada "Kun tanlovi" badge'i doim `-40% OFF` deb yozardi.
   Endi `oldPrice`/`price` dan real foiz, chegirma bo'lmasa badge ko'rsatilmaydi.
5. **Katalog mobil filtri** mahsulotlar grid'ini pastga surardi. Endi "Filtrlar (N)"
   tugmasi bilan ochiladi/yopiladi (desktopda doim ochiq).
6. **`db.ts` butun saytni yiqitardi.** `new PrismaClient()` modul import vaqtida
   chaqirilardi: Prisma klienti tayyor bo'lmasa (Vercel dependency cache, `prisma generate`
   ishlamagan — CLAUDE.md'da yozilgan xato) `@/lib/db` import qilgan har bir route, shu
   jumladan locale layout (Header orqali) 500 qaytarardi. Endi lazy `Proxy` — client faqat
   birinchi so'rovda yaratiladi, ya'ni xato "shu query ishlamadi" darajasida qoladi.
7. **`useEffect` tozalash** — ProductCard'dagi `setTimeout` endi unmount'da tozalanadi.

## 5. Accessibility / izchillik

- `prefers-reduced-motion: reduce` qo'llab-quvvatlanadi (animatsiya/transition o'chadi).
- Karta amallariga `aria-label` (uz/ru), mobil filtr tugmasiga `aria-expanded`/`aria-controls`.
- `error.tsx`: endi foydalanuvchiga tushunarli xabar (xom `error.message` faqat dev'da),
  "Bosh sahifaga" tugmasi va qo'ng'iroq raqami; matn `uz`/`ru` (pathname orqali).
- `Skeleton` geometriyasi haqiqiy kartaga moslandi (layout shift yo'q, `rounded-xl`,
  `rounded-full` CTA).
- `Inter` endi **variable font** sifatida yuklanadi (6 statik weight × 2 subset → 1 fayl × 2
  subset), `--font-inter` CSS o'zgaruvchisi orqali Tailwind `font-sans` bilan bog'landi.
- `themeColor` metadata'dan olib tashlandi (viewport'da qolgan) — Next 14 ogohlantirishi yo'q.
- Ishlatilmagan `.card-lift` CSS (har bir kartada `will-change: transform`) olib tashlandi.

## 6. Preview (DB'siz UI tekshirish)

`/ui-preview` — faqat development uchun sahifa (`NODE_ENV=production` bo'lsa `notFound()`),
DB ulanmagan muhitda real komponentlarni mock ma'lumot bilan ko'rsatadi:

- `HeaderClient` (mock kategoriya daraxti, mega menyu, live search)
- `ProductCard` grid — oddiy, "narx so'rash" (B2B), variantli, tugagan (out of stock)
- `ProductDetailClient` — galereya, bulk narx, kalkulyator, sticky ATC bar
- `CartDrawer` (header'dagi SAVAT tugmasi orqali), `StickyMobileContact`, `Footer`,
  `DeferredWidgets`
- "Savatga 3 mahsulot qo'shish" va UZ/RU almashtirish tugmalari

```bash
npm run dev          # http://localhost:3000/ui-preview
```

## 7. Tekshiruv holati

| Tekshiruv | Natija |
|-----------|--------|
| `npx tsc --noEmit` | 74 xato — barchasi avvaldan mavjud (`TS7006`/`TS7053`, Prisma tiplari yo'qligidan). Baseline (`git worktree` @ HEAD) bilan **diff = 0 yangi xato** |
| `npx next lint` | Xato yo'q; faqat avvaldan mavjud ogohlantirishlar (`exhaustive-deps`, admin'dagi `<img>`) |
| Dev smoke test | `/ui-preview`, `/uz/cart`, `/uz/checkout`, `/uz/wishlist`, `/uz/compare`, `/uz/about`, `/uz/contact` → 200 |
| `npm run build` | Sandboxda ishga tushirib bo'lmadi — `prisma generate` uchun engine yuklab olinmaydi (tarmoq bloklangan) va DB yo'q. Vercel'da `postinstall` ishlaydi |

> Eslatma: `[lang]` ostidagi **DB ma'lumotiga tayanadigan** sahifalar (`/uz`, `/uz/catalog`,
> `/uz/product/*`) bu sandboxda ma'lumot ko'rsatmaydi — Prisma klienti generatsiya
> qilinmagan (`binaries.prisma.sh` bloklangan) va Postgres yo'q, shuning uchun ular
> `error.tsx` holatini ko'rsatadi. Bu muhit cheklovi, kod regressiyasi emas: savat,
> checkout, wishlist, compare, about, contact sahifalari to'liq ishlaydi. Home/catalog/
> product UI'sini `/ui-preview` orqali ko'rish mumkin.
