# SPS PLAST — arxitektura

**Yangilangan:** 2026-10-04 (backendsiz arxitektura, Batch 3)

## 1. Maqsad

Sayt mahsulotni ko'rsatadi, ishonch uyg'otadi va **zayafka** yig'adi. Xarid
savati, buyurtma va to'lov yo'q: xabar Telegram guruhga tushadi, menejer
qo'ng'iroq qilib sotadi. Shu sababli butun tizim statik kontent + bitta yozuv
API'sidan iborat.

## 2. Sitemap

| Manzil | Turi | Izoh |
|---|---|---|
| `/uz`, `/ru` | statik (ISR 60s) | Bosh sahifa: hero, kategoriyalar, bestsellerlar, ishonch bloklari, FAQ |
| `/{lang}/catalog` | statik | Filtrlar (kategoriya, qidiruv, narx, material) — natijalar URL'da |
| `/{lang}/catalog/{slug}` | statik (6) | Kategoriya sahifasi: to'r + 300+ so'z SEO matn + FAQ JSON-LD |
| `/{lang}/product/{slug}` | statik (384) | Mahsulot: variantlar, kalkulyator, zayafka CTA |
| `/{lang}/blog`, `/{lang}/blog/{slug}` | statik (16) | 7 maqola × 2 til |
| `/{lang}/projects`, `/production`, `/about`, `/contact` | statik | Ishonch sahifalari |
| `/{lang}/how-to-order`, `/delivery-payment`, `/returns`, `/privacy`, `/terms` | statik | Shartlar va jarayon |
| `/api/leads` | route handler | Yagona yozuv endpointi (Telegram) |
| `/api/health` | route handler | Env/Telegram holati |

## 3. Ma'lumot qatlami

```
catalog_build/products.json ─┐
data/molds-2026.json ────────┼─► scripts/build-static-catalog.js ─► src/data/catalog.json
data/content-2026.json ──────┘                                        │
                                                                      ▼
                                              src/lib/catalog/*  (sinxron o'qish)
```

- `npm run catalog:check` build oldidan JSON va `public/search-index.json` eskirganini tekshiradi.
- Testlar katalog shartnomasini qo'riqlaydi: 192 mahsulot, 3 kategoriya,
  unikal SKU/slug, har bir media fayl `public/` da mavjud, ikki tilda nom/tavsif.
- Kontent (blog, loyihalar) ham shu faylda — bazaga import yo'q.

## 4. Zayafka oqimi

```
LeadButton/LeadModal  ──POST /api/leads──►  Zod validatsiya
   (uz/ru, +998 mask)                       honeypot + rate limit (10/15min)
                                            HTML escape
                                            ▼
                                    sendTelegramNotification()
                                            ▼
                                kompaniya Telegram guruhi
```

Xabar tarkibi: turi, ism, telefon, mahsulot + SKU, miqdor, izoh, **manba
sahifa**, til, vaqt (Asia/Toshkent), UTM/gclid/fbclid. Muvaffaqiyatda
`generate_lead` event yuboriladi.

## 5. Frontend qatlami

- `src/app/[lang]/*` — server komponentlar, `generateStaticParams()` bilan
  prerender (uz/ru yopiq to'plam).
- `src/components/lead/*` — forma va tugma (yagona kirish nuqtasi).
- `src/components/product/*` — kartochka, tez ko'rish, taqqoslash, galereya.
- Zustand faqat mahalliy holat uchun: sevimlilar, taqqoslash, oxirgi ko'rilgan.
- `src/lib/faq.ts` (bosh sahifa) va `data/category-seo-2026.json` (kategoriyalar) — ko'rinadigan matn va JSON-LD bir manbadan.

## 6. SEO

- Har sahifada canonical + hreflang (`uz`, `ru`, `x-default`) — `src/lib/seo.ts`.
- JSON-LD: `Organization`, `Product`, `BreadcrumbList`, `FAQPage`, `HowTo`.
- `sitemap.ts` — statik sahifalar + 192 mahsulot + blog; `robots.ts`.
- Kategoriya sahifalari qidiruv uchun asosiy "uzun matn" manbasi (P1-7).

## 7. Analitika

`AnalyticsScripts.tsx` faqat env ID bo'lsa yuklaydi: GTM → GA4 → Yandex Metrica
→ Meta Pixel. Hodisalar `src/lib/analytics.ts` da: `view_item`,
`view_item_list`, `search`, `share`, `add_to_wishlist`, `add_to_compare`,
`generate_lead`.

## 8. Xavfsizlik va maxfiylik

- `/api/leads`: Zod sxemasi, honeypot, IP bo'yicha rate limit, HTML escape.
- Maxfiy kalitlar faqat serverda (Telegram token hech qachon klientga chiqmaydi).
- Xavfsizlik sarlavhalari `next.config.js` da (nosniff, HSTS, referrer policy).
- Sayt cookie o'rnatmaydi; analitika faqat ID kiritilganda yuklanadi.
