// Bosqich 10: o'z tashrif statistikamiz (src/server/visits.ts) — PGlite ustida.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
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
  ctx = { db, visits: await load('src/server/visits.ts'), leads: await load('src/server/leads.ts') };
  return ctx;
}

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';

test('1. User-agent: qurilma/brauzer/OS, botlar ajratiladi', async () => {
  const { visits } = await setup();
  assert.deepStrictEqual(visits.parseUserAgent(IPHONE), { device: 'mobile', browser: 'Safari', os: 'iOS' });
  assert.deepStrictEqual(visits.parseUserAgent(WIN), { device: 'desktop', browser: 'Chrome', os: 'Windows' });
  assert.ok(visits.isBot('Mozilla/5.0 (compatible; Googlebot/2.1)'));
  assert.ok(visits.isBot('Mozilla/5.0 (compatible; YandexBot/3.0)'));
  assert.ok(visits.isBot(''));
  assert.ok(!visits.isBot(WIN));
  assert.strictEqual(visits.modelSlugFromPath('/ru/catalog/paving/01-monako'), '01-monako');
  assert.strictEqual(visits.modelSlugFromPath('/ru/catalog/paving'), null);
  assert.strictEqual(visits.referrerHost('https://www.google.com/search?q=x'), 'google.com');
  assert.strictEqual(visits.referrerHost('https://sps.uz/uz', 'sps.uz'), null, 'ichki o\'tish manba emas');
});

test('2. Hisobot: tashrifchi/sessiya/ko\'rish, voronka, manba, davlat, model', async () => {
  const { db, visits, leads } = await setup();
  const now = new Date();
  const hit = (vid, sid, type, p, extra = {}) =>
    visits.recordVisit(db, { visitorId: vid, sessionId: sid, type, path: p, userAgent: IPHONE, ...extra }, now);
  await hit('vvvvvvvv1', 'ssssssss1', 'pageview', '/uz', { referrer: 'https://www.google.com/', country: 'UZ' });
  await hit('vvvvvvvv1', 'ssssssss1', 'pageview', '/uz/catalog/paving/01-monako', { country: 'UZ' });
  await hit('vvvvvvvv1', 'ssssssss1', 'add_to_request', '/uz/catalog/paving/01-monako', { item: '01-monako', country: 'UZ' });
  await hit('vvvvvvvv1', 'ssssssss1', 'generate_lead', '/uz/request', { country: 'UZ' });
  await hit('vvvvvvvv2', 'ssssssss2', 'pageview', '/ru', { utmSource: 'instagram', country: 'KZ' });
  await leads.createLead(db, { type: 'list', name: 'A', phone: '+998901234567', lang: 'uz', visitorId: 'vvvvvvvv1', sessionId: 'ssssssss1' });

  const o = await visits.visitOverview(db, 30);
  assert.strictEqual(o.visitors, 2);
  assert.strictEqual(o.sessions, 2);
  assert.strictEqual(o.pageviews, 3);
  assert.ok(o.online >= 2);
  assert.deepStrictEqual(o.funnel, { sessions: 2, viewedModel: 1, addedToRequest: 1, contacted: 0, lead: 1 });
  assert.deepStrictEqual(o.sources.map((s) => s.key).sort(), ['google.com', 'instagram']);
  assert.ok(o.countries.some((c) => c.key === 'KZ'));
  assert.strictEqual(o.models[0].key, '01-monako');
  assert.ok(o.langs.some((l) => l.key === 'ru'));
  assert.strictEqual(o.daily.length, 1);

  const recent = await visits.recentSessions(db);
  const s1 = recent.find((r) => r.sessionId === 'ssssssss1');
  assert.strictEqual(s1.pageviews, 2);
  assert.strictEqual(s1.source, 'google.com');
  assert.strictEqual(s1.entry, '/uz');
  assert.ok(s1.events.includes('add_to_request'));
  const leadMap = await visits.sessionsWithLeads(db, ['ssssssss1', 'ssssssss2']);
  assert.ok(leadMap.get('ssssssss1').number.startsWith('SPS-'));
  assert.ok(!leadMap.has('ssssssss2'));

  const journey = await visits.visitorJourney(db, { visitorId: 'vvvvvvvv1' });
  assert.deepStrictEqual(journey.map((j) => j.type), ['pageview', 'pageview', 'add_to_request', 'generate_lead']);
});

test('3. /api/track: bot va admin yo\'llari yozilmaydi, har doim 204, IP saqlanmaydi', () => {
  const route = fs.readFileSync(path.join(ROOT, 'src/app/api/track/route.ts'), 'utf8');
  assert.match(route, /isBot\(ua\)/);
  assert.match(route, /startsWith\('\/admin'\)/);
  assert.match(route, /status: 204/);
  const schema = fs.readFileSync(path.join(ROOT, 'src/server/db/schema.ts'), 'utf8');
  const visitsBlock = schema.slice(schema.indexOf("pgTable(\n  'visits'"), schema.indexOf("export const siteSettings"));
  assert.ok(!/\bip\b/i.test(visitsBlock.replace(/IP saqlanmaydi/g, '')), 'visits jadvalida IP ustuni bo\'lmasin');
  const tracker = fs.readFileSync(path.join(ROOT, 'src/lib/visitTracker.ts'), 'utf8');
  assert.ok(!/document\.cookie/.test(tracker), 'tracker cookie ishlatmasin');
});
