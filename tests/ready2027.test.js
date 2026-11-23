// Tayyor mahsulotlar (ikkinchi yo'nalish, 2026-11-23): bo'lim turi, marshrutlar, qolip katalogidan ajratish.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const load = (p) => import(path.join(ROOT, p));
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

test('1. standart tayyor bo\'limlar qolip bo\'limlaridan ajratilgan', async () => {
  const c = await load('src/lib/catalogCore.ts');
  assert.deepEqual(c.READY_SECTIONS, ['tayyor_termopanel', 'tayyor_bilayn', 'tayyor_dekor', 'tayyor_karniz', 'tayyor_tyaga', 'tayyor_pilyastra', 'tayyor_kapitel', 'tayyor_tsokol', 'tayyor_tosh', 'tayyor_skameyka', 'tayyor_zabor']);
  for (const s of c.READY_SECTIONS) assert.ok(!c.SECTIONS.includes(s), `${s} qolip bo'limlari ro'yxatida`);
  // Slug yo'nalish ichida unikal: /catalog/facade va /ready/facade — ikki xil sahifa.
  assert.equal(c.sectionFromSlug('thermal-panels'), 'termopanel');
  assert.equal(c.readySectionFromSlug('thermal-panels'), 'tayyor_termopanel');
  assert.equal(c.readySectionFromSlug('paving'), undefined);
  assert.equal(c.sectionPath('trotuar'), '/catalog/paving');
  assert.equal(c.sectionPath('tayyor_skameyka'), '/ready/benches');
  assert.equal(c.modelPath({ section: 'tayyor_zabor', slug: 'yz-01' }), '/ready/euro-fence/yz-01');
  assert.equal(c.modelPath({ section: 'trotuar', slug: '01-monako' }), '/catalog/paving/01-monako');
});

test('2. qolip API tayyor mahsulotni qaytarmaydi, getModelBySlug esa ikkalasini topadi', async () => {
  const c = await load('src/lib/catalog2027.ts');
  for (const m of c.getModels()) assert.ok(c.SECTIONS.includes(m.section), `${m.slug}: qolip ro'yxatida begona bo'lim`);
  for (const m of c.getReadyModels()) {
    assert.ok(c.READY_SECTIONS.includes(m.section));
    assert.equal(c.getModelBySlug(m.slug), m, 'zayafka ro\'yxati tayyor mahsulotni topishi kerak');
    assert.equal(c.getMoldBySlug(m.slug), undefined);
  }
  assert.ok(c.getMoldBySlug('01-monako'));
});

test('3. migratsiya 0004: kind ustuni, (kind, slug) unikal, 4 standart bo\'lim', () => {
  const sql = read('drizzle/0004_ready_products.sql');
  assert.match(sql, /ADD COLUMN "kind" text DEFAULT 'molds' NOT NULL/);
  assert.match(sql, /UNIQUE\("kind","slug"\)/);
  for (const k of ['tayyor_termopanel', 'tayyor_bilayn', 'tayyor_dekor', 'tayyor_karniz', 'tayyor_tyaga', 'tayyor_pilyastra', 'tayyor_kapitel', 'tayyor_tsokol', 'tayyor_tosh', 'tayyor_skameyka', 'tayyor_zabor']) assert.ok(sql.includes(`'${k}'`), k);
  assert.match(sql, /ON CONFLICT \("key"\) DO NOTHING/);
  const journal = JSON.parse(read('drizzle/meta/_journal.json'));
  assert.ok(journal.entries.some((e) => e.tag === '0004_ready_products'));
  // Snapshot bo'lim turini olib o'tadi (aks holda prod'da hammasi "qolip" bo'lib qoladi).
  assert.match(read('scripts/export-snapshot.mjs'), /select key, slug, name, sort, kind from catalog_sections/);
});

test('4. sahifalar: /ready, /ready/[section], /ready/[section]/[slug] — statik, qattiq 404, narxsiz', () => {
  const index = read('src/app/[lang]/ready/page.tsx');
  const sec = read('src/app/[lang]/ready/[section]/page.tsx');
  const pdp = read('src/app/[lang]/ready/[section]/[slug]/page.tsx');
  assert.ok(!fs.existsSync(path.join(ROOT, 'src/app/[lang]/ready/layout.tsx')), 'eski noindex layout qaytmasin');
  for (const [name, src] of [['index', index], ['section', sec], ['pdp', pdp]]) {
    assert.ok(src.includes('pageMetadata('), `${name}: pageMetadata yo'q`);
    assert.ok(!/price|narx:\s*\d/i.test(src.replace(/priceNote/g, '')), `${name}: narx bo'lmasligi kerak`);
  }
  // Bo'sh holat indekslanmaydi.
  assert.ok(index.includes('noindexMetadata') && sec.includes('noindexMetadata'));
  assert.match(sec, /export const dynamicParams = false/);
  assert.match(pdp, /export const dynamicParams = false/);
  assert.match(pdp, /noindex: !hasAnyImage\(m\)/);
  assert.match(pdp, /jsonLdProduct\(/);
});

test('5. kartochka/ro\'yxat/solishtirish havolalari modelPath orqali (tayyor mahsulot /catalog ga ketmaydi)', () => {
  for (const f of ['src/components/catalog2027/ProductCard.tsx', 'src/components/request2027/RequestClient.tsx', 'src/components/compare2027/CompareClient.tsx']) {
    const src = read(f);
    assert.ok(src.includes('modelPath('), `${f}: modelPath yo'q`);
    assert.ok(!src.includes('/catalog/${SECTION_SLUGS'), `${f}: qattiq /catalog havola`);
  }
  const card = read('src/components/catalog2027/ProductCard.tsx');
  assert.match(card, /isReadySection\(model\.section\)/);
});

test('6. zayafka: tayyor mahsulotda qolip hisoblanmaydi, Telegram xabarida TAYYOR belgisi', () => {
  assert.match(read('src/app/api/leads/route.ts'), /!isReadySection\(model\.section\) \? calcMolds/);
  assert.match(read('src/server/leadMessage.ts'), /TAYYOR: /);
});

test('7. sitemap manbasi tayyor sahifalarni biladi, admin bo\'lim formasi yo\'nalishni tanlaydi', () => {
  const sp = read('src/lib/sitePaths.ts');
  assert.ok(sp.includes('getReadyModels()') && sp.includes('getActiveReadySections()'));
  assert.match(read('src/app/admin/products/sections/SectionForm.tsx'), /name="kind"/);
  assert.match(read('src/server/catalog.ts'), /yo'nalishini o'zgartirib bo'lmaydi/);
});

test('8. tayyor mahsulot miqdori birligi bilan (m² / dona) matnga yoziladi, qolip "m²/kun" maydoniga emas', () => {
  const modal = read('src/components/catalog2027/QuickRequestModal.tsx');
  assert.match(modal, /volumeM2: ready \? undefined/);
  assert.match(modal, /m2: ready \? undefined/);
  assert.match(modal, /t\.unitPcs/);
  const list = read('src/components/request2027/RequestClient.tsx');
  assert.match(list, /m2: isReady\(model\) \? undefined/);
  assert.match(list, /const molds = ready \? null : calcMolds/);
});
