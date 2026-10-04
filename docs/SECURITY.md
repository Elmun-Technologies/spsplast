# SPS PLAST — xavfsizlik (backendsiz arxitektura)

> 2026-10 yangilangan. Saytda baza, sessiya, admin panel va to'lov yo'q —
> quyidagi choralar **hozirgi** arxitekturaga tegishli.

## 1. Yozadigan yagona nuqta: `POST /api/leads`

Saytning yagona yozuv amali — zayafka formasi. U `src/app/api/leads/route.ts`
orqali ishlaydi va hech qanday ma'lumotni saqlamaydi: matn Telegram guruhiga
yuboriladi va so'rov tugaydi (stateless).

Himoya qatlamlari:

| Chora | Tafsilot |
|---|---|
| **Sxema validatsiyasi** | `zod` — `name` 2–120, `phone` 7–32, `product` ≤ 240, `productSku` ≤ 64, `quantity` butun son 1–1 000 000, `message` ≤ 2000, `pageUrl` ≤ 500, `lang` `uz`/`ru`; noto'g'ri so'rov → `400` |
| **Telefon normalizatsiyasi** | `src/lib/phone.ts` — `901234567` → `+998901234567`; tekshiruvdan o'tmagan raqam Telegram'ga yuborilmaydi |
| **Honeypot** | Yashirin `website` maydoni to'ldirilgan bo'lsa so'rov `success: true` bilan jimgina tashlanadi (bot o'z xatosini bilmaydi) |
| **Rate limit** | `src/lib/rateLimit.ts` — IP bo'yicha **10 so'rov / 15 daqiqa**; IP `x-forwarded-for` ning birinchi qiymatidan olinadi (Vercel proxy) |
| **Payload chegarasi** | Maydonlar uzunligi sxema darajasida cheklangan — Telegram xabari hajmi va HTML render'i nazoratda |
| **HTML escaping** | `escapeTelegramHtml()` (`src/lib/telegram.ts`) — Telegram `parse_mode: HTML` bilan chaqiriladi, shuning uchun `& < >` qochiriladi; foydalanuvchi matni bot markup'ini buzmaydi va boshqa chatni nishonga olmaydi |
| **Xato matnlari** | Foydalanuvchiga faqat umumiy xabar qaytariladi; Telegram tokeni, chat ID va API javobi tashqariga chiqmaydi |

**Ma'lum cheklov:** rate limiter in-memory. Vercel'da bir nechta instansiya
parallel ishlaganda limit instansiya bo'yicha qo'llanadi. Bu Telegram'ni
to'ldirib yuborishdan himoya qilishga yetadi; qo'shimcha chora kerak bo'lsa,
oldingi Kafka navbatdagi variant — honeypot + telefon validatsiyasi.

## 2. Maxfiy ma'lumotlar

- `TELEGRAM_BOT_TOKEN` va `TELEGRAM_CHAT_ID` **faqat serverda** o'qiladi
  (`src/app/api/leads/route.ts`, `src/lib/telegram.ts`, `/api/health`).
  `NEXT_PUBLIC_` prefiksi berilmagan — brauzerga tushmaydi.
- Telegram API manzili faqat server tomonida chaqiriladi; brauzer hech qachon
  `api.telegram.org` ga murojaat qilmaydi.
- Repo ichida `.env*` yo'q; tokenlar Vercel → Environment Variables orqali
  kiritiladi (`docs/DEPLOYMENT.md`).
- Xato bo'lsa Telegram yuborilmaydi, lekin foydalanuvchi oqimi davom etadi:
  javob `{ success: true, delivered: false }` va log'da sabab ko'rinadi.

## 3. Statik kontent va sitemap

- `public/search-index.json` — faqat ochiq katalog ma'lumotlari (nomi, slug,
  rasm, SKU). `robots.ts` bu faylni indeksatsiyadan yopadi; unda maxfiy
  maydon yo'q.
- Sitemap, JSON-LD va `metadataBase` `NEXT_PUBLIC_SITE_URL` dan olinadi
  (`https://sps.uz`); noto'g'ri qiymat faqat kanonik havolalarga ta'sir qiladi.
- Sharhlar, buyurtmalar, narxlar va qoldiq serverda saqlanmaydi — saytda
  shunga mos maxfiy ma'lumot ham yo'q.

## 4. HTTP sarlavhalari (`next.config.js` → `headers()`)

| Sarlavha | Qiymat | Maqsad |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HTTPS'ga majburlash |
| `X-Content-Type-Options` | `nosniff` | MIME-type sniffing'nig oldini olish |
| `X-Frame-Options` | `DENY` (faqat production) | Clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Eski brauzerlar uchun qo'shimcha qatlam |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Tashqi saytlarga to'liq URL ketmasin |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Keraksiz API'larni yopish |
| `poweredByHeader` | `false` | Texnologiya bannerni yashirish |

`X-Frame-Options: DENY` faqat productionda qo'llanadi — `next dev` ko'pincha
preview iframe ichida ochiladi va u yerda sahifa bloklanmasligi kerak.

## 5. Middleware

`src/middleware.ts` faqat `/` manzilini til bo'yicha yo'naltiradi (cookie →
`Accept-Language` → `uz`). Eski admin API uchun CSRF darvozasi **olib
tashlandi**: cookie-sessiya, `/api/admin/*`, `/api/orders/*` yo'q, shuning
uchun himoya qilinadigan sirt ham yo'q.

## 6. Nima qasddan yo'q

Savat/checkout, to'lov qabul qilish, foydalanuvchi akkauntlari, admin panel,
fayl yuklash, uchinchi tomon skriptlari (analitika ID kiritilmaguncha),
`dangerouslySetInnerHTML` bilan foydalanuvchi matni. Bu imkoniyatlar
qo'shilsa, `SECURITY.md` va `docs/ARCHITECTURE.md` birga yangilanishi shart.
