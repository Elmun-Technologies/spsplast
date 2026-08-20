# SPS PLAST — Production Launch Checklist

## Phase 8 Final Launch Readiness Verification

Use this checklist to track production deployment validation items.

---

## 1. Database & Infrastructure
- [ ] **PostgreSQL Database Provisioning:** Managed PostgreSQL instance is created with SSL required.
- [ ] **Database Credentials:** `DATABASE_URL` and `DIRECT_URL` populated securely in environment.
- [ ] **Data Migration Executed:** SQLite data exported and verified in target PostgreSQL database.
- [ ] **Schema Migration Deployed:** `prisma migrate deploy` executed successfully.
- [ ] **Database Backups:** Provider automated snapshots / point-in-time recovery enabled.

---

## 2. Environment & Secrets
- [ ] **AUTH_SECRET:** Strong 32+ character random string set in production secrets.
- [ ] **INTEGRATION_ENCRYPTION_KEY:** 32-byte encryption key set for securing CRM tokens.
- [ ] **NEXT_PUBLIC_SITE_URL:** Authoritative production URL configured (e.g. `https://spsplast.uz`). No localhost or placeholder URLs.
- [ ] **CRON_SECRET:** Secret token configured for protected `/api/cron/integrations` endpoint.
- [ ] **Environment Validation:** Startup validation succeeds with zero errors (`validateEnvironment()`).

---

## 3. Storage & Assets
- [ ] **Cloudflare R2 / S3 Storage:** R2 bucket and access credentials configured.
- [ ] **STORAGE_PROVIDER:** Configured to `r2` or `s3` (local storage disabled for production serverless deployment).
- [ ] **Media Upload Verification:** Test product media, Mold, and Finished Result upload verified on persistent R2 storage.
- [ ] **CDN / Custom Media Domain:** `S3_PUBLIC_URL` pointing to production CDN / custom domain with HTTPS.

---

## 4. Domain & Security
- [ ] **Domain DNS:** Apex and `www` A/AAAA/CNAME records configured.
- [ ] **SSL / TLS Certificate:** Valid HTTPS certificate active with automated renewal.
- [ ] **Security Headers:** HSTS, X-Content-Type-Options, Referrer-Policy, X-Frame-Options active via `next.config.js`.
- [ ] **Proxy Headers:** Trust reverse proxy host / proto headers for CSRF validation.
- [ ] **Rate Limiting:** Shared PostgreSQL rate limiter active on checkout, admin login, and leads.

---

## 5. Integrations & Payment Providers
- [ ] **Click Integration:** Verified live or disabled in storefront UI if credentials unconfigured.
- [ ] **Payme Integration:** Verified live or disabled in storefront UI if credentials unconfigured.
- [ ] **amoCRM Integration:** OAuth connected, token refresh verified, lead/order sync verified.
- [ ] **Telegram Admin Notifications:** Bot token & chat ID active, order notification tested.
- [ ] **Cron Execution Scheduler:** External trigger calling `/api/cron/integrations` every 1-5 minutes with `CRON_SECRET`.

---

## 6. SEO, Analytics & Content
- [ ] **Real Business Contact Info:** Phone (`+998 90 123 45 67`), email (`info@spsplast.uz`), address verified.
- [ ] **Sitemap & Robots:** `/sitemap.xml` and `/robots.txt` outputting accurate canonical production URLs.
- [ ] **Structured Data:** JSON-LD schema (Product, BreadcrumbList) validated on product pages.
- [ ] **Google Tag Manager / GA4 / Pixel:** Production measurement IDs configured without test/duplicate scripts.
- [ ] **Media Assets:** High quality product images, Mold images, and Finished Result images uploaded.

---

## 7. Quality Assurance & E2E Validation
- [ ] **Public E2E Flow:** Home -> Category -> Product -> Cart -> Checkout -> Order Success (UZ/RU).
- [ ] **Variant & Stock Test:** Thermopanel variant selection, integer price snapshot, atomic stock decrement.
- [ ] **Admin E2E Flow:** Admin login, product editing, order status change, integration outbox inspection.
- [ ] **Health Endpoint:** `GET /api/health` returns `status: "ok"`.

---

## Launch Decision
- [ ] **P0 Launch Blockers Cleared**
- [ ] **P1 High Priority Items Addressed**
- [ ] **Final Sign-off Obtained**
