# SPS PLAST — deploy qo'llanmasi (Vercel-only)

**Yangilangan:** 2026-10-04

## 1. Platforma

Sayt **faqat Vercel** ga joylanadi: statik sahifalar CDN'dan beriladi, ikkita
route handler (`/api/leads`, `/api/health`) esa serverless funksiya sifatida
ishlaydi. Baza, Docker, Fly.io va cron yo'q.

## 2. Muhit o'zgaruvchilari

Vercel → Project → Settings → Environment Variables:

| Kalit | Majburiymi | Izoh |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Tavsiya | `https://sps.uz` — canonical, sitemap, hreflang shunga tayanadi |
| `TELEGRAM_BOT_TOKEN` | **Ha** (zayafka uchun) | `@BotFather` dan |
| `TELEGRAM_CHAT_ID` | **Ha** (zayafka uchun) | Kompaniya guruhi ID'si (`-100…`) |
| `NEXT_PUBLIC_GTM_ID` | Yo'q | GTM konteyner |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Yo'q | GTM bo'lmasa to'g'ridan-to'g'ri GA4 |
| `NEXT_PUBLIC_YANDEX_METRICA_ID` | Yo'q | UZ bozorida asosiy kanal |
| `NEXT_PUBLIC_META_PIXEL_ID` | Yo'q | Facebook/Instagram reklama uchun |

`DATABASE_URL` **kerak emas**. Bot tokeni bo'lmasa sayt ishlaydi, lekin
zayafkalar yetib bormaydi — `/api/health` buni `degraded` deb ko'rsatadi.

## 3. Deploy jarayoni

1. Repo'ni Vercel'ga import qiling (framework: Next.js, build: `npm run build`).
2. Env o'zgaruvchilarni kiriting.
3. Deploy qiling. Build `catalog:check` bilan boshlanadi — `src/data/catalog.json`
   manbalarga mos bo'lmasa build to'xtaydi.
4. Domenni ulang: `sps.uz` (apex) + `www.sps.uz` → apex 301 (redirect
   `next.config.js` da allaqachon bor).

## 4. Deploydan keyin tekshirish

```bash
curl -s https://sps.uz/api/health | jq
# { "status": "ok", "checks": { "telegram": true, "siteUrl": true } }

curl -sI https://sps.uz/uz | head -1          # 200
curl -sI https://sps.uz/produkciya | head -3  # 301 → /ru/catalog
```

Qo'lda zayafka sinovi: `/uz` → mahsulot → “Zayafka berish” → formani to'ldirish →
Telegram guruhda xabar paydo bo'lishi (ism, telefon, mahsulot, manba sahifa).

## 5. Kontent yangilash

Mahsulot yoki maqola qo'shish:

```bash
# manbalarni tahrirlang: catalog_build/, data/
npm run catalog:build
npm run catalog:check
git commit -am "katalog: yangi modellar" && git push
```

Vercel avtomatik qayta deploy qiladi; statik sahifalar qayta generatsiya bo'ladi.

## 6. Rollback

Vercel → Deployments → kerakli oldingi deploy → **Promote to Production**.
Kontent xatosi bo'lsa: `git revert` + push (build `catalog:check` bilan
himoyalangan).

## 7. Kuzatuv

- `/api/health` — Telegram va sayt manzili holati (monitoring uchun nuqta).
- Vercel Analytics / Logs — serverless xatolar.
- Telegram guruh — har bir zayafka; javob berilmagan xabar = yo'qotilgan lead.
