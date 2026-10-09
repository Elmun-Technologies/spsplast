// Bosqich 2: katalog filtrlari/saralash mantig'i testlari.
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const load = (p) => import(path.join(ROOT, p));

test('qidiruv "№" belgisini e\'tiborsiz qiladi va kod bo\'yicha topadi', async () => {
  const { getModels } = await load('src/lib/catalog2027.ts');
  const { filterModels, DEFAULT_FILTERS } = await load('src/lib/catalogFilters.ts');
  const withSign = filterModels(getModels(), { ...DEFAULT_FILTERS, q: '№ 70' });
  const without = filterModels(getModels(), { ...DEFAULT_FILTERS, q: '70' });
  assert.ok(withSign.length > 0);
  assert.deepEqual(withSign.map((m) => m.slug), without.map((m) => m.slug));
});

test('filtrlar kesishadi va facet sonlari mos keladi', async () => {
  const { getModels } = await load('src/lib/catalog2027.ts');
  const { filterModels, facetCounts, DEFAULT_FILTERS } = await load('src/lib/catalogFilters.ts');
  const models = getModels();
  const f = { ...DEFAULT_FILTERS, size: '300' };
  const filtered = filterModels(models, f);
  const facets = facetCounts(models, f);
  // size guruhidagi facet soni = shu filtr bilan filtrlangan ro'yxat uzunligi
  assert.equal(facets.size['300'], filtered.length);
  // use faqat trotuar uchun: boshqa bo'limlar yo'q
  const fUse = { ...DEFAULT_FILTERS, use: 'car' };
  for (const m of filterModels(models, fUse)) assert.equal(m.section, 'trotuar');
});

test('saralash: kod va qalinlik', async () => {
  const { getModels, modelThickness } = await load('src/lib/catalog2027.ts');
  const { sortModels } = await load('src/lib/catalogFilters.ts');
  const models = getModels();
  const byThick = sortModels(models, 'thick');
  const depths = byThick.map((m) => modelThickness(m) ?? 999);
  for (let i = 1; i < depths.length; i += 1) assert.ok(depths[i] >= depths[i - 1]);
  const byCode = sortModels(models, 'code');
  assert.ok(byCode[0].code, 'birinchi model kodli');
});

test('URL parametrlari aylanadi (parse -> toParams -> parse)', async () => {
  const { parseFilters, filtersToParams, DEFAULT_FILTERS } = await load('src/lib/catalogFilters.ts');
  const f = { ...DEFAULT_FILTERS, q: 'monako', use: 'walk', set: 2, sort: 'code', view: 'list' };
  const back = parseFilters(filtersToParams(f));
  assert.deepEqual(back, f);
  assert.deepEqual(parseFilters(new URLSearchParams('')), DEFAULT_FILTERS);
});

test('/api/leads xalqaro telefonni qabul qiladi', async () => {
  const { isValidIntlPhone, isValidUzPhone } = await load('src/lib/phone.ts');
  assert.ok(isValidUzPhone('+998 90 123 45 67'));
  assert.ok(isValidIntlPhone('+7 916 123-45-67'));
  assert.ok(isValidIntlPhone('+992 90 123 45 67'));
  assert.ok(!isValidIntlPhone('123'));
  assert.ok(!isValidIntlPhone('abc def gh'));
});
