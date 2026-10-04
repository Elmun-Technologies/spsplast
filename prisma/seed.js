/**
 * SPS Plast — katalog bazasi (2026 katalogi: 130 qolip)
 * Data: catalog_build/products.json + public/catalog/2026/ images.
 * Media rollari: MAIN = qolip (card), FINISHED_RESULT = quyma (hover + slider),
 * USAGE = makon ko'rinishi (gallery).
 */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
const path = require('path');
const CATALOG = require(path.join(__dirname, '..', 'catalog_build', 'products.json'));
const CONTENT = require(path.join(__dirname, 'data', 'content-2026.json'));

// --- RU nomlar (katalog asosida tarjima / transliteratsiya) ---
const RU_NAMES = {
  'G001': 'Флория',
  'G002': 'Магна',
  'G003': 'Версаче 1',
  'G004': 'Азара',
  'G005': 'Ялта',
  'G006': 'Монако',
  'G007': 'Шерша',
  'G008': 'Рокки',
  'G009': 'Ромбик (новинка)',
  'G010': 'Азалия 1',
  'G011': 'Астана',
  'G012': 'Юлдуз',
  'G013': 'Туркменский цветок',
  'G014': 'Эксклюзив',
  'G015': 'Вегас 1',
  'G016': 'Бухара',
  'G017': 'Афина',
  'G018': 'Роял 2',
  'G019': 'Пальма',
  'G020': 'Бумеранг',
  'G021': 'Дубай — Камень',
  'G022': 'Дубай — Шерша',
  'G023': 'Дубай — Круг',
  'G024': 'Парус',
  'G025': 'Рио',
  'G026': 'Дождик',
  'G027': 'Кабанчик 10',
  'G028': 'Виндовс',
  'G029': '4D / Шерша',
  'G030': 'Восьмигранный цветок',
  'G031': 'Диагональный камень',
  'G032': 'Парная каменная текстура',
  'G033': 'Разделённый кирпич',
  'G034': 'Шесть плоских ячеек',
  'G035': 'Четыре крыла',
  'G036': 'Вложенные квадраты',
  'G037': 'Узорный медальон',
  'G038': 'Парный восьмигранный цветок',
  'G039': 'Два плоских сегмента',
  'G040': 'Длинная волна',
  'G041': 'Шесть граней',
  'G042': 'Полосатый бордюр',
  'G043': 'Длинная плоская панель',
  'G044': 'Панель с ромбами',
  'G045': 'Кирпич и камень',
  'G046': 'Четыре крыла',
  'G047': 'Широкий восьмигранник',
  'G048': 'Вытянутый орнамент',
  'G049': 'Лучевая звезда',
  'G050': 'Квадратный медальон',
  'G051': 'Изогнутый кирпич',
  'G052': 'Волнистая панель',
  'G053': 'Диагональные полосы',
  'G054': 'Соединённые ячейки',
  'G055': 'Мелкие камни',
  'G056': 'Панель с рамкой',
  'G057': 'Зернистая текстура',
  'G058': 'Дугообразный кирпич',
  'G059': 'Волнистый рельеф',
  'G060': 'Шесть ячеек',
  'G061': 'Восьмигранный орнамент',
  'G062': 'Ячейка с четырьмя узорами',
  'G063': 'Продольный жёлоб',
  'G064': 'Парный цветочный медальон',
  'G065': 'Пирамидальный центр',
  'G066': 'Геометрическая пирамида',
  'G067': 'Плоский кирпич',
  'G068': 'Каменный кирпич',
  'G069': 'Плоская панель',
  'G070': 'Растительная текстура',
  'G071': 'Плоский восьмигранник',
  'G072': 'Четырёхлистный цветок',
  'G073': 'Парный растительный узор',
  'G074': 'Вытянутый центр цветка',
  'G075': 'Рифлёный профиль',
  'G076': 'Прямоугольная геометрия',
  'G077': 'Вытянутая звезда',
  'G078': 'Вытянутый камень',
  'G079': 'Двухконечный контур',
  'G080': 'Парный геометрический цветок',
  'G081': 'Восемь граней',
  'G082': 'Заострённый цветочный узор',
  'G083': 'Шероховатый кирпич',
  'G084': 'Слоистый кирпич',
  'G085': 'Парный каменный восьмигранник',
  'G086': 'Растительный узор с бордюром',
  'G087': 'Соединённые ромбы',
  'G088': 'Парная волокнистая текстура',
  'G089': 'Вытянутая волна',
  'G090': 'Два глубоких сегмента',
  'G091': 'Парный скрученный узор',
  'G092': 'Четырёхконечная геометрия',
  'G093': 'Шестигранный центр',
  'G094': 'Гранистая диагональная панель',
  'G095': 'Ступенчатая длинная рамка',
  'G096': 'Ступенчатая квадратная рамка',
  'G097': 'Ступенчатая широкая рамка',
  'G098': 'Плоская длинная панель',
  'G099': 'Продольные ленты',
  'G100': 'Широкие продольные ленты',
  'G101': 'Фигурный продольный профиль',
  'G102': 'Гладкий изогнутый профиль',
  'G103': 'Длинная панель с бордюром',
  'A10-001': 'Фрагментный рельеф',
  'A10-002': 'Зернистая поверхность',
  'A10-003': 'Ступенчатый бордюр',
  'A10-004': 'Плоский центр',
  'A10-005': 'Классический бордюр',
  'A10-006': 'Тонкий бордюр',
  'A10-007': 'Гладкая панель',
  'A10-008': 'Ритм кирпича',
  'A10-009': 'Зернистая текстура',
  'A10-010': 'Волокнистая текстура',
  'A10-011': 'Кирпичная кладка',
  'A10-012': 'Внутренняя рамка',
  'A10-013': 'Центральный орнамент',
  'A10-023': 'Повторяющиеся ячейки',
  'A10-024': 'Плоский профиль',
  'A10-025': 'Ступенчатый профиль',
  'A10-026': 'Геометрический узор',
  'A10-027': 'Ячейки с рамкой',
  'A10-028': 'Слоистый камень',
  'A10-029': 'Каменная кладка',
  'A10-030': 'Вытянутые ячейки',
  'A10-031': 'Прямоугольные камни',
  'A10-032': 'Узорный бордюр',
  'A10-033': 'Камень и геометрия',
  'A10-034': 'Соединённые линии',
  'A10-035': 'Гранистая геометрия',
  'A10-036': 'Овальный ритм',
};

const SECTION_META = {
  S1: {
    catSlugUz: 'bruschatka-trotuar-qoliplari', catSlugRu: 'formy-dlya-bruschatki',
    catNameUz: 'Bruschatka va trotuar plitkasi qoliplari', catNameRu: 'Формы для брусчатки и тротуарной плитки',
    catDescUz: 'Yo‘lak, hovli va maydonlar uchun bruschatka hamda trotuar plitkasi qoliplari. 2026 katalogidagi G001–G029 seriyasi.',
    catDescRu: 'Формы для брусчатки и тротуарной плитки для дорожек, дворов и площадей. Серия G001–G029 из каталога 2026.',
    nameSuffixUz: ' qolipi', nameSuffixRu: 'Форма ',
    kindUz: 'bruschatka va trotuar plitkasi uchun plastik qolip',
    kindRu: 'пластиковая форма для брусчатки и тротуарной плитки',
  },
  S2: {
    catSlugUz: 'dekorativ-plitka-qoliplari', catSlugRu: 'formy-dlya-dekorativnoy-plitki',
    catNameUz: 'Dekorativ relyefli plita qoliplari', catNameRu: 'Формы для декоративной плитки',
    catDescUz: 'Gulli, naqshli va relyefli dekorativ plitalar uchun qoliplar. 2026 katalogidagi G030–G103 seriyasi.',
    catDescRu: 'Формы для декоративных плиток с цветочным, узорным и рельефным рисунком. Серия G030–G103 из каталога 2026.',
    nameSuffixUz: ' qolipi', nameSuffixRu: 'Форма ',
    kindUz: 'dekorativ relyefli plita uchun plastik qolip',
    kindRu: 'пластиковая форма для декоративной рельефной плитки',
  },
  S3: {
    catSlugUz: 'panel-profil-qoliplari', catSlugRu: 'formy-dlya-paneley-profiley',
    catNameUz: 'Devor paneli va profil (hoshiya) qoliplari', catNameRu: 'Формы для панелей и профилей',
    catDescUz: 'Fasad uchun 3D panel, karniz va profil (hoshiya) qoliplari. 2026 katalogidagi A10 seriyasi.',
    catDescRu: 'Формы для 3D-панелей, карнизов и профилей для фасадов. Серия A10 из каталога 2026.',
    nameSuffixUz: ' panel qolipi', nameSuffixRu: 'Форма для панелей ',
    kindUz: 'devor paneli va profil (hoshiya) uchun plastik qolip',
    kindRu: 'пластиковая форма для стеновой панели и профиля',
  },
};

const MAIN = process.env.DATABASE_URL || 'postgresql://sps@127.0.0.1:5433/spsplast_db';
const DIRECT = process.env.DIRECT_URL || MAIN;

const slugify = (s) =>
  s.toLowerCase()
    .replace(/[‘'ʻʼ`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function main() {
  const adapter = new PrismaPg({ connectionString: MAIN });
  const prisma = new PrismaClient({ adapter });

  console.log('Seeding SPS Plast catalog 2026 (' + CATALOG.length + ' products)...');

  // idempotent: clear catalog data (keep admin)
  for (const m of [
    'productMedia', 'productAttributeValue', 'productVariantOption', 'productVariant',
    'productTranslation', 'productCategory', 'product',
    'categoryAttribute', 'categoryTranslation', 'category',
    'attributeOptionTranslation', 'attributeOption', 'attributeTranslation', 'attributeDefinition',
    'banner', 'project', 'blogPostTranslation', 'blogPost',
  ]) {
    await prisma[m].deleteMany({});
  }
  console.log('Previous catalog data cleared');

  // ---------- Admin ----------
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@spsplast.uz';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: 'ADMIN' },
    create: {
      email: adminEmail, name: 'SPS Admin', passwordHash, role: 'ADMIN',
    },
  });
  console.log('Admin user ready:', adminEmail);

  // ---------- Attribute definitions ----------
  const attrDimensions = await prisma.attributeDefinition.create({
    data: {
      code: 'dimensions', type: 'TEXT', unit: 'mm', filterable: true,
      translations: { create: [
        { locale: 'uz', name: 'O‘lchami' },
        { locale: 'ru', name: 'Размер' },
      ]},
    },
  });
  const attrMaterial = await prisma.attributeDefinition.create({
    data: {
      code: 'material', type: 'TEXT', unit: null, filterable: true,
      translations: { create: [
        { locale: 'uz', name: 'Material' },
        { locale: 'ru', name: 'Материал' },
      ]},
    },
  });
  const attrTexture = await prisma.attributeDefinition.create({
    data: {
      code: 'texture', type: 'SELECT', unit: null, filterable: true,
      translations: { create: [
        { locale: 'uz', name: 'Tekstura / Yuzasi' },
        { locale: 'ru', name: 'Фактура / Поверхность' },
      ]},
    },
  });
  const attrColor = await prisma.attributeDefinition.create({
    data: {
      code: 'color', type: 'SELECT', unit: null, filterable: false,
      translations: { create: [
        { locale: 'uz', name: 'Mavjud ranglar' },
        { locale: 'ru', name: 'Доступные цвета' },
      ]},
    },
  });

  for (const o of [
    { code: 'brick', uz: 'G‘isht simon', ru: 'Кирпичная' },
    { code: 'stone', uz: 'Tosh simon', ru: 'Каменная' },
    { code: 'smooth', uz: 'Silliq', ru: 'Гладкая' },
    { code: 'gloss', uz: 'Yaltiroq', ru: 'Глянец' },
    { code: '3d', uz: '3D relef', ru: '3D рельеф' },
    { code: 'faceted', uz: 'Qirrali', ru: 'Гранёная' },
  ]) {
    await prisma.attributeOption.create({
      data: {
        attributeId: attrTexture.id, code: o.code, sortOrder: 1,
        translations: { create: [{ locale: 'uz', label: o.uz }, { locale: 'ru', label: o.ru }] },
      },
    });
  }
  for (const o of [
    { code: 'travertin', uz: 'Travertin', ru: 'Травертин' },
    { code: 'mramor', uz: 'Mramor', ru: 'Мрамор' },
    { code: 'bej', uz: 'Bej', ru: 'Бежевый' },
    { code: 'kulrang', uz: 'Kulrang', ru: 'Серый' },
    { code: 'ok', uz: 'Oq', ru: 'Белый' },
    { code: 'polipropilen', uz: 'Polipropilen', ru: 'Полипропилен' },
    { code: 'abs', uz: 'ABS plastik', ru: 'АБС пластик' },
    { code: 'qora', uz: 'Qora', ru: 'Чёрный' },
  ]) {
    await prisma.attributeOption.create({
      data: {
        attributeId: attrColor.id, code: o.code, sortOrder: 1,
        translations: { create: [{ locale: 'uz', label: o.uz }, { locale: 'ru', label: o.ru }] },
      },
    });
  }
  console.log('Attribute definitions + options ready');

  // ---------- Categories (3 sections) ----------
  const catIds = {};
  const catImages = {
    S1: '/catalog/2026/G001-quyma.jpg',
    S2: '/catalog/2026/G050-quyma.jpg',
    S3: '/catalog/2026/A10-001-quyma.jpg',
  };
  for (const [i, s] of ['S1', 'S2', 'S3'].entries()) {
    const m = SECTION_META[s];
    const cat = await prisma.category.create({
      data: {
        sortOrder: i, status: 'ACTIVE', image: catImages[s],
        translations: { create: [
          { locale: 'uz', name: m.catNameUz, slug: m.catSlugUz, description: m.catDescUz },
          { locale: 'ru', name: m.catNameRu, slug: m.catSlugRu, description: m.catDescRu },
        ]},
        attributes: {
          create: [
            { attributeId: attrDimensions.id, required: true, sortOrder: 1 },
            { attributeId: attrMaterial.id, required: true, sortOrder: 2 },
            { attributeId: attrTexture.id, required: false, sortOrder: 3 },
          ],
        },
      },
    });
    catIds[s] = cat.id;
  }
  console.log('Categories ready');

  // ---------- Products (130) ----------
  let count = 0;
  for (const p of CATALOG) {
    const m = SECTION_META[p.section];
    const nameUz = '«' + p.name + '»' + m.nameSuffixUz;
    const nameRu = m.nameSuffixRu + '«' + RU_NAMES[p.code] + '»';
    const slug = slugify(p.code + '-' + p.name);
    const dimsClean = p.dims.replace(/\*/g, '').replace(/\s*mm$/i, '').trim();
    const assumedNoteUz = p.assumed
      ? ' Yulduzcha (*) bilan belgilangan o‘lcham standart qiymat — buyurtmada menejer bilan aniqlashtiriladi.' : '';
    const assumedNoteRu = p.assumed
      ? ' Размер со звёздочкой (*) — стандартное значение, уточняется при заказе.' : '';
    const multiNoteUz = p.multi
      ? ' Bu to‘plam bir nechta elementdan (A / B / V) iborat — batafsil ma’lumot uchun menejer bilan bog‘laning.' : '';
    const multiNoteRu = p.multi
      ? ' Этот комплект состоит из нескольких элементов (A / B / V) — подробности уточняйте у менеджера.' : '';

    const shortUz = `${p.slogan} ${m.kindUz.charAt(0).toUpperCase() + m.kindUz.slice(1)}. O‘lcham: ${dimsClean} mm.`;
    const shortRu = `${m.kindRu.charAt(0).toUpperCase() + m.kindRu.slice(1)} «${RU_NAMES[p.code]}». Размер: ${dimsClean} мм.`;
    const descUz = `«${p.name}» — ${m.kindUz} (katalog kodi: ${p.code}). ${p.slogan} Qolip mustahkam polipropilen/ABS plastikdan tayyorlangan: aniq geometriya, barqaror natija va qayta-qayta ishlatish imkoniyati. O‘lcham: ${p.dims} mm.${assumedNoteUz}${multiNoteUz} Yetkazib berish O‘zbekiston bo‘ylab. Narx vaqtinchalik — so‘nggi narx uchun menejer bilan bog‘laning.`;
    const descRu = `«${RU_NAMES[p.code]}» — ${m.kindRu} (код каталога: ${p.code}). Форма изготовлена из прочного полипропилена/АБС: точная геометрия, стабильный результат и многократное использование. Размер: ${dimsClean} мм.${assumedNoteRu}${multiNoteRu} Доставка по всему Узбекистану. Актуальную цену уточняйте у менеджера.`;

    await prisma.product.create({
      data: {
        sku: 'SPS-' + p.code,
        status: 'ACTIVE',
        basePrice: 0,
        compareAtPrice: null,
        currency: 'UZS',
        inStock: true,
        stockQty: 100,
        trackInventory: false,
        allowBackorder: true,
        isBestseller: false,
        isNew: !!p.isNew,
        translations: {
          create: [
            { locale: 'uz', name: nameUz, slug, shortDescription: shortUz, description: descUz,
              metaTitle: `${nameUz} — SPS Plast`, metaDescription: shortUz.slice(0, 160) },
            { locale: 'ru', name: nameRu, slug, shortDescription: shortRu, description: descRu,
              metaTitle: `${nameRu} — SPS Plast`, metaDescription: shortRu.slice(0, 160) },
          ],
        },
        categories: { create: [{ categoryId: catIds[p.section] }] },
        media: { create: [
          { type: 'MAIN', sortOrder: 1, url: `/catalog/2026/${p.code}-mold.jpg`,
            alt: `${nameUz} — qolip` },
          { type: 'FINISHED_RESULT', sortOrder: 2, url: `/catalog/2026/${p.code}-quyma.jpg`,
            alt: `${nameUz} — tayyor natija (quyma)` },
          { type: 'USAGE', sortOrder: 3, url: `/catalog/2026/${p.code}-env.jpg`,
            alt: `${nameUz} — qo‘llanish namunasi` },
        ] },
        attributeValues: {
          create: [
            { attributeId: attrDimensions.id, textValue: p.dims },
            { attributeId: attrMaterial.id, textValue: 'Polipropilen / ABS' },
          ],
        },
      },
    });
    count++;
    if (count % 25 === 0) console.log(`  ${count} products...`);
  }
  console.log(`Products ready: ${count}`);

  // ---------- PR#9 qo'shimchalari: 12 ta yangi qolip (2026-09-27, oq fonda studiya rasmlari) ----------
  const NEW_ITEMS = [
    { sku: 'SPS-NEW-072', nameUz: 'G‘isht T 4’li qolipi (tosh to‘lqini)', nameRu: 'Форма «Кирпич Т 4-ки» (каменная волна)', slugUz: 'gisht-t-4-li-qolipi-tosh-tolqini', slugRu: 'forma-kirpich-t-4-ki-kamen-volna', dims: '400 × 200 × 30 mm', ypc: 24, img: 72, cat: 'S3', bestseller: false },
    { sku: 'SPS-NEW-073', nameUz: 'Sakkizburchak Naqshli qolipi 30×30', nameRu: 'Форма «Восьмиугольник Орнамент» 30×30', slugUz: 'sakkizburchak-naqshli-qolipi-30x30', slugRu: 'forma-vosmiugolnik-ornament-30x30', dims: '300 × 300 × 30 mm', ypc: 11, img: 73, cat: 'S2', bestseller: false },
    { sku: 'SPS-NEW-074', nameUz: 'Tosh + Yog‘och X qolipi 30×30', nameRu: 'Форма «Камень + Дерево Х» 30×30', slugUz: 'tosh-yogoch-x-qolipi-30x30', slugRu: 'forma-kamen-derevo-x-30x30', dims: '300 × 300 × 30 mm', ypc: 11, img: 74, cat: 'S1', bestseller: true },
    { sku: 'SPS-NEW-075', nameUz: 'G‘isht T 4’li qolipi (to‘lqinsimon)', nameRu: 'Форма «Кирпич Т 4-ки» (волнистая)', slugUz: 'gisht-t-4-li-qolipi-tolqinsimon', slugRu: 'forma-kirpich-t-4-ki-volna', dims: '400 × 200 × 30 mm', ypc: 24, img: 75, cat: 'S3', bestseller: false },
    { sku: 'SPS-NEW-076', nameUz: 'Qo‘sh Sakkizburchak qolipi', nameRu: 'Форма «Двойной восьмиугольник»', slugUz: 'qosh-sakkizburchak-qolipi', slugRu: 'forma-dvojnoj-vosmiugolnik', dims: '600 × 300 × 30 mm', ypc: 11, img: 76, cat: 'S1', bestseller: false },
    { sku: 'SPS-NEW-077', nameUz: 'Geometrik Doiralar qolipi 30×30', nameRu: 'Форма «Геометрия Круги» 30×30', slugUz: 'geometrik-doiralar-qolipi-30x30', slugRu: 'forma-geometriya-krugi-30x30', dims: '300 × 300 × 30 mm', ypc: 11, img: 77, cat: 'S2', bestseller: false },
    { sku: 'SPS-NEW-078', nameUz: 'Diagonal Yulduz qolipi 30×30', nameRu: 'Форма «Диагональ Звезда» 30×30', slugUz: 'diagonal-yulduz-qolipi-30x30', slugRu: 'forma-diagonal-zvezda-30x30', dims: '300 × 300 × 30 mm', ypc: 11, img: 78, cat: 'S2', bestseller: false },
    { sku: 'SPS-NEW-079', nameUz: 'Romb 8-shakl 3’li qolipi', nameRu: 'Форма «Ромб 8-ка тройная»', slugUz: 'romb-8-shakl-3-li-qolipi', slugRu: 'forma-romb-8ka-trojnoj', dims: '500 × 280 × 45 mm', ypc: 8, img: 79, cat: 'S1', bestseller: true },
    { sku: 'SPS-NEW-080', nameUz: 'Marmar 2’li qolipi 40×20', nameRu: 'Форма «Мрамор двойная» 40×20', slugUz: 'marmar-2-li-qolipi-40x20', slugRu: 'forma-mramor-dvoynaya-40x20', dims: '400 × 200 × 30 mm', ypc: 25, img: 80, cat: 'S2', bestseller: false },
    { sku: 'SPS-NEW-081', nameUz: 'Cho‘ziq Sakkizburchak qolipi', nameRu: 'Форма «Вытянутый восьмиугольник»', slugUz: 'choziq-sakkizburchak-qolipi', slugRu: 'forma-vytyanutyj-vosmiugolnik', dims: '600 × 300 × 30 mm', ypc: 11, img: 81, cat: 'S1', bestseller: false },
    { sku: 'SPS-NEW-082', nameUz: 'Marmar Kvadrat qolipi 30×30', nameRu: 'Форма «Мрамор Квадрат» 30×30', slugUz: 'marmar-kvadrat-qolipi-30x30', slugRu: 'forma-mramor-kvadrat-30x30', dims: '300 × 300 × 30 mm', ypc: 11, img: 82, cat: 'S2', bestseller: false },
    { sku: 'SPS-NEW-083', nameUz: 'Strelka (O‘q) qolipi', nameRu: 'Форма «Стрелка»', slugUz: 'strelka-oq-qolipi', slugRu: 'forma-strelka', dims: '500 × 250 × 30 mm', ypc: 16, img: 83, cat: 'S1', bestseller: false },
  ];
  for (const it of NEW_ITEMS) {
    const img = '/catalog/catalog-' + String(it.img).padStart(3, '0') + '.jpg';
    await prisma.product.create({
      data: {
        sku: it.sku,
        status: 'ACTIVE',
        basePrice: 0,
        compareAtPrice: null,
        currency: 'UZS',
        inStock: true,
        stockQty: 100,
        trackInventory: false,
        allowBackorder: true,
        isBestseller: it.bestseller,
        isNew: true,
        yieldPerCast: it.ypc,
        translations: {
          create: [
            { locale: 'uz', name: it.nameUz, slug: it.slugUz,
              shortDescription: `${it.nameUz}. O‘lcham: ${it.dims}. Yangi model — 2026.`,
              description: `${it.nameUz}. SPS Plast zavodida ishlab chiqarilgan yuqori sifatli ABS/polipropilen qolip. Aniq geometriya, 200+ quyishga chidamli. O‘lcham: ${it.dims}. Yangi model — 2026. Narx vaqtinchalik — so‘nggi narx uchun menejer bilan bog‘laning.`,
              metaTitle: `${it.nameUz} — SPS Plast` },
            { locale: 'ru', name: it.nameRu, slug: it.slugRu,
              shortDescription: `${it.nameRu}. Размер: ${it.dims}. Новая модель — 2026.`,
              description: `${it.nameRu}. Высококачественная форма из АБС/полипропилена производства SPS Plast. Точная геометрия, ресурс 200+ заливок. Размер: ${it.dims}. Новая модель — 2026. Актуальную цену уточняйте у менеджера.`,
              metaTitle: `${it.nameRu} — SPS Plast` },
          ],
        },
        categories: { create: [{ categoryId: catIds[it.cat] }] },
        media: { create: [
          { type: 'MAIN', sortOrder: 1, url: img, alt: it.nameUz },
        ] },
        attributeValues: {
          create: [
            { attributeId: attrDimensions.id, textValue: it.dims },
            { attributeId: attrMaterial.id, textValue: 'Polipropilen / ABS' },
          ],
        },
      },
    });
    count++;
  }
  console.log(`PR#9 new items ready: ${NEW_ITEMS.length} (total ${count})`);

  // ---------- Banner ----------
  await prisma.banner.create({
    data: {
      titleUz: '2026 katalogi — 130+ yangi plastik qolip',
      titleRu: 'Каталог 2026 — 130+ новых пластиковых форм',
      subTitleUz: 'Polipropilen va ABS plastikdan mustahkam qoliplar: bruschatka, dekorativ plita, fasad paneli va profil.',
      subTitleRu: 'Прочные формы из полипропилена и АБС: брусчатка, декоративная плитка, фасадные панели и профили.',
      imageUrl: '/catalog/2026/G005-env.jpg',
      linkUrl: '/catalog',
      position: 'HERO',
      isActive: true,
    },
  });

  // ---------- Project ----------
  // ---------- Project ----------
  // 6 real loyiha: public/media/projects ichidagi "oldin/keyin" juftliklari
  // scripts/build-media.py tomonidan master rasmlardan yasaladi.
  for (const project of CONTENT.projects) {
    await prisma.project.create({
      data: {
        titleUz: project.uz.title,
        titleRu: project.ru.title,
        descriptionUz: project.uz.description,
        descriptionRu: project.ru.description,
        location: project.location,
        productUsed: project.productUsed,
        beforeImage: project.beforeImage,
        afterImage: project.afterImage,
      },
    });
  }

  // ---------- Blog ----------
  // 6 maqola (uz + ru). Matn formati shu faylda emas, alohida JSON'da:
  // prisma/data/content-2026.json — uni nosozlik bo'lsa tahrirlash oson.
  // Bloklash qoidalari: "## " h2, "### " h3, "- " ro'yxat, "> " iqtibos,
  // bloklar bo'sh qator bilan ajratiladi (src/app/[lang]/blog/[slug]/page.tsx).
  for (const post of CONTENT.blog) {
    await prisma.blogPost.create({
      data: {
        coverImage: post.coverImage,
        author: post.author || 'SPS Plast mutaxassisi',
        isPublished: true,
        publishedAt: new Date(post.publishedAt),
        translations: {
          create: [
            {
              locale: 'uz',
              slug: post.slug,
              title: post.uz.title,
              excerpt: post.uz.excerpt,
              content: post.uz.content,
            },
            {
              locale: 'ru',
              slug: post.ru.slug || `${post.slug}-ru`,
              title: post.ru.title,
              excerpt: post.ru.excerpt,
              content: post.ru.content,
            },
          ],
        },
      },
    });
  }

  console.log('Seed completed successfully.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
