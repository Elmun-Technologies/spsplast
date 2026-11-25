// `patch` (scripts/catalog-add-*.json): egasi tasdiqlagan nom/o'lcham tuzatishlari.
// Statik katalog (extractor) va baza (catalog-sync.ts) bir xil maydonlarni ustidan yozishi shart.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const files = fs.readdirSync(path.join(root, 'scripts')).filter((f) => /^catalog-add-.*\.json$/.test(f)).sort();
const models = JSON.parse(read('data/models-2027.json')).models;
const bySlug = new Map(models.map((m) => [m.slug, m]));

const fields = (src, re) => [...src.match(re)[1].matchAll(/['"](\w+)['"]/g)].map((m) => m[1]).sort();

test('patch: sync skripti va extractor bir xil maydonlarni yangilaydi', () => {
  const ts = fields(read('scripts/catalog-sync.ts'), /const PATCHABLE = \[([^\]]+)\]/);
  const py = fields(read('scripts/extract/build_models_2027.py'), /PATCHABLE = \(([^)]+)\)/);
  assert.deepEqual(ts, py);
  assert.ok(!ts.includes('slug') && !ts.includes('images') && !ts.includes('section'), 'URL va rasmlar patch bilan o‘zgarmaydi');
});

test('patch: har bir tuzatish mavjud modelga tegishli va statik katalogda qo‘llangan', () => {
  let n = 0;
  const last = new Map(); // bir slug bir necha faylda bo'lsa — oxirgisi ustun (fayllar nom bo'yicha tartibda)
  for (const f of files) {
    const patch = JSON.parse(read(`scripts/${f}`)).patch ?? {};
    for (const [slug, raw] of Object.entries(patch)) {
      assert.ok(bySlug.has(slug), `${f}: ${slug} katalogda yo‘q`);
      last.set(slug, { ...(last.get(slug) ?? {}), ...raw });
      n++;
    }
  }
  assert.ok(n >= 14, 'kamida 2026-11-24 tuzatishlari bo‘lishi kerak');
  for (const [slug, raw] of last) {
    for (const [k, v] of Object.entries(raw)) assert.deepEqual(bySlug.get(slug)[k], v, `${slug}.${k}`);
  }
});

test('patch 2026-11-24: novinkalar nomi va Terratsso chuqurligi', () => {
  const ru = (s) => bySlug.get(s).name.ru;
  assert.equal(ru('oltiburchak-galka'), 'Антара');
  assert.equal(ru('antara-1'), 'Антара 2');
  assert.equal(ru('kristall'), 'Национал 1');
  assert.equal(ru('meandr-30-30'), 'Лабиринт');
  assert.equal(ru('naqshli-bordyur'), 'Бордюр Версаче');
  for (const s of ['terratsso-1', 'terratsso-2', 'terratsso-3']) {
    assert.ok(bySlug.has(s), s);
    assert.equal(bySlug.get(s).molds[0].depth, '50', `${s}: chuqurlik 50 mm`);
  }
  assert.equal(bySlug.get('meandr-30-30').kg, '6,5');
});

test('2026-11-25: Национал 2, Antara o‘lchami, raqamlangan nomlar va `retire` (takror Kaliforniya → 301)', () => {
  const ru = (s) => bySlug.get(s).name.ru;
  assert.equal(ru('girih'), 'Национал 2');
  assert.deepEqual(bySlug.get('oltiburchak-galka').molds, bySlug.get('antara-1').molds);
  assert.deepEqual(['tomir-20-20-kvadrat', 'tomir-20-20-x1', '32-tomir', 'tomir-15-15'].map(ru), ['Томир 1', 'Томир 2', 'Томир 3', 'Томир 4']);
  assert.deepEqual(['36-bodom-20-20', '25-bodom', 'bodom-15-15'].map(ru), ['Бодом 1', 'Бодом 2', 'Бодом 3']);
  // `retire`: statik katalogdan chiqadi, sahifasi qoladigan modelga 301 bo'ladi, bazada arxivga o'tadi
  assert.ok(!bySlug.has('kaliforniya') && bySlug.has('kaliforniya-g'));
  const redirects = JSON.parse(fs.readFileSync(path.join(root, 'scripts/redirects-2027.json'), 'utf8'));
  const list = Array.isArray(redirects) ? redirects : Object.values(redirects).flat();
  for (const lang of ['uz', 'ru', 'en']) {
    const r = list.find((x) => x.source === `/${lang}/catalog/paving/kaliforniya`);
    assert.equal(r?.destination, `/${lang}/catalog/paving/kaliforniya-g`);
    assert.equal(r?.statusCode, 301);
  }
  const sync = fs.readFileSync(path.join(root, 'scripts/catalog-sync.ts'), 'utf8');
  assert.match(sync, /data\.retire/);
  assert.match(fs.readFileSync(path.join(root, 'scripts/extract/build_models_2027.py'), 'utf8'), /def apply_retire/);
});
