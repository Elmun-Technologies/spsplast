# syntax=docker/dockerfile:1
#
# SPS — Next.js 15 (standalone) + Prisma, Fly.io / istalgan Docker host uchun.
#
# Uch bosqich:
#   deps    — faqat bog'liqliklar (kesh qatlami)
#   builder — prisma generate + next build (standalone chiqish)
#   runner  — minimal ishlash muhiti (root emas, 3000-port)
#
# Muhim: `next build` bosqichida DATABASE_URL kerak emas — sahifalar bazaga
# bog'liq bo'lmasligi uchun maxsus yozilgan (CLAUDE.md dagi qoida), lekin
# `prisma generate` schema.prisma dan client yaratadi.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY scripts/prisma-generate.js ./scripts/prisma-generate.js
RUN npm ci --no-audit --no-fund

FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1
# next.config.js shu o'zgaruvchi bilan `output: 'standalone'` ga o'tadi
ENV BUILD_STANDALONE=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build vaqtida kerak bo'ladigan public env'lar (canonical/OG havolalar uchun)
ARG NEXT_PUBLIC_SITE_URL="https://sps.uz"
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
# `npm run build` ichida `node scripts/prisma-generate.js` ishlaydi:
# engineType = "client" (WASM query compiler + @prisma/adapter-pg), shuning
# uchun native engine binary yuklanmaydi.
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# Standalone chiqish: server.js + minimal node_modules
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Seed / import / `prisma db push` konteyner ichidan ishga tushirilishi uchun
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/catalog_build/products.json ./catalog_build/products.json
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/pg ./node_modules/pg
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin

USER nextjs
EXPOSE 3000

# Next.js standalone serveri
CMD ["node", "server.js"]
