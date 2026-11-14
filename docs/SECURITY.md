# SPS PLAST — xavfsizlik

> **Yangilangan: 2026-11-07.** Saytda endi baza, sessiya va admin panel **bor**
> (Stage 7+) — bu fayl shunga mos yangilandi. To'liq, doimiy yangilanadigan
> tafsilot CLAUDE.md "Known Pitfalls" bo'limida (audit 2026-11-02 bosqichlari,
> ayniqsa 3.1-band).

## 1. `POST /api/leads`

Zayafka formasi avval **bazaga** (ketma-ket `SPS-YYMM-NNNN` raqami bilan),
keyin Telegram guruhiga yozadi. Ikkisi ham muvaffaqiyatsiz bo'lsa **503**
qaytaradi — jim yo'qolish yo'q (mijozga qo'ng'iroq/WhatsApp/Telegram
tugmalari ko'rsatiladi, `LeadFeedback.tsx`).

| Chora | Tafsilot |
|---|---|
| **Sxema validatsiyasi** | `zod` — noto'g'ri so'rov → `400 bad_json`/`validation` |
| **Origin/Content-Type** | `src/lib/requestGuard.ts`'s `isCrossOrigin()` — cross-site yozuvlar rad etiladi; faqat `application/json` qabul qilinadi (CORS-preflight-bypass hiylasi to'xtatiladi) |
| **Hajm chegarasi** | `readLimitedText()` — oqim sifatida 32 KB'dan oshsa `413`, `Content-Length` sarlavhasiga tayanmaydi |
| **Telefon normalizatsiyasi** | `src/lib/phone.ts` — xalqaro formatlar (RU/KZ/KG/TJ/AZ/AM/GE/BY), noto'g'ri raqam alohida `bad_phone` xatosi bilan rad etiladi |
| **Honeypot** | Yashirin `website` maydoni to'ldirilsa — soxta `ok`, hech narsa saqlanmaydi/yuborilmaydi |
| **Rate limit** | Bazadagi `rate_hits` jadvali (IP bo'yicha) — in-memory emas, Vercel'ning ko'p instansiyasi orasida ham to'g'ri ishlaydi |
| **HTML escaping** | `escapeTelegramHtml()` — Telegram `parse_mode: HTML` bilan chaqiriladi |
| **IP saqlanmaydi** | Faqat `IP_HASH_SECRET` bilan HMAC xeshi (`src/server/privacy.ts`); 24 soatdan eski qatorlar tozalanadi |

## 2. Admin panel (`/admin`)

- Parol — `scrypt` xeshi (`src/server/auth.ts`); sessiya tokeni **o'zi**
  saqlanmaydi, faqat uning sha256 xeshi (baza sizsa ham cookie qayta
  ishlatilmaydi).
- Login IP **va** e-pochta bo'yicha alohida tezlik cheklanadi (botnet bitta
  akkauntni ko'p IP bilan "brute-force" qila olmaydi).
- Har bir admin `page.tsx`/`route.ts`/server action `requireUser()` chaqiradi
  (`tests/admin2027.test.js` test 12 — barcha fayllarni generik skanerlaydi).
- `/admin` o'ziga xos, qattiqroq CSP bilan (`src/middleware.ts`, nonce bilan,
  `'unsafe-inline'`siz) — ommaviy saytning CSP'sini (`next.config.js`)
  **almashtiradi**, mos yozuvdan tashqari.
- API kalitlari (Yandex OAuth, Google service account) `integration_secrets`
  jadvalida — bu jadval ommaviy JS bundle'ga (`site_settings` snapshot)
  **hech qachon** qo'shilmaydi.

## 3. Ommaviy sayt (CSP, sarlavhalar)

`next.config.js` → `headers()`: `Content-Security-Policy` (haqiqiy
`script-src`/`connect-src`/`img-src` ro'yxati — faqat ishlatiladigan analitika
host'lari, `object-src 'none'`, `frame-ancestors 'none'`), `Strict-Transport-
Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
`Permissions-Policy`. `X-Frame-Options: DENY` faqat production'da (`next dev`
ko'pincha preview iframe ichida ochiladi).

## 4. Middleware (`src/middleware.ts`)

- `/` → foydalanuvchi tiliga yo'naltirish (cookie → `Accept-Language`,
  MDH tillari ruschaga → `uz`).
- `/admin/*` → sessiya cookie'si yo'q bo'lsa `login?next=`ga yo'naltirish
  (haqiqiy tekshiruv sahifadagi `requireUser()`da).

## 5. Maxfiylik

- Tashrif kuzatuvi (`/api/track`) IP va cookie saqlamaydi, botlarni filtrlaydi.
- Zayafkalarni admin anonimlashtirishi mumkin (shaxsiy ma'lumotni o'chirish,
  statistikani saqlagan holda).
- Maxfiylik siyosati sahifasi (`/{lang}/privacy`) — matn hali yuridik
  tekshiruvdan o'tishi kerak (`docs/unresolved-questions.md` §1.11).

## 6. Hali yo'q / qasddan tashlab qo'yilgan

To'lov qabul qilish, foydalanuvchi akkountlari (mijozlar uchun — faqat
admin/menejer kiradi), `dangerouslySetInnerHTML` bilan foydalanuvchi matni.
Yangi imkoniyat qo'shilsa, shu fayl va `docs/ARCHITECTURE.md` birga
yangilanishi shart.
