import {
  bigserial,
  boolean,
  customType,
  index,
  jsonb,
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

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => 'bytea',
});

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
    /** Sayt tashrifi bilan bog'lash (visits jadvali): mijoz zayafkadan oldin nimalarni ko'rgan. */
    visitorId: text('visitor_id'),
    sessionId: text('session_id'),
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

/**
 * O'z tashrif statistikamiz (Bosqich 10): sahifa ko'rish va voqealar.
 * IP saqlanmaydi; tashrifchi — localStorage'dagi tasodifiy ID, sessiya — 30 daqiqa.
 */
export const visits = pgTable(
  'visits',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    visitorId: text('visitor_id').notNull(),
    sessionId: text('session_id').notNull(),
    /** 'pageview' yoki voqea nomi: add_to_request, add_to_compare, generate_lead, search, contact_click … */
    type: text('type').notNull(),
    path: text('path').notNull(),
    /** Model sahifasi yoki voqea obyekti (slug). */
    item: text('item'),
    detail: text('detail'),
    referrerHost: text('referrer_host'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    country: text('country'),
    city: text('city'),
    device: text('device'),
    browser: text('browser'),
    os: text('os'),
    lang: text('lang'),
    createdAt: createdAt(),
  },
  (t) => [
    index('visits_created_idx').on(t.createdAt),
    index('visits_session_idx').on(t.sessionId),
    index('visits_visitor_idx').on(t.visitorId),
  ],
);

/** Admin'dan boshqariladigan sozlamalar (integratsiyalar, verifikatsiya kodlari). */
export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: integer('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
});

// --- Katalog (Bosqich 9): admin'dan boshqariladi, sayt "Nashr qilish" bilan yig'iladi ---

export type LocalizedText = { uz: string | null; ru: string | null; en: string | null };

export const PRODUCT_STATUSES = ['published', 'draft', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const catalogSections = pgTable('catalog_sections', {
  /** Ichki kalit (trotuar, fasad, termopanel …) — mahsulot shu bilan bog'lanadi. */
  key: text('key').primaryKey(),
  /** URL: /{lang}/catalog/{slug} */
  slug: text('slug').notNull().unique(),
  name: jsonb('name').$type<LocalizedText>().notNull(),
  sort: integer('sort').notNull().default(0),
  visible: boolean('visible').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ProductMold = { l: string; size: string | null; depth: string | null; g: number | null };
export type ProductTile = { l: string; size: string | null; per: string | null };
export type ProductSpec = { k: LocalizedText; v: LocalizedText };
export type ProductImages = {
  scene: string | null;
  sceneSm: string | null;
  molds: Record<string, string>;
  tiles: Record<string, string>;
};

export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    key: text('key').notNull(),
    code: text('code'),
    section: text('section')
      .notNull()
      .references(() => catalogSections.key, { onUpdate: 'cascade' }),
    status: text('status', { enum: PRODUCT_STATUSES }).notNull().default('draft'),
    /** "Ko'p so'raladigan" tartibi: kichik — oldinda. */
    sort: integer('sort').notNull().default(1000),
    name: jsonb('name').$type<LocalizedText>().notNull(),
    subtitle: jsonb('subtitle').$type<LocalizedText>().notNull(),
    note: jsonb('note').$type<LocalizedText | null>(),
    kg: text('kg'),
    molds: jsonb('molds').$type<ProductMold[]>().notNull().default([]),
    tiles: jsonb('tiles').$type<ProductTile[]>().notNull().default([]),
    specs: jsonb('specs').$type<ProductSpec[]>().notNull().default([]),
    sizeEstimated: boolean('size_estimated').notNull().default(false),
    images: jsonb('images').$type<ProductImages>().notNull(),
    createdAt: createdAt(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('products_section_idx').on(t.section), index('products_status_idx').on(t.status)],
);

/** Admin'dan yuklangan rasmlar (WebP). `/media/{id}.webp` orqali uzoq kesh bilan beriladi. */
export const media = pgTable('media', {
  id: text('id').primaryKey(),
  mime: text('mime').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  bytes: integer('bytes').notNull(),
  data: bytea('data').notNull(),
  originalName: text('original_name'),
  createdAt: createdAt(),
  createdBy: integer('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
});

/** Nashrlar tarixi: kim, qachon saytni qayta yig'dirdi. */
export const publishes = pgTable('publishes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => adminUsers.id, { onDelete: 'set null' }),
  status: text('status').notNull(),
  message: text('message'),
  createdAt: createdAt(),
});
