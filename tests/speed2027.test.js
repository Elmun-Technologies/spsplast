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

// 2026-11-23: barcha sahifalar 213–222 KB → 167–186 KB. Sabab: mijoz fayllari `getUi()`/`getPages()` va
// `catalog2027` (modellar ro'yxati) ni import qilardi — uch tilning lug'atlari (~30 KB gzip) va katalog (~15 KB)
// HAR sahifa JS'iga tushardi (error boundary, header, til almashtirgich layout'da).
test("3. Hech bir 'use client' fayl lug'at modullari yoki katalog ma'lumotini qiymat sifatida import qilmaydi", () => {
  // Ruxsat etilgan istisnolar: CompareBarPanel faqat solishtirish ro'yxati bo'sh bo'lmaganda dynamic() bilan yuklanadi;
  // useModelLookup katalogni import() bilan kechiktirib yuklaydi.
  const ALLOW = new Set(['src/components/catalog2027/CompareBarPanel.tsx']);
  const BANNED = [
    /from '@\/lib\/ui'/,
    /from '@\/lib\/pages'/,
    /from '@\/lib\/catalog2027'/,
    /from '@\/dictionaries\/(ui|pages)\/(uz|ru|en)'/,
  ];
  const offenders = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(rel);
      else if (/\.(ts|tsx)$/.test(e.name) && !ALLOW.has(rel)) {
        const src = read(rel);
        if (!/^['"]use client['"]/m.test(src)) continue;
        // Ko'p qatorli importlar ham: `import {\n a,\n} from '…';` (faqat `import type` mustasno).
        for (const m of src.matchAll(/^import\s+(?!type\s)[^;]*?from\s+'[^']+';/gm)) {
          if (BANNED.some((re) => re.test(m[0]))) offenders.push(`${rel}: ${m[0].replace(/\s+/g, ' ')}`);
        }
      }
    }
  };
  walk('src');
  assert.deepStrictEqual(offenders, [], "Mijozda: useUi() (UiProvider), '@/lib/catalogCore', useModelLookup() ishlating");
});
