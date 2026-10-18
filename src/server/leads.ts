import { and, count, desc, eq, gte, ilike, inArray, lt, or, sql } from 'drizzle-orm';
import type { Db } from './db/client.ts';
import {
  adminUsers,
  leadActivity,
  leadCounters,
  leadItems,
  leads,
  rateHits,
  type LeadStatus,
} from './db/schema.ts';

/**
 * Zayafkalar ombori (Bosqich 7–8). Barcha funksiyalar `db` ni parametr sifatida
 * oladi — Next marshrutlari `getDb()` ni, testlar PGlite'ni beradi.
 */

export type NewLeadInput = {
  type: 'quick' | 'list' | 'partners';
  clientType?: 'workshop' | 'dealer' | 'builder' | 'private';
  name: string;
  phone: string;
  city?: string;
  country?: string;
  geoCountry?: string | null;
  company?: string;
  volumeM2?: number;
  material?: string;
  message?: string;
  lang: string;
  pageUrl?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  gclid?: string;
  fbclid?: string;
  items?: { slug: string; code?: string | null; name?: string | null; m2?: number; molds?: number | null }[];
};

/** `2026-10` → `2610`. Toshkent vaqti bo'yicha (oy chegarasi UTC+5 da almashadi). */
export function leadPeriod(now: Date): string {
  const t = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  return `${String(t.getUTCFullYear() % 100).padStart(2, '0')}${String(t.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function formatLeadNumber(period: string, n: number): string {
  return `SPS-${period}-${String(n).padStart(4, '0')}`;
}

/** Atomar hisoblagich: parallel zayafkalar ham bir xil raqam olmaydi. */
export async function nextLeadNumber(db: Db, now: Date): Promise<string> {
  const period = leadPeriod(now);
  const [row] = await db
    .insert(leadCounters)
    .values({ period, value: 1 })
    .onConflictDoUpdate({ target: leadCounters.period, set: { value: sql`${leadCounters.value} + 1` } })
    .returning({ value: leadCounters.value });
  return formatLeadNumber(period, row.value);
}

export async function createLead(db: Db, input: NewLeadInput, now = new Date()): Promise<{ id: number; number: string }> {
  return db.transaction(async (tx) => {
    const number = await nextLeadNumber(tx as unknown as Db, now);
    const [lead] = await tx
      .insert(leads)
      .values({
        number,
        type: input.type,
        clientType: input.clientType ?? null,
        name: input.name,
        phone: input.phone,
        city: input.city || null,
        country: input.country || null,
        geoCountry: input.geoCountry || null,
        company: input.company || null,
        volumeM2: input.volumeM2 ?? null,
        material: input.material || null,
        message: input.message || null,
        lang: input.lang,
        pageUrl: input.pageUrl || null,
        utmSource: input.utm_source || null,
        utmMedium: input.utm_medium || null,
        utmCampaign: input.utm_campaign || null,
        gclid: input.gclid || null,
        fbclid: input.fbclid || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: leads.id });

    if (input.items?.length) {
      await tx.insert(leadItems).values(
        input.items.map((it) => ({
          leadId: lead.id,
          slug: it.slug,
          code: it.code ?? null,
          name: it.name ?? null,
          m2: it.m2 ?? null,
          molds: it.molds ?? null,
        })),
      );
    }
    await tx.insert(leadActivity).values({ leadId: lead.id, kind: 'created', createdAt: now });
    return { id: lead.id, number };
  });
}

export async function markTelegram(db: Db, leadId: number, delivered: boolean): Promise<void> {
  await db.update(leads).set({ telegramDelivered: delivered }).where(eq(leads.id, leadId));
  if (!delivered) {
    await db.insert(leadActivity).values({ leadId, kind: 'telegram', body: "Telegram'ga yetkazilmadi" });
  }
}

/**
 * Serverless'da ishlaydigan rate limit: hisob bazada. `true` — ruxsat.
 * Eski yozuvlar har chaqiruvda shu kalit uchun tozalanadi (jadval o'smaydi).
 */
/** Faqat sanaydi (yozmaydi) — login'da muvaffaqiyatsiz urinishlar uchun. */
export async function recentHits(db: Db, key: string, windowMs: number, now = new Date()): Promise<number> {
  const since = new Date(now.getTime() - windowMs);
  const [{ n }] = await db
    .select({ n: count() })
    .from(rateHits)
    .where(and(eq(rateHits.key, key), gte(rateHits.at, since)));
  return n;
}

export async function recordHit(db: Db, key: string, now = new Date()): Promise<void> {
  await db.insert(rateHits).values({ key, at: now });
}

export async function hitRateLimit(db: Db, key: string, max: number, windowMs: number, now = new Date()): Promise<boolean> {
  const since = new Date(now.getTime() - windowMs);
  await db.delete(rateHits).where(and(eq(rateHits.key, key), lt(rateHits.at, since)));
  const [{ n }] = await db
    .select({ n: count() })
    .from(rateHits)
    .where(and(eq(rateHits.key, key), gte(rateHits.at, since)));
  if (n >= max) return false;
  await db.insert(rateHits).values({ key, at: now });
  return true;
}

// --- Admin: ro'yxat, kartochka, o'zgarishlar ----------------------------------

export type LeadFilters = {
  status?: LeadStatus;
  q?: string;
  type?: 'quick' | 'list' | 'partners';
  assigneeId?: number | 'none';
  from?: Date;
  to?: Date;
  /** Faqat Telegram'ga yetkazilmaganlar. */
  undelivered?: boolean;
  page?: number;
  pageSize?: number;
};

function leadWhere(f: LeadFilters) {
  const cond = [];
  if (f.status) cond.push(eq(leads.status, f.status));
  if (f.type) cond.push(eq(leads.type, f.type));
  if (f.assigneeId === 'none') cond.push(sql`${leads.assigneeId} is null`);
  else if (typeof f.assigneeId === 'number') cond.push(eq(leads.assigneeId, f.assigneeId));
  if (f.from) cond.push(gte(leads.createdAt, f.from));
  if (f.to) cond.push(lt(leads.createdAt, f.to));
  if (f.undelivered) cond.push(eq(leads.telegramDelivered, false));
  const q = f.q?.trim();
  if (q) {
    const like = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    const digits = q.replace(/\D/g, '');
    cond.push(
      or(
        ilike(leads.number, like),
        ilike(leads.name, like),
        ilike(leads.city, like),
        ilike(leads.country, like),
        ilike(leads.company, like),
        digits.length >= 4 ? sql`regexp_replace(${leads.phone}, '\\D', '', 'g') like ${`%${digits}%`}` : sql`false`,
      ),
    );
  }
  return cond.length ? and(...cond) : undefined;
}

export async function listLeads(db: Db, f: LeadFilters = {}) {
  const pageSize = Math.min(Math.max(f.pageSize ?? 30, 1), 200);
  const page = Math.max(f.page ?? 1, 1);
  const where = leadWhere(f);

  const rows = await db
    .select({
      id: leads.id,
      number: leads.number,
      type: leads.type,
      clientType: leads.clientType,
      name: leads.name,
      phone: leads.phone,
      city: leads.city,
      country: leads.country,
      geoCountry: leads.geoCountry,
      company: leads.company,
      status: leads.status,
      lang: leads.lang,
      volumeM2: leads.volumeM2,
      utmSource: leads.utmSource,
      telegramDelivered: leads.telegramDelivered,
      createdAt: leads.createdAt,
      assigneeName: adminUsers.name,
      itemCount: sql<number>`(select count(*)::int from ${leadItems} where ${leadItems.leadId} = ${leads.id})`,
    })
    .from(leads)
    .leftJoin(adminUsers, eq(adminUsers.id, leads.assigneeId))
    .where(where)
    .orderBy(desc(leads.createdAt), desc(leads.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ total }] = await db.select({ total: count() }).from(leads).where(where);
  return { rows, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getLead(db: Db, id: number) {
  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) return null;
  const items = await db.select().from(leadItems).where(eq(leadItems.leadId, id)).orderBy(leadItems.id);
  const activity = await db
    .select({
      id: leadActivity.id,
      kind: leadActivity.kind,
      body: leadActivity.body,
      fromValue: leadActivity.fromValue,
      toValue: leadActivity.toValue,
      createdAt: leadActivity.createdAt,
      userName: adminUsers.name,
    })
    .from(leadActivity)
    .leftJoin(adminUsers, eq(adminUsers.id, leadActivity.userId))
    .where(eq(leadActivity.leadId, id))
    .orderBy(desc(leadActivity.createdAt), desc(leadActivity.id));
  return { lead, items, activity };
}

export async function setLeadStatus(
  db: Db,
  leadId: number,
  userId: number,
  status: LeadStatus,
  lostReason?: string,
): Promise<boolean> {
  const [cur] = await db.select({ status: leads.status }).from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!cur || cur.status === status) return false;
  const reason = status === 'lost' ? lostReason?.trim() || null : null;
  await db.update(leads).set({ status, lostReason: reason, updatedAt: new Date() }).where(eq(leads.id, leadId));
  await db.insert(leadActivity).values({
    leadId,
    userId,
    kind: 'status',
    fromValue: cur.status,
    toValue: status,
    body: reason,
  });
  return true;
}

export async function assignLead(db: Db, leadId: number, userId: number, assigneeId: number | null): Promise<boolean> {
  const [cur] = await db.select({ assigneeId: leads.assigneeId }).from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!cur || cur.assigneeId === assigneeId) return false;
  const ids = [cur.assigneeId, assigneeId].filter((v): v is number => typeof v === 'number');
  const names = ids.length
    ? await db.select({ id: adminUsers.id, name: adminUsers.name }).from(adminUsers).where(inArray(adminUsers.id, ids))
    : [];
  const nameOf = (id: number | null) => (id == null ? null : names.find((n) => n.id === id)?.name ?? `#${id}`);
  await db.update(leads).set({ assigneeId, updatedAt: new Date() }).where(eq(leads.id, leadId));
  await db.insert(leadActivity).values({
    leadId,
    userId,
    kind: 'assign',
    fromValue: nameOf(cur.assigneeId),
    toValue: nameOf(assigneeId),
  });
  return true;
}

export async function addLeadNote(db: Db, leadId: number, userId: number, body: string): Promise<boolean> {
  const text = body.trim().slice(0, 4000);
  if (!text) return false;
  await db.insert(leadActivity).values({ leadId, userId, kind: 'note', body: text });
  await db.update(leads).set({ updatedAt: new Date() }).where(eq(leads.id, leadId));
  return true;
}

// --- Admin bosh sahifasi uchun statistika --------------------------------------

export async function leadStats(db: Db, now = new Date()) {
  const day = 24 * 60 * 60 * 1000;
  const since30 = new Date(now.getTime() - 30 * day);

  const byStatus = await db.select({ status: leads.status, n: count() }).from(leads).groupBy(leads.status);
  const [today] = await db.select({ n: count() }).from(leads).where(gte(leads.createdAt, new Date(now.getTime() - day)));
  const [week] = await db.select({ n: count() }).from(leads).where(gte(leads.createdAt, new Date(now.getTime() - 7 * day)));
  const [month] = await db.select({ n: count() }).from(leads).where(gte(leads.createdAt, since30));
  const [undelivered] = await db.select({ n: count() }).from(leads).where(eq(leads.telegramDelivered, false));

  const countryExpr = sql<string>`coalesce(nullif(${leads.country}, ''), ${leads.geoCountry}, '—')`;
  const byCountry = await db
    .select({ country: countryExpr, n: count() })
    .from(leads)
    .where(gte(leads.createdAt, since30))
    .groupBy(countryExpr)
    .orderBy(desc(count()))
    .limit(10);

  const sourceExpr = sql<string>`coalesce(nullif(${leads.utmSource}, ''), 'direct')`;
  const bySource = await db
    .select({ source: sourceExpr, n: count() })
    .from(leads)
    .where(gte(leads.createdAt, since30))
    .groupBy(sourceExpr)
    .orderBy(desc(count()))
    .limit(10);

  const topModels = await db
    .select({ slug: leadItems.slug, code: leadItems.code, name: sql<string>`max(${leadItems.name})`, n: count() })
    .from(leadItems)
    .innerJoin(leads, eq(leads.id, leadItems.leadId))
    .where(gte(leads.createdAt, since30))
    .groupBy(leadItems.slug, leadItems.code)
    .orderBy(desc(count()))
    .limit(10);

  const status = Object.fromEntries(byStatus.map((r) => [r.status, r.n])) as Partial<Record<LeadStatus, number>>;
  return {
    today: today.n,
    week: week.n,
    month: month.n,
    undelivered: undelivered.n,
    status,
    byCountry,
    bySource,
    topModels,
  };
}
