import {
  boolean,
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

/**
 * Baza sxemasi (Bosqich 7–8, docs/ROADMAP-2027.md §3).
 *
 * Ommaviy sayt bazani o'qimaydi — u statik qoladi. Baza faqat:
 *  - zayafkalarni saqlash (`/api/leads` avval shu yerga yozadi, keyin Telegram),
 *  - admin panel (kirish, sessiyalar, zayafka holatlari, izohlar),
 *  - serverless'da ishlaydigan rate limit uchun.
 *
 * O'zgartirishdan keyin: `npm run db:generate` (yangi migratsiya `drizzle/` ga).
 */

export const ADMIN_ROLES = ['admin', 'manager'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const LEAD_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_TYPES = ['quick', 'list', 'partners'] as const;
export const CLIENT_TYPES = ['workshop', 'dealer', 'builder', 'private'] as const;

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role', { enum: ADMIN_ROLES }).notNull().default('manager'),
  passwordHash: text('password_hash').notNull(),
  active: boolean('active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: createdAt(),
});

/** Sessiya tokenining o'zi saqlanmaydi — faqat sha256 xeshi (baza sizsa ham cookie qayta ishlatilmaydi). */
export const adminSessions = pgTable(
  'admin_sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('admin_sessions_user_idx').on(t.userId)],
);

/** Oy bo'yicha ketma-ket zayafka raqami: SPS-YYMM-NNNN (HANDOFF 5). */
export const leadCounters = pgTable('lead_counters', {
  period: text('period').primaryKey(),
  value: integer('value').notNull(),
});

export const leads = pgTable(
  'leads',
  {
    id: serial('id').primaryKey(),
    number: text('number').notNull().unique(),
    type: text('type', { enum: LEAD_TYPES }).notNull(),
    clientType: text('client_type', { enum: CLIENT_TYPES }),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    city: text('city'),
    country: text('country'),
    /** Vercel `x-vercel-ip-country` (ISO-2) — mijoz yozmasa ham davlat statistikasi uchun. */
    geoCountry: text('geo_country'),
    company: text('company'),
    volumeM2: real('volume_m2'),
    material: text('material'),
    message: text('message'),
    lang: text('lang').notNull(),
    pageUrl: text('page_url'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    gclid: text('gclid'),
    fbclid: text('fbclid'),
    status: text('status', { enum: LEAD_STATUSES }).notNull().default('new'),
    lostReason: text('lost_reason'),
    assigneeId: integer('assignee_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    telegramDelivered: boolean('telegram_delivered').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('leads_status_idx').on(t.status),
    index('leads_created_idx').on(t.createdAt),
    index('leads_assignee_idx').on(t.assigneeId),
  ],
);

export const leadItems = pgTable(
  'lead_items',
  {
    id: serial('id').primaryKey(),
    leadId: integer('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    code: text('code'),
    /** Zayafka paytidagi nom (katalog keyin o'zgarsa ham tarix saqlanadi). */
    name: text('name'),
    m2: real('m2'),
    molds: integer('molds'),
  },
  (t) => [index('lead_items_lead_idx').on(t.leadId), index('lead_items_slug_idx').on(t.slug)],
);

export const LEAD_ACTIVITY_KINDS = ['created', 'status', 'assign', 'note', 'telegram'] as const;

export const leadActivity = pgTable(
  'lead_activity',
  {
    id: serial('id').primaryKey(),
    leadId: integer('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    userId: integer('user_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    kind: text('kind', { enum: LEAD_ACTIVITY_KINDS }).notNull(),
    body: text('body'),
    fromValue: text('from_value'),
    toValue: text('to_value'),
    createdAt: createdAt(),
  },
  (t) => [index('lead_activity_lead_idx').on(t.leadId)],
);

export const rateHits = pgTable(
  'rate_hits',
  {
    id: serial('id').primaryKey(),
    key: text('key').notNull(),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('rate_hits_key_at_idx').on(t.key, t.at)],
);
