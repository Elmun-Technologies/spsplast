#!/usr/bin/env node
/**
 * Statik katalog generatori.
 *
 * Sayt backendsiz ishlaydi: barcha ommaviy sahifalar `src/data/catalog.json`
 * dan o'qiydi. Bu skript uchta manbani bitta faylga yig'adi:
 *
 *   1. catalog_build/products.json    — 2026 katalogi (130 ta G/A10 qolip)
 *   2. scripts/static/seed-data.js    — RU nomlar, bo'limlar, 12 ta PR#9 qolipi
 *   3. data/molds-2026.json           — 50 ta studiya seriyali qolip (variant o'qlari bilan)
 *   4. data/content-2026.json         — blog (7) va loyihalar (6)
 *
 * Chiqish: `src/data/catalog.json` — ilgari Prisma qaytargan shaklga
 * yaqinlashtirilgan obyektlar (translations, media, attributeValues, variants),
 * shuning uchun sahifalar deyarli o'zgarmagan holda statik manbaga o'tadi.
 *
 * Ishlatish:
 *   node scripts/build-static-catalog.js           # yozadi
 *   node scripts/build-static-catalog.js --check   # faqat tekshiradi (CI)
 *
 * Skript idempotent: bir xil kirishdan bir xil chiqish yasaladi (sanani ham
 * manbalardan oladi), shuning uchun git diff faqat haqiqiy o'zgarishda paydo
 * bo'ladi.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CATALOG = require(path.join(ROOT, 'catalog_build', 'products.json'));
const MOLDS = require(path.join(ROOT, 'data', 'molds-2026.json'));
const CONTENT = require(path.join(ROOT, 'data', 'content-2026.json'));
const CATEGORY_SEO = require(path.join(ROOT, 'data', 'category-seo-2026.json'));
const { RU_NAMES, SECTION_META, NEW_ITEMS } = require('./static/seed-data');

const OUT_FILE = path.join(ROOT, 'src', 'data', 'catalog.json');
// Qidiruv indeksi: header'dagi jonli takliflar uchun yengil fayl. Alohida
// fayl bo'lgani uchun foydalanuvchi qidirmaguncha yuklanmaydi (har sahifaning
// HTML'iga 40 KB indeks solib qo'yilmaydi).
const SEARCH_INDEX_FILE = path.join(ROOT, 'public', 'search-index.json');
const CHECK_ONLY = process.argv.includes('--check');

/** Katalog manbalari sanasi — barcha mahsulotlar uchun `updatedAt` bo'lib xizmat qiladi. */
const CATALOG_DATE = MOLDS.generatedAt || '2026-09-27';

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[‘'ʻʼ`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Studiya seriyasidagi tekstura kodlari (import-molds-2026.js dagi bilan bir xil). */
const TEXTURE_LABELS = {
  brick: { uz: 'G‘isht', ru: 'Кирпич' },
  stone: { uz: 'Tosh', ru: 'Камень' },
  smooth: { uz: 'Silliq', ru: 'Гладкая' },
  gloss: { uz: 'Yaltiroq', ru: 'Глянец' },
  '3d': { uz: '3D relef', ru: '3D рельеф' },
  faceted: { uz: 'Qirrali', ru: 'Гранёная' },
};

/** molds-2026.json dagi kategoriya kaliti -> katalog bo'limi. */
const CATEGORY_TO_SECTION = {
  bruschatka: 'S1',
  bordyur: 'S1',
  plitka: 'S2',
  'devor-panel': 'S3',
  fasad: 'S3',
  termopanel: 'S3',
};

const SECTION_ORDER = ['S1', 'S2', 'S3'];

// ---------------------------------------------------------------------------
// Atributlar
// ---------------------------------------------------------------------------

const ATTRIBUTES = [
  {
    id: 'attr-dimensions',
    code: 'dimensions',
    sortOrder: 1,
    translations: [
      { locale: 'uz', name: 'O‘lchami' },
      { locale: 'ru', name: 'Размер' },
    ],
  },
  {
    id: 'attr-material',
    code: 'material',
    sortOrder: 2,
    translations: [
      { locale: 'uz', name: 'Material' },
      { locale: 'ru', name: 'Материал' },
    ],
  },
  {
    id: 'attr-texture',
    code: 'texture',
    sortOrder: 3,
    translations: [
      { locale: 'uz', name: 'Tekstura / Yuzasi' },
      { locale: 'ru', name: 'Фактура / Поверхность' },
    ],
  },
];

const attributeByCode = Object.fromEntries(ATTRIBUTES.map((a) => [a.code, a]));

function attributeValue(code, textValue, option) {
  const attribute = attributeByCode[code];
  return {
    attribute: { code: attribute.code, sortOrder: attribute.sortOrder, translations: attribute.translations },
    textValue: textValue ?? null,
    option: option || null,
  };
}

function textureOption(code) {
  const labels = TEXTURE_LABELS[code];
  if (!labels) return null;
  return {
    code,
    translations: [
      { locale: 'uz', label: labels.uz },
      { locale: 'ru', label: labels.ru },
    ],
  };
}

// ---------------------------------------------------------------------------
// Kategoriyalar
// ---------------------------------------------------------------------------

const CATEGORY_IMAGES = {
  S1: '/catalog/2026/G001-quyma.jpg',
  S2: '/catalog/2026/G050-quyma.jpg',
  S3: '/catalog/2026/A10-001-quyma.jpg',
};

/** Kategoriya SEO matni (`data/category-seo-2026.json`) — har bir bo'lim ikki tilda. */
function seoFor(section, locale) {
  const entry = CATEGORY_SEO.sections[section];
  if (!entry || !entry[locale]) {
    // validate() bu holatni build'ni to'xtatib ushlaydi; bu yerda bo'sh obyekt
    // qaytaramiz, shunda sahifa crash bo'lmaydi.
    return null;
  }
  return entry[locale];
}

function buildCategories() {
  return SECTION_ORDER.map((section, index) => {
    const meta = SECTION_META[section];
    return {
      id: `cat-${section.toLowerCase()}`,
      parentId: null,
      image: CATEGORY_IMAGES[section],
      sortOrder: index,
      status: 'ACTIVE',
      section,
      translations: [
        {
          locale: 'uz',
          name: meta.catNameUz,
          slug: meta.catSlugUz,
          description: meta.catDescUz,
          seo: seoFor(section, 'uz'),
        },
        {
          locale: 'ru',
          name: meta.catNameRu,
          slug: meta.catSlugRu,
          description: meta.catDescRu,
          seo: seoFor(section, 'ru'),
        },
      ],
    };
  });
}

// ---------------------------------------------------------------------------
// Mahsulotlar
// ---------------------------------------------------------------------------

function productBase({ id, sku, section, isNew, isBestseller, yieldPerCast, media, translations, attributeValues, variants }) {
  return {
    id,
    sku,
    status: 'ACTIVE',
    basePrice: 0,
    compareAtPrice: null,
    currency: 'UZS',
    // Diqqat: sayt ombor qoldig'ini yuritmaydi. `inStock: true` shunchaki
    // "mahsulot katalogda faol" degani, `stockQty` esa noma'lum (null) —
    // ilgari bu yerda 100 ta soxta qoldiq turardi va UI "Omborda mavjud" deb
    // yozardi (P0-8). Mavjudlikni menejer qo'ng'iroqda tasdiqlaydi.
    inStock: true,
    stockQty: null,
    isBestseller: !!isBestseller,
    isNew: !!isNew,
    yieldPerCast: yieldPerCast ?? null,
    durabilityCasts: null,
    videoUrl: null,
    updatedAt: CATALOG_DATE,
    categoryId: `cat-${section.toLowerCase()}`,
    translations,
    media,
    attributeValues,
    variants: variants || [],
  };
}

/** 1) 2026 katalogi — 130 ta qolip (G001…G103, A10-…) */
function buildCatalogProducts() {
  return CATALOG.map((p) => {
    const meta = SECTION_META[p.section];
    const nameUz = '«' + p.name + '»' + meta.nameSuffixUz;
    const nameRu = meta.nameSuffixRu + '«' + RU_NAMES[p.code] + '»';
    // Katalogdagi slug ikki tilda bir xil — kod band (masalan, g001-floriya).
    const slug = slugify(p.code + '-' + p.name);
    const dimsClean = p.dims.replace(/\*/g, '').replace(/\s*mm$/i, '').trim();
    const assumedNoteUz = p.assumed
      ? ' Yulduzcha (*) bilan belgilangan o‘lcham standart qiymat — buyurtmada menejer bilan aniqlashtiriladi.'
      : '';
    const assumedNoteRu = p.assumed
      ? ' Размер со звёздочкой (*) — стандартное значение, уточняется при заказе.'
      : '';
    const multiNoteUz = p.multi
      ? ' Bu to‘plam bir nechta elementdan (A / B / V) iborat — batafsil ma’lumot uchun menejer bilan bog‘laning.'
      : '';
    const multiNoteRu = p.multi
      ? ' Этот комплект состоит из нескольких элементов (A / B / V) — подробности уточняйте у менеджера.'
      : '';

    const shortUz = `${p.slogan} ${meta.kindUz.charAt(0).toUpperCase() + meta.kindUz.slice(1)}. O‘lcham: ${dimsClean} mm.`;
    const shortRu = `${meta.kindRu.charAt(0).toUpperCase() + meta.kindRu.slice(1)} «${RU_NAMES[p.code]}». Размер: ${dimsClean} мм.`;
    const descUz = `«${p.name}» — ${meta.kindUz} (katalog kodi: ${p.code}). ${p.slogan} Qolip mustahkam polipropilen/ABS plastikdan tayyorlangan: aniq geometriya, barqaror natija va qayta-qayta ishlatish imkoniyati. O‘lcham: ${p.dims} mm.${assumedNoteUz}${multiNoteUz} Yetkazib berish O‘zbekiston bo‘ylab. Narx vaqtinchalik — so‘nggi narx uchun menejer bilan bog‘laning.`;
    const descRu = `«${RU_NAMES[p.code]}» — ${meta.kindRu} (код каталога: ${p.code}). Форма изготовлена из прочного полипропилена/АБС: точная геометрия, стабильный результат и многократное использование. Размер: ${dimsClean} мм.${assumedNoteRu}${multiNoteRu} Доставка по всему Узбекистану. Актуальную цену уточняйте у менеджера.`;

    return productBase({
      id: `p-${p.code.toLowerCase()}`,
      sku: 'SPS-' + p.code,
      section: p.section,
      isNew: p.isNew,
      isBestseller: false,
      media: [
        { type: 'MAIN', sortOrder: 1, url: `/catalog/2026/${p.code}-mold.jpg`, alt: `${nameUz} — qolip` },
        { type: 'FINISHED_RESULT', sortOrder: 2, url: `/catalog/2026/${p.code}-quyma.jpg`, alt: `${nameUz} — tayyor natija (quyma)` },
        { type: 'USAGE', sortOrder: 3, url: `/catalog/2026/${p.code}-env.jpg`, alt: `${nameUz} — qo‘llanish namunasi` },
      ],
      translations: [
        {
          locale: 'uz',
          name: nameUz,
          slug,
          shortDescription: shortUz,
          description: descUz,
          metaTitle: `${nameUz} — SPS Plast`,
          metaDescription: shortUz.slice(0, 160),
        },
        {
          locale: 'ru',
          name: nameRu,
          slug,
          shortDescription: shortRu,
          description: descRu,
          metaTitle: `${nameRu} — SPS Plast`,
          metaDescription: shortRu.slice(0, 160),
        },
      ],
      attributeValues: [
        attributeValue('dimensions', p.dims),
        attributeValue('material', 'Polipropilen / ABS'),
      ],
    });
  });
}

/** 2) PR#9 — 12 ta yangi qolip (2026-09-27 studiya suratlari). */
function buildNewItems() {
  return NEW_ITEMS.map((it) => {
    const img = '/catalog/catalog-' + String(it.img).padStart(3, '0') + '.jpg';
    return productBase({
      id: `p-${it.sku.toLowerCase()}`,
      sku: it.sku,
      section: it.cat,
      isNew: true,
      isBestseller: it.bestseller,
      yieldPerCast: it.ypc,
      media: [{ type: 'MAIN', sortOrder: 1, url: img, alt: it.nameUz }],
      translations: [
        {
          locale: 'uz',
          name: it.nameUz,
          slug: it.slugUz,
          shortDescription: `${it.nameUz}. O‘lcham: ${it.dims}. Yangi model — 2026.`,
          description: `${it.nameUz}. SPS Plast zavodida ishlab chiqarilgan yuqori sifatli ABS/polipropilen qolip. Aniq geometriya, 200+ quyishga chidamli. O‘lcham: ${it.dims}. Yangi model — 2026. Narx vaqtinchalik — so‘nggi narx uchun menejer bilan bog‘laning.`,
          metaTitle: `${it.nameUz} — SPS Plast`,
        },
        {
          locale: 'ru',
          name: it.nameRu,
          slug: it.slugRu,
          shortDescription: `${it.nameRu}. Размер: ${it.dims}. Новая модель — 2026.`,
          description: `${it.nameRu}. Высококачественная форма из АБС/полипропилена производства SPS Plast. Точная геометрия, ресурс 200+ заливок. Размер: ${it.dims}. Новая модель — 2026. Актуальную цену уточняйте у менеджера.`,
          metaTitle: `${it.nameRu} — SPS Plast`,
        },
      ],
      attributeValues: [
        attributeValue('dimensions', it.dims),
        attributeValue('material', 'Polipropilen / ABS'),
      ],
    });
  });
}

/** 3) Studiya seriyasi — 50 ta qolip, variant o'qlari bilan. */
function buildMoldProducts() {
  const axes = MOLDS.optionAxes;

  return MOLDS.products.map((item) => {
    const section = CATEGORY_TO_SECTION[item.category];
    if (!section) throw new Error(`Noma'lum kategoriya: ${item.category} (${item.sku})`);

    const dimensions = item.dimensionsConfirmed ? item.dimensions : `${item.dimensions}*`;

    // Variant kombinatsiyalari (masalan, PP/ABS × 2.0/3.0 mm) — har biriga SKU.
    const axisCodes = (item.options || []).filter((code) => axes[code]);
    let combos = [[]];
    for (const axisCode of axisCodes) {
      const next = [];
      for (const combo of combos) {
        for (const value of axes[axisCode].values) next.push([...combo, { axisCode, value }]);
      }
      combos = next;
    }

    const variants = combos
      .filter((combo) => combo.length > 0)
      .map((combo, index) => ({
        id: `v-${item.sku.toLowerCase()}-${combo.map((c) => c.value.code).join('-')}-${index}`,
        sku: `${item.sku}-${combo.map((c) => c.value.code.toUpperCase()).join('-')}`,
        price: item.price ?? 0,
        // Qoldiq yuritilmaydi: sayt omborni bilmaydi, shuning uchun soxta
        // raqam yozilmaydi (mahsulot kartasi bilan bir xil qoida, P0-8).
        stockQty: null,
        status: 'ACTIVE',
        options: combo.map((c) => {
          const axis = axes[c.axisCode];
          return {
            option: {
              code: c.value.code,
              attribute: {
                code: c.axisCode,
                sortOrder: 10,
                translations: [
                  { locale: 'uz', name: axis.nameUz },
                  { locale: 'ru', name: axis.nameRu },
                ],
              },
              translations: [
                { locale: 'uz', label: c.value.labelUz },
                { locale: 'ru', label: c.value.labelRu },
              ],
            },
          };
        }),
      }));

    return productBase({
      id: `p-${item.sku.toLowerCase()}`,
      sku: item.sku,
      section,
      isNew: item.isNew,
      isBestseller: item.bestseller,
      yieldPerCast: item.cavities > 1 ? item.cavities : null,
      media: [{ type: 'MAIN', sortOrder: 1, url: item.image, alt: item.nameUz }],
      translations: [
        {
          locale: 'uz',
          name: item.nameUz,
          slug: item.slugUz,
          shortDescription: item.shortUz,
          description: item.descUz,
          metaTitle: `${item.nameUz} — SPS`,
          metaDescription: item.shortUz,
        },
        {
          locale: 'ru',
          name: item.nameRu,
          slug: item.slugRu,
          shortDescription: item.shortRu,
          description: item.descRu,
          metaTitle: `${item.nameRu} — SPS`,
          metaDescription: item.shortRu,
        },
      ],
      attributeValues: [
        attributeValue('dimensions', dimensions),
        attributeValue('material', item.material || 'Polipropilen / ABS'),
        ...(textureOption(item.texture) ? [attributeValue('texture', null, textureOption(item.texture))] : []),
      ],
      variants,
    });
  });
}

// ---------------------------------------------------------------------------
// Kontent: blog va loyihalar
// ---------------------------------------------------------------------------

function buildBlog() {
  return CONTENT.blog.map((post, index) => ({
    id: `blog-${post.slug}`,
    coverImage: post.coverImage,
    author: post.author || 'SPS Plast mutaxassisi',
    isPublished: true,
    publishedAt: post.publishedAt,
    updatedAt: post.publishedAt,
    sortOrder: index,
    translations: [
      { locale: 'uz', slug: post.slug, title: post.uz.title, excerpt: post.uz.excerpt, content: post.uz.content },
      {
        locale: 'ru',
        slug: post.ru.slug || `${post.slug}-ru`,
        title: post.ru.title,
        excerpt: post.ru.excerpt,
        content: post.ru.content,
      },
    ],
  }));
}

function buildProjects() {
  return CONTENT.projects.map((project, index) => ({
    id: `project-${project.slug}`,
    slug: project.slug,
    beforeImage: project.beforeImage,
    afterImage: project.afterImage,
    location: project.location,
    productUsed: project.productUsed,
    sortOrder: index,
    titleUz: project.uz.title,
    titleRu: project.ru.title,
    descriptionUz: project.uz.description,
    descriptionRu: project.ru.description,
  }));
}

// ---------------------------------------------------------------------------
// Yig'ish va yozish
// ---------------------------------------------------------------------------

function build() {
  const categories = buildCategories();
  const products = [...buildCatalogProducts(), ...buildNewItems(), ...buildMoldProducts()];

  // Kategoriya bo'yicha mahsulot soni (sahifalarda `_count.products` sifatida ishlatiladi).
  const counts = {};
  for (const product of products) counts[product.categoryId] = (counts[product.categoryId] || 0) + 1;
  for (const category of categories) category.productCount = counts[category.id] || 0;

  return {
    $comment:
      'AUTO-GENERATED — qo‘lda tahrirlamang. Manba: catalog_build/products.json, data/molds-2026.json, ' +
      'scripts/static/seed-data.js. Qayta yasash: node scripts/build-static-catalog.js',
    version: '2026.10',
    catalogDate: CATALOG_DATE,
    currency: MOLDS.currency || 'UZS',
    categories,
    attributes: ATTRIBUTES,
    products,
    blog: buildBlog(),
    projects: buildProjects(),
  };
}

function validate(data) {
  const problems = [];

  if (data.products.length !== 192) {
    problems.push(`Mahsulotlar soni 192 bo'lishi kerak, hozir: ${data.products.length}`);
  }
  if (data.categories.length !== 3) {
    problems.push(`Kategoriyalar soni 3 bo'lishi kerak, hozir: ${data.categories.length}`);
  }
  if (data.blog.length !== CONTENT.blog.length) {
    problems.push('Blog yozuvlari to‘liq emas');
  }

  // P1-7: har bir kategoriya uchun 300+ so'zlik SEO matn va kamida 5 FAQ
  // bo'lishi shart — kontent yetishmasa build to'xtaydi, "bo'sh" SEO sahifa
  // deploy bo'lib qolmaydi.
  for (const category of data.categories) {
    for (const locale of ['uz', 'ru']) {
      const trans = category.translations.find((t) => t.locale === locale);
      const seo = trans && trans.seo;
      if (!seo || !seo.lead || !Array.isArray(seo.body) || !Array.isArray(seo.faq)) {
        problems.push(`${category.id}/${locale}: SEO matn yo‘q (data/category-seo-2026.json)`);
        continue;
      }
      const words = [
        seo.lead,
        ...seo.body.map((block) => `${block.heading} ${block.text}`),
        ...(seo.bullets || []),
        ...seo.faq.flatMap((entry) => [entry.q, entry.a]),
      ]
        .join(' ')
        .split(/\s+/)
        .filter(Boolean).length;
      if (words < 300) problems.push(`${category.id}/${locale}: SEO matn ${words} so‘z (300+ kerak)`);
      if (seo.faq.length < 5) problems.push(`${category.id}/${locale}: FAQ ${seo.faq.length} ta (5+ kerak)`);
    }
  }

  const skus = new Set();
  const slugs = new Set();
  for (const product of data.products) {
    if (skus.has(product.sku)) problems.push(`SKU takrorlangan: ${product.sku}`);
    skus.add(product.sku);

    for (const locale of ['uz', 'ru']) {
      const trans = product.translations.find((t) => t.locale === locale);
      if (!trans || !trans.name || !trans.slug) {
        problems.push(`${product.sku}: ${locale} tarjimasi to‘liq emas`);
        continue;
      }
      const key = `${locale}:${trans.slug}`;
      if (slugs.has(key)) problems.push(`Slug takrorlangan: ${key}`);
      slugs.add(key);
    }

    for (const media of product.media) {
      const file = path.join(ROOT, 'public', media.url.replace(/^\//, ''));
      if (!fs.existsSync(file)) problems.push(`${product.sku}: rasm topilmadi — ${media.url}`);
    }
  }

  for (const entry of [...data.blog, ...data.projects]) {
    if (entry.coverImage) {
      const file = path.join(ROOT, 'public', entry.coverImage.replace(/^\//, ''));
      if (!fs.existsSync(file)) problems.push(`Rasm topilmadi: ${entry.coverImage}`);
    }
    if (entry.beforeImage) {
      const file = path.join(ROOT, 'public', entry.beforeImage.replace(/^\//, ''));
      if (!fs.existsSync(file)) problems.push(`Rasm topilmadi: ${entry.beforeImage}`);
    }
  }

  return problems;
}

/**
 * Qidiruv indeksi: slug, sarlavha (uz/ru), SKU, rasm va kategoriya.
 * Narx indeksga kirmaydi — saytda narx menejer tomonidan tasdiqlanadi.
 */
function buildSearchIndex(data) {
  return {
    generatedAt: data.generatedAt || CATALOG_DATE,
    categories: data.categories.map((category) => {
      const uz = category.translations.find((t) => t.locale === 'uz') || {};
      const ru = category.translations.find((t) => t.locale === 'ru') || {};
      return {
        id: category.id,
        slugUz: uz.slug || category.id,
        slugRu: ru.slug || uz.slug || category.id,
        nameUz: uz.name || category.id,
        nameRu: ru.name || uz.name || category.id,
      };
    }),
    products: data.products.map((product) => {
      const uz = product.translations.find((t) => t.locale === 'uz') || {};
      const ru = product.translations.find((t) => t.locale === 'ru') || {};
      return {
        id: product.id,
        sku: product.sku,
        categoryId: product.categoryId,
        slugUz: uz.slug || product.id,
        slugRu: ru.slug || uz.slug || product.id,
        titleUz: uz.name || product.sku,
        titleRu: ru.name || uz.name || product.sku,
        image: product.media[0]?.url || null,
      };
    }),
  };
}

function main() {
  const data = build();
  const problems = validate(data);

  if (problems.length > 0) {
    console.error(`Statik katalogda ${problems.length} ta muammo:`);
    for (const problem of problems.slice(0, 40)) console.error('  - ' + problem);
    process.exit(1);
  }

  const json = JSON.stringify(data, null, 2) + '\n';

  if (CHECK_ONLY) {
    const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : '';
    if (current !== json) {
      console.error('src/data/catalog.json eskirgan. `node scripts/build-static-catalog.js` ishga tushiring.');
      process.exit(1);
    }
    const indexPath = fs.existsSync(SEARCH_INDEX_FILE) ? fs.readFileSync(SEARCH_INDEX_FILE, 'utf8') : '';
    if (indexPath !== JSON.stringify(buildSearchIndex(data), null, 2) + '\n') {
      console.error('public/search-index.json eskirgan. `node scripts/build-static-catalog.js` ishga tushiring.');
      process.exit(1);
    }
    console.log('Statik katalog joyida: ' + data.products.length + ' mahsulot, ' + data.categories.length + ' kategoriya.');
    return;
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, json);
  fs.writeFileSync(SEARCH_INDEX_FILE, JSON.stringify(buildSearchIndex(data), null, 2) + '\n');
  console.log(
    `src/data/catalog.json yozildi: ${data.products.length} mahsulot, ${data.categories.length} kategoriya, ` +
      `${data.blog.length} maqola, ${data.projects.length} loyiha.`
  );
}

main();
