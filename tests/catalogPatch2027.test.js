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
