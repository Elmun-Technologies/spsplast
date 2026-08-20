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
