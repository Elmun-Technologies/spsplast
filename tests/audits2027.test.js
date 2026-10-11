const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Audit qoidalari testi (Stage 6).
 *
 * `scripts/audit-seo-dom.mjs` server ishlab turganda yuradi, shuning uchun CI'da
 * uni tekshirib bo'lmaydi. Bu testlar qoidalarning o'zini (`scripts/lib/dom-rules.mjs`)
 * kichik HTML fixture'larida sinaydi: "yaxshi" sahifa toza o'tishi, "yomon" sahifa
 * esa kutilgan xatolarni berishi kerak. Shunday qilib audit skripti jim turib
 * hech narsani o'tkazib yubormasligi kafolatlanadi.
 *
 * Qo'shimcha: marshrut/ekran ro'yxatlari (`scripts/lib/routes.mjs`) haqiqiy
 * etalon fayllar bilan mos kelishi va npm skriptlari ulanganligi tekshiriladi.
 */

const ROOT = path.join(__dirname, '..');
const SITE = 'https://sps.uz';

async function loadRules() {
  return import(path.join(__dirname, '..', 'scripts', 'lib', 'dom-rules.mjs'));
}

async function loadRoutes() {
  return import(path.join(__dirname, '..', 'scripts', 'lib', 'routes.mjs'));
}

async function audit(html, options) {
  const { JSDOM } = await import('jsdom');
  const { auditDocument } = await loadRules();
  const dom = new JSDOM(html, { url: options.url || `${SITE}${options.path}` });
  return auditDocument({ doc: dom.window.document, siteUrl: SITE, ...options });
}

/** To'liq va to'g'ri sahifa (barcha qoidalar o'tishi kerak). */
const GOOD = `<!doctype html>
<html lang="uz">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Beton plitka qoliplari — 119 model, Toshkent</title>
  <meta name="description" content="Toshkentdagi qoliplar zavodi: beton plitka, fasad va dekor elementlari uchun plastik qoliplar. Zayafka qoldiring." />
  <link rel="canonical" href="${SITE}/uz/catalog/paving" />
  <link rel="alternate" hreflang="uz" href="${SITE}/uz/catalog/paving" />
  <link rel="alternate" hreflang="ru" href="${SITE}/ru/catalog/paving" />
  <link rel="alternate" hreflang="en" href="${SITE}/en/catalog/paving" />
  <link rel="alternate" hreflang="x-default" href="${SITE}/uz/catalog/paving" />
  <meta property="og:title" content="Trotuar plitkasi qoliplari" />
  <meta property="og:description" content="95 model, zavoddan to'g'ridan-to'g'ri." />
  <meta property="og:url" content="${SITE}/uz/catalog/paving" />
  <meta property="og:image" content="${SITE}/images/site/factory.webp" />
  <meta property="og:locale" content="uz_UZ" />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">[{"@context":"https://schema.org","@type":"Organization","name":"SPS Plast","telephone":"+998983007772","address":{"@type":"PostalAddress","addressCountry":"UZ"},"sameAs":["https://t.me/spsplastuz","https://instagram.com/spsplast.uz"]},{"@context":"https://schema.org","@type":"WebSite","name":"SPS Plast","url":"${SITE}","potentialAction":{"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":"${SITE}/uz/catalog?q={search_term_string}"}}},{"@context":"https://schema.org","@type":"Product","name":"Monako","url":"${SITE}/uz/catalog/paving/01-monako","image":["${SITE}/catalog/2027/x.webp"],"offers":{"@type":"Offer","priceCurrency":"UZS","availability":"https://schema.org/InStock","itemOffered":{"@type":"Service","name":"Hisob-kitob"}}}]</script>
</head>
<body>
  <header><a href="/uz" aria-label="SPS"><img src="/images/brand/logo-ink.webp" alt="" width="72" height="44" /></a></header>
  <main id="main-content">
    <h1>Trotuar plitkasi qoliplari</h1>
    <h2>Modellar</h2>
    <img src="/catalog/2027/trotuar-01-monako-scene.webp" alt="Monako — terilgan ko'rinishi" width="800" height="600" loading="lazy" />
    <a href="/uz/catalog/paving/01-monako">Monako</a>
    <a href="tel:+998983007772">+998 98 300 77 72</a>
    <a href="https://t.me/spsplastuz" target="_blank" rel="noopener noreferrer">Telegram</a>
    <form action="/api/leads" method="post">
      <label for="name">Ism</label>
      <input id="name" name="name" type="text" autocomplete="name" />
      <label for="tel">Telefon</label>
      <input id="tel" name="tel" type="tel" autocomplete="tel" />
      <button type="submit">Zayafka qoldirish</button>
    </form>
    <p>Zavod 20 yildan beri ishlaydi, oyiga 18 000 m², 740+ obyekt, 8 davlat.</p>
  </main>
  <footer><nav aria-label="Pastki menyu"><a href="/uz/privacy">Maxfiylik</a></nav></footer>
</body>
</html>`;

/** Ataylab buzilgan sahifa: har bir qoida bo'yicha bittadan xato. */
const BAD = `<!doctype html>
<html lang="ru">
<head>
  <title>Qisqa</title>
  <meta name="description" content="Trotuar plitkasi. Zayafka qoldiring — menejer qolip soni va narxini hisoblab beradi." />
  <link rel="canonical" href="/ru/catalog/paving" />
  <link rel="alternate" hreflang="uz" href="/uz/catalog/paving" />
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"X","offers":{"@type":"Offer","price":"150000","priceCurrency":"UZS"}}</script>
</head>
<body>
  <h1>Birinchi</h1>
  <h1>Ikkinchi</h1>
  <h4>Daraja sakradi</h4>
  <img src="/catalog/2027/x.png" />
  <a href="/uz/blog/eski-maqola">Blog</a>
  <a href="/catalog/paving">Til prefiksisiz</a>
  <a href="#">Bo'sh</a>
  <a href="https://t.me/x" target="_blank">Tashqi</a>
  <a href="tel:+998 98 300 77 72">Telefon</a>
  <form action="/api/cart" method="post">
    <input name="phone" type="tel" />
  </form>
  <p>Narx: 150 000 so'm. Qolipni yaratish mumkin.</p>
</body>
</html>`;

test('1. Yaxshi sahifa auditi toza o\'tadi', async () => {
  const out = await audit(GOOD, { path: '/uz/catalog/paving', lang: 'uz', expect: { jsonLd: ['Organization', 'WebSite', 'Product'] } });
  assert.deepStrictEqual(out.errors, [], `kutilmagan xatolar: ${out.errors.join(' | ')}`);
});

test('2. Buzilgan sahifada barcha qoidalar ishlaydi', async () => {
  const out = await audit(BAD, { path: '/ru/catalog/paving', lang: 'ru', expect: {} });
  const joined = out.errors.join('\n');

  const expected = [
    ['title qisqa', /title juda qisqa/],
    ['description tili', /o'zbekcha matn qolgan/],
    ['canonical nisbiy', /canonical .* != /],
    ['hreflang to\'liq emas', /hreflang "ru" yo'q/],
    ['hreflang mutlaq emas', /mutlaq URL emas/],
    ['og yo\'q', /og:title yo'q/],
    ['h1 ikkita', /h1 soni 2/],
    ['sarlavha sakraydi', /h1 -> h4/],
    ['alt yo\'q', /alt atributi yo'q/],
    ['o\'chirilgan marshrut', /o'chirilgan marshrut/],
    ['til prefiksi', /til prefiksi yo'q/],
    ['bo\'sh havola', /manzilsiz havola/],
    ['noopener', /rel="noopener" siz/],
    ['tel formati', /E\.164 formatida emas/],
    ['forma nomi', /nomlanmagan/],
    ['mavjud bo\'lmagan API', /mavjud bo'lmagan API/],
    ['JSON-LD narx', /narx maydoni bor/],
    ['yaratish', /yarat/],
    ['narx matnda', /narx ko'rsatilgan/],
  ];

  for (const [name, pattern] of expected) {
    assert.ok(pattern.test(joined) || out.warnings.some((w) => pattern.test(w)),
      `qoida ishlamadi: ${name}\nXatolar:\n${joined}`);
  }

  // Rasm formati (png) — ogohlantirish darajasida.
  assert.ok(out.warnings.some((w) => /WebP emas/.test(w)), 'png rasm uchun ogohlantirish yo\'q');
});

test('2b. Til/viewport/charset yo\u02BBq bo\u02BBlsa \u2014 uchta xato', async () => {
  const bare = '<!doctype html><html><head><meta name="viewport" content="width=1024" /><title>Salom</title></head><body><h1>Sarlavha</h1></body></html>';
  const out = await audit(bare, { path: '/uz', lang: 'uz', expect: { jsonLd: [] } });
  const joined = out.errors.join('\n');

  assert.ok(/<html lang> yo/.test(joined), 'html lang qoidasi ishlamadi');
  assert.ok(/meta viewport/.test(joined), 'viewport qoidasi ishlamadi');
  assert.ok(/charset/.test(joined), 'charset qoidasi ishlamadi');
});

test('3. noindex sahifalar: hreflang/OG talab qilinmaydi, robots talab qilinadi', async () => {
  const noindexPage = GOOD
    .replace(/<link rel="alternate"[^>]*>\s*/g, '')
    .replace(/<meta property="og:[^>]*>\s*/g, '')
    .replace('<meta name="twitter:card" content="summary_large_image" />', '<meta name="robots" content="noindex, follow" />');

  const out = await audit(noindexPage, { path: '/uz/compare', lang: 'uz', expect: { noindex: true } });
  assert.deepStrictEqual(out.errors, [], `noindex sahifada kutilmagan xato: ${out.errors.join(' | ')}`);

  // noindex kutilgan, lekin yo'q bo'lsa — xato.
  const missing = await audit(GOOD, { path: '/uz/compare', lang: 'uz', expect: { noindex: true } });
  assert.ok(missing.errors.some((e) => /noindex kutilgan/.test(e)), 'noindex yo\'qligi aniqlanmadi');

  // Indekslanadigan sahifada noindex bo'lsa — xato.
  const wrong = await audit(noindexPage, { path: '/uz/contact', lang: 'uz', expect: {} });
  assert.ok(wrong.errors.some((e) => /indekslanadigan sahifada noindex/.test(e)), 'ortiqcha noindex aniqlanmadi');
});

test('4. JSON-LD: narx, breadcrumb tartibi va FAQ talablari', async () => {
  const { JSDOM } = await import('jsdom');
  const { checkJsonLd, parseJsonLd } = await loadRules();

  const html = `<!doctype html><html lang="uz"><body>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":2,"name":"A","item":"${SITE}/uz"},{"@type":"ListItem","position":1,"name":"B","item":"/uz/catalog"}]}</script>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Savol","acceptedAnswer":{"@type":"Answer"}}]}</script>
    <script type="application/ld+json">{buzilgan json</script>
  </body></html>`;
  const doc = new JSDOM(html).window.document;

  assert.strictEqual(parseJsonLd(doc).filter((b) => !b.ok).length, 1, 'buzilgan JSON aniqlanmadi');

  const out = { errors: [], warnings: [], notes: [] };
  checkJsonLd(doc, { path: '/uz/x', lang: 'uz', siteUrl: SITE, expect: {} }, out);
  const joined = out.errors.join('\n');

  assert.ok(/parse qilinmadi/.test(joined), 'JSON xatosi aniqlanmadi');
  assert.ok(/Breadcrumb position noto'g'ri/.test(joined), 'breadcrumb tartibi tekshirilmadi');
  assert.ok(/Breadcrumb item mutlaq URL emas/.test(joined), 'breadcrumb manzili tekshirilmadi');
  assert.ok(/FAQ javobi to'liq emas/.test(joined), 'FAQ javobi tekshirilmadi');
});

test('5. Kontent qoidalari: placeholder va tasdiqlangan raqamlar qayd etiladi', async () => {
  const { JSDOM } = await import('jsdom');
  const { checkContent } = await loadRules();
  const out = { errors: [], warnings: [], notes: [] };

  const doc = new JSDOM(`<!doctype html><html lang="uz"><body>
    <p>Biz bilan bog'laning: [E-POCHTA]. Matn [YURIST TASDIG'I] kutmoqda.</p>
    <script>self.__next_f.push([1,{"__PAGE__":{}}])</script>
  </body></html>`).window.document;

  checkContent(doc, { path: '/uz/privacy', lang: 'uz', expect: {} }, out);
  assert.deepStrictEqual(out.errors, [], `kutilmagan xato: ${out.errors.join(' | ')}`);
  assert.ok(out.notes.some((n) => /placeholder/.test(n)), 'placeholder qayd etilmadi');
  // Next'ning RSC payload'i (script ichidagi matn) kontent deb hisoblanmasligi kerak.
  assert.ok(!out.notes.some((n) => n.includes('__PAGE__')), 'script ichidagi matn kontentga aralashdi');
});

test('6. Marshrut ro\'yxati: manzillar unikal va til/kutilgan status bilan', async () => {
  const { AUDIT_ROUTES } = await loadRoutes();
  const paths = AUDIT_ROUTES.map((r) => r.path);
  assert.strictEqual(new Set(paths).size, paths.length, 'AUDIT_ROUTES da duplikat manzil bor');

  for (const route of AUDIT_ROUTES) {
    assert.ok(route.path.startsWith('/'), `manzil / bilan boshlanmadi: ${route.path}`);
    assert.ok(route.expect, `${route.path}: expect bloki yo'q`);
    if (!route.expect.status) {
      assert.ok(route.lang, `${route.path}: til ko'rsatilmagan`);
    }
  }

  // Uch til ham qamrab olingan.
  for (const lang of ['uz', 'ru', 'en']) {
    assert.ok(AUDIT_ROUTES.some((r) => r.lang === lang), `${lang} uchun marshrut yo'q`);
  }
  // Migratsiya va noindex holatlari ham ro'yxatda.
  assert.ok(AUDIT_ROUTES.some((r) => r.expect.status === 301), '301 tekshiruvi yo\'q');
  assert.ok(AUDIT_ROUTES.some((r) => r.expect.status === 404), '404 tekshiruvi yo\'q');
  assert.ok(AUDIT_ROUTES.some((r) => r.expect.noindex), 'noindex tekshiruvi yo\'q');
});

test('7. Screenshot rejasi haqiqiy etalon fayllarga bog\'langan', async () => {
  const { SHOT_PLAN, VIEWPORTS } = await loadRoutes();
  const screens = path.join(ROOT, 'docs', 'design-handoff', 'screens');

  assert.strictEqual(VIEWPORTS.mobile.width, 390, 'mobil kenglik 390 emas');
  assert.strictEqual(VIEWPORTS.desktop.width, 1440, 'desktop kenglik 1440 emas');

  const missing = [];
  for (const shot of SHOT_PLAN) {
    const kinds = ['mobile', 'desktop'].filter((k) => shot[k]);
    assert.ok(kinds.length, `${shot.id}: bitta ham o'lchov belgilanmagan`);

    const candidates = [
      ...kinds.map((k) => path.join(screens, k, `${shot.id}.jpg`)),
      path.join(screens, 'i18n', `${shot.id}.jpg`),
    ];
    if (!candidates.some((file) => fs.existsSync(file))) missing.push(shot.id);
  }
  assert.deepStrictEqual(missing, [], `etalon topilmadi: ${missing.join(', ')}`);
});

test('8. Audit skriptlari va npm buyruqlari ulangan', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

  for (const script of ['audit', 'audit:seo', 'audit:a11y', 'shots', 'lighthouse']) {
    assert.ok(pkg.scripts[script], `npm run ${script} yo'q`);
  }

  for (const file of [
    'scripts/audit-seo-dom.mjs',
    'scripts/audit-a11y.mjs',
    'scripts/visual/compare-screens.mjs',
    'scripts/visual/lighthouse.mjs',
    'scripts/lib/routes.mjs',
    'scripts/lib/dom-rules.mjs',
    'docs/checks.md',
    'docs/unresolved-questions.md',
  ]) {
    assert.ok(fs.existsSync(path.join(ROOT, file)), `${file} yo'q`);
  }

  // devDependency: axe-core + jsdom (auditlar shular bilan ishlaydi).
  assert.ok(pkg.devDependencies['axe-core'], 'axe-core devDependency emas');
  assert.ok(pkg.devDependencies.jsdom, 'jsdom devDependency emas');

  // Eski (o'chirilgan) qatlam kutubxonalari qaytib kelmasligi kerak.
  for (const dead of ['zustand', 'clsx', 'tailwind-merge', 'tailwindcss', 'prisma']) {
    assert.ok(!pkg.dependencies[dead] && !pkg.devDependencies[dead], `${dead} package.json'da qoldi`);
  }
});

test('9. Yozilgan hisobotlar toza (0 xato)', () => {
  const dir = path.join(ROOT, 'docs', 'audits');
  const pick = (prefix) => fs.readdirSync(dir).filter((f) => f.startsWith(prefix)).sort().pop();

  const seoReport = pick('seo-dom-');
  const a11yReport = pick('a11y-');
  assert.ok(seoReport, 'docs/audits/seo-dom-*.md hisoboti yo\'q (npm run audit:seo)');
  assert.ok(a11yReport, 'docs/audits/a11y-*.md hisoboti yo\'q (npm run audit:a11y)');

  const seo = fs.readFileSync(path.join(dir, seoReport), 'utf8');
  assert.ok(/xato: \*\*0\*\*/.test(seo), `SEO hisobotida xato bor: ${seoReport}`);
  assert.ok(/ogohlantirish: \*\*0\*\*/.test(seo), `SEO hisobotida ogohlantirish bor: ${seoReport}`);

  const a11y = fs.readFileSync(path.join(dir, a11yReport), 'utf8');
  assert.ok(/buzilish: \*\*0\*\*/.test(a11y), `a11y hisobotida buzilish bor: ${a11yReport}`);
  assert.ok(/## Jiddiy buzilishlar yo'q/.test(a11y), 'a11y hisobotida jiddiy buzilish bor');
});
