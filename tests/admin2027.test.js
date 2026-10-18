// Bosqich 7–8: zayafkalarni saqlash va admin panel (docs/ROADMAP-2027.md).
// Haqiqiy `src/server/*` kodi PGlite (xotiradagi Postgres) ustida, haqiqiy
// `drizzle/` migratsiyalari bilan sinaladi — tashqi baza kerak emas.
// `src/server` nisbiy `.ts` importlardan foydalanadi, shuning uchun to'g'ridan-
// to'g'ri yuklanadi (load-alias'ning umumiy `.tmp-tests` papkasi boshqa test
// fayllari tomonidan parallel tozalanadi).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let ctx;
async function setup() {
  if (ctx) return ctx;
  const { pathToFileURL } = await import('node:url');
  const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  const schema = await load('src/server/db/schema.ts');
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder: path.join(ROOT, 'drizzle') });
  const leads = await load('src/server/leads.ts');
  const auth = await load('src/server/auth.ts');
  ctx = { db, leads, auth, schema };
  return ctx;
}

test('1. Zayafka raqami oy bo\'yicha ketma-ket: SPS-YYMM-0001, 0002; yangi oy — 0001', async () => {
  const { db, leads } = await setup();
  const oct = new Date('2026-10-18T10:00:00Z');
  const a = await leads.createLead(db, { type: 'quick', name: 'Aziz', phone: '+998901234567', lang: 'uz' }, oct);
  const b = await leads.createLead(db, { type: 'quick', name: 'Bobur', phone: '+998901234568', lang: 'ru' }, oct);
  assert.strictEqual(a.number, 'SPS-2610-0001');
  assert.strictEqual(b.number, 'SPS-2610-0002');
  // 31-oktabr 20:00 UTC = 1-noyabr 01:00 Toshkent → noyabr hisoblagichi.
  const nov = await leads.createLead(
    db,
    { type: 'quick', name: 'Dilshod', phone: '+77011234567', lang: 'ru' },
    new Date('2026-10-31T20:00:00Z'),
  );
  assert.strictEqual(nov.number, 'SPS-2611-0001');
});

test('2. Parallel zayafkalar bir xil raqam olmaydi', async () => {
  const { db, leads } = await setup();
  const now = new Date('2026-12-01T08:00:00Z');
  const res = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      leads.createLead(db, { type: 'quick', name: `M${i}`, phone: '+998901111111', lang: 'uz' }, now),
    ),
  );
  assert.strictEqual(new Set(res.map((r) => r.number)).size, 8);
});

test('3. Modellar, izoh va "created" faoliyati saqlanadi', async () => {
  const { db, leads } = await setup();
  const { id } = await leads.createLead(db, {
    type: 'list',
    clientType: 'dealer',
    name: 'Karimov',
    phone: '+992901234567',
    country: 'Tojikiston',
    geoCountry: 'TJ',
    lang: 'ru',
    utm_source: 'google',
    items: [
      { slug: '01-monako', code: '01', name: 'Monako', m2: 100, molds: 1100 },
      { slug: 'f17-pilyastr-3', code: 'F17', name: 'Pilyastr 3' },
    ],
  });
  const full = await leads.getLead(db, id);
  assert.strictEqual(full.lead.status, 'new');
  assert.strictEqual(full.lead.telegramDelivered, false);
  assert.strictEqual(full.items.length, 2);
  assert.strictEqual(full.items[0].molds, 1100);
  assert.deepStrictEqual(full.activity.map((a) => a.kind), ['created']);

  await leads.markTelegram(db, id, false);
  const after = await leads.getLead(db, id);
  assert.ok(after.activity.some((a) => a.kind === 'telegram'), 'yetkazilmagan Telegram faoliyatda ko\'rinmaydi');
});

test('4. Holat, mas\'ul va izoh o\'zgarishlari tarixga yoziladi', async () => {
  const { db, leads, auth } = await setup();
  const mgr = await auth.createAdminUser(db, { email: 'Manager@SPS.uz ', name: 'Menejer', role: 'manager', password: 'uzun-parol-123' });
  const { id } = await leads.createLead(db, { type: 'quick', name: 'Test', phone: '+998901234500', lang: 'uz' });

  assert.strictEqual(await leads.setLeadStatus(db, id, mgr.id, 'contacted'), true);
  assert.strictEqual(await leads.setLeadStatus(db, id, mgr.id, 'contacted'), false, 'bir xil holat qayta yozilmasin');
  assert.strictEqual(await leads.setLeadStatus(db, id, mgr.id, 'lost', 'Narx qimmat'), true);
  assert.strictEqual(await leads.assignLead(db, id, mgr.id, mgr.id), true);
  assert.strictEqual(await leads.addLeadNote(db, id, mgr.id, '   '), false, 'bo\'sh izoh yozilmasin');
  assert.strictEqual(await leads.addLeadNote(db, id, mgr.id, 'Qayta qo\'ng\'iroq ertaga'), true);

  const full = await leads.getLead(db, id);
  assert.strictEqual(full.lead.status, 'lost');
  assert.strictEqual(full.lead.lostReason, 'Narx qimmat');
  assert.strictEqual(full.lead.assigneeId, mgr.id);
  const kinds = full.activity.map((a) => a.kind).sort();
  assert.deepStrictEqual(kinds, ['assign', 'created', 'note', 'status', 'status']);
  const assign = full.activity.find((a) => a.kind === 'assign');
  assert.strictEqual(assign.toValue, 'Menejer');
  assert.strictEqual(assign.userName, 'Menejer');
});

test('5. Ro\'yxat filtrlari: holat, qidiruv (ism, raqam, telefon raqamlari), sahifalash', async () => {
  const { db, leads } = await setup();
  await leads.createLead(db, { type: 'partners', name: 'Nurlan Distrib', phone: '+7 701 555 44 33', company: 'KZ Beton', lang: 'ru' });
  const byName = await leads.listLeads(db, { q: 'nurlan' });
  assert.strictEqual(byName.total, 1);
  const byPhone = await leads.listLeads(db, { q: '5554433' });
  assert.strictEqual(byPhone.total, 1, 'telefon raqami bo\'shliqlarsiz topilmaydi');
  const byCompany = await leads.listLeads(db, { q: 'kz beton' });
  assert.strictEqual(byCompany.rows[0].name, 'Nurlan Distrib');
  const lost = await leads.listLeads(db, { status: 'lost' });
  assert.ok(lost.rows.every((r) => r.status === 'lost') && lost.total >= 1);
  const partners = await leads.listLeads(db, { type: 'partners' });
  assert.strictEqual(partners.total, 1);
  const page = await leads.listLeads(db, { pageSize: 2, page: 2 });
  assert.strictEqual(page.rows.length, 2);
  assert.ok(page.pages >= 3);
  // SQL wildcard'lar matn sifatida qidiriladi
  assert.strictEqual((await leads.listLeads(db, { q: '%' })).total, 0);
});

test('6. Statistika: davr, holat, davlat (yozilmasa geo), manba, top modellar', async () => {
  const { db, leads } = await setup();
  const s = await leads.leadStats(db);
  assert.ok(s.month >= s.week && s.week >= s.today);
  assert.ok(s.undelivered >= 1);
  assert.ok(s.status.new >= 1 && s.status.lost >= 1);
  assert.ok(s.byCountry.some((c) => c.country === 'Tojikiston'));
  assert.ok(s.bySource.some((c) => c.source === 'google'));
  assert.ok(s.topModels.some((m) => m.slug === '01-monako'));
});

test('7. Rate limit bazada: oynada max ta, keyin rad; oyna o\'tgach yana ruxsat', async () => {
  const { db, leads } = await setup();
  const t0 = new Date('2026-10-18T10:00:00Z');
  const res = [];
  for (let i = 0; i < 4; i += 1) res.push(await leads.hitRateLimit(db, 'lead_1.2.3.4', 3, 60_000, t0));
  assert.deepStrictEqual(res, [true, true, true, false]);
  assert.strictEqual(await leads.hitRateLimit(db, 'lead_5.6.7.8', 3, 60_000, t0), true, 'boshqa IP bloklanmasin');
  assert.strictEqual(await leads.hitRateLimit(db, 'lead_1.2.3.4', 3, 60_000, new Date(t0.getTime() + 61_000)), true);
});

test('8. Parol: scrypt xesh, to\'g\'ri/xato parol, qisqa parol rad', async () => {
  const { auth, db } = await setup();
  const h = await auth.hashPassword('maxfiy-parol-1');
  assert.match(h, /^scrypt\$16384\$/);
  assert.ok(!h.includes('maxfiy'), 'parol ochiq saqlanmoqda');
  assert.strictEqual(await auth.verifyPassword('maxfiy-parol-1', h), true);
  assert.strictEqual(await auth.verifyPassword('maxfiy-parol-2', h), false);
  assert.strictEqual(await auth.verifyPassword('x', 'buzilgan'), false);
  await assert.rejects(auth.createAdminUser(db, { email: 'a@b.uz', name: 'A', role: 'admin', password: 'qisqa' }));
});

test('9. Login va sessiya: e-pochta registrsiz, muddati, faolsizlantirish, parol almashishi', async () => {
  const { auth, db } = await setup();
  const { id } = await auth.createAdminUser(db, { email: 'boss@sps.uz', name: 'Rahbar', role: 'admin', password: 'kuchli-parol-2026' });

  assert.strictEqual(await auth.authenticate(db, 'boss@sps.uz', 'noto\'g\'ri-parol'), null);
  assert.strictEqual(await auth.authenticate(db, 'yoq@sps.uz', 'kuchli-parol-2026'), null);
  const user = await auth.authenticate(db, '  BOSS@sps.uz', 'kuchli-parol-2026');
  assert.deepStrictEqual(user, { id, email: 'boss@sps.uz', name: 'Rahbar', role: 'admin' });

  const now = new Date();
  const { token } = await auth.createSession(db, id, now);
  const [stored] = await db.select().from(ctx.schema.adminSessions);
  assert.notStrictEqual(stored.tokenHash, token, 'token bazada ochiq saqlanmoqda');
  assert.strictEqual((await auth.getSessionUser(db, token, now)).id, id);
  assert.strictEqual(await auth.getSessionUser(db, 'soxta-token', now), null);
  assert.strictEqual(await auth.getSessionUser(db, token, new Date(now.getTime() + auth.SESSION_TTL_MS + 1)), null);

  await auth.setUserActive(db, id, false);
  assert.strictEqual(await auth.getSessionUser(db, token, now), null, 'faolsiz foydalanuvchi kira olmasin');
  assert.strictEqual(await auth.authenticate(db, 'boss@sps.uz', 'kuchli-parol-2026'), null);
  await auth.setUserActive(db, id, true);

  const s2 = await auth.createSession(db, id);
  await auth.setUserPassword(db, id, 'yangi-kuchli-parol');
  assert.strictEqual(await auth.getSessionUser(db, s2.token), null, 'parol almashganda eski sessiyalar yopilmadi');
  const s3 = await auth.createSession(db, id);
  await auth.deleteSession(db, s3.token);
  assert.strictEqual(await auth.getSessionUser(db, s3.token), null);
});

test('10. /api/leads: avval bazaga, keyin Telegram; baza yo\'q bo\'lsa ham ishlaydi', () => {
  const route = read('src/app/api/leads/route.ts');
  const save = route.indexOf('createLead(');
  const send = route.indexOf('sendTelegramNotification(');
  assert.ok(save > 0 && send > save, 'zayafka Telegramdan oldin saqlanishi kerak');
  assert.match(route, /markTelegram\(/, 'Telegram natijasi bazaga yozilmaydi');
  assert.match(route, /getDb\(\)/);
  assert.match(route, /hitRateLimit\(/, 'serverless rate limit ishlatilmaydi');
});

test('11. Admin: noindex, robots yopiq, analitika skriptlari admin sahifalarida yo\'q', () => {
  const layout = read('src/app/admin/layout.tsx');
  assert.match(layout, /index:\s*false/, 'admin noindex emas');
  assert.match(read('src/app/robots.ts'), /'\/admin'/, 'robots.txt /admin ni yopmaydi');
  assert.match(read('src/components/analytics/AnalyticsScripts.tsx'), /startsWith\('\/admin'\)/);
});

test('12. Admin sahifalari sessiyani tekshiradi (login sahifasidan tashqari)', () => {
  const dir = path.join(ROOT, 'src/app/admin');
  const offenders = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === 'page.tsx' || e.name === 'route.ts') {
        const rel = path.relative(dir, full);
        if (rel.startsWith('login')) continue;
        if (!/requireUser\(/.test(fs.readFileSync(full, 'utf8'))) offenders.push(rel);
      }
    }
  };
  walk(dir);
  assert.deepStrictEqual(offenders, []);
  for (const file of ['src/app/admin/actions.ts', 'src/app/admin/products/actions.ts']) {
    const actions = read(file);
    const exported = actions.match(/export async function \w+/g) || [];
    const guarded = actions.match(/export async function \w+[\s\S]*?\n}/g).filter((fn) => /requireUser\(|loginAction|logoutAction/.test(fn));
    assert.strictEqual(guarded.length, exported.length, `${file}: har bir server action requireUser() chaqirishi kerak`);
  }
  // Bo'lim, o'chirish va integratsiyalar — faqat administrator.
  assert.match(read('src/app/admin/products/actions.ts'), /deleteProductAction[\s\S]*?requireUser\('admin'\)/);
  assert.match(read('src/app/admin/actions.ts'), /saveIntegrationsAction[\s\S]*?requireUser\('admin'\)/);
});

test('13. Login limiti faqat xato urinishlarni sanaydi', async () => {
  const { db, leads } = await setup();
  const now = new Date();
  assert.strictEqual(await leads.recentHits(db, 'login_9.9.9.9', 60_000, now), 0);
  await leads.recordHit(db, 'login_9.9.9.9', now);
  await leads.recordHit(db, 'login_9.9.9.9', now);
  assert.strictEqual(await leads.recentHits(db, 'login_9.9.9.9', 60_000, now), 2);
  assert.strictEqual(await leads.recentHits(db, 'login_9.9.9.9', 60_000, new Date(now.getTime() + 61_000)), 0);
  assert.match(read('src/app/admin/actions.ts'), /if \(!user\) \{\s*await recordHit/);
});
