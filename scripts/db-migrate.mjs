#!/usr/bin/env node
/**
 * `drizzle/` migratsiyalarini `DATABASE_URL` bazasiga qo'llaydi (idempotent).
 *   DATABASE_URL=postgres://... npm run db:migrate
 *
 * `--deploy` (Vercel build, `vercel.json` → `npm run db:migrate:deploy && npm run build`):
 *  - `DATABASE_URL` yo'q → o'tkazib yuboriladi (sayt bazasiz ham yig'iladi);
 *  - Production (`VERCEL_ENV=production`) → har deploy'da qo'llanadi;
 *  - Preview → faqat `MIGRATE_PREVIEW=1` bo'lsa (Preview ko'pincha production bazasiga
 *    ulangan: PR'dagi tajriba migratsiyasi production jadvallarini o'zgartirib qo'ymasin);
 *  - migratsiya xatosi → build to'xtaydi (yangi kod eski jadvallar bilan chiqmasin).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const url = process.env.DATABASE_URL;
const deploy = process.argv.includes('--deploy');
if (deploy) {
  const env = process.env.VERCEL_ENV;
  if (!url) {
    console.log('[migrate] DATABASE_URL yo\'q — migratsiya o\'tkazib yuborildi.');
    process.exit(0);
  }
  if (env && env !== 'production' && process.env.MIGRATE_PREVIEW !== '1') {
    console.log(`[migrate] ${env} build — migratsiya o'tkazib yuborildi (Preview uchun MIGRATE_PREVIEW=1).`);
    process.exit(0);
  }
}
if (!url) {
  console.error('DATABASE_URL berilmagan.');
  process.exit(1);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const client = postgres(url, { max: 1, prepare: false });
try {
  await migrate(drizzle(client), { migrationsFolder: path.join(ROOT, 'drizzle') });
  console.log('Migratsiyalar qo\'llandi.');
} catch (error) {
  console.error('Migratsiya xatosi:', error);
  process.exitCode = 1;
} finally {
  await client.end();
}
