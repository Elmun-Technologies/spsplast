// Admin → SEO markazi, Matnlar (CMS), Analitika ulanishlari (2028).
// `src/server/*` PGlite (xotiradagi Postgres) ustida haqiqiy `drizzle/` migratsiyalari bilan;
// tashqi API'lar (Google, Yandex, IndexNow) soxta `fetch` bilan — tarmoq kerak emas.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

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
  const [auth, seo, content, secrets, settings, google, yandex, indexnow, liveMeta, overrides, texts, rules] = await Promise.all([
    load('src/server/auth.ts'),
    load('src/server/seoAdmin.ts'),
    load('src/server/content.ts'),
    load('src/server/secrets.ts'),
    load('src/server/settings.ts'),
    load('src/server/reports/google.ts'),
    load('src/server/reports/yandex.ts'),
    load('src/server/reports/indexnow.ts'),
    load('src/server/liveMeta.ts'),
    load('src/lib/seoOverrides.ts'),
    load('src/lib/textOverrides.ts'),
    load('src/server/copyRules.ts'),
  ]);
  const admin = await auth.createAdminUser(db, { email: 'seo@sps.uz', name: 'SEO', role: 'admin', password: 'parol-12345678' });
  ctx = { db, schema, seo, content, secrets, settings, google, yandex, indexnow, liveMeta, overrides, texts, rules, uid: admin.id };
  return ctx;
}

const emptyLangs = () => ({
  uz: { title: '', description: '', h1: '', intro: '' },
  ru: { title: '', description: '', h1: '', intro: '' },
  en: { title: '', description: '', h1: '', intro: '' },
});

test('1. Matn qoidalari: narx, "yaratish", HTML, [placeholder], noma\'lum token rad etiladi', async () => {
  const { rules } = await setup();
  const bad = [
    ['uz', "Qolip yaratildi"],
    ['ru', 'Цена: 120 000 сум'],
    ['ru', 'Всего 50 руб.'],
    ['en', 'Only $25 per mold'],
    ['uz', "Narxi 100 000 so'm"],
    ['en', '<script>alert(1)</script>'],
    ['ru', 'Срок [уточнить]'],
    ['en', 'We have {price} models'],
  ];
  for (const [lang, text] of bad) assert.ok(rules.copyError(text, lang, 500), `o'tib ketdi: ${lang} ${text}`);
  const good = [
    ['ru', 'Формы для тротуарной плитки 300×300 — {years} лет опыта, доставка в {countries} стран'],
    ['uz', "Toshkentda ishlab chiqarilgan qoliplar. Narxni menejer hisoblaydi."],
    ['en', 'Price on request — the manager calculates the mold count.'],
  ];
  for (const [lang, text] of good) assert.strictEqual(rules.copyError(text, lang, 500), null, `${lang}: ${text}`);
  assert.ok(rules.copyError('a'.repeat(80), 'en', 70));
});

test('2. SEO sahifasi: saqlash, noindex uch tilga, xato matn rad etiladi, standartga qaytish', async () => {
  const { db, seo, uid } = await setup();
  const input = emptyLangs();
  input.ru = { title: 'Формы для плитки в Казахстан', description: 'Пластиковые формы для тротуарной плитки с доставкой в Казахстан от завода в Ташкенте.', h1: 'Формы для плитки — Казахстан', intro: 'Алматы, Астана, Шымкент.' };
  const ok = await seo.saveSeoPage(db, uid, '/export/kazakhstan', input, true);
  assert.deepStrictEqual(ok, { ok: true });
  const rows = await seo.getSeoPage(db, '/export/kazakhstan');
  assert.strictEqual(rows.length, 3);
  assert.ok(rows.every((r) => r.noindex), 'noindex uch tilda');
  assert.strictEqual(rows.find((r) => r.lang === 'ru').title, 'Формы для плитки в Казахстан');
  assert.strictEqual(rows.find((r) => r.lang === 'uz').title, null);

  // Noma'lum sahifa, uzun title, "yaratish", H1 bosh sahifada — rad etiladi.
  assert.strictEqual((await seo.saveSeoPage(db, uid, '/no-such-page', emptyLangs(), false)).ok, false);
  const long = emptyLangs();
  long.en.title = 'x'.repeat(80);
  long.uz.description = "Yangi qoliplar yaratildi";
  const r = await seo.saveSeoPage(db, uid, '/catalog', long, false);
  assert.strictEqual(r.ok, false);
  assert.ok(r.errors['en.title'] && r.errors['uz.description']);
  const h1 = emptyLangs();
  h1.ru.h1 = 'Главная';
  assert.ok((await seo.saveSeoPage(db, uid, '', h1, false)).errors['ru.h1'], "bosh sahifa H1'i maket matni");

  // Hammasi bo'sh + noindex o'chiq → yozuv o'chadi.
  assert.deepStrictEqual(await seo.saveSeoPage(db, uid, '/export/kazakhstan', emptyLangs(), false), { ok: true });
  assert.strictEqual((await seo.getSeoPage(db, '/export/kazakhstan')).length, 0);
});

test('3. Saytda qo\'llanishi: seoOverrideFrom va noindex sitemap\'dan chiqaradi', async () => {
  const { overrides } = await setup();
  const rows = [
    { path: '/catalog/paving', lang: 'ru', title: 'Формы для тротуарной плитки', description: null, h1: 'Формы для тротуарной плитки', intro: null, noindex: false },
    { path: '/catalog/paving', lang: 'uz', title: null, description: null, h1: null, intro: null, noindex: false },
    { path: '/privacy', lang: 'en', title: null, description: null, h1: null, intro: null, noindex: true },
  ];
  const ru = overrides.seoOverrideFrom(rows, 'ru', '/catalog/paving');
  assert.strictEqual(ru.title, 'Формы для тротуарной плитки');
  assert.strictEqual(ru.description, undefined);
  assert.strictEqual(overrides.seoOverrideFrom(rows, 'uz', '/catalog/paving').h1, undefined);
  assert.strictEqual(overrides.seoOverrideFrom(rows, 'ru', '/privacy').noindex, true, 'noindex sahifa darajasida');
  assert.strictEqual(overrides.seoOverrideFrom(rows, 'ru', '/contact'), null);
  assert.deepStrictEqual([...overrides.noindexPathsFrom(rows)], ['/privacy']);

  // Sahifalar `pageMetadata` orqali qo'llaydi (har sahifada alohida kod shart emas).
  assert.match(read('src/lib/seo.ts'), /seoOverride\(lang, path\)/);
  assert.match(read('src/app/sitemap.ts'), /noindexPaths\(\)/);
  for (const f of ['src/app/[lang]/export/[country]/page.tsx', 'src/app/[lang]/catalog/[section]/tag/[tag]/page.tsx', 'src/app/[lang]/catalog/[section]/page.tsx']) {
    assert.match(read(f), /o\?\.h1 \|\|/, `${f}: admin H1`);
  }
});

test('4. 301 yo\'naltirishlar: tekshiruv, zanjir/aylanish, tizim yo\'llari, next.config formati', async () => {
  const { db, seo, uid } = await setup();
  const v = (s, d, ex = []) => seo.validateRedirect(s, d, ex);
  assert.deepStrictEqual(v('https://sps.uz/ru/old-page/?utm=1', '/ru/catalog'), { ok: true, source: '/ru/old-page', destination: '/ru/catalog' });
  assert.strictEqual(v('/ru/blog/*', '/ru').source, '/ru/blog/:path*');
  assert.strictEqual(v('/ru/a', 'https://spsplast.com/ru/b').ok, true);
  for (const [s, d] of [['/admin', '/ru'], ['/api/leads', '/ru'], ['/', '/ru'], ['/ru/a', '/ru/a'], ['ru/a', '/ru'], ['/ru/a', 'javascript:alert(1)'], ['/ru/a', '//evil.com'], ['/ru/:x', '/ru']]) {
    assert.strictEqual(v(s, d).ok, false, `${s} → ${d} o'tib ketdi`);
  }
  // Zanjir: a → b mavjud bo'lsa, b → c va c → a rad etiladi.
  assert.strictEqual(v('/ru/b', '/ru/c', [{ source: '/ru/a', destination: '/ru/b' }]).ok, false);
  assert.strictEqual(v('/ru/c', '/ru/a', [{ source: '/ru/a', destination: '/ru/b' }]).ok, false);

  const added = await seo.addRedirect(db, uid, '/ru/staraya', '/ru/catalog/paving', 'test');
  assert.strictEqual(added.ok, true);
  const list = await seo.listRedirects(db);
  assert.deepStrictEqual(seo.redirectsForConfig(list), [{ source: '/ru/staraya', destination: '/ru/catalog/paving', statusCode: 301 }]);
  await seo.deleteRedirect(db, uid, list[0].id);
  assert.strictEqual((await seo.listRedirects(db)).length, 0);

  // next.config: admin ro'yxati migratsiyadan oldin; git'dagi fayl bo'sh.
  assert.deepStrictEqual(JSON.parse(read('src/data/redirects.generated.json')), []);
  assert.match(read('next.config.js'), /\[canonicalHost, \.\.\.fromAdmin, \.\.\.migration\]/);
});

test('5. Matnlar (CMS): kalitlar lug\'atdan, saqlash/qaytarish, qoidalar, saytda qo\'llanishi', async () => {
  const { db, content, texts, uid } = await setup();
  const entries = content.contentEntries();
  assert.ok(entries.length > 400, `matnlar kam: ${entries.length}`);
  const h1 = entries.find((e) => e.key === 'pages.home.h1');
  assert.ok(h1 && h1.template && h1.values.uz.includes('{1}') && h1.values.ru && h1.values.en, 'H1 shabloni {1} bilan');
  assert.ok(entries.some((e) => e.key.startsWith('ui.header.')));
  assert.ok(entries.find((e) => e.key === 'pages.seo.geo.title')?.template, "geo sarlavhasi — shablon");
  assert.ok(!entries.some((e) => e.key === 'pages.seo.geo.faq'), "ro'yxat qaytaradigan funksiya — kod");
  assert.ok(entries.find((e) => e.key === 'pages.partners.title') ? true : entries.some((e) => e.key.startsWith('pages.partners.')));

  const r = await content.saveContent(db, uid, { 'pages.home.h1': { ru: 'Формы для плитки от завода — {1} моделей', uz: h1.values.uz } });
  assert.deepStrictEqual(r, { ok: true, changed: 1 });
  let rows = await content.listOverrides(db);
  assert.deepStrictEqual(rows.map((x) => [x.key, x.lang]), [['pages.home.h1', 'ru']], 'standart bilan bir xil uz saqlanmaydi');
  // Bo'sh qiymat — standartga qaytadi.
  assert.deepStrictEqual(await content.saveContent(db, uid, { 'pages.home.h1': { ru: '' } }), { ok: true, changed: 1 });
  rows = await content.listOverrides(db);
  assert.strictEqual(rows.length, 0);
  // Qoidalar va noma'lum kalit.
  const bad = await content.saveContent(db, uid, { 'pages.home.h1': { uz: 'Qolip yaratish' }, 'pages.nope.x': { ru: 'x' } });
  assert.strictEqual(bad.ok, false);
  assert.ok(bad.errors['pages.home.h1:uz'] && bad.errors['pages.nope.x']);

  // Sayt: override qo'llanadi, qolganlari va funksiyalar o'zgarmaydi.
  const dict = { home: { h1: 'A', list: ['x', 'y'], fn: (n) => `n=${n}`, keep: (n) => `k=${n}` }, other: 'B' };
  const out = texts.applyTextOverrides(dict, { 'pages.home.h1': 'A2', 'pages.home.list.1': 'y2', 'pages.home.fn': '{1} ta model' }, 'pages');
  assert.strictEqual(out.home.h1, 'A2');
  assert.deepStrictEqual(out.home.list, ['x', 'y2']);
  assert.strictEqual(out.home.fn(119), '119 ta model', 'shablon argument bilan');
  assert.strictEqual(out.home.keep(3), 'k=3');
  // {1} oddiy matnda — xato.
  assert.strictEqual((await content.saveContent(db, uid, { 'ui.header.cta': { ru: 'Заявка {1}' } })).ok, false);
  assert.strictEqual(out.other, 'B');
  assert.strictEqual(texts.applyTextOverrides(dict, { 'ui.x': 'z' }, 'pages'), dict, "boshqa nom maydoni — o'sha obyekt");
  assert.match(read('src/lib/pages.ts'), /applyTextOverrides\(raw\[l\], siteSnapshot\?\.texts\?\.\[l\], 'pages'\)/);
  assert.match(read('src/lib/ui.ts'), /applyTextOverrides\(ui\[l\], siteSnapshot\?\.texts\?\.\[l\], 'ui'\)/);
});

test('6. API kalitlari: alohida jadval, snapshot\'ga tushmaydi, formada qaytarilmaydi', async () => {
  const { db, secrets, uid } = await setup();
  const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const sa = JSON.stringify({ type: 'service_account', client_email: 'sps@proj.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) });
  const bad = await secrets.saveSecrets(db, uid, { google_service_account: '{"x":1}', gsc_property: 'spsplast.com' });
  assert.strictEqual(bad.ok, false);
  assert.ok(bad.errors.google_service_account && bad.errors.gsc_property);
  assert.deepStrictEqual(await secrets.saveSecrets(db, uid, { google_service_account: sa, gsc_property: 'sc-domain:spsplast.com', yandex_oauth_token: 'y0_AgAAAAABCDEFGHIJKLMNOPQRSTUV' }), { ok: true });
  const st = await secrets.secretStatus(db);
  assert.strictEqual(st.google_service_account.hint, 'sps@proj.iam.gserviceaccount.com');
  assert.strictEqual(st.yandex_oauth_token.hint, '…STUV', 'token ochiq ko\'rsatilmaydi');
  const cfg = await secrets.getReportConfig(db);
  assert.strictEqual(cfg.serviceAccount.client_email, 'sps@proj.iam.gserviceaccount.com');
  // Bo'sh maydon — o'zgarmaydi; clear — o'chiradi.
  await secrets.saveSecrets(db, uid, { yandex_oauth_token: '' });
  assert.ok((await secrets.getReportConfig(db)).yandexToken);
  await secrets.saveSecrets(db, uid, {}, ['yandex_oauth_token']);
  assert.strictEqual((await secrets.getReportConfig(db)).yandexToken, '');
  // Env ustun.
  process.env.GSC_PROPERTY = 'https://spsplast.com/';
  assert.strictEqual((await secrets.getReportConfig(db)).gscProperty, 'https://spsplast.com/');
  delete process.env.GSC_PROPERTY;

  // Snapshot (ommaviy JS) bu jadvalni hech qachon o'qimaydi; site_settings'da kalit yo'q.
  const snap = read('scripts/export-snapshot.mjs');
  assert.ok(!/integration_secrets/.test(snap.replace(/\/\/.*$/gm, '')), "export-snapshot integration_secrets'ni o'qimasligi kerak");
  for (const f of ['src/lib/integrations.ts']) assert.ok(!/oauth|service_account|private_key/i.test(read(f)), `${f}: kalit maydoni ommaviy sozlamalarda`);
});

test('7. Google: JWT (RS256) to\'g\'ri imzolanadi; Search Console va GA4 javobi o\'qiladi', async () => {
  const { google } = await setup();
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const sa = { client_email: 'sps@proj.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) };
  const jwt = google.signJwt(sa, [google.SCOPES.webmasters], 1_700_000_000);
  const [h, c, sig] = jwt.split('.');
  const ok = crypto.createVerify('RSA-SHA256').update(`${h}.${c}`).verify(publicKey, Buffer.from(sig, 'base64url'));
  assert.ok(ok, 'imzo tekshiruvdan o\'tmadi');
  const claims = JSON.parse(Buffer.from(c, 'base64url').toString());
  assert.deepStrictEqual([claims.iss, claims.aud, claims.exp - claims.iat], [sa.client_email, 'https://oauth2.googleapis.com/token', 3600]);

  const calls = [];
  const fake = async (url, init = {}) => {
    calls.push({ url, body: init.body ? String(init.body) : '' });
    const json = (o) => new Response(JSON.stringify(o), { status: 200 });
    if (url.includes('oauth2.googleapis.com')) return json({ access_token: 'tok', expires_in: 3600 });
    if (url.includes('searchAnalytics')) {
      const dims = JSON.parse(init.body).dimensions?.[0];
      if (!dims) return json({ rows: [{ clicks: 12, impressions: 340, ctr: 0.035, position: 8.4 }] });
      if (dims === 'query') return json({ rows: [{ keys: ['формы для тротуарной плитки'], clicks: 9, impressions: 200, ctr: 0.045, position: 2.7 }] });
      return json({ rows: [] });
    }
    if (url.includes('runReport')) return json({ rows: [{ dimensionValues: [{ value: '20261101' }], metricValues: [{ value: '5' }, { value: '4' }, { value: '1' }, { value: '0.6' }] }] });
    return new Response('nope', { status: 404 });
  };
  const gsc = await google.gscReport(sa, 'sc-domain:spsplast.com', 28, fake);
  assert.deepStrictEqual(gsc.totals, { clicks: 12, impressions: 340, ctr: 0.035, position: 8.4 });
  assert.strictEqual(gsc.queries[0].key, 'формы для тротуарной плитки');
  assert.ok(calls.some((x) => x.url.includes('sites/sc-domain%3Aspsplast.com/searchAnalytics')), 'mulk URL-kodlangan');
  const ga = await google.ga4Report(sa, '412345678', 28, fake);
  assert.strictEqual(ga.totals.sessions, 5);
  assert.deepStrictEqual(ga.daily[0], { day: '2026-11-01', value: 5 });

  // Xato javob tushunarli matnga aylanadi.
  const err = async () => new Response(JSON.stringify({ error: { message: 'User does not have sufficient permission' } }), { status: 403 });
  await assert.rejects(google.gscSubmitSitemap({ ...sa, client_email: 'other@p.iam.gserviceaccount.com' }, 'sc-domain:x.com', 'https://x.com/sitemap.xml', err), /HTTP 403: User does not have sufficient permission/);
});

test('8. Yandex: Metrica va Webmaster javoblari, sayt hostini topish', async () => {
  const { yandex } = await setup();
  const fake = async (url, init = {}) => {
    assert.match(init.headers.authorization, /^OAuth /);
    const json = (o) => new Response(JSON.stringify(o), { status: 200 });
    if (url.includes('/goals')) return json({ goals: [{ id: 77, name: 'Zayafka' }] });
    if (url.includes('stat/v1/data')) {
      const q = new URL(url).searchParams;
      if (q.get('metrics').includes('goal77')) return json({ totals: [3, 1.5] });
      if (!q.get('dimensions')) return json({ totals: [120, 90, 300, 21.5, 95] });
      return json({ data: [{ dimensions: [{ name: 'Казахстан' }], metrics: [40, 30] }] });
    }
    if (url.endsWith('/v4/user')) return json({ user_id: 5 });
    if (url.endsWith('/user/5/hosts')) return json({ hosts: [{ host_id: 'https:spsplast.com:443', ascii_host_url: 'https://spsplast.com/', verified: true }] });
    if (url.includes('/summary')) return json({ sqi: 10, searchable_pages_count: 400, excluded_pages_count: 12, site_problems: { FATAL: 0 } });
    if (url.includes('search-queries/popular')) return json({ queries: [{ query_text: 'формы для плитки', indicators: { TOTAL_SHOWS: 50, TOTAL_CLICKS: 4, AVG_SHOW_POSITION: 3.2 } }] });
    return new Response('{}', { status: 404 });
  };
  const m = await yandex.metricaReport('y0_token', '99999', 7, fake);
  assert.deepStrictEqual(m.totals, { visits: 120, users: 90, pageviews: 300, bounceRate: 21.5, avgDuration: 95 });
  assert.strictEqual(m.countries[0].key, 'Казахстан');
  assert.deepStrictEqual(m.goals, [{ id: 77, name: 'Zayafka', reaches: 3, conversion: 1.5 }]);
  const wm = await yandex.webmasterReport('y0_token', 'https://www.spsplast.com', 7, fake);
  assert.strictEqual(wm.host.hostId, 'https:spsplast.com:443');
  assert.strictEqual(wm.summary.searchable, 400);
  assert.deepStrictEqual(wm.queries[0], { query: 'формы для плитки', shows: 50, clicks: 4, position: 3.2 });
  await assert.rejects(yandex.webmasterHost('y0_token', 'https://boshqa-sayt.uz', fake), /topilmadi/);
});

test('9. IndexNow: kalit fayli, yuboriladigan ro\'yxat faqat shu host', async () => {
  const { indexnow } = await setup();
  const p = indexnow.indexNowPayload('https://spsplast.com', 'abc12345', ['https://spsplast.com/ru', 'https://evil.com/x', 'bad']);
  assert.deepStrictEqual(p, { host: 'spsplast.com', key: 'abc12345', keyLocation: 'https://spsplast.com/indexnow-key.txt', urlList: ['https://spsplast.com/ru'] });
  const sent = [];
  const res = await indexnow.submitIndexNow('https://spsplast.com', 'abc12345', ['https://spsplast.com/ru'], async (url, init) => {
    sent.push(url);
    assert.strictEqual(JSON.parse(init.body).key, 'abc12345');
    return new Response('', { status: url.includes('yandex') ? 202 : 200 });
  });
  assert.ok(res.every((r) => r.ok));
  assert.deepStrictEqual(sent.sort(), ['https://api.indexnow.org/indexnow', 'https://yandex.com/indexnow']);
  const route = read('src/app/indexnow-key.txt/route.ts');
  assert.match(route, /integrationValue\('indexnow_key'\)/);
  assert.match(route, /force-static/);
});

test('10. "Nashr qilish": SEO, 301 va matn o\'zgarishlari sanaladi (o\'chirish ham)', async () => {
  const { db, seo, content, settings, uid, schema } = await setup();
  await db.insert(schema.publishes).values({ userId: uid, status: 'ok', message: 't', createdAt: new Date(Date.now() - 60_000) });
  const before = await settings.pendingChanges(db);
  const input = emptyLangs();
  input.en.title = 'Paving tile molds 300×300';
  await seo.saveSeoPage(db, uid, '/catalog/paving/tag/300x300', input, false);
  await seo.addRedirect(db, uid, '/en/old', '/en/catalog', '');
  await content.saveContent(db, uid, { 'ui.header.cta': { en: 'Send a request' } });
  const after = await settings.pendingChanges(db);
  assert.strictEqual(after.seo - before.seo, 3);
  assert.strictEqual(after.redirects - before.redirects, 1);
  assert.strictEqual(after.texts - before.texts, 1);
  const s0 = after.settings;
  const [r] = await seo.listRedirects(db);
  await seo.deleteRedirect(db, uid, r.id);
  assert.ok((await settings.pendingChanges(db)).settings > s0 - 1, "o'chirish ham o'zgarish sifatida qayd etiladi");
  assert.match(read('src/app/admin/PublishBar.tsx'), /pending\.seo \+ pending\.redirects \+ pending\.texts/);
});

test('11. Saytdagi joriy meta o\'qiladi (HTML parser)', async () => {
  const { liveMeta } = await setup();
  const html = '<html><head><title>Формы &amp; плитка · SPS Plast</title><meta name="description" content="Описание &quot;SPS&quot;"/></head><body><h1 class="h1">Формы <span>для</span> плитки</h1></body></html>';
  assert.deepStrictEqual(liveMeta.parseMeta(html), { title: 'Формы & плитка · SPS Plast', description: 'Описание "SPS"', h1: 'Формы для плитки' });
});

test('12. Admin menyusi va sahifalar: SEO, Matnlar, Analitika', () => {
  const shell = read('src/app/admin/AdminShell.tsx');
  for (const href of ['/admin/seo', '/admin/content', '/admin/analytics']) assert.ok(shell.includes(`'${href}'`), `menyuda yo'q: ${href}`);
  for (const f of ['src/app/admin/seo/page.tsx', 'src/app/admin/seo/edit/page.tsx', 'src/app/admin/content/page.tsx']) {
    assert.match(read(f), /requireUser\('admin'\)/, `${f}: faqat administrator`);
  }
  // Mijoz komponentiga funksiya (validate) uzatilmaydi.
  assert.match(read('src/app/admin/analytics/page.tsx'), /SECRET_FIELDS\.map\(\(\{ key, label, env, secret, multiline, placeholder, help \}\)/);
});

test('13. Vercel build: migratsiya build oldidan, Preview va bazasiz holatda o\'tkazib yuboriladi', async () => {
  const { spawnSync } = require('node:child_process');
  const vercel = JSON.parse(read('vercel.json'));
  assert.strictEqual(vercel.buildCommand, 'npm run db:migrate:deploy && npm run build', 'migratsiya buildʼdan oldin');
  const pkg = JSON.parse(read('package.json'));
  assert.strictEqual(pkg.scripts['db:migrate:deploy'], 'node scripts/db-migrate.mjs --deploy');
  const run = (env) => {
    const clean = { ...process.env };
    delete clean.DATABASE_URL;
    delete clean.VERCEL_ENV;
    delete clean.MIGRATE_PREVIEW;
    return spawnSync(process.execPath, [path.join(ROOT, 'scripts/db-migrate.mjs'), '--deploy'], { env: { ...clean, ...env }, encoding: 'utf8', timeout: 20000 });
  };
  const noUrl = run({ VERCEL_ENV: 'production' });
  assert.strictEqual(noUrl.status, 0, noUrl.stderr);
  assert.match(noUrl.stdout, /o'tkazib yuborildi/);
  const preview = run({ VERCEL_ENV: 'preview', DATABASE_URL: 'postgres://x@127.0.0.1:1/x' });
  assert.strictEqual(preview.status, 0, preview.stderr);
  assert.match(preview.stdout, /MIGRATE_PREVIEW=1/);
  // Oddiy `db:migrate` (qo'lda) — manzilsiz xato beradi, jim o'tib ketmaydi.
  const manual = spawnSync(process.execPath, [path.join(ROOT, 'scripts/db-migrate.mjs')], { env: { PATH: process.env.PATH }, encoding: 'utf8' });
  assert.strictEqual(manual.status, 1);
});
