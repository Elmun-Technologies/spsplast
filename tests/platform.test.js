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

test('8. Har bir kategoriyada 300+ so‘z SEO matn va 5+ FAQ bor (P1-7)', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'catalog.json'), 'utf8'));

  for (const category of catalog.categories) {
    for (const locale of ['uz', 'ru']) {
      const trans = category.translations.find((t) => t.locale === locale);
      const seo = trans && trans.seo;
      assert.ok(seo, `${category.id}/${locale}: SEO matn yo‘q`);

      const words = [
        seo.lead,
        ...seo.body.map((block) => `${block.heading} ${block.text}`),
        ...seo.bullets,
        ...seo.faq.flatMap((entry) => [entry.q, entry.a]),
      ]
        .join(' ')
        .split(/\s+/)
        .filter(Boolean).length;

      assert.ok(words >= 300, `${category.id}/${locale}: faqat ${words} so‘z (300+ kerak)`);
      assert.ok(seo.faq.length >= 5, `${category.id}/${locale}: FAQ 5 tadan kam`);
    }
  }
});

test('9. FAQ JSON-LD sahifadagi matn bilan bir manbadan yasaladi', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { HOME_FAQ, faqItems, faqJsonLd } = await loadTs('src/lib/faq.ts');

  const entries = faqItems(HOME_FAQ, 'ru');
  const jsonLd = faqJsonLd(entries);
  assert.strictEqual(jsonLd['@type'], 'FAQPage');
  assert.strictEqual(jsonLd.mainEntity.length, entries.length);
  assert.strictEqual(jsonLd.mainEntity[0].name, HOME_FAQ[0].ru.q);
  assert.strictEqual(jsonLd.mainEntity[0].acceptedAnswer.text, HOME_FAQ[0].ru.a);
});

test('10. Qidiruv indeksi statik fayl — /api/search chaqirilmaydi', () => {
  const indexPath = path.join(__dirname, '..', 'public', 'search-index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

  assert.strictEqual(index.products.length, 192);
  assert.strictEqual(index.categories.length, 3);
  // Har bir mahsulotda ikkala til uchun slug va sarlavha bo'lishi kerak:
  // 62 mahsulotda uz/ru slug'lari farq qiladi.
  for (const product of index.products) {
    assert.ok(product.slugUz && product.slugRu && product.titleUz && product.titleRu, `to‘liq emas: ${product.sku}`);
  }

  // Regression guard: header ilgari mavjud bo'lmagan qidiruv API'siga so'rov
  // yuborardi va takliflar jimgina bo'sh qolardi. Endi qidiruv statik indeks
  // ustida, brauzerda bajariladi.
  const srcDir = path.join(__dirname, '..', 'src');
  const offenders = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) {
        const source = fs.readFileSync(full, 'utf8');
        if (/fetch\(\s*[`'"]\/api\/search/.test(source)) offenders.push(path.relative(srcDir, full));
      }
    }
  };
  walk(srcDir);
  assert.deepStrictEqual(offenders, [], `Mavjud bo'lmagan API'ga so'rov: ${offenders.join(', ')}`);
});

test('11. Ichki havolalar faqat haqiqiy kategoriya slug‘laridan foydalanadi', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'catalog.json'), 'utf8'));
  const validSlugs = new Set(catalog.categories.flatMap((c) => c.translations.map((t) => t.slug)));

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
          if (!validSlugs.has(slug) && !slug.startsWith('[')) {
            offenders.push(`${path.relative(srcDir, full)}: /catalog/${slug}`);
          }
        }
      }
    }
  };
  walk(srcDir);

  assert.deepStrictEqual(offenders, [], `Noma'lum kategoriya slug'i: ${offenders.join(', ')}`);
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
    path.join('src', 'app', '[lang]', 'product', '[slug]', 'page.tsx'),
    path.join('src', 'app', '[lang]', 'catalog', '[categorySlug]', 'page.tsx'),
    path.join('src', 'app', '[lang]', 'blog', '[slug]', 'page.tsx'),
  ];
  for (const route of routes) {
    const source = fs.readFileSync(path.join(__dirname, '..', route), 'utf8');
    assert.match(
      source,
      /export const dynamicParams = false/,
      `${route}: \`dynamicParams = false\` bo'lmasa notFound() 200 status bilan qaytadi`
    );
    assert.match(source, /generateStaticParams/, `${route}: generateStaticParams yo'q`);
  }
});

test('14. uz/ru slug farqi hreflang va sitemapʼda hisobga olinadi', () => {
  const catalog = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'catalog.json'), 'utf8')
  );

  // Slug'i tildan tilga farq qiladigan yozuvlar bor — bu normal holat.
  const differing = catalog.products.filter((p) => {
    const uz = p.translations.find((t) => t.locale === 'uz');
    const ru = p.translations.find((t) => t.locale === 'ru');
    return uz && ru && uz.slug !== ru.slug;
  });
  assert.ok(differing.length > 0, 'uz/ru slug farqi kutilgan edi');

  // seo.ts: alternat manzillarni qabul qiladi va hreflang'da ishlatadi.
  const seo = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'seo.ts'), 'utf8');
  assert.match(seo, /alternatePaths/, 'seo.ts: alternatePaths maydoni yo‘q');
  assert.match(seo, /hreflang\(path, alternatePaths\)/, 'seo.ts: hreflang alternatlarni hisobga olmaydi');

  // Kategoriya va blog sahifalari per-locale slug uzatadi.
  for (const route of [
    path.join('src', 'app', '[lang]', 'catalog', '[categorySlug]', 'page.tsx'),
    path.join('src', 'app', '[lang]', 'blog', '[slug]', 'page.tsx'),
  ]) {
    const source = fs.readFileSync(path.join(__dirname, '..', route), 'utf8');
    assert.match(source, /alternatePaths/, `${route}: alternatePaths uzatilmaydi`);
  }

  // Sitemap: dinamik yozuvlar uchun har bir til o'z slug'ini yozadi va
  // kategoriya sahifalari ham ro'yxatga tushadi.
  const sitemap = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'sitemap.ts'), 'utf8');
  assert.match(sitemap, /entryAlternates\('product'/, 'sitemap: mahsulot alternatlari tuzilmagan');
  assert.match(sitemap, /entryAlternates\('catalog'/, 'sitemap: kategoriya alternatlari tuzilmagan');
  assert.match(sitemap, /entryAlternates\('blog'/, 'sitemap: blog alternatlari tuzilmagan');
  assert.match(sitemap, /catalog\.categories\.map/, 'sitemap: kategoriya sahifalari yo‘q');
});


test('15. Brendlangan 404 sahifasi mavjud va ikki tilda', () => {
  const notFound = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'not-found.tsx'), 'utf8');

  // Qidiruv tizimlari 404 sahifani indekslamasin.
  assert.match(notFound, /index: false/, '404 sahifasida noindex yo‘q');
  // Ikkala til auditoriyasi uchun ham yo'l ko'rsatilgan bo'lishi kerak.
  assert.match(notFound, /\/uz\/catalog/, '404: uz katalog havolasi yo‘q');
  assert.match(notFound, /\/ru\/catalog/, '404: ru katalog havolasi yo‘q');
  assert.match(notFound, /COMPANY_CONTACTS/, '404: telefon havolasi yo‘q');
});
