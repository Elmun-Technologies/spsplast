# SPS PLAST — arxitektura

**Yangilangan:** 2026-11-07 (redesign 2027 + admin/baza, Stage 7–11). Bu fayl qisqa
umumiy ko'rinish — to'liq, doimiy yangilanadigan tafsilot **`CLAUDE.md`** da
(papka tuzilishi, marshrutlar, biznes qoidalari, "Known Pitfalls").

## 1. Maqsad

Sayt mahsulotni ko'rsatadi, ishonch uyg'otadi va **zayafka** yig'adi. Xarid
savati, buyurtma va to'lov yo'q: xabar avval bazaga, keyin Telegram guruhga
tushadi, menejer qo'ng'iroq qilib sotadi.

## 2. Sitemap (marshrutlar)

| Manzil | Turi | Izoh |
|---|---|---|
| `/{lang}` (uz/ru/en) | statik | Bosh sahifa: hero, bo'limlar, raqamlar, kalkulyator misoli, mijoz sharhlari (bo'lsa) |
| `/{lang}/catalog`, `/{lang}/catalog/{section}` | statik | Filtr/qidiruv mijoz tomonida (`window.location.search`) |
| `/{lang}/catalog/{section}/{slug}` | statik | Model: galereya, kalkulyator, tablar, zayafka CTA |
| `/{lang}/catalog/{section}/tag/{tag}`, `/{lang}/export/{country}` | statik | SEO landing (≥ 6 model bo'lgan teg, 8 eksport davlati) |
| `/{lang}/compare`, `/{lang}/request` | statik, `noindex, follow` | Foydalanuvchi holati (localStorage) |
| `/{lang}/partners`, `/{lang}/production`, `/{lang}/contact`, `/{lang}/privacy` | statik | Ishonch/jarayon sahifalari |
| `/admin/*` | dinamik (`force-dynamic`) | Login, dashboard, zayafka CRM, mahsulot/bo'lim/sharh boshqaruvi, SEO markazi, Matnlar CMS, analitika, sozlamalar |
| `/api/leads`, `/api/health`, `/api/track` | route handler | Yagona uchta API yo'li (`tests/foundation2027.test.js` qamrab oladi) |

Jami 448 statik sahifa (`npm run build`), sitemap 276 URL (`/sitemap.xml`).

## 3. Ma'lumot qatlami

Ommaviy sayt **statik qoladi** — hech bir ommaviy sahifa build vaqtida bazani
so'rovda kutib turmaydi:

```
data/models-2027.json (GENERATED, Excel'dan) ──► src/data/models2027.ts (statik)
                                                        │
Postgres (admin panel, Stage 7+) ──► scripts/export-snapshot.mjs (build boshida)
                                      │                 │
                                      ▼                 ▼
                         src/data/site.generated.ts  src/data/models2027.ts
                         (sozlamalar/SEO/matn/sharh)  (nashr qilingan mahsulotlar
                                                        BOR bo'lsa shu bilan almashadi)
                                                        │
                                              src/lib/catalog2027.ts (sinxron o'qish)
```

`DATABASE_URL` yo'q bo'lsa `export-snapshot.mjs` hech narsa yozmaydi — sayt
statik katalog + env bilan yig'iladi (lokal dev uchun odatiy holat). Git'dagi
nusxalar har doim `null`/`[]`: commit qilishdan oldin `git checkout src/data`.

## 4. Zayafka oqimi

`POST /api/leads` (Zod, honeypot, IP+email rate limit, xalqaro telefon
normalizatsiyasi) avval **bazaga** yozadi (ketma-ket `SPS-YYMM-NNNN` raqami),
keyin Telegram'ga yuboradi. Ikkisi ham muvaffaqiyatsiz bo'lsa **503**
qaytaradi (jim yo'qolish yo'q) — mijozga qo'ng'iroq/Telegram/WhatsApp
tugmalari ko'rsatiladi. `GET /api/health` baza/Telegram/analitika holatini
tekshiradi (ixtiyoriy `HEALTH_CHECK_TOKEN` bilan yopiq bo'lishi mumkin).

## 5. Admin panel va baza (Stage 7–11)

Postgres (Neon/Supabase) + Drizzle ORM, faqat `src/server/` orqali — ommaviy
sahifalar (`[lang]`, `components`, `lib`) bazani **hech qachon** import
qilmaydi (`tests/platform.test.js` test 6). Admin: login/sessiya (admin/
menejer rollari), zayafka CRM, mahsulot/bo'lim/sharh CRUD, rasm yuklash
(fon olib tashlash brauzerda), SEO markazi (sahifa meta, 301, IndexNow,
Search Console/Webmaster hisobotlari), Matnlar CMS (620+ satr), Tashriflar
va Integratsiyalar sozlamalari. Batafsil: `docs/ADMIN.md`.

## 6. Frontend qatlami

Next.js 15 (App Router) + React 19, **plain CSS** (Tailwind olib tashlangan,
2026-11-01). Shriftlar (Onest) o'z-ichida (`public/fonts/`) — tashqi tarmoq
chaqiruvi yo'q. Holat: `localStorage` (`sps_request`/`sps_compare`,
`src/lib/store/spsLists.ts`) — Zustand yoki boshqa global state kutubxonasi
yo'q.

## 7. SEO

Har bir sahifada canonical + hreflang (uz/ru/en + `x-default` → ru, MDH
tillari uchun), JSON-LD (Organization/WebSite/LocalBusiness/Product/FAQ/
ItemList/Review — **narxsiz**, HANDOFF 1.1), sitemap va 301 xaritasi
(`scripts/redirects-2027.json`, 436+ yozuv).

## 8. Analitika va xavfsizlik

GTM/GA4, Yandex Metrica, Meta Pixel — admin sozlamalari yoki env orqali,
ID bo'lmasa skript yuklanmaydi. CSP (`next.config.js` — ommaviy sayt,
`src/middleware.ts` — admin, nonce bilan qattiqroq), `/api/leads` va
`/api/track` Origin/Content-Type/hajm tekshiruvi. Batafsil: `docs/SECURITY.md`,
CLAUDE.md "Known Pitfalls" (audit 2026-11-02 bosqichlari).
