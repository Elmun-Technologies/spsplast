import { drizzle } from 'drizzle-orm/postgres-js';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import postgres from 'postgres';
import * as schema from './schema.ts';

/**
 * Baza ulanishi. `DATABASE_URL` bo'lmasa `null` — sayt baribir ishlaydi:
 * `/api/leads` eski yo'l bilan faqat Telegram'ga yuboradi, admin panel
 * "baza ulanmagan" deb ko'rsatadi. Build paytida baza kerak emas.
 *
 * Neon / Supabase pooler (pgbouncer) bilan ishlashi uchun `prepare: false`.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const globalForDb = globalThis as unknown as { __spsDb?: Db; __spsDbOverride?: Db | null };

export function getDb(): Db | null {
  if (globalForDb.__spsDbOverride !== undefined) return globalForDb.__spsDbOverride;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!globalForDb.__spsDb) {
    // DATABASE_POOL_MAX: serverless'da (Neon/Supabase pooler) yoki bitta ulanishli lokal
    // test bazasida (PGlite socket) kichikroq pul kerak bo'lishi mumkin.
    const max = Math.min(Math.max(Number(process.env.DATABASE_POOL_MAX) || 5, 1), 20);
    // connect_timeout: baza javob bermasa zayafka 30 s osilib qolmasin — 5 s dan keyin
    // `/api/leads` Telegram yo'liga o'tadi (audit 2026-11-02).
    const client = postgres(url, { max, prepare: false, idle_timeout: 20, connect_timeout: 5 });
    globalForDb.__spsDb = drizzle(client, { schema }) as unknown as Db;
  }
  return globalForDb.__spsDb;
}

/** Testlar uchun: PGlite yoki `null` (baza yo'q holati) ni o'rnatadi. */
export function setDbForTests(db: Db | null | undefined): void {
  globalForDb.__spsDbOverride = db;
}

export { schema };
