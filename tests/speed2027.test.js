// Audit 2026-11-02, 3-bosqich (3.4): JS hajmi — uch tilning HAM lug'ati klient bundle'iga tushmasin.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const CLIENT_COMPONENTS = [
  'src/components/model2027/ModelClient.tsx',
  'src/components/compare2027/CompareClient.tsx',
  'src/components/request2027/RequestClient.tsx',
  'src/components/partners2027/PartnersForm.tsx',
];

test("1. Model/Compare/Request/Partners klient komponentlari getPages()/getUi() chaqirmaydi (lug'at props orqali keladi)", () => {
  for (const file of CLIENT_COMPONENTS) {
    const source = read(file);
    assert.doesNotMatch(source, /\bgetPages\(/, `${file}: getPages() chaqirilmasin — server komponentdan prop orqali kelsin`);
    assert.doesNotMatch(source, /\bgetUi\(/, `${file}: getUi() chaqirilmasin — server komponentdan prop orqali kelsin`);
  }
});

test('2. Klientga prop sifatida uzatiladigan lug\'at bo\'limlarida (model/compare/request/partners) funksiya maydoni yo\'q', async () => {
  const { pathToFileURL } = await import('node:url');
  const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);
  const findFns = (obj, out, prefix) => {
    for (const k in obj) {
      const v = obj[k];
      if (typeof v === 'function') out.push(`${prefix}.${k}`);
      else if (v && typeof v === 'object' && !Array.isArray(v)) findFns(v, out, `${prefix}.${k}`);
    }
  };
  for (const [name, rel] of [
    ['uz', 'src/dictionaries/pages/uz.ts'],
    ['ru', 'src/dictionaries/pages/ru.ts'],
    ['en', 'src/dictionaries/pages/en.ts'],
  ]) {
    const mod = await load(rel);
    const dict = mod[`pages${name[0].toUpperCase()}${name.slice(1)}`];
    const out = [];
    for (const section of ['model', 'compare', 'request', 'partners']) findFns(dict[section], out, section);
    // RSC server->client chegarasidan funksiya o'ta olmaydi — "Functions cannot be passed
    // directly to Client Components" bilan BUTUN build yiqiladi (haqiqiy voqea, 2026-11-07).
    assert.deepStrictEqual(out, [], `${name}: funksiya maydoni topildi — klient komponentga uzatilganda build yiqiladi`);
  }
});
