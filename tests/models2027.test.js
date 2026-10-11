// models-2027.json shartnoma testi (bosqich 0).
// Faqat XATO darajasidagi invariantlarni tekshiradi: ogohlantirishlar (biznes javobi
// kutilayotgan joylar) docs/data-questions.md da yashaydi va build'ni buzmaydi.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'data/models-2027.json');
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const SECTIONS = ['trotuar', 'fasad', 'zabor', 'dekor', 'skameyka'];

function walkStrings(node, cb, trail) {
  trail = trail || '';
  if (typeof node === 'string') cb(node, trail);
  else if (Array.isArray(node)) node.forEach((v, i) => walkStrings(v, cb, trail + '[' + i + ']'));
  else if (node && typeof node === 'object')
    for (const [k, v] of Object.entries(node)) walkStrings(v, cb, trail + '.' + k);
}

test('slug va key unikal', () => {
  const slugs = data.models.map((m) => m.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test("har modelda uz nomi va to'g'ri bo'lim bor", () => {
  for (const m of data.models) {
    assert.ok(m.name.uz && m.name.uz.length > 1, m.slug);
    assert.ok(SECTIONS.includes(m.section), m.slug);
  }
});

test('uz matnlarda "yarat" so\'zi yo\'q', () => {
  const bad = [];
  walkStrings(data.models, (s, trail) => {
    if (trail.endsWith('.uz') && /yarat/i.test(s)) bad.push(trail + ': ' + s);
  });
  assert.deepEqual(bad, []);
});

test('barcha rasm havolalari diskda mavjud', () => {
  const missing = [];
  for (const m of data.models) {
    const imgs = [m.images.scene, m.images.sceneSm, ...Object.values(m.images.molds), ...Object.values(m.images.tiles)];
    for (const src of imgs) {
      if (src && !fs.existsSync(path.join(ROOT, 'public', src.replace(/^\//, '')))) missing.push(src);
    }
  }
  assert.deepEqual(missing, []);
});

test("katalogda narx maydoni yo'q", () => {
  const raw = fs.readFileSync(FILE, 'utf8');
  assert.ok(!/price|narx/i.test(raw));
});
