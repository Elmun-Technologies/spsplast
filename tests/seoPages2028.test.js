// SEO landing sahifalari (docs/SEO-2028-RU.md 2-bo'lim): teg sahifalari
// `/{lang}/catalog/{section}/tag/{tag}` va eksport (geo) sahifalari `/{lang}/export/{country}`.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const load = (rel) => import(path.join(SRC, rel));
const LANGS = ['uz', 'ru', 'en'];
/** Sarlavha shabloni `%s · SPS Plast` (11 belgi) — SERP'da 65 belgigacha sig'ishi uchun. */
const TITLE_MAX = 65 - ' · SPS Plast'.length;

test('1. Teg sahifalari: har biri ≥ MIN_TAG_MODELS model, bo\'sh teg sahifa olmaydi', async () => {
  const { getSeoTags, tagModels, isSeoTag, MIN_TAG_MODELS } = await load('lib/seoPages.ts');
  const tags = getSeoTags();
  assert.ok(tags.length >= 3, `teg sahifalari juda kam: ${tags.length}`);
  for (const t of tags) {
    const models = tagModels(t.section, t.tag);
    assert.strictEqual(models.length, t.count);
    assert.ok(models.length >= MIN_TAG_MODELS, `${t.tag}: ${models.length} model`);
    assert.ok(models.every((m) => m.section === t.section), `${t.tag}: boshqa bo'lim modeli`);
    assert.ok(isSeoTag(t.section, t.tag));
  }
  assert.ok(!isSeoTag('trotuar', 'no-such-tag'));
  assert.ok(!isSeoTag('dekor', 'walk-25-30'), 'teg boshqa bo\'limga o\'tib ketdi');
});

test('2. Lug\'at: har bir teg va davlat uchun 3 tilda matn, sarlavha/description uzunligi', async () => {
  const { getSitePages: getPages } = await load('lib/pagesServer.ts'); // + seo/privacy (server lug'ati)
  const { getSeoTags, EXPORT_COUNTRIES } = await load('lib/seoPages.ts');
  const { getTotalCount } = await load('lib/catalog2027.ts');
  const total = getTotalCount();
  for (const lang of LANGS) {
    const s = getPages(lang).seo;
    for (const t of getSeoTags()) {
      const c = s.tags[t.tag];
      assert.ok(c && c.name && c.h1 && c.text, `${lang}/${t.tag}: matn yo'q`);
      assert.ok(c.title.length <= TITLE_MAX, `${lang}/${t.tag}: title ${c.title.length} > ${TITLE_MAX}: ${c.title}`);
      assert.ok(c.text.length >= 50 && c.text.length <= 170, `${lang}/${t.tag}: description ${c.text.length}`);
    }
    const g = s.geo;
    for (const { key } of EXPORT_COUNTRIES) {
      const c = g.countries[key];
      assert.ok(c && c.name && c.to && c.from && c.cities, `${lang}/${key}: davlat matni yo'q`);
      const title = g.title(c.to);
      assert.ok(title.length <= TITLE_MAX, `${lang}/${key}: title ${title.length} > ${TITLE_MAX}: ${title}`);
      const d = g.description(c.to, total);
      assert.ok(d.length >= 50 && d.length <= 170, `${lang}/${key}: description ${d.length}: ${d}`);
      assert.strictEqual(g.faq(c).length, 4);
    }
    // Sarlavhalar bir-biridan farq qiladi (dublikat title — SEO kannibalizatsiya).
    const titles = EXPORT_COUNTRIES.map(({ key }) => g.title(g.countries[key].to));
    assert.strictEqual(new Set(titles).size, titles.length, `${lang}: bir xil eksport sarlavhalari`);
  }
});

test('3. Matnlar biznes qoidalariga mos: narx yo\'q, "yaratish" yo\'q, token qolmagan', async () => {
  const { getSitePages: getPages } = await load('lib/pagesServer.ts'); // + seo/privacy (server lug'ati)
  const { EXPORT_COUNTRIES } = await load('lib/seoPages.ts');
  for (const lang of LANGS) {
    const s = getPages(lang).seo;
    const g = s.geo;
    const out = [JSON.stringify(s)];
    for (const { key } of EXPORT_COUNTRIES) {
      const c = g.countries[key];
      out.push(g.title(c.to), g.h1(c.to), g.description(c.to, 100), g.lead(c.to, 100), JSON.stringify(g.faq(c)));
    }
    out.push(s.guide.countText('Monako', '11', 100, '1 100'));
    const text = out.join('\n');
    assert.ok(!/yarat/i.test(text), `${lang}: "yaratish" so'zi`);
    assert.ok(!/so'm|soʻm|\bsum\b|\$\s?\d|₽|руб\.|\d\s?USD\b|цена:\s?\d|\d\s?(доллар|рубл)/i.test(text), `${lang}: narx`);
    assert.ok(!/\{(years|capacity|objects|countries|countryList|contactLine|addressLine|address)\}/.test(text), `${lang}: token qolgan`);
    assert.ok(!/\[[^\]\s][^\]]{1,40}\]/.test(text), `${lang}: [placeholder]`);
  }
});

test('4. Marshrutlar statik: dynamicParams=false + generateStaticParams', () => {
  for (const rel of ['app/[lang]/catalog/[section]/tag/[tag]/page.tsx', 'app/[lang]/export/[country]/page.tsx']) {
    const src = fs.readFileSync(path.join(SRC, rel), 'utf8');
    assert.match(src, /export const dynamicParams = false/, `${rel}: dynamicParams`);
    assert.match(src, /generateStaticParams/, `${rel}: generateStaticParams`);
    assert.match(src, /pageMetadata\(/, `${rel}: pageMetadata (canonical + hreflang)`);
    assert.ok(!/searchParams/.test(src), `${rel}: searchParams o'qimasligi kerak (soft-404)`);
    assert.ok(!/\+998|98 300/.test(src), `${rel}: qattiq yozilgan telefon`);
  }
});

test('5. Ichki havolalar: footer va bo\'lim sahifasi SEO sahifalariga olib boradi', () => {
  const footer = fs.readFileSync(path.join(SRC, 'components/site/SiteFooter.tsx'), 'utf8');
  assert.match(footer, /EXPORT_COUNTRIES/, 'footer eksport davlatlari ro\'yxati');
  assert.match(footer, /\/export\/\$\{c\.key\}/, 'footer eksport havolasi');
  const section = fs.readFileSync(path.join(SRC, 'app/[lang]/catalog/[section]/page.tsx'), 'utf8');
  assert.match(section, /<TagChips/, 'bo\'lim sahifasida teg havolalari');
  assert.match(section, /<CountriesStrip/, 'bo\'lim sahifasida davlatlar bloki');
});

test('6. Audit marshrutlari SEO sahifalarini qamraydi', async () => {
  const { AUDIT_ROUTES } = await import(path.join(ROOT, 'scripts/lib/routes.mjs'));
  const paths = AUDIT_ROUTES.map((r) => r.path);
  assert.ok(paths.some((p) => /\/catalog\/paving\/tag\//.test(p)), 'teg sahifasi auditda yo\'q');
  assert.ok(paths.some((p) => /\/export\//.test(p)), 'eksport sahifasi auditda yo\'q');
});
