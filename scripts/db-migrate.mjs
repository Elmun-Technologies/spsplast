#!/usr/bin/env node
/**
 * `drizzle/` migratsiyalarini `DATABASE_URL` bazasiga qo'llaydi (idempotent).
 *   DATABASE_URL=postgres://... npm run db:migrate
 * Vercel'da: Build Command'dan oldin yoki deploydan keyin bir marta.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const url = process.env.DATABASE_URL;
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
