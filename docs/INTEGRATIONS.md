# SPS PLAST — integratsiyalar

**Yangilangan:** 2026-10-04

Saytda ikkita integratsiya qatlami bor: **zayafkani yetkazish** (majburiy) va
**analitika** (ixtiyoriy, env bo'lsa yuklanadi). To'lov, CRM, S3, cron va
boshqa eski integratsiyalar backendsiz arxitekturada olib tashlangan.

## 1. Telegram — zayafka yetkazish

**Fayllar:** `src/lib/telegram.ts`, `src/app/api/leads/route.ts`

- Bot tokeni va guruh ID'si env orqali (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).
- Har bir zayafka `sendMessage` bilan HTML parse rejimida yuboriladi; foydalanuvchi
  kiritgan barcha matn `escapeTelegramHtml()` dan o'tadi (markup inject bo'lmasligi
  uchun).
- Xabar tarkibi: turi, ism, telefon, mahsulot + SKU, miqdor, izoh, manba sahifa,
  til, vaqt (Asia/Toshkent), UTM/gclid/fbclid.
- Xatolik yuz bersa API `{success: true, delivered: false}` qaytaradi va log yozadi —
  foydalanuvchi formani qayta to'ldirishga majbur bo'lmaydi.

**Muhim:** token bo'lmasa `/api/health` `degraded` holatini ko'rsatadi; deploydan
keyin shu endpointni tekshiring.

## 2. Analitika

**Fayllar:** `src/components/analytics/AnalyticsScripts.tsx`, `src/lib/analytics.ts`

| Kanal | Env | Izoh |
|---|---|---|
| Google Tag Manager | `NEXT_PUBLIC_GTM_ID` | Asosiy konteyner |
| GA4 | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Faqat GTM bo'lmasa to'g'ridan-to'g'ri yuklanadi |
| Yandex Metrica | `NEXT_PUBLIC_YANDEX_METRICA_ID` | `reachGoal` bilan hodisalar |
| Meta Pixel | `NEXT_PUBLIC_META_PIXEL_ID` | Facebook/Instagram |

Hodisalar: `view_item`, `view_item_list`, `search`, `share`, `add_to_wishlist`,
`add_to_compare`, `generate_lead`. Skriptlar `afterInteractive` va faqat ID
mavjud bo'lsa yuklanadi — ID bo'lmasa sayt bitta ham tashqi so'rov qilmaydi.

## 3. Olib tashlangan integratsiyalar

Click/Payme to'lovlari, amoCRM, S3/R2 media saqlash, cron job'lar va admin
autentifikatsiyasi endi mavjud emas (sayt do'kon emas). Qayta kerak bo'lsa —
`docs/OPTIMIZATION-LOG.md` Batch 3 dagi qarorlarni ko'rib chiqing.
