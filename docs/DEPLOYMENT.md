# SPS PLAST — deploy qo'llanmasi (Vercel-only)

**Yangilangan:** 2026-11-07 (baza qo'shilgandan keyin, Stage 7+). Admin/baza
sozlash tafsilotlari: **`docs/ADMIN.md`**. Bu fayl umumiy deploy oqimini
tasvirlaydi.

## 1. Platforma

Sayt **faqat Vercel** ga joylanadi: statik sahifalar CDN'dan beriladi,
`/api/*` route handler'lari serverless funksiya sifatida ishlaydi, admin
panel (`/admin/*`) esa `force-dynamic` (har so'rovda server render).
Ma'lumotlar bazasi — Postgres (Neon yoki Supabase), Vercel'ning o'zida emas.

## 2. Muhit o'zgaruvchilari

Vercel → Project → Settings → Environment Variables:

| Kalit | Majburiymi | Izoh |
|---|---|---|
| `DATABASE_URL` | **Ha** (production) | Neon/Supabase Postgres — zayafka saqlash, `/admin`, build snapshot uchun. Bo'lmasa sayt statik katalog bilan ishlaydi, lekin `/admin` ishlamaydi. |
| `NEXT_PUBLIC_SITE_URL` | Tavsiya | `https://spsplast.com` — canonical, sitemap, hreflang shunga tayanadi |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | **Ha** (zayafka uchun) | `@BotFather` dan; guruh ID'si `-100…` |
| `IP_HASH_SECRET` | Tavsiya (production) | Tashrif/rate-limit IP xeshlash kaliti |
| `HEALTH_CHECK_TOKEN` | Yo'q | `/api/health` batafsil javobini yopish uchun |
| `VERCEL_DEPLOY_HOOK_URL` | Tavsiya | Admin → "Nashr qilish" shu hook'ni chaqiradi (yangi build) |
| `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` | Yo'q | Admin'da so'nggi deploy holatini ko'rsatish uchun |
| `NEXT_PUBLIC_GTM_ID` / `GA_MEASUREMENT_ID` / `YANDEX_METRICA_ID` / `META_PIXEL_ID` | Yo'q | Admin → Sozlamalar orqali ham kiritiladi (env — zaxira) |

To'liq ro'yxat: `.env.example`.

## 3. Deploy jarayoni

1. Repo'ni Vercel'ga import qiling (framework: Next.js).
2. Postgres bazasini yarating (Neon/Supabase) va `DATABASE_URL`ni kiriting.
3. Boshqa env o'zgaruvchilarni kiriting.
4. **`vercel.json`** `buildCommand`ni `npm run db:migrate:deploy && npm run build`
   ga almashtiradi (Vercel dashboard'dagi build buyrug'idan ustun) — migratsiya
   build'dan OLDIN ishlaydi. `DATABASE_URL` bo'lmasa migratsiya o'tkazib
   yuboriladi; Production'da bo'lsa va muvaffaqiyatsiz bo'lsa — build to'xtaydi
   (eski deploy ishlashda davom etadi, sayt jim eskirib qolmaydi).
5. Birinchi admin foydalanuvchini yarating (`docs/ADMIN.md` — `npm run admin:create`).
6. Domenni ulang: `spsplast.com` (apex, kanonik) + `www.spsplast.com`, eski
   `sps.uz`/`www.sps.uz` — hammasi 301 bilan `spsplast.com`ga (`next.config.js`).

## 4. Deploydan keyin tekshirish

```bash
curl -s https://spsplast.com/api/health | jq
# { "status": "ok", "checks": { "db": true, "telegram": true, ... } }

curl -sI https://spsplast.com/uz | head -1           # 200
curl -sI https://sps.uz/uz | head -3                  # 301 → https://spsplast.com/uz
curl -sI https://spsplast.com/admin | head -3          # 302 → /admin/login (cookie'siz)
```

Qo'lda zayafka sinovi: `/uz` → model → "Zayafka qoldirish" → formani
to'ldirish → Telegram guruhda xabar paydo bo'lishi VA admin → Zayafkalar'da
yangi qator ko'rinishi.

## 5. Kontent yangilash

**Katalog (modellar, Excel manbadan):**
```bash
npm run models:build && npm run models:images && npm run models:check
git commit -am "katalog: yangi modellar" && git push
```

**Admin orqali** (mahsulot/bo'lim/sharh/matn/SEO): o'zgarish darhol bazaga
yoziladi; saytga chiqishi uchun admin → "Nashr qilish" (Vercel Deploy Hook →
yangi build, `VERCEL_API_TOKEN` bo'lsa holati ko'rinadi).

## 6. Rollback

Vercel → Deployments → kerakli oldingi deploy → **Promote to Production**.
Migratsiyalar **qo'shimcha (additive)** bo'lishi shart — eski deploy
rollback'dan keyin ham yangi ustun/jadval bilan ishlay olishi kerak.
Kontent xatosi: `git revert` + push.

## 7. Kuzatuv

- `/api/health` — baza, Telegram va analitika holati (monitoring nuqtasi;
  `HEALTH_CHECK_TOKEN` bilan batafsil javobni yopish mumkin).
- Admin → Tashriflar — o'z (cookie'siz) tashrif statistikasi.
- Vercel Analytics / Logs — serverless xatolar.
- Telegram guruh — har bir zayafka; javobsiz xabar = yo'qotilgan lead (lekin
  baza ham saqlagani uchun admin → Zayafkalar'da baribir ko'rinadi).
