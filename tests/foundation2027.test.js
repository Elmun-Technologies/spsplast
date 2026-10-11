// Bosqich 1 (asos) testlari: shrift, Tailwind yo'qligi, 3 til, taqiqlangan so'zlar.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

test('Onest self-host: lotin + kirill woff2 mavjud', () => {
  for (const f of ['public/fonts/onest-latin-wght-normal.woff2', 'public/fonts/onest-cyrillic-wght-normal.woff2']) {
    assert.ok(fs.existsSync(path.join(ROOT, f)), f);
    assert.ok(fs.statSync(path.join(ROOT, f)).size > 4000, f + ' hajmi');
  }
  const css = read('src/app/globals.css');
  assert.ok(css.includes("font-family: 'Onest Variable'"));
  assert.ok(css.includes('font-display: swap'));
  assert.ok(!css.includes('fonts.googleapis.com'), 'Google Fonts so\'rovi yo\'q');
  // next/font importi hech qayerda yo'q (izohlar emas, haqiqiy import tekshiriladi)
  const srcFiles = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (e.isDirectory()) walk(path.join(dir, e.name));
      else if (/\.(ts|tsx)$/.test(e.name)) srcFiles.push(path.join(dir, e.name));
    }
  };
  walk('src');
  for (const f of srcFiles) assert.ok(!read(f).includes("from 'next/font"), f);
});

test('Tailwind o\'chirilgan', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'tailwind.config.js')));
  assert.ok(!fs.existsSync(path.join(ROOT, 'postcss.config.js')));
  assert.ok(!read('src/app/globals.css').includes('@tailwind'));
  const pkg = JSON.parse(read('package.json'));
  assert.ok(!pkg.dependencies.tailwindcss && !pkg.devDependencies.tailwindcss);
});

test('UI lug\'atlari uz/ru/en bir xil kalitlarga ega', async (t) => {
  const uz = await import(path.join(ROOT, 'src/dictionaries/ui/uz.ts'));
  const ru = await import(path.join(ROOT, 'src/dictionaries/ui/ru.ts'));
  const en = await import(path.join(ROOT, 'src/dictionaries/ui/en.ts'));
  const keys = (o, p = '') =>
    Object.entries(o).flatMap(([k, v]) =>
      v && typeof v === 'object' ? keys(v, p + k + '.') : [p + k]);
  const a = keys(uz.uz).sort();
  assert.deepEqual(keys(ru.ru).sort(), a, 'ru kalitlari');
  assert.deepEqual(keys(en.en).sort(), a, 'en kalitlari');
});

test('interfeys matnlarida taqiqlangan so\'zlar yo\'q (narx/savat/yaratish)', async () => {
  const uz = (await import(path.join(ROOT, 'src/dictionaries/ui/uz.ts'))).uz;
  const bad = [];
  const walk = (node, trail) => {
    trail = trail || '';
    if (typeof node === 'string') {
      if (/yarat/i.test(node)) bad.push(trail + ': yarat');
      // "savat" faqat HANDOFF talab qilgan inkor gapida kelishi mumkin
      if (/savat/i.test(node) && !/bu savat emas/i.test(node)) bad.push(trail + ': savat');
    } else if (node && typeof node === 'object')
      for (const [k, v] of Object.entries(node)) walk(v, trail + '.' + k);
  };
  walk(uz);
  assert.deepEqual(bad, []);
});

test('kontaktlar HANDOFF 1-bo\'lim bilan mos', async () => {
  const mod = await import(path.join(ROOT, 'src/lib/contacts2027.ts'));
  const c = mod.CONTACTS_2027;
  assert.equal(c.mainPhoneRaw, '+998983007772');
  assert.equal(c.sales.length, 3);
  assert.equal(c.office.raw, '+998787770007');
  assert.equal(c.telegramHandle, '@spsplastuz');
});

test('faqat /api/leads va /api/health mavjud', () => {
  const api = fs.readdirSync(path.join(ROOT, 'src/app/api')).filter((d) => !d.startsWith('.'));
  assert.deepEqual(api.sort(), ['health', 'leads']);
});
