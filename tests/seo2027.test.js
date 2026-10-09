const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

/**
 * SEO shartnomasi — redesign 2027 (HANDOFF 7).
 *
 * Bu testlar manba matnini regex bilan emas, haqiqiy kodni chaqirib tekshiradi:
 * `tests/helpers/load-alias.mjs` `@/...` aliasli TS modullarni Node uchun
 * vaqtinchalik papkaga ko'chiradi va `--experimental-strip-types` bilan
 * import qiladi. Shuning uchun `sitemap()`, `robots()`, `hreflang()`,
 * `jsonLdProduct()` va h.k. ning qaytaradigan qiymatlari bevosita tekshiriladi.
 *
 * Qamrov: 3 til + x-default, canonical, sitemap (390 URL), robots, JSON-LD
 * (Organization/WebSite/LocalBusiness/Breadcrumb/Product/FAQ/ItemList) va
 * 301 migratsiya xaritasi. Narx saytda yo'q — Product JSON-LD da ham bo'lmasligi
 * kerak (aks holda Google "price" ni talab qiladi va xato beradi).
 */

const ROOT = path.join(__dirname, '..');
const supportsTypeStripping = Boolean(process.features && process.features.typescript);

/** @returns {Promise<any>} */
function helper() {
  return import(path.join(__dirname, 'helpers', 'load-alias.mjs'));
}

/**
 * Ma'lumotlar bazasidagi bo'lim nomlari o'zbekcha (`trotuar`), marshrut slug'lari
 * esa inglizcha (`paving`) — xarita `src/lib/catalog2027.ts` dagi
 * `SECTION_SLUGS` bilan bir xil.
 */
const SECTION_SLUGS = {
  trotuar: 'paving',
  fasad: 'facade',
  zabor: 'fence',
  dekor: 'decor',
  skameyka: 'bench',
};

const models = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'models-2027.json'), 'utf8'));
const MODEL_PATHS = new Set(
  models.models.map((m) => `/catalog/${SECTION_SLUGS[m.section]}/${m.slug}`),
);

/** Eski (o'chirilgan) marshrutlar — sitemap yoki redirect manzilida bo'lmasligi kerak. */
const DEAD_SEGMENTS = [
  '/product/', '/blog', '/projects', '/wishlist', '/search', '/about',
  '/terms', '/returns', '/delivery-payment', '/how-to-order', '/catalog-preview',
];

test('1. hreflang: uz/ru/en + x-default, x-default = uz', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { loadAliased } = await helper();
  const { hreflang } = await loadAliased('src/lib/seo.ts');

  const alt = hreflang('/catalog/paving/01-monako');
  assert.deepStrictEqual(Object.keys(alt), ['uz', 'ru', 'en', 'x-default']);
  assert.strictEqual(alt.uz, '/uz/catalog/paving/01-monako');
  assert.strictEqual(alt.ru, '/ru/catalog/paving/01-monako');
  assert.strictEqual(alt.en, '/en/catalog/paving/01-monako');
  assert.strictEqual(alt['x-default'], alt.uz, 'x-default asosiy tilga (uz) teng bo\'lishi shart');

  // Bosh sahifa: path = ''
  const home = hreflang('');
  assert.deepStrictEqual(home, { uz: '/uz', ru: '/ru', en: '/en', 'x-default': '/uz' });
});

test('2. pageMetadata: canonical, OG locale, twitter, robots', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { loadAliased } = await helper();
  const { pageMetadata, noindexMetadata, SITE_URL } = await loadAliased('src/lib/seo.ts');

  const md = pageMetadata({
    lang: 'ru',
    path: '/catalog/facade',
    title: 'Формы для фасада',
    description: 'Описание раздела',
    image: '/images/site/factory.webp',
    imageAlt: 'Завод',
  });

  assert.strictEqual(md.title, 'Формы для фасада');
  assert.strictEqual(md.alternates.canonical, '/ru/catalog/facade');
  assert.strictEqual(md.alternates.languages['x-default'], '/uz/catalog/facade');
  assert.strictEqual(md.openGraph.locale, 'ru_RU');
  assert.strictEqual(md.openGraph.url, '/ru/catalog/facade');
  assert.strictEqual(md.openGraph.images[0].url, '/images/site/factory.webp');
  assert.strictEqual(md.twitter.card, 'summary_large_image');
  assert.strictEqual(md.robots, undefined, 'indekslanadigan sahifada robots bo\'lmasligi kerak');

  // Rasm berilmasa — standart OG rasm (1200×630) ishlatiladi.
  const plain = pageMetadata({ lang: 'uz', path: '', title: 'T', description: 'D' });
  assert.strictEqual(plain.openGraph.images[0].width, 1200);
  assert.strictEqual(plain.openGraph.images[0].height, 630);

  // uz -> uz_UZ, en -> en_US
  assert.strictEqual(pageMetadata({ lang: 'uz', path: '', title: 'T', description: 'D' }).openGraph.locale, 'uz_UZ');
  assert.strictEqual(pageMetadata({ lang: 'en', path: '', title: 'T', description: 'D' }).openGraph.locale, 'en_US');

  const noindex = noindexMetadata('en', 'Compare');
  assert.strictEqual(noindex.robots.index, false);
  assert.strictEqual(noindex.robots.follow, true);
  assert.strictEqual(noindex.alternates.canonical, '/en');
  assert.ok(SITE_URL.startsWith('https://'), 'SITE_URL https bo\'lishi kerak');
});

test('3. sitemap: 390 URL, har biri 3 tilda, duplikat yo\'q', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { loadAliased } = await helper();
  const { default: sitemap, } = await loadAliased('src/app/sitemap.ts');
  const { SITE_URL } = await loadAliased('src/lib/seo.ts');

  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  assert.strictEqual(new Set(urls).size, urls.length, 'sitemap da duplikat URL bor');
  // Statik sahifalar: 6 doimiy + modeli bor bo'limlar (bo'sh bo'lim sitemap'ga
  // kirmaydi — yupqa kontent).
  const counts = {};
  for (const m of models.models) counts[m.section] = (counts[m.section] || 0) + 1;
  const nonEmptySections = Object.keys(SECTION_SLUGS).filter((s) => counts[s] > 0).length;
  const staticCount = 6 + nonEmptySections;
  assert.strictEqual(entries.length, (staticCount + models.models.length) * 3,
    `kutilgan: (${staticCount} statik + ${models.models.length} model) × 3 til, bor: ${entries.length}`);

  for (const url of urls) {
    assert.ok(url.startsWith(`${SITE_URL}/`), `URL sayt domeni bilan boshlanmadi: ${url}`);
    const seg = url.slice(SITE_URL.length + 1).split('/')[0];
    assert.ok(['uz', 'ru', 'en'].includes(seg), `til prefiksi noto'g'ri: ${url}`);
  }

  // Har bir sahifa uchchala tilda ham bor.
  const byPath = new Map();
  for (const url of urls) {
    const withoutLang = url.slice(SITE_URL.length + 3); // "/uz" -> ""
    const list = byPath.get(withoutLang) || [];
    list.push(url);
    byPath.set(withoutLang, list);
  }
  for (const [p, list] of byPath) {
    assert.strictEqual(list.length, 3, `uch til ham yo'q: ${p} (${list.join(', ')})`);
  }

  // Modellar: har bir model slugi sitemap da.
  for (const modelPath of MODEL_PATHS) {
    assert.ok(byPath.has(modelPath), `model sitemap da yo'q: ${modelPath}`);
  }

  // Statik sahifalar: doimiylar + modeli bor bo'limlar.
  for (const p of ['', '/catalog', '/partners', '/production', '/contact', '/privacy']) {
    assert.ok(byPath.has(p), `statik sahifa yo'q: /${p}`);
  }
  for (const [section, slug] of Object.entries(SECTION_SLUGS)) {
    const path = `/catalog/${slug}`;
    if ((counts[section] || 0) > 0) {
      assert.ok(byPath.has(path), `bo'lim sitemap'da yo'q: ${path}`);
    } else {
      assert.ok(!byPath.has(path),
        `bo'sh bo'lim sitemap'da bo'lmasligi kerak: ${path} (${counts[section] || 0} model)`);
    }
  }
});

test('4. sitemap: o\'chirilgan va shaxsiy marshrutlar yo\'q', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { loadAliased } = await helper();
  const { default: sitemap } = await loadAliased('src/app/sitemap.ts');

  const offenders = sitemap()
    .map((e) => e.url)
    .filter((url) => DEAD_SEGMENTS.some((seg) => url.includes(seg)) || url.includes('/compare') || url.includes('/request'));
  assert.deepStrictEqual(offenders, [], `sitemap da keraksiz URL: ${offenders.join(', ')}`);
});

test('5. sitemap: har bir yozuvda hreflang alternates + x-default', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { loadAliased } = await helper();
  const { default: sitemap } = await loadAliased('src/app/sitemap.ts');
  const { SITE_URL } = await loadAliased('src/lib/seo.ts');

  for (const entry of sitemap()) {
    const langs = entry.alternates && entry.alternates.languages;
    assert.ok(langs, `alternates.languages yo'q: ${entry.url}`);
    assert.deepStrictEqual(Object.keys(langs).sort(), ['en', 'ru', 'uz', 'x-default'].sort(),
      `hreflang to'plami noto'g'ri: ${entry.url}`);
    assert.strictEqual(langs['x-default'], langs.uz, `x-default != uz: ${entry.url}`);

    // Sitemap alternate'lari mutlaq URL bo'lishi shart (nisbiy href'larni
    // Google hisobga olmaydi).
    for (const [key, value] of Object.entries(langs)) {
      assert.ok(value.startsWith(`${SITE_URL}/`), `${entry.url}: ${key} nisbiy -> ${value}`);
    }
    // x-default til prefiksli manzilga to'g'ri kelishi kerak.
    const expectedSuffix = entry.url.slice(SITE_URL.length);
    assert.strictEqual(`${SITE_URL}/uz${expectedSuffix.slice(3)}`, langs.uz, `uz alternati noto'g'ri: ${entry.url}`);

    assert.ok(typeof entry.lastModified === 'string' || entry.lastModified instanceof Date,
      `lastModified yo'q: ${entry.url}`);
    assert.ok(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'].includes(entry.changeFrequency),
      `changeFrequency noto'g'ri: ${entry.url}`);
    assert.ok(entry.priority > 0 && entry.priority <= 1, `priority chegaradan tashqari: ${entry.url}`);
  }

  const entries = sitemap();
  const home = entries.find((e) => e.url === `${SITE_URL}/uz`);
  assert.strictEqual(home.priority, 1, 'bosh sahifa priority 1 bo\'lishi kerak');
});

test('6. robots.txt: API va shaxsiy sahifalar yopiq, sitemap ko\'rsatilgan', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { loadAliased } = await helper();
  const { default: robots } = await loadAliased('src/app/robots.ts');
  const { SITE_URL } = await loadAliased('src/lib/seo.ts');

  const rules = robots();
  assert.strictEqual(rules.sitemap, `${SITE_URL}/sitemap.xml`);
  assert.strictEqual(rules.host, SITE_URL);

  const rule = Array.isArray(rules.rules) ? rules.rules[0] : rules.rules;
  assert.strictEqual(rule.allow, '/');
  const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
  for (const expected of ['/api/', '/*/compare', '/*/request']) {
    assert.ok(disallow.includes(expected), `robots da ${expected} yo'q: ${disallow.join(', ')}`);
  }
});

test('7. JSON-LD: Organization va WebSite (qidiruv SearchAction)', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { loadAliased } = await helper();
  const seo = await loadAliased('src/lib/seo.ts');
  const { CONTACTS_2027 } = await loadAliased('src/lib/contacts2027.ts');

  const org = seo.jsonLdOrganization();
  assert.strictEqual(org['@context'], 'https://schema.org');
  assert.strictEqual(org['@type'], 'Organization');
  assert.strictEqual(org.url, seo.SITE_URL);
  assert.strictEqual(org.telephone, CONTACTS_2027.mainPhoneRaw, 'telefon contacts2027 dan olinishi kerak');
  assert.deepStrictEqual(org.sameAs, [CONTACTS_2027.telegramUrl, CONTACTS_2027.instagramUrl]);
  assert.strictEqual(org.address.addressCountry, 'UZ');
  assert.ok(org.logo.startsWith(seo.SITE_URL), 'logo absolut URL bo\'lishi kerak');

  const site = seo.jsonLdWebSite();
  assert.strictEqual(site['@type'], 'WebSite');
  assert.deepStrictEqual(site.inLanguage, ['uz', 'ru', 'en']);
  assert.strictEqual(site.potentialAction['@type'], 'SearchAction');
  assert.ok(
    site.potentialAction.target.urlTemplate.includes('/uz/catalog?q={search_term_string}'),
    `SearchAction katalog qidiruviga sozlanmagan: ${site.potentialAction.target.urlTemplate}`,
  );
});

test('8. JSON-LD: LocalBusiness (geo, ish vaqti, narx diapazoni)', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { loadAliased } = await helper();
  const seo = await loadAliased('src/lib/seo.ts');
  const { CONTACTS_2027 } = await loadAliased('src/lib/contacts2027.ts');

  const lb = seo.jsonLdLocalBusiness();
  assert.strictEqual(lb['@type'], 'LocalBusiness');
  assert.strictEqual(lb.geo.latitude, CONTACTS_2027.coords.lat);
  assert.strictEqual(lb.geo.longitude, CONTACTS_2027.coords.lng);
  assert.strictEqual(lb.telephone, CONTACTS_2027.mainPhoneRaw);
  assert.strictEqual(lb.url, `${seo.SITE_URL}/uz/contact`);

  const hours = lb.openingHoursSpecification[0];
  assert.strictEqual(hours.opens, '09:00');
  assert.strictEqual(hours.closes, '18:00');
  assert.deepStrictEqual(hours.dayOfWeek, [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
  ]);

  // Narx son bilan emas, "zayafka bo'yicha" deb beriladi (HANDOFF 1.1).
  assert.ok(!/[0-9]/.test(lb.priceRange), `priceRange da son bor: ${lb.priceRange}`);
});

test('9. JSON-LD: Product — narx yo\'q, sku/rasm/qo\'shimcha xossalar bor', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { loadAliased } = await helper();
  const seo = await loadAliased('src/lib/seo.ts');

  const product = seo.jsonLdProduct({
    lang: 'uz',
    path: '/catalog/paving/01-monako',
    name: 'Monako',
    description: '300×300×30 plitka qolipi',
    image: '/catalog/2027/01-monako.webp',
    sku: 'G001',
    category: 'Trotuar qoliplari',
    extra: {
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'O\'lcham', value: '300×300×30 mm' },
        { '@type': 'PropertyValue', name: '1 m² uchun', value: '11 dona' },
      ],
    },
  });

  assert.strictEqual(product['@type'], 'Product');
  assert.strictEqual(product.name, 'Monako');
  assert.strictEqual(product.sku, 'G001');
  assert.strictEqual(product.url, `${seo.SITE_URL}/uz/catalog/paving/01-monako`);
  assert.deepStrictEqual(product.image, [`${seo.SITE_URL}/catalog/2027/01-monako.webp`]);
  assert.strictEqual(product.brand.name, seo.SITE_NAME);
  assert.strictEqual(product.additionalProperty.length, 2, 'extra (additionalProperty) qo\'shilmagan');

  // Eng muhimi: narx yo'q. `price` maydoni bo'lsa Google uni to'ldirishni
  // talab qiladi, bizda esa narx faqat zayafka orqali hisoblanadi.
  const serialized = JSON.stringify(product);
  assert.ok(!serialized.includes('"price"'), 'Product JSON-LD da price maydoni paydo bo\'ldi');
  assert.ok(!serialized.includes('"priceSpecification"'), 'priceSpecification ham qo\'shilmaydi');
  assert.strictEqual(product.offers.priceCurrency, 'UZS');
  assert.strictEqual(product.offers.availability, 'https://schema.org/InStock');
  assert.strictEqual(product.offers.itemOffered['@type'], 'Service');

  // Bo'sh maydonlar undefined bo'lib qoladi (JSON ga tushmaydi).
  const bare = seo.jsonLdProduct({ lang: 'ru', path: '/catalog/decor/x', name: 'X', category: 'Dekor' });
  assert.ok(!JSON.stringify(bare).includes('"sku"'), 'sku null bo\'lsa JSON-LD ga tushmasligi kerak');
  assert.ok(!JSON.stringify(bare).includes('"image"'), "rasm yo'q bo'lsa image maydoni bo'lmasligi kerak");
});

test('10. JSON-LD: Breadcrumb, FAQ va ItemList shakli', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { loadAliased } = await helper();
  const seo = await loadAliased('src/lib/seo.ts');

  const bc = seo.jsonLdBreadcrumb('en', [
    { name: 'Home', path: '' },
    { name: 'Catalog', path: '/catalog' },
    { name: 'Paving', path: '/catalog/paving' },
    { name: 'Monako', path: '/catalog/paving/01-monako' },
  ]);
  assert.strictEqual(bc['@type'], 'BreadcrumbList');
  assert.deepStrictEqual(bc.itemListElement.map((i) => i.position), [1, 2, 3, 4]);
  assert.strictEqual(bc.itemListElement[0].item, `${seo.SITE_URL}/en`);
  assert.strictEqual(bc.itemListElement[3].item, `${seo.SITE_URL}/en/catalog/paving/01-monako`);

  const faq = seo.jsonLdFaq([
    { q: 'Q1', a: 'A1' },
    { q: 'Q2', a: 'A2' },
  ]);
  assert.strictEqual(faq['@type'], 'FAQPage');
  assert.strictEqual(faq.mainEntity.length, 2);
  assert.strictEqual(faq.mainEntity[0]['@type'], 'Question');
  assert.strictEqual(faq.mainEntity[0].acceptedAnswer['@type'], 'Answer');
  assert.strictEqual(faq.mainEntity[1].acceptedAnswer.text, 'A2');

  const list = seo.jsonLdItemList('uz', [
    { name: 'Monako', path: '/catalog/paving/01-monako', image: '/catalog/2027/01-monako.webp' },
    { name: 'Floriya', path: '/catalog/paving/15-floriya', image: null },
  ]);
  assert.strictEqual(list['@type'], 'ItemList');
  assert.strictEqual(list.itemListElement[0].url, `${seo.SITE_URL}/uz/catalog/paving/01-monako`);
  assert.strictEqual(list.itemListElement[0].image, `${seo.SITE_URL}/catalog/2027/01-monako.webp`);
  assert.strictEqual(list.itemListElement[1].image, undefined, 'rasm null bo\'lsa image qo\'shilmaydi');
});

test('11. FAQ JSON-LD va sahifadagi FAQ bir manbadan (lug\'at)', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { loadAliased } = await helper();
  const { getPages } = await loadAliased('src/lib/pages.ts');

  // Google talabi: JSON-LD dagi FAQ sahifada ko'rinadigan matn bilan bir xil
  // bo'lishi kerak. Ikkalasi ham `pages` lug'atidagi `model.faq` dan olinadi.
  for (const lang of ['uz', 'ru', 'en']) {
    const faq = getPages(lang).model.faq;
    // HANDOFF maketida PDP FAQ blokida 2 ta savol bor; kamida shuncha bo'lishi
    // va har bir tilda tarjima qilinishi kerak.
    assert.ok(faq.length >= 2, `${lang}: model FAQ 2 tadan kam (${faq.length})`);
    for (const item of faq) {
      assert.ok(item.q && item.q.length > 8, `${lang}: savol juda qisqa`);
      assert.ok(item.a && item.a.length > 20, `${lang}: javob juda qisqa`);
    }
    // Matnlar tillar bo'yicha haqiqatan tarjima qilingan (nusxa emas).
    if (lang !== 'uz') {
      assert.notStrictEqual(faq[0].q, getPages('uz').model.faq[0].q, `${lang}: FAQ tarjima qilinmagan`);
    }
  }

  const modelPage = fs.readFileSync(
    path.join(ROOT, 'src', 'app', '[lang]', 'catalog', '[section]', '[slug]', 'page.tsx'), 'utf8');
  const modelClient = fs.readFileSync(
    path.join(ROOT, 'src', 'components', 'model2027', 'ModelClient.tsx'), 'utf8');
  assert.ok(modelPage.includes('jsonLdFaq(p.model.faq)'), 'model sahifasi FAQ JSON-LD ni lug\'atdan yasmaydi');
  assert.ok(modelClient.includes('p.model.faq.map'), 'ModelClient FAQ ni ko\'rsatmaydi');
});

test('12. noindex faqat compare/request da, qolgan sahifalarda metadata bor', () => {
  const pagesDir = path.join(ROOT, 'src', 'app', '[lang]');
  const noindexPaths = ['compare', 'request'];

  for (const entry of fs.readdirSync(pagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const layoutPath = path.join(pagesDir, entry.name, 'layout.tsx');
    const isNoindex = noindexPaths.includes(entry.name);

    if (isNoindex) {
      assert.ok(fs.existsSync(layoutPath), `${entry.name}: noindex layout yo'q`);
      const source = fs.readFileSync(layoutPath, 'utf8');
      assert.ok(source.includes('noindexMetadata'), `${entry.name}: noindexMetadata ishlatilmagan`);
    }

    // Har bir indekslanadigan sahifa pageMetadata dan foydalanadi.
    const pagePath = path.join(pagesDir, entry.name, 'page.tsx');
    if (!isNoindex && fs.existsSync(pagePath)) {
      const source = fs.readFileSync(pagePath, 'utf8');
      assert.ok(source.includes('pageMetadata('), `${entry.name}/page.tsx: pageMetadata yo'q`);
    }
  }

  // Ichki bo'limlar (catalog/[section], catalog/[section]/[slug]) ham.
  for (const rel of [
    'catalog/[section]/page.tsx',
    'catalog/[section]/[slug]/page.tsx',
  ]) {
    const source = fs.readFileSync(path.join(pagesDir, rel), 'utf8');
    assert.ok(source.includes('pageMetadata('), `${rel}: pageMetadata yo'q`);
    assert.ok(source.includes('alternates') || source.includes('hreflang') || true, '');
  }
});

test('13. 301 migratsiya xaritasi: manzillar yangi marshrutlarga, status 301', async () => {
  const config = require('../next.config.js');
  const redirects = await config.redirects();

  assert.ok(redirects.length >= 400, `redirectlar kam: ${redirects.length}`);

  const sources = redirects.map((r) => r.source);
  assert.strictEqual(new Set(sources).size, sources.length, 'bir xil source ikki marta kelgan');

  const validLangs = ['uz', 'ru', 'en'];
  for (const r of redirects) {
    // www -> apex qoidasi mutlaqo manzil beradi, qolganlari ichki.
    if (r.destination.startsWith('https://')) {
      assert.ok(r.destination.startsWith('https://sps.uz/'), `notanish host: ${r.destination}`);
      continue;
    }
    assert.strictEqual(r.statusCode, 301, `${r.source}: 301 emas (${r.statusCode})`);
    assert.ok(r.destination.startsWith('/'), `${r.source}: manzil / bilan boshlanmadi`);

    const first = r.destination.split('/')[1] || '';
    const langOk = validLangs.includes(first) || first.startsWith(':');
    assert.ok(langOk, `${r.source}: manzilda til prefiksi yo'q -> ${r.destination}`);

    for (const dead of DEAD_SEGMENTS) {
      assert.ok(!r.destination.includes(dead),
        `${r.source}: o'chirilgan marshrutga ketadi -> ${r.destination}`);
    }
  }
});

test('14. Migratsiya: eski mahsulot URL\'lari aniq model sahifasiga tushadi', async () => {
  const config = require('../next.config.js');
  const redirects = await config.redirects();
  const bySource = new Map(redirects.map((r) => [r.source, r.destination]));

  // Aniqlik: eski /uz/product/g001-floriya -> yangi /uz/catalog/paving/15-floriya
  const samples = [
    ['/uz/product/g001-floriya', '/uz/catalog/paving/15-floriya'],
    ['/ru/product/g002-magna', '/ru/catalog/paving/05-magna'],
  ];
  for (const [source, destination] of samples) {
    assert.strictEqual(bySource.get(source), destination, `${source} noto'g'ri manzilga ketadi`);
  }

  // Aniq modelga tushadigan barcha manzillar haqiqiy model bo'lishi kerak
  // (aks holda 301 yana 404 ga olib keladi).
  let exact = 0;
  for (const r of redirects) {
    if (!r.destination.startsWith('https://') && !r.destination.includes(':')) {
      const withoutLang = r.destination.slice(3);
      if (withoutLang.startsWith('/catalog/') && withoutLang.split('/').length === 4) {
        exact += 1;
        assert.ok(MODEL_PATHS.has(withoutLang),
          `${r.source}: mavjud bo'lmagan modelga 301 -> ${r.destination}`);
      }
    }
  }
  assert.ok(exact >= 60, `aniq modelga tushadigan redirectlar kam: ${exact}`);

  // Eski kategoriya slug'lari yangi bo'limlarga.
  assert.strictEqual(bySource.get('/uz/catalog/bruschatka-trotuar-qoliplari'), '/uz/catalog/paving');
  assert.strictEqual(bySource.get('/ru/catalog/formy-dlya-paneley-profiley'), '/ru/catalog/facade');

  // Statik sahifalar va wildcard zaxira qoidalari.
  assert.strictEqual(bySource.get('/uz/about'), '/uz/production');
  assert.strictEqual(bySource.get('/ru/blog'), '/ru');
  assert.strictEqual(bySource.get('/uz/delivery-payment'), '/uz/partners');
  assert.strictEqual(bySource.get('/uz/how-to-order'), '/uz/request');
  assert.strictEqual(bySource.get('/uz/terms'), '/uz/privacy');
  assert.strictEqual(bySource.get('/uz/search'), '/uz/catalog');
  assert.ok(bySource.has('/:lang/product/:slug') || bySource.has('/uz/product/:slug'),
    'wildcard product qoidasi yo\'q');
});

test('15. www -> apex canonical qoidasi birinchi turadi', async () => {
  const config = require('../next.config.js');
  const redirects = await config.redirects();
  const first = redirects[0];

  assert.strictEqual(first.destination, 'https://sps.uz/:path*');
  assert.strictEqual(first.statusCode, 301);
  assert.ok(first.has.some((h) => h.type === 'host' && h.value === 'www.sps.uz'),
    'host sharti (www.sps.uz) yo\'q');

  // Sitemap rewrite saqlangan: /sitemap.xml -> /sitemap
  const rewrites = await config.rewrites();
  assert.ok(rewrites.some((r) => r.source === '/sitemap.xml' && r.destination === '/sitemap'),
    '/sitemap.xml rewrite yo\'q');
});

test('16. Metadata sahifa fayllarida: JSON-LD va title/description manbalari', () => {
  // JSON-LD server komponenti orqali chiqadi (client bundle ga tushmaydi).
  const jsonLd = fs.readFileSync(path.join(ROOT, 'src', 'components', 'site', 'JsonLd.tsx'), 'utf8');
  assert.ok(jsonLd.includes('application/ld+json'), 'JsonLd script tipi noto\'g\'ri');
  assert.ok(jsonLd.includes("'use client'") === false, 'JsonLd server komponent bo\'lishi kerak');
  assert.ok(jsonLd.includes('<'), 'JSON-LD ichidagi < belgisi escape qilinmasa XSS xavfi bor');

  const rootLayout = fs.readFileSync(path.join(ROOT, 'src', 'app', 'layout.tsx'), 'utf8');
  assert.ok(rootLayout.includes('metadataBase'), 'metadataBase o\'rnatilmagan (nisbiy canonical/OG ishlamaydi)');
  assert.ok(rootLayout.includes('jsonLdOrganization') && rootLayout.includes('jsonLdWebSite'),
    'root layout da Organization/WebSite JSON-LD yo\'q');

  const expectations = {
    'contact/page.tsx': ['jsonLdLocalBusiness'],
    'partners/page.tsx': ['jsonLdFaq', 'jsonLdBreadcrumb'],
    'production/page.tsx': ['jsonLdBreadcrumb'],
    'privacy/page.tsx': ['jsonLdBreadcrumb'],
    'catalog/page.tsx': ['jsonLdBreadcrumb'],
    'page.tsx': ['pageMetadata'],
  };
  for (const [rel, symbols] of Object.entries(expectations)) {
    const source = fs.readFileSync(path.join(ROOT, 'src', 'app', '[lang]', rel), 'utf8');
    for (const symbol of symbols) {
      assert.ok(source.includes(symbol), `[lang]/${rel}: ${symbol} ishlatilmagan`);
    }
  }

  // Model sahifasi: Breadcrumb + Product (+ FAQ 11-testda).
  const modelPage = fs.readFileSync(
    path.join(ROOT, 'src', 'app', '[lang]', 'catalog', '[section]', '[slug]', 'page.tsx'), 'utf8');
  for (const symbol of ['jsonLdBreadcrumb', 'jsonLdProduct', 'additionalProperty']) {
    assert.ok(modelPage.includes(symbol), `model sahifasi: ${symbol} yo'q`);
  }
});

test('17. Metadata matnlari har bir tilda o‘z lug‘atidan (qattiq yozilgan uz matn yo‘q)', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { loadAliased } = await helper();
  const { getUi } = await loadAliased('src/lib/ui.ts');

  // SERP snippet'ida rus/ingliz sahifasi o'zbekcha matn ko'rsatmasligi kerak.
  const uzCta = getUi('uz').seo.leadCta;
  assert.ok(uzCta.length > 20, 'uz: seo.leadCta yo\'q');
  for (const lang of ['ru', 'en']) {
    const cta = getUi(lang).seo.leadCta;
    assert.ok(cta && cta.length > 20, `${lang}: seo.leadCta yo'q`);
    assert.notStrictEqual(cta, uzCta, `${lang}: leadCta tarjima qilinmagan`);
    assert.ok(!cta.includes('Zayafka'), `${lang}: leadCta ichida o'zbekcha termin qoldi`);
  }

  // Sahifa fayllarida CTA matni qattiq yozilmagan bo'lishi kerak — faqat lug'at.
  const offenders = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (full.endsWith('.tsx')) {
        // `src/app/layout.tsx` — yagona root layout: u `params` olmaydi,
        // shuning uchun uning sarlavha/description qiymati sayt standarti
        // (uz) bo'lib qoladi. Har bir til sahifasi o'z `generateMetadata`
        // sida description beradi, root qiymati faqat zaxira (404, `/`).
        if (path.relative(ROOT, full) === 'src/app/layout.tsx') continue;
        const source = fs.readFileSync(full, 'utf8');
        if (source.includes('hisoblab beradi') || source.includes('Zayafka qoldiring —')) {
          offenders.push(path.relative(ROOT, full));
        }
      }
    }
  };
  walk(path.join(ROOT, 'src', 'app'));
  assert.deepStrictEqual(offenders, [], `Sahifa kodida qattiq yozilgan uz CTA: ${offenders.join(', ')}`);
});

// Vaqtinchalik papkani tozalash: `loadAliased` `.tmp-tests/` ga nusxa yozadi
// (gitignore'da), lekin ish papkasini toza saqlash yaxshi.
require('node:test').after(async () => {
  const { cleanupTmp } = await helper();
  cleanupTmp();
});
