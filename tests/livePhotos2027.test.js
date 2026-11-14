// Tirik suratlar (media-src/live) to'g'ri modelga tushishi (2026-11-14).
// Bosma katalogdan olingan suratlar 3D raqami bilan nomlangan (t44 = 3D t44 = sayt №40),
// lekin pipeline ularni sayt kodi deb o'qib, 28 ta suratni boshqa modellarga qo'ygan edi.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const models = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/models-2027.json'), 'utf8')).models;
const jobs = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/image-jobs-2027.json'), 'utf8'));
const ts = fs.readFileSync(path.join(ROOT, 'src/components/model2027/model3d.generated.ts'), 'utf8');
const MODEL3D = JSON.parse(ts.slice(ts.indexOf('= {') + 2, ts.lastIndexOf('}') + 1));

const bare = (u) => (u || '').split('?')[0];
const modelOfDst = (dst) => {
  const url = '/' + dst.replace(/^public\//, '');
  return models.find((m) => Object.values(m.images.molds).map(bare).includes(url) || bare(m.images.scene) === url);
};

test("tNN-*.jpg surati aynan 3D tNN modeliga tushadi (sayt №NN ga emas)", () => {
  const live = jobs.filter((j) => j.kind === 'live');
  let checked = 0;
  for (const j of live) {
    const code = path.basename(j.src).split('-')[0].toLowerCase();
    if (!/^t\d+$/.test(code)) continue;
    const m = modelOfDst(j.dst);
    assert.ok(m, `${j.src}: model topilmadi`);
    assert.strictEqual(MODEL3D[m.slug]?.id, code, `${j.src} -> ${m.slug} (3D ${MODEL3D[m.slug]?.id}), 3D ${code} bo'lishi kerak`);
    checked += 1;
  }
  assert.ok(checked > 0 || !live.length, "3D raqamli tirik surat tekshirilmadi");
});

test('sayt kodi bilan nomlangan surat o\'sha kodli modelga tushadi', () => {
  for (const j of jobs.filter((x) => x.kind === 'live')) {
    const code = path.basename(j.src).split('-')[0].toUpperCase();
    if (/^T\d+$/.test(code)) continue;
    const m = modelOfDst(j.dst);
    assert.ok(m, `${j.src}: model topilmadi`);
    assert.ok([m.code?.toUpperCase(), MODEL3D[m.slug]?.id?.toUpperCase(), m.slug.toUpperCase()].includes(code), `${j.src} -> ${m.slug}`);
  }
});

test("katalog rasmlari keshi qisqa: almashtirilgan surat ~1 soatda ko'rinadi (fayl nomi o'zgarmaydi)", async () => {
  const config = require('../next.config.js');
  assert.ok(config.images.minimumCacheTTL <= 3600, `images.minimumCacheTTL = ${config.images.minimumCacheTTL}`);
  const rule = (await config.headers()).find((h) => h.source === '/catalog/(.*)');
  const cc = rule.headers.find((x) => x.key === 'Cache-Control').value;
  const maxAge = Number(/max-age=(\d+)/.exec(cc)[1]);
  assert.ok(maxAge <= 3600, `/catalog max-age = ${maxAge}`);
});
