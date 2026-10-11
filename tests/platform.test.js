const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Platforma testlari: zayafka oqimining kritik qismlari.
 *
 * Node 22.6+ `--experimental-strip-types` bilan `.ts` fayllarni to'g'ridan-to'g'ri
 * import qiladi — shuning uchun bu testlar haqiqiy manba kodini tekshiradi
 * (nusxa emas). Eski Node'da testlar skip bo'ladi.
 */
const supportsTypeStripping = Boolean(process.features && process.features.typescript);

async function loadTs(relativePath) {
  return import(path.join('..', relativePath));
}

test('1. Telefon raqami E.164 formatiga keltiriladi', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { normalizePhone, isValidUzPhone } = await loadTs('src/lib/phone.ts');

  assert.strictEqual(normalizePhone('901234567'), '+998901234567');
  assert.strictEqual(normalizePhone('+998 (90) 123-45-67'), '+998901234567');
  assert.strictEqual(normalizePhone('8901234567'), '+998901234567');
  assert.strictEqual(isValidUzPhone('+998901234567'), true);
  assert.strictEqual(isValidUzPhone('12345'), false);
  assert.strictEqual(isValidUzPhone('+7 999 123 45 67'), false);
});

test('2. Telegram HTML escape — markup inject qilinmaydi', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { escapeTelegramHtml } = await loadTs('src/lib/telegram.ts');

  assert.strictEqual(escapeTelegramHtml('<b>Ism</b>'), '&lt;b&gt;Ism&lt;/b&gt;');
  assert.strictEqual(escapeTelegramHtml('A & B'), 'A &amp; B');
  assert.strictEqual(escapeTelegramHtml(null), '');
  assert.strictEqual(escapeTelegramHtml(undefined), '');
  // Haqiqiy hujum urinishi: havola inject qilib bo'lmasligi kerak.
  assert.ok(!escapeTelegramHtml('<a href="http://evil">x</a>').includes('<a'));
});

test('3. Rate limit oynasi ishlaydi va qayta tiklanadi', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { checkRateLimit, resetRateLimit } = await loadTs('src/lib/rateLimit.ts');

  resetRateLimit();
  const key = 'test_' + Date.now();

  for (let i = 0; i < 3; i += 1) {
    assert.strictEqual(checkRateLimit(key, 3, 60_000).allowed, true, `${i + 1}-so‘rov ruxsat etilishi kerak`);
  }
  const blocked = checkRateLimit(key, 3, 60_000);
  assert.strictEqual(blocked.allowed, false, 'limitdan keyingi so‘rov bloklanishi kerak');
  assert.ok(blocked.resetTimeMs > 0);

  // Boshqa kalit (boshqa IP) bloklanmaydi.
  assert.strictEqual(checkRateLimit(key + '_boshqa', 3, 60_000).allowed, true);
});

test('4. Zayafka API’si Telegram’ga yuboradi va bazani ishlatmaydi', () => {
  const route = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'api', 'leads', 'route.ts'), 'utf8');

  assert.ok(route.includes('sendTelegramNotification'), 'Telegram yuborilishi kerak');
  assert.ok(route.includes('escapeTelegramHtml'), 'HTML escape ishlatilishi kerak');
  assert.ok(route.includes('checkRateLimit'), 'rate limit bo‘lishi kerak');
  assert.ok(route.includes('website'), 'honeypot maydoni bo‘lishi kerak');
  assert.ok(!route.includes('@/lib/db'), 'baza importi bo‘lmasligi kerak');
  assert.ok(route.includes('pageUrl') && route.includes('lang'), 'manba sahifa va til xabarga qo‘shiladi');
});

test('5. Faqat bitta API marshruti qolgan (leads + health)', () => {
  const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
  const routes = [];

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'route.ts') routes.push(path.relative(apiDir, full).replace(/\\/g, '/'));
    }
  };
  walk(apiDir);

  assert.deepStrictEqual(routes.sort(), ['health/route.ts', 'leads/route.ts']);
});

test('6. Ommaviy sahifalarda baza importi qolmagan', () => {
  const srcDir = path.join(__dirname, '..', 'src');
  const offenders = [];

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) {
        const source = fs.readFileSync(full, 'utf8');
        if (source.includes("@/lib/db") || source.includes('@prisma/client')) {
          offenders.push(path.relative(srcDir, full));
        }
      }
    }
  };
  walk(srcDir);

  assert.deepStrictEqual(offenders, [], `Prisma/baza importi qolgan: ${offenders.join(', ')}`);
});

test('7. Fly.io/Docker konfiguratsiyasi olib tashlangan', () => {
  const root = path.join(__dirname, '..');
  for (const file of ['fly.toml', 'Dockerfile', '.github/workflows/fly-deploy.yml', '.github/workflows/cron-integrations.yml']) {
    assert.ok(!fs.existsSync(path.join(root, file)), `${file} hali ham mavjud`);
  }
});

test('8. Bo‘lim nomlari uch tilda lug‘atdan — metadata duplikat emas', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { loadAliased } = await import(path.join(__dirname, 'helpers', 'load-alias.mjs'));
  const { getUi } = await loadAliased('src/lib/ui.ts');

  const sections = ['trotuar', 'fasad', 'zabor', 'dekor', 'skameyka'];
  const seen = { uz: new Set(), ru: new Set(), en: new Set() };

  for (const lang of ['uz', 'ru', 'en']) {
    for (const section of sections) {
      const name = getUi(lang).sections[section];
      assert.ok(name && name.length > 2, `${lang}/${section}: bo'lim nomi yo'q`);
      // Ikki bo'lim bir xil nomda bo'lsa, title/description duplikat bo'ladi.
      assert.ok(!seen[lang].has(name), `${lang}: "${name}" ikki bo'limda takrorlandi`);
      seen[lang].add(name);
    }
  }

  // Tarjima haqiqiy: ru/en nomlari uz dan farq qiladi.
  for (const section of sections) {
    assert.notStrictEqual(getUi('ru').sections[section], getUi('uz').sections[section], `${section}: ru tarjimasi yo'q`);
    assert.notStrictEqual(getUi('en').sections[section], getUi('uz').sections[section], `${section}: en tarjimasi yo'q`);
  }

  // Bo'lim sahifasining metadata'si shu lug'atdan yasaladi (qattiq matn emas).
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'app', '[lang]', 'catalog', '[section]', 'page.tsx'), 'utf8');
  assert.ok(source.includes('pageMetadata('), "bo'lim sahifasida pageMetadata yo'q");
  assert.ok(source.includes('getUi(locale).sections'), "bo'lim nomi lug'atdan olinmayapti");
  assert.ok(source.includes('getModelsBySection'), "sarlavhadagi son ma'lumotdan olinmayapti");
});

test('9. Qidiruv API’siz ishlaydi: form → /catalog?q=, filtr mijoz tomonida', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { loadAliased } = await import(path.join(__dirname, 'helpers', 'load-alias.mjs'));
  const { getUi } = await loadAliased('src/lib/ui.ts');

  // Qidiruv JS ishlamasa ham natija berishi kerak: forma GET bilan katalogga
  // yuboriladi, maydon nomi `q` — CatalogClient uni URL'dan o'qiydi.
  for (const lang of ['uz', 'ru', 'en']) {
    assert.ok(getUi(lang).catalog.searchPlaceholder.length > 3, `${lang}: qidiruv placeholder yo'q`);
  }

  const header = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'components', 'site', 'HeaderClient.tsx'), 'utf8');
  assert.ok(header.includes('name="q"'), "header qidiruv formasida name=q maydoni yo'q");
  assert.ok(header.includes('/catalog'), "header qidiruvi katalogga yo'naltirmaydi");

  const client = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'components', 'catalog2027', 'CatalogClient.tsx'), 'utf8');
  // Bo'lim sahifalari statik (searchParams server'da o'qilmaydi), shuning uchun
  // filtr URL'dan mijoz tomonida o'qiladi.
  assert.ok(client.includes('window.location.search'), "CatalogClient URL paramlarini o'qimaydi");
  assert.ok(client.includes('parseFilters'), "CatalogClient filtr parse funksiyasi yo'q");
  assert.ok(client.includes('filters.q'), 'CatalogClient qidiruv qiymatini ishlatmaydi');

  // Qidiruv va filtrlar bitta joyda (`catalogFilters.ts`) URL'dan o'qiladi:
  // parametrlar HANDOFF 5 bo'yicha q/use/size/set/sort/view.
  const filters = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'catalogFilters.ts'), 'utf8');
  for (const param of ['q', 'use', 'size', 'set', 'sort', 'view']) {
    assert.ok(filters.includes(`sp.get('${param}')`), `filtr parametri o'qilmaydi: ${param}`);
  }

  // Qidiruv analytics hodisasi bilan kuzatiladi (docs/analytics-events.md).
  assert.ok(client.includes("trackEvent('search'"), "search hodisasi yuborilmaydi");

  // Regression guard: ilgari header mavjud bo'lmagan /api/search ga so'rov
  // yuborar va takliflar jimgina bo'sh qolardi. API faqat leads + health.
  const srcDir = path.join(__dirname, '..', 'src');
  const offenders = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) {
        const source = fs.readFileSync(full, 'utf8');
        if (source.includes('/api/search')) offenders.push(path.relative(srcDir, full));
      }
    }
  };
  walk(srcDir);
  assert.deepStrictEqual(offenders, [], `Mavjud bo'lmagan /api/search chaqiruvi: ${offenders.join(', ')}`);
});

test('10. Eski (2026) kontent qatlami o‘chirilgan — manba bitta', () => {
  const root = path.join(__dirname, '..');

  // Ma'lumot: faqat 2027 to'plami + migratsiya uchun arxiv (docs/legacy).
  const dataFiles = fs.readdirSync(path.join(root, 'data')).sort();
  assert.deepStrictEqual(dataFiles, ['image-jobs-2027.json', 'models-2027.json'],
    `data/ da eski fayllar qolgan: ${dataFiles.join(', ')}`);
  assert.deepStrictEqual(fs.readdirSync(path.join(root, 'src', 'data')).sort(), ['models2027.ts']);
  assert.ok(fs.existsSync(path.join(root, 'docs', 'legacy', 'catalog-2026.json')),
    'migratsiya manbasi (docs/legacy/catalog-2026.json) saqlanmagan');

  // Kod: eski modul/store/lug'atlardan hech qanday iz qolmasligi kerak.
  // Import yo'llari bo'yicha tekshiramiz: shunda yangi qatlamdagi o'xshash nomlar
  // (masalan `spsLists.ts` ichidagi mahalliy `compareStore` o'zgaruvchisi)
  // noto'g'ri signal bermaydi.
  const banned = [
    '@/lib/store/wishlistStore', '@/lib/store/compareStore', '@/lib/store/recentStore',
    '@/lib/store/uiStore', '@/lib/blogContent', '@/lib/faq', '@/lib/slug', '@/lib/utils',
    '@/lib/constants/contacts', '@/lib/catalog/categories', '@/data/catalog.json',
    '@/dictionaries/uz.json', '@/dictionaries/ru.json', '@/components/ui/', '@/components/product/',
  ];
  const offenders = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) {
        // Izoh qatorlari hisobga olinmaydi: masalan i18n.ts "getDictionary()
        // o'chirildi" deb yozadi — bu kod emas, hujjat.
        const code = fs.readFileSync(full, 'utf8')
          .split('\n')
          .filter((line) => !line.trim().startsWith('*') && !line.trim().startsWith('//'))
          .join('\n');
        for (const needle of banned) {
          if (code.includes(needle)) offenders.push(`${path.relative(root, full)}: ${needle}`);
        }
      }
    }
  };
  walk(path.join(root, 'src'));
  assert.deepStrictEqual(offenders, [], `Eski qatlam izlari: ${offenders.join(', ')}`);

  // Media: eski foto/galereya papkalari o'chirilgan, PDF katalog saqlangan.
  for (const gone of ['public/catalog/2026', 'public/media', 'public/search-index.json', 'public/manifest.json']) {
    assert.ok(!fs.existsSync(path.join(root, gone)), `${gone} hali ham mavjud`);
  }
  assert.ok(fs.existsSync(path.join(root, 'public', 'catalog', '2027')), `yangi foto to'plami yo'q`);
  assert.ok(fs.existsSync(path.join(root, 'public', 'catalog', 'pdf')), `PDF katalog yo'q`);
});

test('11. Ichki havolalar faqat haqiqiy bo‘lim slug‘laridan foydalanadi', () => {
  // redesign-2027: bo'lim slug'lari HANDOFF 4 bo'yicha (paving/facade/fence/decor/bench)
  const validSlugs = new Set(['paving', 'facade', 'fence', 'decor', 'bench']);

  // src ichida `?category=<slug>` yoki `/catalog/<slug>` ko'rinishidagi
  // qattiq yozilgan slug'lar faqat haqiqiy bo'lishi kerak.
  const srcDir = path.join(__dirname, '..', 'src');
  const offenders = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) {
        const source = fs.readFileSync(full, 'utf8');
        // Faqat havola ko'rinishidagi manzillar: `/catalog/<slug>` va
        // orqasidan nuqta (fayl nomi) kelmaydigan holatlar.
        for (const match of source.matchAll(/\/catalog\/([a-z0-9-]{4,})(?![a-z0-9.-])/g)) {
          const slug = match[1];
          // statik fayl yo'llari (renderlar, pdf) katalog marshruti emas
          if (slug === '2027' || slug === 'pdf') continue;
          if (!validSlugs.has(slug) && !slug.startsWith('[')) {
            offenders.push(`${path.relative(srcDir, full)}: /catalog/${slug}`);
          }
        }
      }
    }
  };
  walk(srcDir);

  assert.deepStrictEqual(offenders, [], `Noma'lum kategoriya slug'i: ${offenders.join(', ')}`);

  // Ikkinchi qatlam: dinamik havolalar ham `SECTION_SLUGS` orqali qurilishi
  // kerak. Bo'lim nomi (`trotuar`) va marshrut slug'i (`paving`) farq qiladi —
  // shu xato tufayli header/footer havolalari bir paytlar 404 bergan.
  const dynamicOffenders = [];
  const walkDynamic = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkDynamic(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) {
        const source = fs.readFileSync(full, 'utf8');
        for (const match of source.matchAll(/catalog\/\$\{([^}]*)\}/g)) {
          const expr = match[1].trim();
          const ok = expr.startsWith('SECTION_SLUGS[') || expr === 'section' || expr === 'sec';
          if (!ok) dynamicOffenders.push(`${path.relative(srcDir, full)}: /catalog/\${${expr}}`);
        }
      }
    }
  };
  walkDynamic(srcDir);

  assert.deepStrictEqual(dynamicOffenders, [],
    `Bo'lim havolasi SECTION_SLUGS orqali qurilmagan: ${dynamicOffenders.join(', ')}`);
});

test('12. Forma maydonlari ekran o‘quvchi uchun nomlangan (a11y)', () => {
  const srcDir = path.join(__dirname, '..', 'src');
  const offenders = [];

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx$/.test(entry.name)) {
        const source = fs.readFileSync(full, 'utf8');
        const rel = path.relative(srcDir, full);

        // Har bir <input|select|textarea> `id`, `aria-label` yoki o'rab turgan
        // <label> ga ega bo'lishi shart. Checkbox/radio odatda label ichida
        // keladi; honeypot maydoni esa aria-hidden blok ichida.
        for (const match of source.matchAll(/<(input|select|textarea)\b/g)) {
          const start = match.index;
          const line = source.slice(0, start).split('\n').length;
          let i = match.index + match[0].length;
          let depth = 0;
          while (i < source.length) {
            const ch = source[i];
            if (ch === '{') depth++;
            else if (ch === '}') depth--;
            else if (ch === '>' && depth === 0 && source[i - 1] !== '=') break;
            i++;
          }
          const tag = source.slice(start, i + 1);
          if (tag.includes('id=') || tag.includes('aria-label')) continue;
          // Honeypot maydoni ataylab yashirin — ekran o'quvchi ko'rmasligi kerak.
          if (tag.includes('aria-hidden')) continue;
          if (/type="(checkbox|radio|hidden)"/.test(tag)) continue;
          offenders.push(`${rel}:${line}`);
        }
      }
    }
  };
  walk(srcDir);

  assert.deepStrictEqual(
    offenders,
    [],
    `Nomsiz forma maydoni: ${offenders.join(', ')}`
  );
});

test('13. Dinamik sahifalar nomaʼlum slug uchun 404 beradi (soft-404 yo‘q)', () => {
  const routes = [
    path.join('src', 'app', '[lang]', 'layout.tsx'),
    path.join('src', 'app', '[lang]', 'catalog', '[section]', 'page.tsx'),
    path.join('src', 'app', '[lang]', 'catalog', '[section]', '[slug]', 'page.tsx'),
  ];
  for (const route of routes) {
    const source = fs.readFileSync(path.join(__dirname, '..', route), 'utf8');
    assert.ok(
      source.includes('export const dynamicParams = false'),
      `${route}: \`dynamicParams = false\` bo'lmasa notFound() 200 status bilan qaytadi`
    );
    assert.ok(source.includes('generateStaticParams'), `${route}: generateStaticParams yo'q`);
    assert.ok(source.includes('notFound()'), `${route}: noma'lum parametr uchun notFound() chaqirilmaydi`);
  }

  // Til segmenti ham tekshiriladi: /xx/... uchun 404 (yoki /uz ga qaytish).
  const layout = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'app', '[lang]', 'layout.tsx'), 'utf8');
  assert.ok(layout.includes('isValidLocale'), 'layout til segmentini tekshirmaydi');
});

test('14. Sitemap/robots/hreflang yangi marshrutlar uchun (3 til + x-default)', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { loadAliased } = await import(path.join(__dirname, 'helpers', 'load-alias.mjs'));
  const { default: sitemap } = await loadAliased('src/app/sitemap.ts');
  const { default: robots } = await loadAliased('src/app/robots.ts');

  const entries = sitemap();
  assert.ok(entries.length > 300, `sitemap juda kichik: ${entries.length}`);

  // Har bir URL uch tilda va har birida hreflang to'plami bor.
  const perPath = new Map();
  for (const entry of entries) {
    const langs = entry.alternates.languages;
    assert.deepStrictEqual(Object.keys(langs).sort(), ['en', 'ru', 'uz', 'x-default'],
      `hreflang to'plami noto'g'ri: ${entry.url}`);
    assert.strictEqual(langs['x-default'], langs.uz, `x-default uz emas: ${entry.url}`);

    // "https://sps.uz/uz/catalog/..." -> "/catalog/...": til prefiksi olib
    // tashlanadi, shunda bir sahifaning uch tilli nusxasi bitta guruhga tushadi.
    const key = entry.url.split('/').slice(4).join('/');
    perPath.set(key, (perPath.get(key) || 0) + 1);
  }
  for (const [key, count] of perPath) {
    assert.strictEqual(count, 3, `${key}: uch tilda ham emas (${count})`);
  }

  // O'chirilgan marshrutlar va shaxsiy sahifalar sitemap'da bo'lmasligi kerak.
  const dead = ['/blog', '/projects', '/wishlist', '/search', '/about', '/product/', '/compare', '/request'];
  const offenders = entries.map((e) => e.url).filter((url) => dead.some((d) => url.includes(d)));
  assert.deepStrictEqual(offenders, [], `sitemap'da keraksiz URL: ${offenders.join(', ')}`);

  const rules = robots();
  const disallow = Array.isArray(rules.rules[0].disallow) ? rules.rules[0].disallow : [rules.rules[0].disallow];
  assert.ok(disallow.includes('/api/'), 'robots: /api/ yopilmagan');
  assert.ok(disallow.includes('/*/compare'), 'robots: compare yopilmagan');
  assert.ok(disallow.includes('/*/request'), 'robots: request yopilmagan');
  assert.ok(rules.sitemap.endsWith('/sitemap.xml'), "robots: sitemap manzili yo'q");
});

test('15. Brendlangan 404 sahifasi mavjud va uch tilda', () => {
  const notFound = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'not-found.tsx'), 'utf8');

  // Qidiruv tizimlari 404 sahifani indekslamasin.
  assert.match(notFound, /index: false/, '404 sahifasida noindex yo‘q');
  // Ikkala til auditoriyasi uchun ham yo'l ko'rsatilgan bo'lishi kerak.
  assert.match(notFound, /\/ru\/catalog/, '404: ru katalog havolasi yo‘q');
  assert.match(notFound, /\/en\/catalog/, '404: en katalog havolasi yo‘q');
  // Asosiy 404 tanasi (barcha tillar uchun) katalog havolalarini o'z ichiga oladi
  const body = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'components', 'site', 'NotFoundBody.tsx'),
    'utf8'
  );
  assert.match(body, /\/catalog\//, '404 tanasi: bo‘lim havolalari yo‘q');
  assert.ok(
    body.includes('action={`/${lang}/catalog`}'),
    '404 tanasi: qidiruv katalogga yuborilmaydi'
  );
  assert.match(notFound, /CONTACTS_2027/, '404: telefon havolasi yo‘q');
});
