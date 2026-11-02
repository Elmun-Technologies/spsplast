// Audit 2026-11-02, 2-bosqich ("Keyingi 2 hafta") tuzatishlari.
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
  ctx = { db, schema, catalog: await load('src/server/catalog.ts'), vercel: await load('src/server/vercelStatus.ts') };
  return ctx;
}

test('1. Rasmsiz model: kartochka yozuvi markazda, model sahifasida "suratini so\'rash", noindex + sitemap\'da yo\'q', () => {
  const css = read('src/app/globals.css');
  assert.match(css, /\.sps-card__media > a\.sps-card__nophoto \{ display: flex;/);
  const model = read('src/components/model2027/ModelClient.tsx');
  assert.match(model, /photoAskMessage\(/);
  assert.match(read('src/app/[lang]/catalog/[section]/[slug]/page.tsx'), /noindex: !hasAnyImage\(model\)/);
  assert.match(read('src/lib/sitePaths.ts'), /autoNoindex: true/);
  assert.match(read('src/app/sitemap.ts'), /autoNoindex\) continue/);
});

test('2. Qidiruv saytda ko\'rsatilgan (kirill) nom bo\'yicha ham topadi', async () => {
  const { loadAliased, cleanupTmp } = await import('./helpers/load-alias.mjs');
  try {
    const c = await loadAliased('src/lib/catalog2027.ts');
    const f = await loadAliased('src/lib/catalogFilters.ts');
    const find = (q) => f.filterModels(c.getModels(), { ...f.DEFAULT_FILTERS, q }).map((m) => m.slug);
    assert.ok(find('монако').includes('01-monako'));
    assert.ok(find('Монако').includes('01-monako'));
    assert.ok(find('monako').includes('01-monako'));
    assert.ok(find('№ 01').includes('01-monako'));
  } finally {
    cleanupTmp();
  }
});

test('3. WhatsApp: hero, footer, telefonda suzuvchi tugma, model panelida model nomi bilan', () => {
  assert.match(read('src/components/site/SiteFooter.tsx'), /<MessengerFab lang=\{lang\} \/>/);
  assert.match(read('src/components/site/MessengerFab.tsx'), /whatsappUrl\}\?text=/);
  assert.match(read('src/app/[lang]/page.tsx'), /whatsappUrl\}\?text=/);
  assert.match(read('src/components/site/SiteFooter.tsx'), /whatsappUrl/);
  assert.match(read('src/components/model2027/ModelClient.tsx'), /p\.model\.waAbout\(/);
  const css = read('src/app/globals.css');
  assert.match(css, /body:has\(\.mbar\) \.wa-fab \{ display: none; \}/);
});

test('4. CI: pipefail va yakuniy natija qadami', () => {
  const ci = read('.github/workflows/checks.yml');
  assert.match(ci, /defaults:\s*\n\s*run:\s*\n\s*shell: bash/);
  assert.match(ci, /Yakuniy natija/);
  assert.match(ci, /steps\.audit_seo\.outcome/);
});

test('5. Admin rasm yuklash: 3,5 MB dan katta rasm brauzerda kichraytiriladi', () => {
  const form = read('src/app/admin/products/[id]/ProductForm.tsx');
  assert.match(form, /await shrinkForUpload\(file\)/);
  assert.match(read('src/app/admin/products/[id]/shrinkImage.ts'), /SAFE_UPLOAD_BYTES = 3\.5 \* 1024 \* 1024/);
});

test('6. Nashr: Production\'da snapshot majburiy; Vercel deploy holati; slug o\'zgarsa 301', async () => {
  assert.match(read('scripts/export-snapshot.mjs'), /process\.env\.VERCEL_ENV === 'production' && Boolean\(process\.env\.DATABASE_URL\)/);

  const { db, schema, catalog, vercel } = await setup();
  // Vercel holati: sozlanmagan — null; soxta API javobi — holat o'qiladi.
  assert.strictEqual(await vercel.latestProductionDeploy({}), null);
  const fake = async (url, init) => {
    assert.match(String(url), /projectId=prj_1/);
    assert.strictEqual(init.headers.Authorization, 'Bearer t');
    return new Response(JSON.stringify({ deployments: [{ state: 'ERROR', created: 1760000000000, url: 'x.vercel.app' }] }));
  };
  const st = await vercel.latestProductionDeploy({ VERCEL_API_TOKEN: 't', VERCEL_PROJECT_ID: 'prj_1' }, fake);
  assert.strictEqual(st.state, 'error');
  assert.strictEqual(vercel.deployStateOf('BUILDING'), 'building');
  assert.strictEqual(vercel.deployStateOf('READY'), 'ready');

  // Slug o'zgarishi → 3 ta 301; eski zanjir yangi manzilga ulanadi.
  await db.insert(schema.catalogSections).values({ key: 'trotuar', slug: 'paving', name: { uz: 'Trotuar' }, sort: 1 });
  await db.insert(schema.redirects).values({ source: '/uz/old-monako', destination: '/uz/catalog/paving/01-monako' });
  const base = {
    slug: '01-monako', section: 'trotuar', code: '01', status: 'published', sort: 1,
    name: { uz: 'Monako' }, subtitle: {}, note: {}, kg: null, sizeEstimated: false,
    molds: [], tiles: [], specs: [], images: catalog.EMPTY_IMAGES,
  };
  const { id } = await catalog.saveProduct(db, null, base);
  assert.ok(id);
  const res = await catalog.saveProduct(db, id, { ...base, slug: '01-monako-300' });
  assert.strictEqual(res.id, id);
  const rows = await db.select().from(schema.redirects);
  const map = Object.fromEntries(rows.map((r) => [r.source, r.destination]));
  for (const lang of ['uz', 'ru', 'en']) {
    assert.strictEqual(map[`/${lang}/catalog/paving/01-monako`], `/${lang}/catalog/paving/01-monako-300`);
  }
  assert.strictEqual(map['/uz/old-monako'], '/uz/catalog/paving/01-monako-300', 'zanjir qoldi');
  // Qoralama mahsulotda 301 yaratilmaydi.
  const draft = await catalog.saveProduct(db, null, { ...base, slug: 'qoralama-1', code: '99', status: 'draft' });
  await catalog.saveProduct(db, draft.id, { ...base, slug: 'qoralama-2', code: '99', status: 'draft' });
  assert.ok(!(await db.select().from(schema.redirects)).some((r) => r.source.includes('qoralama')));
});

test('7. Stok port/konteyner rasmlari saytda yo\'q (faqat SPS materiali)', () => {
  for (const f of ['src/app/[lang]/page.tsx', 'src/app/[lang]/production/page.tsx', 'src/app/[lang]/partners/page.tsx']) {
    assert.ok(!/containers-|port-16x9|port\.webp/.test(read(f)), `${f}: stok rasm`);
  }
  for (const f of ['port.webp', 'port-16x9.webp', 'containers.webp', 'containers-1x1.webp', 'containers-4x3.webp', 'containers-16x9.webp']) {
    assert.ok(!fs.existsSync(path.join(ROOT, 'public/images/site', f)), `${f} hali bor`);
  }
});

test('8. Maxfiylik: IP xeshlanadi, eski yozuvlar o\'chadi, zayafka anonimlashtiriladi, Vebvizor formani yozmaydi', async () => {
  const { pathToFileURL } = await import('node:url');
  const privacy = await import(pathToFileURL(path.join(ROOT, 'src/server/privacy.ts')).href);
  const k1 = privacy.ipKey('lead_create', '203.0.113.7', { IP_HASH_SECRET: 's1' });
  assert.strictEqual(k1, privacy.ipKey('lead_create', '203.0.113.7', { IP_HASH_SECRET: 's1' }), 'barqaror emas');
  assert.ok(!k1.includes('203.0.113.7'), 'kalitda IP ochiq');
  assert.notStrictEqual(k1, privacy.ipKey('lead_create', '203.0.113.7', { IP_HASH_SECRET: 's2' }), 'sirsiz xesh');
  assert.match(read('src/app/api/leads/route.ts'), /ipKey\('lead_create', ip\)/);
  assert.match(read('src/app/admin/actions.ts'), /ipKey\('login', ip\)/);

  const { db, schema } = await setup();
  const leads = await import(pathToFileURL(path.join(ROOT, 'src/server/leads.ts')).href);
  const now = new Date('2026-11-02T10:00:00Z');
  await db.insert(schema.rateHits).values({ key: 'login_198.51.100.1', at: new Date('2026-10-30T10:00:00Z') });
  await leads.hitRateLimit(db, 'lead_create_x', 10, 15 * 60 * 1000, now);
  const keys = (await db.select().from(schema.rateHits)).map((r) => r.key);
  assert.ok(!keys.includes('login_198.51.100.1'), '1 sutkadan eski IP yozuvi qoldi');

  const lead = await leads.createLead(db, { type: 'quick', name: 'Shaxsiy Ism', phone: '+998901234567', city: 'Toshkent', message: 'izoh', lang: 'uz' }, now);
  assert.strictEqual(await leads.anonymizeLead(db, lead.id, null), true);
  const { eq } = await import('drizzle-orm');
  const [row] = await db.select().from(schema.leads).where(eq(schema.leads.id, lead.id));
  assert.strictEqual(row.phone, '—');
  assert.strictEqual(row.city, null);
  assert.strictEqual(row.message, null);
  assert.notStrictEqual(row.name, 'Shaxsiy Ism');
  assert.strictEqual(row.number, lead.number, 'raqam statistika uchun qolishi kerak');

  for (const f of ['src/components/catalog2027/QuickRequestModal.tsx', 'src/components/request2027/RequestClient.tsx', 'src/components/partners2027/PartnersForm.tsx']) {
    assert.ok(!/className="sps-input"/.test(read(f)), `${f}: Vebvizor yozadigan maydon`);
  }
  for (const lang of ['uz', 'ru', 'en']) {
    assert.match(read(`src/dictionaries/pagesServer/${lang}.ts`), /(xesh|хеш|hash)/, `${lang}: maxfiylik matni IP xeshi haqida emas`);
  }
});

test('9. SEO landing va maxfiylik matni mijoz bundle\'iga tushmaydi (server lug\'ati)', () => {
  for (const lang of ['uz', 'ru', 'en']) {
    const pages = read(`src/dictionaries/pages/${lang}.ts`);
    assert.ok(!/\n  seo: \{/.test(pages) && !/\n  privacy: \{/.test(pages), `${lang}: seo/privacy yana pages lug'atida`);
  }
  const walk = (dir, out = []) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full, out);
      else if (/\.tsx?$/.test(e.name)) out.push(full);
    }
    return out;
  };
  const offenders = walk(path.join(ROOT, 'src'))
    .filter((f) => /^['"]use client['"]/m.test(fs.readFileSync(f, 'utf8')))
    .filter((f) => /pagesServer/.test(fs.readFileSync(f, 'utf8')))
    .map((f) => path.relative(ROOT, f));
  assert.deepStrictEqual(offenders, [], 'mijoz komponenti server lug\'atini import qiladi');
});
