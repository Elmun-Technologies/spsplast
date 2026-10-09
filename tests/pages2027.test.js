// Bosqich 3: sahifalar (bosh, model, solishtirish, ro'yxat, ulgurji,
// ishlab chiqarish, kontakt, maxfiylik, 404) — qoidalar va marshrutlar.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');
const load = (rel) => import(path.join(SRC, rel));

const PAGES = [
  'app/[lang]/page.tsx',
  'app/[lang]/catalog/page.tsx',
  'app/[lang]/catalog/[section]/page.tsx',
  'app/[lang]/catalog/[section]/[slug]/page.tsx',
  'app/[lang]/compare/page.tsx',
  'app/[lang]/request/page.tsx',
  'app/[lang]/partners/page.tsx',
  'app/[lang]/production/page.tsx',
  'app/[lang]/contact/page.tsx',
  'app/[lang]/privacy/page.tsx',
  'app/not-found.tsx',
  'app/[lang]/not-found.tsx',
];

test('1. Barcha sahifa marshrutlari mavjud (HANDOFF 4 jadvali)', () => {
  for (const rel of PAGES) {
    assert.ok(fs.existsSync(path.join(SRC, rel)), `yetishmayapti: src/${rel}`);
    const source = read(rel);
    // Dinamik segmentli sahifalar statik generatsiya qilinishi kerak
    // (not-found.tsx chegarasiga Next params uzatmaydi — istisno)
    if (rel.includes('[') && !rel.includes('not-found')) {
      assert.match(source, /generateStaticParams/, `src/${rel}: generateStaticParams yo'q`);
    }
  }
});

test('2. Model sahifasi noma\'lum slug uchun qattiq 404 beradi', () => {
  const source = read('app/[lang]/catalog/[section]/[slug]/page.tsx');
  assert.match(source, /export const dynamicParams = false/);
  assert.match(source, /notFound\(\)/);
  // Bo'lim slug\'i model bo\'limiga mos kelmasa ham 404
  assert.match(source, /model\.section !== sec/);
});

test('3. Sahifa lug\'atlarida taqiqlangan so\'zlar yo\'q', async () => {
  const { getPages } = await load('lib/pages.ts');
  const offenders = [];
  const walk = (node, trail) => {
    if (typeof node === 'string') {
      if (/yarat/i.test(node)) offenders.push(`${trail}: yarat`);
      if (/savat/i.test(node) && !/bu savat emas|это не корзина|not a cart/i.test(node)) {
        offenders.push(`${trail}: savat`);
      }
      if (/so'm|\bsum\b|\$\d|soʻm/i.test(node)) offenders.push(`${trail}: narx belgisi`);
      return;
    }
    if (typeof node === 'function') return;
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${trail}[${i}]`));
      return;
    }
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) walk(v, `${trail}.${k}`);
    }
  };
  for (const lang of ['uz', 'ru', 'en']) walk(getPages(lang), lang);
  assert.deepStrictEqual(offenders, []);
});

test('4. Uch til lug\'atlari bir xil tuzilishga ega', async () => {
  const { getPages } = await load('lib/pages.ts');
  const shape = (node) => {
    if (typeof node === 'function') return 'fn';
    if (Array.isArray(node)) return node.map(shape);
    if (node && typeof node === 'object') {
      const out = {};
      for (const k of Object.keys(node).sort()) out[k] = shape(node[k]);
      return out;
    }
    return typeof node;
  };
  const uz = shape(getPages('uz'));
  assert.deepStrictEqual(shape(getPages('ru')), uz, 'ru lug\'ati tuzilishi uz dan farq qiladi');
  assert.deepStrictEqual(shape(getPages('en')), uz, 'en lug\'ati tuzilishi uz dan farq qiladi');
});

test('5. Biznesdan kutilayotgan placeholderlar joyida qoldi', async () => {
  const { getPages } = await load('lib/pages.ts');
  const flat = (node, out = []) => {
    if (typeof node === 'string') out.push(node);
    else if (Array.isArray(node)) node.forEach((v) => flat(v, out));
    else if (node && typeof node === 'object' && typeof node !== 'function') {
      Object.values(node).forEach((v) => flat(v, out));
    }
    return out;
  };
  const uz = flat(getPages('uz')).join('\n');
  for (const ph of ['[MIN. HAJM]', '[% DAN]', '[SHARTLAR]', '[ISH KUNI]', '[EXW TOSHKENT / DAP]', '[USD · RUB · UZS]', '[KELIB CHIQISH SERTIFIKATI]', '[TEXNOLOG TAVSIYASI]', '[E-POCHTA]', '[SANA]', '[YURIDIK NOMI]', '[SAQLASH MUDDATI]', "[RO'YXAT]", '[YURIST TASDIG\'I]']) {
    assert.ok(uz.includes(ph), `uz lug'atida placeholder yo'q: ${ph}`);
  }
});

test('6. Faqat tasdiqlangan raqamlar ishlatilgan (HANDOFF 1.5)', async () => {
  const { getPages } = await load('lib/pages.ts');
  const uz = JSON.stringify(getPages('uz'));
  // Tasdiqlangan: 20 yil, 18 000 m²/oy, 740+ obyekt, 8 davlat
  for (const claim of ['20', '18 000', '740+', '8']) {
    assert.ok(uz.includes(claim), `tasdiqlangan raqam yo'q: ${claim}`);
  }
  // Bosh yuzlab "tajriba/quvvat/obyekt/davlat" da'volari bo'lmasligi kerak
  const forbidden = [/\b(1[05]|2[1-9]|[3-9]\d)\s*yil/i, /\b(7[5-9]\d|8\d\d|9\d\d)\+?\s*obyekt/i];
  for (const re of forbidden) {
    const m = uz.match(re);
    assert.ok(!m, `tasdiqlanmagan da'vo: ${m ? m[0] : ''}`);
  }
  // Oylik quvvat faqat 18 000 m² bo'lishi mumkin
  for (const m of uz.matchAll(/([\d.]+)\s?000 m²/g)) {
    assert.equal(m[1].trim(), '18', `quvvat da'vosi: ${m[0]}`);
  }
});

test('7. Kontaktlar yagona manbadan (CONTACTS_2027), sahifalarda qattiq raqam yo\'q', () => {
  const files = [
    'app/[lang]/contact/page.tsx',
    'components/model2027/ModelClient.tsx',
    'components/request2027/RequestClient.tsx',
    'components/site/NotFoundBody.tsx',
    'components/partners2027/PartnersForm.tsx',
  ];
  for (const rel of files) {
    const source = read(rel);
    assert.match(source, /CONTACTS_2027/, `${rel}: CONTACTS_2027 ishlatilmagan`);
    assert.ok(
      !/\+998\s?\d/.test(source),
      `${rel}: telefon raqami qattiq yozilgan — CONTACTS_2027 dan oling`
    );
  }
});

test('8. Kalkulyator formulasi HANDOFF 4.2 bo\'yicha', async () => {
  const { getModelBySlug, calcMolds, calcWeight } = await load('lib/catalog2027.ts');
  const monako = getModelBySlug('01-monako');
  assert.ok(monako, 'Monako modeli topilmadi');
  // qolip soni = ceil(m² × dona_1m²); vazn = m² × kg
  const per = Number(String(monako.tiles[0].per).replace(',', '.'));
  assert.equal(calcMolds(monako, 100), Math.ceil(100 * per));
  const kg = Number(String(monako.kg).replace(',', '.'));
  assert.equal(calcWeight(monako, 100), Math.round(100 * kg * 100) / 100);
});

test('9. Bog\'liq modellar: o\'zi chiqmaydi va limitga bo\'ysunadi', async () => {
  const { getModelBySlug, relatedModels } = await load('lib/catalog2027.ts');
  const monako = getModelBySlug('01-monako');
  const rel = relatedModels(monako, 4);
  assert.ok(rel.length > 0 && rel.length <= 4);
  assert.ok(!rel.some((m) => m.slug === monako.slug));
  for (const m of rel) assert.equal(m.section, monako.section);
});

test('10. Bo\'lim muqova rasmlari diskda mavjud', async () => {
  const { SECTIONS, sectionCover } = await load('lib/catalog2027.ts');
  for (const s of SECTIONS) {
    const href = sectionCover(s);
    assert.ok(href.startsWith('/'), `${s}: muqova yo'li noto'g'ri`);
    assert.ok(fs.existsSync(path.join(ROOT, 'public', href)), `${s}: muqova rasmi yo'q (${href})`);
  }
});

test('11. Maxfiylik sahifasi 6 bo\'limdan iborat', async () => {
  const { getPages } = await load('lib/pages.ts');
  for (const lang of ['uz', 'ru', 'en']) {
    const pv = getPages(lang).privacy;
    assert.equal(pv.sections.length, 6, `${lang}: bo'limlar soni`);
    assert.equal(pv.toc.length, 6, `${lang}: mundarija`);
    assert.ok(pv.sections.every((s) => s.id && s.h2), `${lang}: bo'lim identifikatori yo'q`);
  }
});
