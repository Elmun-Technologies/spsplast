# syntax=docker/dockerfile:1
#
# SPS Plast — production image (Coolify, Hetzner). 2026-11-23.
#
# Nima uchun Nixpacks emas: u butun repo + barcha dev-paketlar + build keshini bitta qatlamga
# yozardi (har deploy bir necha GB) va eski image'lar diskni to'ldirardi. Bu fayl:
#   - runtime'da faqat Next `standalone` server (kerakli node_modules), `.next/static` va `public`;
#   - `public/3d` (~350 MB) va `public/catalog` (~120 MB) alohida qatlamlarda — mazmuni o'zgarmasa
#     keyingi deployda o'sha qatlam qayta ishlatiladi, diskka yangidan yozilmaydi;
#   - dev-paketlar, manba fotolar, testlar faqat build bosqichida qoladi (final image'ga kirmaydi).
#
# Build vaqtida kerak bo'ladigan env (Coolify → Environment Variables → "Build Variable" belgilangan;
# Configuration → General → "Use Docker Build Secrets" yoqilsa, ular build-arg emas, secret bo'lib keladi):
# DATABASE_URL (migratsiya + snapshot: admin'dagi mahsulotlar/sozlamalar), NEXT_PUBLIC_* (analitika),
# SNAPSHOT_REQUIRED=1 (baza yetib bo'lmasa build to'xtaydi — eski versiya ishlashda davom etadi).
# Runtime env (TELEGRAM_*, DATABASE_URL, DEPLOY_HOOK_*, IP_HASH_SECRET, …) Coolify konteynerga o'zi beradi.

ARG NODE_IMAGE=node:22-bookworm-slim

# ---------- 1. Paketlar (package-lock o'zgarmasa kesh) ----------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PUPPETEER_SKIP_DOWNLOAD=1 \
    NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund && npm cache clean --force

# ---------- 2. Build ----------
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG DATABASE_URL
ARG DATABASE_POOL_MAX
ARG SNAPSHOT_REQUIRED
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GTM_ID
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ARG NEXT_PUBLIC_YANDEX_METRICA_ID
ARG NEXT_PUBLIC_META_PIXEL_ID
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Migratsiya (DATABASE_URL bo'lmasa o'tkazib yuboriladi) — Nixpacks'dagi build buyrug'i bilan bir xil.
# DATABASE_URL avval BuildKit secret'idan olinadi (Coolify → "Use Docker Build Secrets"): u image tarixiga va
# provenance'ga yozilmaydi. Secret berilmasa — eski usul, `ARG DATABASE_URL` (Nixpacks bilan bir xil, kamroq xavfsiz).
# (Fayl usuli: `env=` bilan secret berilmasa build-arg qiymati ham o'chib qolardi — sinab ko'rildi.)
RUN --mount=type=secret,id=DATABASE_URL,required=false \
    if [ -s /run/secrets/DATABASE_URL ]; then DATABASE_URL="$(cat /run/secrets/DATABASE_URL)"; export DATABASE_URL; fi \
 && npm run db:migrate:deploy && npm run build \
 # Katta statik papkalar runner'ga to'g'ridan-to'g'ri build kontekstidan ko'chiriladi (alohida qatlam).
 && rm -rf public/3d public/catalog

# ---------- 3. Runtime ----------
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Kam o'zgaradigan katta qatlamlar birinchi — keyingi deploylarda qayta ishlatiladi.
COPY --link public/3d ./public/3d
COPY --link public/catalog ./public/catalog
# Qolgan public (shriftlar, ikonlar, pdfjs, admin-ai, …) — build bosqichidan, 3d/catalog'siz.
COPY --link --from=builder /app/public ./public
COPY --link --from=builder /app/.next/standalone ./
COPY --link --from=builder /app/.next/static ./.next/static

# next/image optimallashtirish keshi yoziladigan joy (node foydalanuvchisi).
RUN mkdir -p .next/cache && chown -R node:node .next/cache
USER node
EXPOSE 3000
CMD ["node", "server.js"]
