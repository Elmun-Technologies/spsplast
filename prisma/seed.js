const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Real SPS product catalog (from the printed "SPS / STONE PROFY SERVISE"
// catalogue + the newly photographed molds & finished results).
//
//   - MAIN  ->  qolip asosiy rasmi
//   - MOLD  ->  qolipning o'zi (QOLIP -> NATIJA showcase)
//   - FINISHED_RESULT -> shu qolipdan quyilgan tayyor mahsulot
//   - DIMENSION -> o‘lcham
//
// Narxlar katalogda ko‘rsatilmaganligi sababli basePrice = 0 (narx so‘rash).
// Buni admin panel orqali to‘ldirish mumkin.
// ---------------------------------------------------------------------------

const IMG = (n) => `/catalog/catalog-${String(n).padStart(3, '0')}.jpg`;

async function main() {
  console.log('Seeding real SPS catalog...');

  // Clean existing data (reverse dependency order)
  await prisma.auditLog.deleteMany();
  await prisma.adminSession.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.productMedia.deleteMany();
  await prisma.productVariantOption.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.productTranslation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.categoryAttribute.deleteMany();
  await prisma.categoryTranslation.deleteMany();
  await prisma.category.deleteMany();
  await prisma.attributeOptionTranslation.deleteMany();
  await prisma.attributeOption.deleteMany();
  await prisma.attributeTranslation.deleteMany();
  await prisma.attributeDefinition.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.blogPostTranslation.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.project.deleteMany();
  await prisma.banner.deleteMany();

  // 1. Admin user (safe from env)
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.adminUser.create({
      data: { email: adminEmail, name: 'SPS Admin', passwordHash, role: 'ADMIN' },
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.warn('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set. Skipping admin.');
  }

  // 2. Attributes
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

  // Texture options
  const textureOpts = [
    { code: 'brick', uz: 'G‘isht simon', ru: 'Кирпичная' },
    { code: 'stone', uz: 'Tosh simon', ru: 'Каменная' },
    { code: 'smooth', uz: 'Silliq', ru: 'Гладкая' },
    { code: 'gloss', uz: 'Yaltiroq', ru: 'Глянец' },
    { code: '3d', uz: '3D relef', ru: '3D рельеф' },
    { code: 'faceted', uz: 'Qirrali', ru: 'Гранёная' },
  ];
  const texIds = {};
  for (const o of textureOpts) {
    const created = await prisma.attributeOption.create({
      data: {
        attributeId: attrTexture.id, code: o.code, sortOrder: 1,
        translations: { create: [
          { locale: 'uz', label: o.uz },
          { locale: 'ru', label: o.ru },
        ]},
      },
    });
    texIds[o.code] = created.id;
  }

  // Color options (Travertin / Mramor from catalogue)
  const colorOpts = [
    { code: 'travertin', uz: 'Travertin', ru: 'Травертин' },
    { code: 'mramor', uz: 'Mramor', ru: 'Мрамор' },
    { code: 'polipropilen', uz: 'Polipropilen', ru: 'Полипропилен' },
    { code: 'abs', uz: 'ABS', ru: 'АБС' },
  ];
  const colorIds = {};
  for (const o of colorOpts) {
    const created = await prisma.attributeOption.create({
      data: {
        attributeId: attrColor.id, code: o.code, sortOrder: 1,
        translations: { create: [
          { locale: 'uz', label: o.uz },
          { locale: 'ru', label: o.ru },
        ]},
      },
    });
    colorIds[o.code] = created.id;
  }

  // 3. Categories (balanced: qoliplar + fasad dekor)
  const catBruschatka = await prisma.category.create({
    data: {
      sortOrder: 1,
      image: IMG(7),
      translations: { create: [
        { locale: 'uz', name: 'Bruschatka qoliplari', slug: 'bruschatka-qoliplari', description: 'Bruschatka va trotuar plitka uchun plastik qoliplar' },
        { locale: 'ru', name: 'Формы для брусчатки', slug: 'formy-dlya-bruschatki', description: 'Формы для брусчатки и тротуарной плитки' },
      ]},
    },
  });
  const catPlitka = await prisma.category.create({
    data: {
      sortOrder: 2,
      image: IMG(7),
      translations: { create: [
        { locale: 'uz', name: 'Trotuar plitka qoliplari', slug: 'plitka-qoliplari', description: 'Trotuar plitka va dekorativ plitka qoliplari' },
        { locale: 'ru', name: 'Формы для тротуарной плитки', slug: 'formy-dlya-plitki', description: 'Формы для тротуарной и декоративной плитки' },
      ]},
    },
  });
  const catBordyur = await prisma.category.create({
    data: {
      sortOrder: 3,
      image: IMG(4),
      translations: { create: [
        { locale: 'uz', name: 'Bordyur qoliplari', slug: 'bordyur-qoliplari', description: 'Trotuar va yo‘l bordyur qoliplari' },
        { locale: 'ru', name: 'Формы для бордюров', slug: 'formy-dlya-bordyurov', description: 'Формы для тротуарных бордюров' },
      ]},
    },
  });
  const catFasad = await prisma.category.create({
    data: {
      sortOrder: 4,
      image: IMG(2),
      translations: { create: [
        { locale: 'uz', name: 'Fasad dekor elementlari', slug: 'fasad-dekor', description: 'Karniz, pilyastr, tsokol va fasad bezaklari' },
        { locale: 'ru', name: 'Фасадный декор', slug: 'fasadnyj-dekor', description: 'Карнизы, пилястры, цоколь и фасадные элементы' },
      ]},
    },
  });
  const catTermopanel = await prisma.category.create({
    data: {
      sortOrder: 5,
      image: IMG(15),
      translations: { create: [
        { locale: 'uz', name: 'Fasad termopanellari', slug: 'termopanel', description: 'Fasad uchun issiqlik saqlovchi termopanellar' },
        { locale: 'ru', name: 'Фасадные термопанели', slug: 'termopaneli', description: 'Утепляющие фасадные термопанели' },
      ]},
    },
  });

  // Link category-attribute
  for (const cat of [catBruschatka, catPlitka, catBordyur, catFasad, catTermopanel]) {
    await prisma.categoryAttribute.create({ data: { categoryId: cat.id, attributeId: attrDimensions.id, required: true } });
    await prisma.categoryAttribute.create({ data: { categoryId: cat.id, attributeId: attrMaterial.id, required: true } });
    await prisma.categoryAttribute.create({ data: { categoryId: cat.id, attributeId: attrTexture.id, required: false } });
  }

  // 4. Products helper
  function media(mainIdx, moldIdx, resultIdx, dimIdx) {
    // MAIN
    const arr = [{ type: 'MAIN', url: IMG(mainIdx), alt: 'Qolip asosiy rasmi', sortOrder: 1 }];
    if (moldIdx) arr.push({ type: 'MOLD', url: IMG(moldIdx), alt: 'Qolipning o‘zi', sortOrder: 2 });
    if (resultIdx) arr.push({ type: 'FINISHED_RESULT', url: IMG(resultIdx), alt: 'Tayyor quyilgan mahsulot', sortOrder: 3 });
    if (dimIdx) arr.push({ type: 'DIMENSION', url: IMG(dimIdx), alt: 'O‘lcham', sortOrder: 4 });
    return arr;
  }

  async function createProduct(cfg) {
    const p = await prisma.product.create({
      data: {
        sku: cfg.sku,
        status: 'ACTIVE',
        basePrice: cfg.price ?? 0,
        compareAtPrice: null,
        currency: 'UZS',
        inStock: true,
        stockQty: 999,
        trackInventory: false,
        allowBackorder: true,
        isBestseller: !!cfg.bestseller,
        isNew: !!cfg.isNew,
        yieldPerCast: cfg.yieldPerCast ?? null,
        durabilityCasts: null,
        translations: {
          create: [
            { locale: 'uz', name: cfg.nameUz, slug: cfg.slugUz, shortDescription: cfg.shortUz, description: cfg.descUz },
            { locale: 'ru', name: cfg.nameRu, slug: cfg.slugRu, shortDescription: cfg.shortRu, description: cfg.descRu },
          ],
        },
        categories: { create: [{ categoryId: cfg.categoryId }] },
        media: { create: cfg.media },
        attributeValues: {
          create: [
            { attributeId: attrDimensions.id, textValue: cfg.dimensions || cfg.dims },
            { attributeId: attrMaterial.id, textValue: 'Polipropilen / ABS' },
            { attributeId: attrTexture.id, optionId: texIds[cfg.texture] },
            ...(cfg.colors || []).map((c) => ({ attributeId: attrColor.id, optionId: colorIds[c] })),
          ],
        },
      },
    });
    return p;
  }

  // Helper for standard plitka descriptions
  const plitkaDesc = (uz, ru, dims) => ({
    shortUz: `Qolip o‘lchami: ${dims}. Tayyor plitka 1 m² da chiqish miqdori katalogda ko‘rsatilgan.`,
    shortRu: `Размер формы: ${dims}. Выход готовой плитки на 1 м² указан в каталоге.`,
    descUz: `${uz}. Qolip mustahkam polipropilen/ABS plastikdan tayyorlangan bo‘lib, aniq geometriya va barqaror natija beradi. Qolipdan chiqqan tayyor mahsulot yonma-yon ko‘rsatilgan.`,
    descRu: `${ru}. Форма изготовлена из прочного полипропилена/АБС, обеспечивает точную геометрию и стабильный результат. Рядом показано готовое изделие из этой формы.`,
  });

  const fasadDesc = (uz, ru) => ({
    shortUz: `${uz}.`,
    shortRu: `${ru}.`,
    descUz: `${uz}. Fasad dekor elementi sifatli xomashyodan tayyorlanadi, binoning arxitektura qiyofasini to‘ldiradi.`,
    descRu: `${ru}. Фасадный декоративный элемент из качественного сырья, дополняет архитектурный облик здания.`,
  });

  // --- PLITKA & BRUSCHATKA QOLIPLARI (real catalogue items) ---
  const plitkaItems = [
    { sku: 'SPS-PLT-YALTA', nameUz: 'Yalta qolipi 30x30', nameRu: 'Форма «Ялта» 30x30', slugUz: 'yalta-qolipi-30x30', slugRu: 'forma-yalta-30x30', dims: '300x300x30 cm', ypc: 11, main: 7, mold: 7, result: 8, texture: 'smooth' },
    { sku: 'SPS-PLT-CVETOK', nameUz: 'Cvetok qolipi 30x30', nameRu: 'Форма «Цветок» 30x30', slugUz: 'cvetok-qolipi-30x30', slugRu: 'forma-cvetok-30x30', dims: '300x300x30 cm', ypc: 11, main: 8, mold: 8, result: 13, texture: '3d' },
    { sku: 'SPS-PLT-ASTANA', nameUz: 'Astana qolipi 30x30 (x4)', nameRu: 'Форма «Астана» 30x30 (x4)', slugUz: 'astana-qolipi-30x30', slugRu: 'forma-astana-30x30', dims: '300x300x30 cm', ypc: 25, main: 23, mold: 23, result: 25, texture: '3d' },
    { sku: 'SPS-PLT-YULDUZ', nameUz: 'Yulduz qolipi 30x30 (x4)', nameRu: 'Форма «Юлдуз» 30x30 (x4)', slugUz: 'yulduz-qolipi-30x30', slugRu: 'forma-yulduz-30x30', dims: '300x300x30 cm', ypc: 25, main: 20, mold: 20, result: 23, texture: 'faceted' },
    { sku: 'SPS-PLT-PARKET', nameUz: 'Parket qolipi 20x20 (x2)', nameRu: 'Форма «Паркет» 20x20 (x2)', slugUz: 'parket-qolipi-20x20', slugRu: 'forma-parket-20x20', dims: '200x200x25 cm', ypc: 25, main: 32, mold: 32, result: 60, texture: 'stone' },
    { sku: 'SPS-PLT-BODOM', nameUz: 'Bodom qolipi 20x20', nameRu: 'Форма «Бодом» 20x20', slugUz: 'bodom-qolipi-20x20', slugRu: 'forma-bodom-20x20', dims: '200x200x25 cm', ypc: 11, main: 10, mold: 10, result: 32, texture: 'stone' },
    { sku: 'SPS-PLT-GURUCH', nameUz: 'Guruch qolipi 20x20 (x4)', nameRu: 'Форма «Гуруч» 20x20 (x4)', slugUz: 'guruch-qolipi-20x20', slugRu: 'forma-guruch-20x20', dims: '200x200x25 cm', ypc: 25, main: 10, mold: 10, result: 13, texture: 'smooth' },
    { sku: 'SPS-PLT-PARUS', nameUz: 'Parus qolipi 18x36', nameRu: 'Форма «Парус» 18x36', slugUz: 'parus-qolipi-18x36', slugRu: 'forma-parus-18x36', dims: '180x360x30 cm', ypc: 14, main: 11, mold: 11, result: 21, texture: '3d' },
    { sku: 'SPS-PLT-GLADKIY', nameUz: 'Gladkiy qolipi 18x36', nameRu: 'Форма «Гладкий» 18x36', slugUz: 'gladkiy-qolipi-18x36', slugRu: 'forma-gladkiy-18x36', dims: '180x360x30 cm', ypc: 14, main: 11, mold: 11, result: 56, texture: 'smooth' },
    { sku: 'SPS-PLT-DOZHDIK', nameUz: 'Dojdik qolipi 18x36', nameRu: 'Форма «Дождик» 18x36', slugUz: 'dojdik-qolipi-18x36', slugRu: 'forma-dozhdik-18x36', dims: '180x360x30 cm', ypc: 14, main: 21, mold: 21, result: 11, texture: '3d' },
    { sku: 'SPS-PLT-ORNAMENT', nameUz: 'Ornament qolipi 18x36', nameRu: 'Форма «Орнамент» 18x36', slugUz: 'ornament-qolipi-18x36', slugRu: 'forma-ornament-18x36', dims: '180x360x30 cm', ypc: 14, main: 21, mold: 21, result: 57, texture: '3d' },
    { sku: 'SPS-PLT-ZANJIR', nameUz: 'Zanjir qolipi 30x30', nameRu: 'Форма «Занжир» 30x30', slugUz: 'zanjir-qolipi-30x30', slugRu: 'forma-zanjir-30x30', dims: '300x300x30 cm', ypc: 11, main: 12, mold: 12, result: 22, texture: '3d' },
    { sku: 'SPS-PLT-POLOSA', nameUz: 'Polosa qolipi 30x30', nameRu: 'Форма «Полоса» 30x30', slugUz: 'polosa-qolipi-30x30', slugRu: 'forma-polosa-30x30', dims: '300x300x30 cm', ypc: 11, main: 12, mold: 12, result: 57, texture: 'smooth' },
    { sku: 'SPS-PLT-RIO', nameUz: 'Rio qolipi 30x30', nameRu: 'Форма «Рио» 30x30', slugUz: 'rio-qolipi-30x30', slugRu: 'forma-rio-30x30', dims: '300x300x30 cm', ypc: 11, main: 19, mold: 19, result: 63, texture: 'stone' },
    { sku: 'SPS-PLT-VIKING', nameUz: 'Viking qolipi 30x30', nameRu: 'Форма «Викинг» 30x30', slugUz: 'viking-qolipi-30x30', slugRu: 'forma-viking-30x30', dims: '300x300x30 cm', ypc: 11, main: 19, mold: 19, result: 44, texture: '3d' },
    { sku: 'SPS-PLT-PALMA', nameUz: 'Palma qolipi', nameRu: 'Форма «Пальма»', slugUz: 'palma-qolipi', slugRu: 'forma-palma', dims: '360x180x30 cm', ypc: 9, main: 56, mold: 56, result: 60, texture: 'faceted' },
    { sku: 'SPS-PLT-BUMERANG', nameUz: 'Bumerang qolipi', nameRu: 'Форма «Бумеранг»', slugUz: 'bumerang-qolipi', slugRu: 'forma-bumerang', dims: '160x150x25 cm', ypc: 47, main: 56, mold: 56, result: 55, texture: 'smooth' },
    { sku: 'SPS-PLT-ROYAL1', nameUz: 'Royal 1 qolipi', nameRu: 'Форма «Рояль 1»', slugUz: 'royal-1-qolipi', slugRu: 'forma-rojal-1', dims: '180x100x30 cm', ypc: 20, main: 46, mold: 46, result: 50, texture: '3d' },
    { sku: 'SPS-PLT-ROYAL2', nameUz: 'Royal 2 qolipi', nameRu: 'Форма «Рояль 2»', slugUz: 'royal-2-qolipi', slugRu: 'forma-rojal-2', dims: '180x100x30 cm', ypc: 22, main: 48, mold: 48, result: 50, texture: '3d' },
    { sku: 'SPS-PLT-ONABOLA', nameUz: 'Ona-Bola 1 qolipi', nameRu: 'Форма «Она-Бола 1»', slugUz: 'ona-bola-1-qolipi', slugRu: 'forma-ona-bola-1', dims: '200x135x30 cm', ypc: 25, main: 59, mold: 59, result: 68, texture: 'faceted' },
    { sku: 'SPS-PLT-UZOR', nameUz: 'Uzor 4 Gul qolipi 40x40', nameRu: 'Форма «Узор 4 гул» 40x40', slugUz: 'uzor-4-gul-qolipi', slugRu: 'forma-uzor-4-gul-40x40', dims: '400x400x40 cm', ypc: 6, main: 68, mold: 68, result: 70, texture: '3d' },
    { sku: 'SPS-PLT-DUBAY40', nameUz: 'Dubay qolipi 40x40', nameRu: 'Форма «Дубай» 40x40', slugUz: 'dubay-qolipi-40x40', slugRu: 'forma-dubaj-40x40', dims: '400x400x40 cm', ypc: 6, main: 68, mold: 68, result: 70, texture: 'smooth' },
    { sku: 'SPS-PLT-KARE', nameUz: 'Kare qolipi 40x40', nameRu: 'Форма «Каре» 40x40', slugUz: 'kare-qolipi-40x40', slugRu: 'forma-kare-40x40', dims: '400x400x40 cm', ypc: 6, main: 70, mold: 70, result: 67, texture: 'faceted' },
    { sku: 'SPS-PLT-TUMBA', nameUz: 'Tumba qolipi 40x40', nameRu: 'Форма «Тумба» 40x40', slugUz: 'tumba-qolipi-40x40', slugRu: 'forma-tumba-40x40', dims: '400x400x40 cm', ypc: 6, main: 70, mold: 70, result: 67, texture: 'gloss' },
    { sku: 'SPS-PLT-VENTILYATOR', nameUz: 'Ventilyator qolipi', nameRu: 'Форма «Вентилятор»', slugUz: 'ventilyator-qolipi', slugRu: 'forma-ventilyator', dims: '240x240x30 cm', ypc: 18, main: 39, mold: 39, result: 55, texture: '3d' },
    { sku: 'SPS-PLT-FARON', nameUz: 'Faron qolipi 15x14', nameRu: 'Форма «Фарон» 15x14', slugUz: 'faron-qolipi', slugRu: 'forma-faron-15x14', dims: '150x140x25 cm', ypc: 15, main: 39, mold: 39, result: 55, texture: 'faceted' },
  ];

  for (const item of plitkaItems) {
    const desc = plitkaDesc(item.nameUz, item.nameRu, item.dims);
    await createProduct({
      ...item,
      categoryId: item.sku.includes('BORD') ? catBordyur.id : (item.dims.includes('400') ? catPlitka.id : catBruschatka.id),
      price: 0,
      media: media(item.main, item.mold, item.result, null),
      ...desc,
      colors: ['polipropilen', 'abs'],
    });
  }

  // --- BORDYUR QOLIPLARI ---
  const bordyurItems = [
    { sku: 'SPS-BRD-190', nameUz: '190x50 devor paneli qolipi', nameRu: 'Форма для забора 190x50', slugUz: 'devor-paneli-qolipi-190x50', slugRu: 'forma-zabora-190x50', dims: '1900x500 cm', ypc: 1, main: 25, mold: 25, result: 4, texture: 'stone' },
    { sku: 'SPS-BRD-KIRPICH', nameUz: 'Devor paneli «Kirpich»', nameRu: 'Панель забора «Кирпич»', slugUz: 'devor-kirpich-qolipi', slugRu: 'forma-zabora-kirpich', dims: '1900x500 cm', ypc: 1, main: 31, mold: 31, result: 61, texture: 'brick' },
    { sku: 'SPS-BRD-SKALA', nameUz: 'Devor paneli «Kamen Skala»', nameRu: 'Панель забора «Камень Скала»', slugUz: 'devor-kamen-skala-qolipi', slugRu: 'forma-zabora-kamen-skala', dims: '1900x500 cm', ypc: 1, main: 31, mold: 31, result: 61, texture: 'stone' },
  ];
  for (const item of bordyurItems) {
    const desc = plitkaDesc(item.nameUz, item.nameRu, item.dims);
    await createProduct({
      ...item, categoryId: catBordyur.id, price: 0,
      media: media(item.main, item.mold, item.result, null),
      ...desc, colors: ['polipropilen', 'abs'],
    });
  }

  // --- FASAD DEKOR (karniz / pilyastr / tsokol) ---
  const fasadItems = [
    { sku: 'SPS-KRN-005', nameUz: 'Karniz 35x120 (KRN-005)', nameRu: 'Карниз 35x120 (KRN-005)', slugUz: 'karniz-35x120-krn005', slugRu: 'karniz-35x120-krn005', dims: '350x1200', main: 2, mold: 2, result: 9, texture: 'smooth' },
    { sku: 'SPS-KRN-006', nameUz: 'Karniz 50x120 (KRN-006)', nameRu: 'Карниз 50x120 (KRN-006)', slugUz: 'karniz-50x120-krn006', slugRu: 'karniz-50x120-krn006', dims: '500x1200', main: 2, mold: 2, result: 9, texture: 'smooth' },
    { sku: 'SPS-KRN-007', nameUz: 'Karniz 35x120 (KRN-007)', nameRu: 'Карниз 35x120 (KRN-007)', slugUz: 'karniz-35x120-krn007', slugRu: 'karniz-35x120-krn007', dims: '350x1200', main: 2, mold: 2, result: 42, texture: 'smooth' },
    { sku: 'SPS-KRN-008', nameUz: 'Karniz 30x120 (KRN-008)', nameRu: 'Карниз 30x120 (KRN-008)', slugUz: 'karniz-30x120-krn008', slugRu: 'karniz-30x120-krn008', dims: '300x1200', main: 2, mold: 2, result: 42, texture: 'smooth' },
    { sku: 'SPS-KRN-009', nameUz: 'Karniz 25x120 (KRN-009)', nameRu: 'Карниз 25x120 (KRN-009)', slugUz: 'karniz-25x120-krn009', slugRu: 'karniz-25x120-krn009', dims: '250x1200', main: 42, mold: 42, result: 2, texture: 'smooth' },
    { sku: 'SPS-KRN-010', nameUz: 'Karniz 20x120 (KRN-010)', nameRu: 'Карниз 20x120 (KRN-010)', slugUz: 'karniz-20x120-krn010', slugRu: 'karniz-20x120-krn010', dims: '200x1200', main: 42, mold: 42, result: 2, texture: 'smooth' },
    { sku: 'SPS-PL-002', nameUz: 'Pilyastr 40x120 (PL-002)', nameRu: 'Пилястра 40x120 (PL-002)', slugUz: 'pilyastr-40x120-pl002', slugRu: 'pilyastr-40x120-pl002', dims: '400x1200', main: 42, mold: 42, result: 9, texture: 'smooth' },
    { sku: 'SPS-PL-003', nameUz: 'Pilyastr 40x120 (PL-003)', nameRu: 'Пилястра 40x120 (PL-003)', slugUz: 'pilyastr-40x120-pl003', slugRu: 'pilyastr-40x120-pl003', dims: '400x1200', main: 42, mold: 42, result: 14, texture: 'faceted' },
    { sku: 'SPS-PL-012', nameUz: 'Pilyastr 40x120 (PL-012)', nameRu: 'Пилястра 40x120 (PL-012)', slugUz: 'pilyastr-40x120-pl012', slugRu: 'pilyastr-40x120-pl012', dims: '400x1200', main: 9, mold: 9, result: 14, texture: 'smooth' },
    { sku: 'SPS-PL-013', nameUz: 'Pilyastr 50x120 (PL-013)', nameRu: 'Пилястра 50x120 (PL-013)', slugUz: 'pilyastr-50x120-pl013', slugRu: 'pilyastr-50x120-pl013', dims: '500x1200', main: 9, mold: 9, result: 14, texture: 'smooth' },
    { sku: 'SPS-PL-014', nameUz: 'Pilyastr 40x120 (PL-014)', nameRu: 'Пилястра 40x120 (PL-014)', slugUz: 'pilyastr-40x120-pl014', slugRu: 'pilyastr-40x120-pl014', dims: '400x1200', main: 9, mold: 9, result: 33, texture: 'smooth' },
    { sku: 'SPS-PL-015', nameUz: 'Pilyastr 50x120 (PL-015)', nameRu: 'Пилястра 50x120 (PL-015)', slugUz: 'pilyastr-50x120-pl015', slugRu: 'pilyastr-50x120-pl015', dims: '500x1200', main: 9, mold: 9, result: 33, texture: 'smooth' },
    { sku: 'SPS-SL-001', nameUz: 'Tsokol 75x50 (SL-001)', nameRu: 'Цоколь 75x50 (SL-001)', slugUz: 'tsokol-75x50-sl001', slugRu: 'tsokol-75x50-sl001', dims: '750x500', main: 14, mold: 14, result: 51, texture: '3d' },
    { sku: 'SPS-SL-002', nameUz: 'Tsokol 75x40 (SL-002)', nameRu: 'Цоколь 75x40 (SL-002)', slugUz: 'tsokol-75x40-sl002', slugRu: 'tsokol-75x40-sl002', dims: '750x400', main: 14, mold: 14, result: 51, texture: '3d' },
    { sku: 'SPS-SL-003', nameUz: 'Tsokol 60x40 (SL-003)', nameRu: 'Цоколь 60x40 (SL-003)', slugUz: 'tsokol-60x40-sl003', slugRu: 'tsokol-60x40-sl003', dims: '600x400', main: 14, mold: 14, result: 51, texture: '3d' },
    { sku: 'SPS-SL-004', nameUz: 'Tsokol 80x60 (SL-004)', nameRu: 'Цоколь 80x60 (SL-004)', slugUz: 'tsokol-80x60-sl004', slugRu: 'tsokol-80x60-sl004', dims: '800x600', main: 14, mold: 14, result: 33, texture: '3d' },
    { sku: 'SPS-FSD-013', nameUz: 'Dekor 80x40 (FSD-013)', nameRu: 'Декор 80x40 (FSD-013)', slugUz: 'dekor-80x40-fsd013', slugRu: 'dekor-80x40-fsd013', dims: '800x400', main: 6, mold: 6, result: 16, texture: '3d' },
    { sku: 'SPS-FSD-014', nameUz: 'Dekor 80x40 (FSD-014)', nameRu: 'Декор 80x40 (FSD-014)', slugUz: 'dekor-80x40-fsd014', slugRu: 'dekor-80x40-fsd014', dims: '800x400', main: 6, mold: 6, result: 16, texture: '3d' },
    { sku: 'SPS-FSD-015', nameUz: 'Dekor 50x50 (FSD-015)', nameRu: 'Декор 50x50 (FSD-015)', slugUz: 'dekor-50x50-fsd015', slugRu: 'dekor-50x50-fsd015', dims: '500x500', main: 6, mold: 6, result: 16, texture: 'faceted' },
    { sku: 'SPS-FSD-016', nameUz: 'Dekor 50x50 (FSD-016)', nameRu: 'Декор 50x50 (FSD-016)', slugUz: 'dekor-50x50-fsd016', slugRu: 'dekor-50x50-fsd016', dims: '500x500', main: 6, mold: 6, result: 16, texture: 'faceted' },
  ];

  for (const item of fasadItems) {
    const desc = fasadDesc(item.nameUz, item.nameRu);
    await createProduct({
      ...item, categoryId: catFasad.id, price: 0,
      media: media(item.main, item.mold, item.result, null),
      ...desc, colors: ['travertin', 'mramor'],
    });
  }

  // --- TERMOPANELLAR ---
  const termoItems = [
    { sku: 'SPS-TP-001', nameUz: 'Termopanel 30x60 «Kirpich»', nameRu: 'Термопанель 30x60 «Кирпич»', slugUz: 'termopanel-30x60-kirpich', slugRu: 'termopanel-30x60-kirpich', dims: '300x600', main: 36, mold: 36, result: 15, texture: 'brick' },
    { sku: 'SPS-TP-002', nameUz: 'Termopanel 30x60 «Gladkiy»', nameRu: 'Термопанель 30x60 «Гладкий»', slugUz: 'termopanel-30x60-gladkiy', slugRu: 'termopanel-30x60-gladkiy', dims: '300x600', main: 36, mold: 36, result: 15, texture: 'smooth' },
    { sku: 'SPS-TP-003', nameUz: 'Termopanel 30x60 «Bilayn»', nameRu: 'Термопанель 30x60 «Билайн»', slugUz: 'termopanel-30x60-bilayn', slugRu: 'termopanel-30x60-bilajn', dims: '300x600', main: 36, mold: 36, result: 15, texture: '3d' },
    { sku: 'SPS-TP-004', nameUz: 'Termopanel 30x60 «Kuba»', nameRu: 'Термопанель 30x60 «Куба»', slugUz: 'termopanel-30x60-kuba', slugRu: 'termopanel-30x60-kuba', dims: '300x600', main: 36, mold: 36, result: 15, texture: '3d' },
    { sku: 'SPS-TP-005', nameUz: 'Termopanel 25x50 «Pryamaya»', nameRu: 'Термопанель 25x50 «Прямая»', slugUz: 'termopanel-25x50-pryamaya', slugRu: 'termopanel-25x50-pryamaya', dims: '250x500', main: 15, mold: 15, result: 34, texture: 'smooth' },
    { sku: 'SPS-TP-006', nameUz: 'Termopanel 25x50 «Kruglaya»', nameRu: 'Термопанель 25x50 «Круглая»', slugUz: 'termopanel-25x50-kruglaya', slugRu: 'termopanel-25x50-kruglaya', dims: '250x500', main: 15, mold: 15, result: 34, texture: 'faceted' },
    { sku: 'SPS-TP-007', nameUz: 'Termopanel 25x50 «Kirpich»', nameRu: 'Термопанель 25x50 «Кирпич»', slugUz: 'termopanel-25x50-kirpich', slugRu: 'termopanel-25x50-kirpich', dims: '250x500', main: 15, mold: 15, result: 8, texture: 'brick' },
    { sku: 'SPS-TP-008', nameUz: 'Termopanel 25x50 «3D»', nameRu: 'Термопанель 25x50 «3D»', slugUz: 'termopanel-25x50-3d', slugRu: 'termopanel-25x50-3d', dims: '250x500', main: 15, mold: 15, result: 8, texture: '3d' },
    { sku: 'SPS-TP-009', nameUz: 'Termopanel 25x50 «Brilliant»', nameRu: 'Термопанель 25x50 «Бриллиант»', slugUz: 'termopanel-25x50-brilliant', slugRu: 'termopanel-25x50-brilliant', dims: '250x500', main: 58, mold: 58, result: 12, texture: '3d' },
    { sku: 'SPS-TP-010', nameUz: 'Termopanel 25x50 «Bilayn»', nameRu: 'Термопанель 25x50 «Билайн»', slugUz: 'termopanel-25x50-bilayn', slugRu: 'termopanel-25x50-bilajn', dims: '250x500', main: 58, mold: 58, result: 12, texture: '3d' },
    { sku: 'SPS-TP-011', nameUz: 'Termopanel 20x40 «Pryamaya»', nameRu: 'Термопанель 20x40 «Прямая»', slugUz: 'termopanel-20x40-pryamaya', slugRu: 'termopanel-20x40-pryamaya', dims: '200x400', main: 58, mold: 58, result: 12, texture: 'smooth' },
    { sku: 'SPS-TP-012', nameUz: 'Termopanel 25x50 «Labirint»', nameRu: 'Термопанель 25x50 «Лабиринт»', slugUz: 'termopanel-25x50-labirint', slugRu: 'termopanel-25x50-labirint', dims: '250x500', main: 58, mold: 58, result: 12, texture: 'faceted' },
  ];
  for (const item of termoItems) {
    const desc = {
      shortUz: `Fasad uchun issiqlik saqlovchi termopanel. O‘lcham: ${item.dims}.`,
      shortRu: `Утепляющая фасадная термопанель. Размер: ${item.dims}.`,
      descUz: `${item.nameUz}. Binoning fasadini issiqlik saqlaydigan va bezak beruvchi termopanel. Penopolistol asos, travertin/mramor qoplama.`,
      descRu: `${item.nameRu}. Термопанель для утепления и декорирования фасада. Основа — пенополистирол, покрытие — травертин/мрамор.`,
    };
    await createProduct({
      ...item, categoryId: catTermopanel.id, price: 0,
      media: media(item.main, item.mold, item.result, null),
      ...desc, colors: ['travertin', 'mramor'],
    });
  }

  // 5. Banner (Hero) — use a real mold photo
  await prisma.banner.create({
    data: {
      titleUz: 'Qoliplar va fasad dekor — zavoddan to‘g‘ridan-to‘g‘ri',
      titleRu: 'Формы и фасадный декор — напрямую от производителя',
      subTitleUz: 'Bruschatka, bordyur, plitka qoliplari va termopanel. Sifatli xomashyo.',
      subTitleRu: 'Формы для брусчатки, бордюров, плитки и термопанели. Качественное сырьё.',
      imageUrl: IMG(25),
      position: 'HERO',
      isActive: true,
    },
  });

  // 6. Project example (real-ish, from catalogue photos)
  await prisma.project.create({
    data: {
      titleUz: 'Bruschatka bilan qoplangan maydon',
      titleRu: 'Площадка, вымощенная брусчаткой',
      descriptionUz: 'Forma yordamida quyilgan bruschatka bilan bezatilgan maydon.',
      descriptionRu: 'Площадка, вымощенная брусчаткой, отлитой с использованием форм.',
      location: 'Tashkent, Uzbekistan',
      productUsed: 'Bruschatka qoliplari',
      afterImage: IMG(25),
    },
  });

  // 7. Blog post
  await prisma.blogPost.create({
    data: {
      author: 'SPS Mutaxassisi',
      coverImage: IMG(7),
      isPublished: true,
      translations: {
        create: [
          {
            locale: 'uz', slug: 'bruschatka-qolipi-qanday-tanlanadi',
            title: 'Bruschatka qolipi qanday tanlanadi?',
            excerpt: 'Qolip materiali, o‘lchami va teksturasining ahamiyati.',
            content: 'Bruschatka ishlab chiqarishda qolip tanlash muhim bosqichdir. Qolipning materiali, o‘lchami va qalinligi tayyor mahsulot sifatiga ta’sir qiladi...',
          },
          {
            locale: 'ru', slug: 'kak-vybrat-formu-dlya-bruschatki',
            title: 'Как выбрать форму для брусчатки?',
            excerpt: 'Важность материала, размера и фактуры формы.',
            content: 'Выбор формы — ключевой этап при производстве брусчатки. Материал, размер и толщина формы влияют на качество готового изделия...',
          },
        ],
      },
    },
  });

  console.log('Database successfully seeded with real SPS catalog!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
