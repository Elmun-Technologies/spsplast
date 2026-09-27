# Fly.io ga deploy — qadamma-qadam

Loyiha Fly.io uchun to'liq tayyor: `Dockerfile`, `.dockerignore`, `fly.toml`,
health-check (`/api/health`) va GitHub Actions workflow'lari qo'shilgan.

| Fayl | Vazifasi |
|---|---|
| `Dockerfile` | 3 bosqichli build: deps → builder (`npm run build` → `scripts/prisma-generate.js` + `next build`) → runner (Next.js **standalone**, root emas). Prisma **Rust-siz** rejimda (`engineType = "client"` + `@prisma/adapter-pg`), shuning uchun konteynerga native engine kerak emas |
| `.dockerignore` | Image ichiga katalog PDF'lari, manba suratlar, `docs/`, `node_modules` tushmaydi |
| `fly.toml` | Region `fra`, 1 GB RAM, HTTPS majburiy, health-check, deploy oldidan `prisma db push` |
| `.github/workflows/fly-deploy.yml` | `main` ga push → test → `flyctl deploy` |
| `.github/workflows/cron-integrations.yml` | Soatlik cron (Flyda Vercel Cron yo'q) |

---

## 1. Bir martalik sozlash

```bash
# 0) flyctl
curl -L https://fly.io/install.sh | sh

fly auth login
cd spsplast

# 1) Ilovani yaratish (deploy qilmasdan) — app nomi fly.toml dagi bilan bir xil bo'lsin
fly launch --no-deploy --copy-config --name spsplast --region fra
```

## 2. PostgreSQL

Ikki yo'l bor:

**a) Fly Managed Postgres (tavsiya — ilova bilan bir regionda):**
```bash
fly mpg create --name spsplast-db --region fra
fly mpg attach spsplast-db          # DATABASE_URL secret'ini o'zi qo'yadi
```

**b) Tashqi provayder (Neon / Supabase, Frankfurt):**
```bash
fly secrets set \
  DATABASE_URL="postgresql://...?sslmode=require&pgbouncer=true&connection_limit=5" \
  DIRECT_URL="postgresql://...?sslmode=require"
```

> `DATABASE_URL` — pooled (pgbouncer), `DIRECT_URL` — to'g'ridan-to'g'ri.
> `prisma db push` va Studio aynan `DIRECT_URL` bilan ishlaydi.

## 3. Secrets

```bash
fly secrets set \
  NEXT_PUBLIC_SITE_URL="https://sps.uz" \
  AUTH_SECRET="$(openssl rand -hex 32)" \
  INTEGRATION_ENCRYPTION_KEY="$(openssl rand -hex 32)" \
  CRON_SECRET="$(openssl rand -hex 24)" \
  SEED_ADMIN_EMAIL="admin@sps.uz" \
  SEED_ADMIN_PASSWORD="<kuchli-parol>" \
  TELEGRAM_BOT_TOKEN="..." \
  TELEGRAM_CHAT_ID="-100..." \
  STORAGE_PROVIDER="r2" \
  S3_ENDPOINT="https://<account>.r2.cloudflarestorage.com" \
  S3_BUCKET="spsplast-media" \
  S3_ACCESS_KEY="..." \
  S3_SECRET_KEY="..." \
  S3_PUBLIC_URL="https://media.sps.uz"
```

> `NEXT_PUBLIC_*` o'zgaruvchilari **build vaqtida** kerak: ular `fly.toml` dagi
> `[build.args]` orqali ham beriladi (`NEXT_PUBLIC_SITE_URL`). Domen o'zgarsa
> `fly.toml` dagi qiymatni ham yangilang.

### Rasm yuklash haqida
Fly mashinalari qayta ishga tushganda fayl tizimi tozalanadi, shuning uchun
admin paneldan yuklangan rasm **R2/S3** ga ketishi kerak. Muqobil (bitta mashina
uchun) — Fly volume:
```bash
fly volumes create uploads --size 3 --region fra
# fly.toml ga:
# [[mounts]]
#   source = "uploads"
#   destination = "/app/public/uploads"
```
Bir nechta mashina bo'lsa volume ular orasida bo'linmaydi — R2/S3 afzal.

## 4. Birinchi deploy

```bash
fly deploy
# release_command avtomatik `prisma db push` qiladi (sxema yaratiladi)

# Katalogni bazaga yozish (50 ta yangi mahsulot + 200 variant):
fly ssh console -C "node scripts/import-molds-2026.js"

# yoki to'liq boshlang'ich to'plam (DIQQAT: hamma jadvalni tozalaydi!):
# fly ssh console -C "node prisma/seed.js"
```

Tekshirish:
```bash
fly status
curl -s https://spsplast.fly.dev/api/health | jq
fly logs
```

## 5. Domen

```bash
fly certs add sps.uz
fly certs add www.sps.uz
fly ips list        # A/AAAA yozuvlarini DNS ga qo'shing
fly certs show sps.uz
```
So'ng `NEXT_PUBLIC_SITE_URL` ni shu domenga o'zgartiring va qayta deploy qiling.

## 6. Cron

Flyda Vercel Cron yo'q. Ikki variant:

1. **GitHub Actions** (tayyor): `.github/workflows/cron-integrations.yml`,
   secretlar — `SITE_URL`, `CRON_SECRET`.
2. **Fly scheduled machine:**
   ```bash
   fly machine run . --schedule hourly \
     --command "curl -fsS -H 'Authorization: Bearer <CRON_SECRET>' https://sps.uz/api/cron/integrations"
   ```

## 7. Kundalik ishlar

```bash
fly logs                       # jonli loglar
fly ssh console                # konteyner ichiga kirish
fly scale count 2              # 2 ta mashina (yuk oshganda)
fly scale vm shared-cpu-2x --memory 2048
fly releases                   # tarix
fly releases rollback          # oldingi versiyaga qaytish
fly mpg connect spsplast-db    # psql
```

## 8. Vercel bilan taqqoslash (nimalar o'zgaradi)

| | Vercel | Fly.io |
|---|---|---|
| Ishga tushirish | git push | Docker image (`fly deploy`) |
| Sovuq start | yo'q (serverless) | `min_machines_running = 1` bilan yo'q |
| CDN | global, avtomatik | Fly Anycast — statik fayllar Yevropadan (kerak bo'lsa oldiga Cloudflare qo'yish mumkin) |
| Rasm optimizatsiyasi | Vercel Image | `next/image` konteyner ichida (CPU sarfi shu mashinada) |
| Cron | `vercel.json` crons | GitHub Actions yoki scheduled machine |
| Baza | tashqi (Neon/Supabase) | Fly MPG — **ilova bilan bir regionda**, kechikish ~1 ms |
| Prisma | Rust-siz client (`engineType = "client"` + `@prisma/adapter-pg`) | xuddi shunday — konteynerga native engine kerak emas |
| Narx (kichik sayt) | Pro $20/oy | shared-cpu-1x 1 GB ≈ $5–7/oy + baza |

> Repoda `vercel.json` yo'q: Vercel Hobby rejasida soatlik cron deploy'ni
> xatoga olib kelardi. Vercelga qaytish kerak bo'lsa, region va cron'ni loyiha
> sozlamalaridan bering.

## 9. Shaxsiy ma'lumotlar qonuni haqida eslatma

Fly.io ning O'zbekistonda regioni **yo'q** (eng yaqinlari `fra`, `waw`, `bom`).
Ya'ni `docs/DEPLOYMENT.md` 9.3-bo'limidagi 27-1-modda savoli Flyda ham xuddi
Verceldagidek qoladi. Agar yurist lokalizatsiyani qat'iy talab desa, yechim —
bazani (yoki butun stack'ni) O'zbekistondagi serverga ko'chirish. Bu holatda ham
shu `Dockerfile` ishlaydi: istalgan VPS'da `docker compose up -d` bilan.
