# SPS PLAST — Production Deployment Guide

## Overview

This guide outlines the production deployment architecture, environment configurations, background jobs, storage setup, and operational instructions for SPS PLAST e-commerce platform.

---

## 1. Recommended Production Architecture

### Platform Stack
- **Application Server:** Next.js 14 App Router (Deployed to Vercel or AWS Node.js VPS / Docker container)
- **Database:** Managed PostgreSQL (Supabase, Neon, Railway, or AWS RDS PostgreSQL)
- **Storage:** Cloudflare R2 or AWS S3 (S3 API compatible object storage with CDN integration)
- **Integrations:** Click, Payme, amoCRM, Telegram Bot API
- **Cron / Schedulers:** Vercel Cron or CloudWatch Scheduled Tasks invoking `/api/cron/integrations` with `CRON_SECRET` authorization.

---

## 2. Environment Variables Specification

All production secrets must be populated in the hosting provider's secure secret manager. Never commit `.env` files to git.

```ini
# Environment Mode
NODE_ENV="production"

# Database Configuration
DATABASE_URL="postgresql://user:password@pg-host:5432/spsplast?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:password@pg-host:5432/spsplast?sslmode=require"

# Site URLs & Security
NEXT_PUBLIC_SITE_URL="https://spsplast.uz"
AUTH_SECRET="a_random_32_character_string_for_jose_jwt_signing"
INTEGRATION_ENCRYPTION_KEY="32_byte_hex_or_base64_encryption_key"
CRON_SECRET="secure_random_token_for_cron_endpoint"

# Persistent Storage (Cloudflare R2 / AWS S3)
STORAGE_PROVIDER="r2" # or "s3"
S3_ENDPOINT="https://<account_id>.r2.cloudflarestorage.com"
S3_REGION="auto"
S3_BUCKET="spsplast-production-media"
S3_ACCESS_KEY="<r2_access_key>"
S3_SECRET_KEY="<r2_secret_key>"
S3_PUBLIC_URL="https://media.spsplast.uz"

# Integration Secrets (Only configure when live-tested)
TELEGRAM_BOT_TOKEN="<bot_token>"
TELEGRAM_CHAT_ID="<chat_id>"

CLICK_MERCHANT_ID="<click_merchant_id>"
CLICK_SERVICE_ID="<click_service_id>"
CLICK_SECRET_KEY="<click_secret_key>"

PAYME_MERCHANT_ID="<payme_merchant_id>"
PAYME_SECRET_KEY="<payme_secret_key>"

AMOCRM_SUBDOMAIN="<subdomain>"
AMOCRM_CLIENT_ID="<client_id>"
AMOCRM_CLIENT_SECRET="<client_secret>"
AMOCRM_REDIRECT_URI="https://spsplast.uz/api/admin/integrations/amocrm/callback"
```

---

## 3. Database & Migration Procedure

1. **Schema Deployment:**
   Always run migrations using Prisma's non-reset deploy command during CI/CD release:
   ```bash
   npx prisma migrate deploy
   ```
2. **Client Generation:**
   ```bash
   npx prisma generate
   ```

---

## 4. Background Job & Cron Execution

The integration outbox queue processes amoCRM synchronization, Telegram alerts, and callback retries automatically via background jobs.
- **Endpoint:** `GET /api/cron/integrations`
- **Authorization:** `Authorization: Bearer <CRON_SECRET>` or query parameter `?secret=<CRON_SECRET>`
- **Job Locking & Recovery:** Jobs transitioning to `PROCESSING` lock atomically. Any stuck job older than 15 minutes automatically resets to `PENDING` for retry.

---

## 5. Health & Monitoring

- **Health Check Endpoint:** `GET /api/health`
- **Output:** Returns JSON status payload indicating HTTP 200 (healthy) or 503 (degraded) with database connectivity and environment validation results.

---

## 6. Rollback Procedure

1. **Application Version:** Roll back deployment artifact/commit to previous deployment tag.
2. **Database:** Forward-fix schema migrations when possible. Schema rollbacks must preserve order history, SKU mapping, and transaction records.
3. **Storage:** Cloudflare R2 object storage versioning provides historical asset recovery.

## 7. Website vs. PWA (2026-09-27)

Sayt **oddiy veb-sayt** sifatida ishlaydi. Ilgari u o'rnatiladigan PWA sifatida
sozlangan edi va shu sababli ikkita muammo kelib chiqqan:

1. **"Alohida ilova" bo'lib ochilishi** — `manifest.json` da `display: "standalone"`,
   iOS uchun `apple-mobile-web-app-capable: yes` va `PWAInstallBanner`
   ("Ilovani o'rnating") banneri bor edi. Chrome havolani o'rnatilgan ilova
   oynasida ochardi.
2. **Eskirgan sahifalar / buzilgan navigatsiya** — `public/sw.js` barcha
   so'rovlarni *cache-first* keshlardi (HTML va `/_next/static/...` chunk'lari
   ham). Har deploydan keyin brauzer eski HTML'ni ko'rsatib, u yo'q bo'lib
   ketgan JS chunk'larni so'rardi → havolalar ishlamay qolardi.

### Nima o'zgardi

| Fayl | O'zgarish |
|---|---|
| `public/manifest.json` | `display: "browser"`, `orientation` olib tashlandi, `purpose: "any"` |
| `src/app/layout.tsx` | `appleWebApp.capable: false`, `metadataBase` qo'shildi |
| `public/sw.js` | Cache-first logika o'rniga **kill switch**: keshlarni tozalaydi va o'zini unregister qiladi |
| `src/components/layout/SWRegister.tsx` | Endi SW ro'yxatdan o'tkazmaydi, aksincha qolgan SW va keshlarni o'chiradi |
| `src/components/layout/PWAInstallBanner.tsx` | O'chirildi |

### Foydalanuvchi tomonida

Agar telefonga ilova allaqachon **o'rnatilgan** bo'lsa, u o'zi yo'qolmaydi —
bir marta qo'lda o'chirish kerak:

- **Android/Chrome:** ilova ikonkasini bosib turing → *Uninstall* (yoki
  Sozlamalar → Ilovalar → SPS → O'chirish).
- **iOS/Safari:** bosh ekrandagi ikonkani o'chirib tashlang.
- **Desktop Chrome:** `chrome://apps` → SPS → *Remove from Chrome*.

Keshlangan eski versiya saytni ochgandan so'ng avtomatik tozalanadi
(`sw.js` kill switch ishga tushadi va sahifani yangilaydi).

## 8. SEO havolalari

- `NEXT_PUBLIC_SITE_URL` **albatta** production domenga o'rnatilishi kerak
  (masalan `https://sps.uz`). U `metadataBase`, `sitemap.xml`, `robots.txt`,
  YML feed va canonical havolalar uchun ishlatiladi. Aks holda Open Graph
  rasmlari `localhost` ga ishora qiladi.
- Bosh sahifa, katalog va mahsulot sahifalarida `canonical` + `hreflang`
  (uz/ru) havolalari bor; mahsulotlarda har bir til o'z slug'iga bog'lanadi.

## 9. "Vercel o'zi yetadimi?" — hosting bo'yicha qaror

**Qisqa javob:** Next.js ilovasi uchun Vercel to'liq yetarli, lekin **baza va fayl
xotirasi Vercelda yo'q** — ular alohida sozlanadi. Qolgani huquqiy talabga bog'liq
(pastdagi 9.3).

### 9.1 Vercelda ishlashi uchun majburiy sozlamalar

| Nima | Nega | Qanday |
|---|---|---|
| **Managed PostgreSQL** | Vercelda baza yo'q | Neon / Supabase / Vercel Postgres, **Frankfurt (eu-central-1)** regioni. `DATABASE_URL` — pooled (pgbouncer), `DIRECT_URL` — to'g'ridan-to'g'ri |
| **R2 / S3 obyekt xotirasi** | Vercel fayl tizimi **read-only** va vaqtinchalik: admin paneldan yuklangan rasm `public/uploads` ga yozilmaydi (yoki keyingi deployda yo'qoladi) | `STORAGE_PROVIDER=r2` + `S3_*` env'lari. Bu bo'lmasa admin orqali rasm yuklash ishlamaydi |
| **Region: `fra1`** | Default region AQSH (iad1) — Toshkentdan har bir so'rov ~250 ms ortiqcha | `vercel.json` da sozlangan (`"regions": ["fra1"]`) |
| **Cron** | `/api/cron/integrations` (CRM/Telegram navbati) o'zi ishga tushmaydi | Vercel Cron (`vercel.json` dagi `crons`) + `CRON_SECRET`. **Diqqat:** Hobby rejada cron faqat kuniga 1 marta ishlashi mumkin — soatlik jadval deploy'ni xatoga olib keladi. Shu sababli repoda `vercel.json` saqlanmadi; Flyda cron GitHub Actions orqali |
| **Pro reja** | Vercel Hobby tijorat loyihalari uchun mo'ljallanmagan | Pro ($20/oy) |
| **`NEXT_PUBLIC_SITE_URL`** | canonical, OG, sitemap, feed havolalari | Production domen (`https://sps.uz`) |

### 9.2 Vercel nimalarni o'zi hal qiladi

CDN va keshlash, ISR (`revalidate`), `next/image` optimizatsiyasi, avtomatik HTTPS,
preview deploylar, rollback, gzip/brotli. Bular uchun alohida server shart emas.

### 9.3 Huquqiy jihat — O'zbekiston shaxsiy ma'lumotlar qonuni

Sayt zayafka va buyurtmalarda **ism + telefon** yig'adi, ya'ni loyiha shaxsga doir
ma'lumotlar operatori hisoblanadi:

- "Shaxsga doir ma'lumotlar to'g'risida"gi qonun (O'RQ-547) **27-1-moddasi**:
  O'zbekiston fuqarolarining shaxsga doir ma'lumotlari qayta ishlanadigan serverlar
  O'zbekiston hududida joylashtirilishi lozim; baza `pd.gov.uz` davlat reyestrida
  ro'yxatdan o'tkaziladi.
- Vazirlar Mahkamasining **415-son (29.07.2026)** qarori bilan ma'lumotlarni bir xil
  himoya qiluvchi **48 ta chet davlat ro'yxati** tasdiqlandi (AQSH, Germaniya,
  Niderlandiya, Shveytsariya, Estoniya va boshqalar) — transchegaraviy uzatish shu
  davlatlarga erkinlashtirildi.
- Bu ikki talab bir-birini to'liq almashtirmaydi, shuning uchun **yurist bilan
  tasdiqlash kerak**: agar 27-1 qat'iy qo'llanilsa, leadlar/buyurtmalar bazasi
  O'zbekistondagi serverda bo'lishi kerak.

### 9.4 Variantlar

| Variant | Ijobiy | Salbiy |
|---|---|---|
| **A. Vercel + Neon (Frankfurt)** — hozirgi yo'l | Eng tez ishga tushadi, CDN/ISR/rasm optimizatsiyasi tayyor, DevOps yo'q | 27-1-modda bo'yicha savol ochiq |
| **B. O'zbekistondagi VPS** (Docker: Node + PostgreSQL + Nginx) | Lokalizatsiya talabiga mos, foydalanuvchiga eng yaqin baza | Serverni o'zingiz boqasiz: HTTPS, backup, monitoring, CDN alohida |
| **C. Gibrid: Vercel (frontend) + UZ'dagi baza** | Frontend tez, ma'lumot mamlakatda | Har bir DB so'rovi ~200 ms+ (Frankfurt↔Toshkent) — admin va checkout sezilarli sekinlashadi |

**Amaliy tavsiya:** hozircha **A** bilan davom etish (sayt tez ishga tushadi), yurist
27-1 ni qat'iy talab deb topsa — **B** ga ko'chirish. Loyiha buni qo'llab-quvvatlaydi:
`next build && next start` yoki Docker; kodda Vercel'ga xos bog'liqlik yo'q.

### 9.5 Tanlangan yo'l: Fly.io (2026-09-27)

Loyiha **Fly.io** ga ko'chirilmoqda. Kerakli hamma narsa repoda:
`Dockerfile`, `.dockerignore`, `fly.toml`, `.github/workflows/fly-deploy.yml`,
`.github/workflows/cron-integrations.yml`.

Qadamma-qadam qo'llanma: [`docs/DEPLOY-FLY.md`](DEPLOY-FLY.md).

Asosiy farqlar:
- `next.config.js` Docker build'da `output: 'standalone'` ga o'tadi (`BUILD_STANDALONE=1`).
- `prisma/schema.prisma` da `binaryTargets = ["native", "debian-openssl-3.0.x"]`.
- Cron endi `vercel.json` emas — GitHub Actions yoki Fly scheduled machine.
- `vercel.json` repodan olib tashlandi: Hobby rejada soatlik cron deploy'ni
  to'xtatardi ("Deployment failed"). Vercelga qaytish kerak bo'lsa, region va
  cron loyiha sozlamalaridan (Settings → Functions / Cron Jobs) beriladi.
- Fayl yuklash uchun R2/S3 (yoki `/app/public/uploads` ga volume + `UPLOADS_VOLUME=1`);
  aks holda `/api/health` ogohlantirish beradi.
- **Secretlarni birinchi deploydan oldin o'rnating:** `AUTH_SECRET` bo'lmasa
  `/api/health` 503 qaytaradi va Fly deployni orqaga qaytaradi.
