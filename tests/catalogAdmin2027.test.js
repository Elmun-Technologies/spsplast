// Bosqich 9: katalog admini, rasm yuklash, integratsiyalar va nashr (PGlite ustida).
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
  const auth = await load('src/server/auth.ts');
  const user = await auth.createAdminUser(db, { email: 'a@sps.uz', name: 'Admin', role: 'admin', password: 'uzun-parol-123' });
  ctx = {
    db,
    schema,
    user,
    catalog: await load('src/server/catalog.ts'),
    media: await load('src/server/media.ts'),
    settings: await load('src/server/settings.ts'),
  };
  return ctx;
}

const models = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/models-2027.json'), 'utf8')).models;
const termo = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/termopanel-2027.json'), 'utf8')).items;

test('1. Import: hozirgi katalog nashrda (tartib saqlanadi), termopanellar qoralama; takror import xavfsiz', async () => {
  const { db, catalog } = await setup();
  const res = await catalog.importCatalog(db, models, termo);
  assert.strictEqual(res.added, models.length + termo.length);
  assert.ok(res.sections >= 7);
  const again = await catalog.importCatalog(db, models, termo);
  assert.strictEqual(again.added, 0);
  const counts = await catalog.productStatusCounts(db);
  assert.strictEqual(counts.published, models.length);
  assert.strictEqual(counts.draft, termo.length);
  const all = await catalog.listProducts(db, { status: 'published' });
  assert.deepStrictEqual(all.slice(0, 3).map((p) => p.slug), models.slice(0, 3).map((m) => m.slug), '"ko\'p so\'raladigan" tartibi buzildi');
  const sections = await catalog.listSections(db);
  const tp = sections.find((s) => s.key === 'termopanel');
  assert.ok(tp && tp.total > 0 && tp.published === 0);
});

test('2. Filtrlar: rasmsiz, ruscha nomsiz, qidiruv (kod/nom), bo\'lim', async () => {
  const { db, catalog } = await setup();
  const noImg = await catalog.listProducts(db, { missing: 'image', status: 'published' });
  const expected = models.filter((m) => !(m.images.scene || m.images.sceneSm || Object.keys(m.images.molds).length || Object.keys(m.images.tiles).length));
  assert.strictEqual(noImg.length, expected.length);
  assert.strictEqual((await catalog.listProducts(db, { q: 'monako' }))[0].code, '01');
  assert.strictEqual((await catalog.listProducts(db, { q: 'TP-001' }))[0].section, 'termopanel');
  assert.ok((await catalog.listProducts(db, { section: 'fasad_dekor' })).every((p) => p.section === 'fasad_dekor'));
  assert.ok((await catalog.listProducts(db, { missing: 'ru' })).length > 0);
});

test('3. To\'liqlik: rasm — kritik, tarjima/o\'lcham — ogohlantirish', async () => {
  const { catalog } = await setup();
  const withImg = models.find((m) => m.images.scene);
  const c = catalog.completeness(withImg);
  assert.ok(c.publishable);
  assert.ok(c.checks.find((x) => x.key === 'ru' && !x.ok));
  const bare = catalog.completeness({ ...withImg, images: catalog.EMPTY_IMAGES });
  assert.strictEqual(bare.publishable, false);
  assert.ok(bare.score < c.score);
});

test('4. Saqlash: slug avtomatik, "yaratish" taqiqi, takror slug, noma\'lum bo\'lim', async () => {
  const { db, catalog } = await setup();
  assert.strictEqual(catalog.slugify("№ 70 Kabanchik 17,5 naqshli"), '70-kabanchik-17-5-naqshli');
  assert.strictEqual(catalog.slugify('Монако'), 'monako');
  assert.strictEqual(catalog.slugify("G'isht O'rmon"), 'gisht-ormon');
  const base = {
    slug: 'z-01-test-panel', code: 'Z01', section: 'zabor', status: 'draft', sort: 5,
    name: { uz: 'Test panel', ru: 'Тест', en: 'Test' }, subtitle: { uz: null, ru: null, en: null }, note: null,
    kg: null, molds: [], tiles: [], specs: [], sizeEstimated: false, images: catalog.EMPTY_IMAGES,
  };
  const ok = await catalog.saveProduct(db, null, base);
  assert.ok(ok.id);
  assert.match((await catalog.saveProduct(db, null, base)).error, /slug/);
  assert.match((await catalog.saveProduct(db, null, { ...base, slug: 'x-1', name: { ...base.name, uz: 'Biz yaratgan panel' } })).error, /yaratish/);
  assert.match((await catalog.saveProduct(db, null, { ...base, slug: 'x-2', section: 'yoq' })).error, /Bo'lim/);
  assert.match((await catalog.saveProduct(db, null, { ...base, slug: 'Yomon Slug' })).error, /slug/);
  const upd = await catalog.saveProduct(db, ok.id, { ...base, status: 'archived' });
  assert.strictEqual(upd.id, ok.id);
  assert.strictEqual((await catalog.getProduct(db, ok.id)).status, 'archived');
});

test('5. Ommaviy holat va bo\'limni o\'chirish himoyasi', async () => {
  const { db, catalog } = await setup();
  const drafts = await catalog.listProducts(db, { section: 'termopanel' });
  const r = await catalog.setProductsStatus(db, drafts.slice(0, 2).map((p) => p.id), 'archived');
  assert.strictEqual(r.changed, 2);
  assert.match(await catalog.deleteSection(db, 'termopanel'), /mahsulot bor/);
  assert.strictEqual(await catalog.saveSection(db, { key: 'stul', slug: 'chair-legs', name: { uz: 'Stul oyoqlari', ru: null, en: null }, sort: 80, visible: true }, true), null);
  assert.match(await catalog.saveSection(db, { key: 'stul2', slug: 'chair-legs', name: { uz: 'X', ru: null, en: null }, sort: 1, visible: true }, true), /band/);
  assert.match(await catalog.saveSection(db, { key: 'Bad Key', slug: 'x', name: { uz: 'X', ru: null, en: null }, sort: 1, visible: true }, true), /Kalit/);
  assert.strictEqual(await catalog.deleteSection(db, 'stul'), null);
});

test('6. Rasm yuklash: WebP, chet fon kesiladi, shaffoflik saqlanadi, sahna 2 o\'lchamda, xeshdan nom', async () => {
  const { db, media } = await setup();
  const sharp = require('sharp');
  // 1200×1200 oq fon o'rtasida 400×400 qora "qolip".
  const mold = await sharp({ create: { width: 1200, height: 1200, channels: 3, background: '#ffffff' } })
    .composite([{ input: await sharp({ create: { width: 400, height: 400, channels: 3, background: '#111111' } }).png().toBuffer(), left: 400, top: 400 }])
    .jpeg()
    .toBuffer();
  const r = await media.uploadImage(db, mold, 'mold');
  assert.match(r.url, /^\/media\/[a-f0-9]{24}\.webp$/);
  assert.ok(r.width <= 420 && r.height <= 420, `trim ishlamadi: ${r.width}×${r.height}`);
  const stored = await media.getMedia(db, r.url.slice(7, 31));
  assert.strictEqual((await sharp(stored.data).metadata()).format, 'webp');
  const again = await media.uploadImage(db, mold, 'mold');
  assert.strictEqual(again.url, r.url, 'bir xil rasm qayta saqlanmasin');

  const cutout = await sharp({ create: { width: 900, height: 900, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300"><ellipse cx="250" cy="150" rx="250" ry="150" fill="#8b8b8b"/></svg>'), left: 200, top: 300 }])
    .png()
    .toBuffer();
  const c = await media.uploadImage(db, cutout, 'tile');
  const cm = await sharp((await media.getMedia(db, c.url.slice(7, 31))).data).metadata();
  assert.ok(cm.hasAlpha, 'shaffoflik yo\'qoldi');

  const scene = await sharp({ create: { width: 2000, height: 1200, channels: 3, background: '#a0a0a0' } }).jpeg().toBuffer();
  const s = await media.uploadImage(db, scene, 'scene');
  assert.ok(s.smUrl && s.width === 1400);

  const grey = await sharp({ create: { width: 900, height: 900, channels: 3, background: '#7a6a55' } }).jpeg().toBuffer();
  const g = await media.uploadImage(db, grey, 'mold', { trim: false });
  assert.ok(g.warnings.some((w) => /Fon/.test(w)), 'tozalanmagan fon haqida ogohlantirish yo\'q');
  await assert.rejects(media.uploadImage(db, Buffer.from('not an image'), 'mold'), /rasm emas/);
});

test('7. Integratsiyalar: format tekshiruvi, nashr kutayotgan o\'zgarishlar, deploy hook\'siz xato', async () => {
  const { db, settings, user } = await setup();
  const bad = await settings.saveIntegrations(db, user.id, { gtm_id: 'GTM-ABC123', ga4_id: '<script>', meta_pixel_id: '123' });
  assert.deepStrictEqual(bad.sort(), ['ga4_id', 'meta_pixel_id']);
  assert.deepStrictEqual(await settings.saveIntegrations(db, user.id, { gtm_id: 'GTM-ABC123', yandex_metrica_id: '12345678', google_site_verification: 'abcDEF_1234567890abcdef-XYZ' }), []);
  const saved = await settings.getSettings(db);
  assert.strictEqual(saved.gtm_id, 'GTM-ABC123');
  const pending = await settings.pendingChanges(db);
  assert.ok(pending.settings >= 3 && pending.products > 0);
  const res = await settings.triggerPublish(db, user.id, '');
  assert.strictEqual(res.ok, false);
  assert.match(res.message, /VERCEL_DEPLOY_HOOK_URL/);
  assert.strictEqual((await settings.lastPublish(db)).status, 'error');
});

test('8. Snapshot: git\'dagi nusxa null, build skripti bazasiz statik katalogni saqlaydi', () => {
  const gen = fs.readFileSync(path.join(ROOT, 'src/data/site.generated.ts'), 'utf8');
  assert.match(gen, /siteSnapshot: SiteSnapshot \| null = null;/, 'site.generated.ts git\'da null bo\'lishi kerak (build uni to\'ldiradi)');
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.match(pkg.scripts.build, /^node scripts\/export-snapshot\.mjs && node scripts\/validate-models-2027\.mjs && next build$/);
  const script = fs.readFileSync(path.join(ROOT, 'scripts/export-snapshot.mjs'), 'utf8');
  assert.match(script, /status = 'published'/);
  assert.match(script, /hasCatalog/, 'bo\'sh baza statik katalogni o\'chirib yubormasin');
  // Git'dagi src/data/models2027.ts — statik katalog (DB build'dan keyin tasodifan commit qilinmasin).
  const ts = fs.readFileSync(path.join(ROOT, 'src/data/models2027.ts'), 'utf8');
  assert.ok(!ts.startsWith('// SNAPSHOT'), 'src/data/models2027.ts da DB snapshot qolgan — git checkout src/data');
  const fromTs = JSON.parse(ts.slice(ts.indexOf('= ') + 2, ts.lastIndexOf(';')));
  assert.deepStrictEqual(fromTs.map((m) => m.slug), models.map((m) => m.slug));
});

test('9. Integratsiya qiymatlari skriptga faqat qat\'iy formatda tushadi', async () => {
  const { pathToFileURL } = await import('node:url');
  const integ = await import(pathToFileURL(path.join(ROOT, 'src/lib/integrations.ts')).href);
  assert.strictEqual(integ.isValidIntegration('gtm_id', "GTM-X');alert(1)//"), false);
  assert.strictEqual(integ.isValidIntegration('yandex_metrica_id', '123;alert(1)'), false);
  assert.strictEqual(integ.isValidIntegration('meta_pixel_id', '123456789012345'), true);
  assert.strictEqual(integ.isValidIntegration('google_site_verification', ''), true, 'bo\'sh qiymat — o\'chirish');
});

test('10. Nusxa: qoralama, yangi slug, ma\'lumot saqlanadi; ikkinchi nusxa -2', async () => {
  const { db, catalog } = await setup();
  const [src] = await catalog.listProducts(db, { q: 'monako' });
  const id1 = await catalog.duplicateProduct(db, src.id);
  const id2 = await catalog.duplicateProduct(db, src.id);
  const c1 = await catalog.getProduct(db, id1);
  const c2 = await catalog.getProduct(db, id2);
  assert.strictEqual(c1.status, 'draft');
  assert.strictEqual(c1.slug, `${src.slug}-nusxa`);
  assert.strictEqual(c2.slug, `${src.slug}-nusxa-2`);
  assert.deepStrictEqual(c1.molds, src.molds);
  assert.match(c1.name.uz, /\(nusxa\)$/);
});
