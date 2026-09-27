#!/usr/bin/env node
/**
 * 2026 studiya seriyasini (50 ta qolip) bazaga QO'SHADI.
 *
 * `prisma/seed.js` dan farqi: bu skript hech narsani o'chirmaydi —
 * na buyurtmalarni, na leadlarni, na mavjud mahsulotlarni. Faqat
 * `prisma/data/molds-2026.json` dagi ma'lumotni upsert qiladi, shuning uchun
 * production bazada ham xavfsiz va qayta-qayta ishga tushirsa bo'ladi.
 *
 *   node scripts/import-molds-2026.js           # yozadi
 *   node scripts/import-molds-2026.js --dry-run # faqat nima bo'lishini ko'rsatadi
 */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const catalog = require('../prisma/data/molds-2026.json');

const DRY_RUN = process.argv.includes('--dry-run');
// Loyihada Rust-siz Prisma client ishlatiladi (engineType = "client"),
// shuning uchun ulanish @prisma/adapter-pg orqali beriladi — xuddi
// prisma/seed.js va src/lib/db.ts dagidek.
const prisma = DRY_RUN
  ? null
  : new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const TEXTURE_LABELS = {
  brick: { uz: 'G‘isht', ru: 'Кирпич' },
  stone: { uz: 'Tosh', ru: 'Камень' },
  smooth: { uz: 'Silliq', ru: 'Гладкая' },
  gloss: { uz: 'Yaltiroq', ru: 'Глянец' },
  '3d': { uz: '3D relef', ru: '3D рельеф' },
  faceted: { uz: 'Qirrali', ru: 'Гранёная' },
};

// 2026 katalogidagi bo'limlar (prisma/seed.js dagi SECTION_META bilan bir xil
// slug/nom). Studiya seriyasidagi mahsulotlar mavjud kategoriyalarga qo'shiladi,
// yangi dublikat kategoriya yaratilmaydi.
const SECTION_DEFS = {
  S1: {
    sortOrder: 1,
    uz: {
      name: 'Bruschatka va trotuar plitkasi qoliplari',
      slug: 'bruschatka-trotuar-qoliplari',
      description: 'Yo‘lak, hovli va maydonlar uchun bruschatka hamda trotuar plitkasi qoliplari.',
    },
    ru: {
      name: 'Формы для брусчатки и тротуарной плитки',
      slug: 'formy-dlya-bruschatki',
      description: 'Формы для брусчатки и тротуарной плитки для дорожек, дворов и площадей.',
    },
  },
  S2: {
    sortOrder: 2,
    uz: {
      name: 'Dekorativ relyefli plita qoliplari',
      slug: 'dekorativ-plitka-qoliplari',
      description: 'Gulli, naqshli va relyefli dekorativ plitalar uchun qoliplar.',
    },
    ru: {
      name: 'Формы для декоративной плитки',
      slug: 'formy-dlya-dekorativnoy-plitki',
      description: 'Формы для декоративных плиток с цветочным, узорным и рельефным рисунком.',
    },
  },
  S3: {
    sortOrder: 3,
    uz: {
      name: 'Devor paneli va profil (hoshiya) qoliplari',
      slug: 'panel-profil-qoliplari',
      description: 'Fasad va to‘siq uchun panel, karniz, pilyastra va profil qoliplari.',
    },
    ru: {
      name: 'Формы для панелей и профилей',
      slug: 'formy-dlya-paneley-profiley',
      description: 'Формы для фасадных панелей, карнизов, пилястр и профилей.',
    },
  },
};

// molds-2026.json dagi ichki kategoriya kodlari -> katalog bo'limlari
const CATEGORY_TO_SECTION = {
  bruschatka: 'S1',
  bordyur: 'S1',
  plitka: 'S2',
  'devor-panel': 'S3',
  fasad: 'S3',
  termopanel: 'S3',
};

async function upsertAttribute({ code, type, unit, variantAxis, sortOrder, uz, ru }) {
  const attribute = await prisma.attributeDefinition.upsert({
    where: { code },
    update: { type, unit, variantAxis, sortOrder },
    create: { code, type, unit, variantAxis, sortOrder },
  });
  for (const [locale, name] of [['uz', uz], ['ru', ru]]) {
    await prisma.attributeTranslation.upsert({
      where: { attributeId_locale: { attributeId: attribute.id, locale } },
      update: { name },
      create: { attributeId: attribute.id, locale, name },
    });
  }
  return attribute;
}

async function upsertOption(attributeId, code, sortOrder, uz, ru) {
  const option = await prisma.attributeOption.upsert({
    where: { attributeId_code: { attributeId, code } },
    update: { sortOrder },
    create: { attributeId, code, sortOrder },
  });
  for (const [locale, label] of [['uz', uz], ['ru', ru]]) {
    await prisma.attributeOptionTranslation.upsert({
      where: { optionId_locale: { optionId: option.id, locale } },
      update: { label },
      create: { optionId: option.id, locale, label },
    });
  }
  return option;
}

async function upsertCategory(key) {
  const section = CATEGORY_TO_SECTION[key];
  const def = section ? SECTION_DEFS[section] : null;
  if (!def) throw new Error(`Noma'lum kategoriya: ${key}`);

  const existing = await prisma.categoryTranslation.findUnique({
    where: { locale_slug: { locale: 'uz', slug: def.uz.slug } },
  });

  // Kategoriya bor bo'lsa tegilmaydi (nomi/rasmi seed tomonidan boshqariladi),
  // yo'q bo'lsagina yaratiladi.
  const category = existing
    ? await prisma.category.findUnique({ where: { id: existing.categoryId } })
    : await prisma.category.create({ data: { sortOrder: def.sortOrder, status: 'ACTIVE' } });

  for (const locale of ['uz', 'ru']) {
    const t = def[locale];
    await prisma.categoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: category.id, locale } },
      update: {},
      create: { categoryId: category.id, locale, name: t.name, slug: t.slug, description: t.description },
    });
  }
  return category;
}

async function linkCategoryAttribute(categoryId, attributeId, required) {
  await prisma.categoryAttribute.upsert({
    where: { categoryId_attributeId: { categoryId, attributeId } },
    update: { required },
    create: { categoryId, attributeId, required },
  });
}

async function main() {
  const products = catalog.products;
  console.log(`2026 studiya seriyasi: ${products.length} ta mahsulot${DRY_RUN ? ' (DRY RUN)' : ''}`);

  if (DRY_RUN) {
    const byCategory = products.reduce((acc, p) => ({ ...acc, [p.category]: (acc[p.category] || 0) + 1 }), {});
    const variantsPerProduct = (products[0].options || []).reduce(
      (n, axis) => n * catalog.optionAxes[axis].values.length,
      1
    );
    console.table(byCategory);
    console.log(`Variantlar: ${products.length} × ${variantsPerProduct} = ${products.length * variantsPerProduct}`);
    console.log('Hech narsa o‘chirilmaydi va yozilmaydi. Yozish uchun --dry-run siz ishga tushiring.');
    return;
  }

  // 1. Atributlar
  const attrDimensions = await upsertAttribute({ code: 'dimensions', type: 'TEXT', unit: 'mm', variantAxis: false, sortOrder: 1, uz: 'O‘lchami', ru: 'Размер' });
  const attrMaterial = await upsertAttribute({ code: 'material', type: 'TEXT', unit: null, variantAxis: false, sortOrder: 2, uz: 'Material', ru: 'Материал' });
  const attrTexture = await upsertAttribute({ code: 'texture', type: 'SELECT', unit: null, variantAxis: false, sortOrder: 3, uz: 'Tekstura', ru: 'Фактура' });

  const textureIds = {};
  let i = 1;
  for (const [code, labels] of Object.entries(TEXTURE_LABELS)) {
    const option = await upsertOption(attrTexture.id, code, i++, labels.uz, labels.ru);
    textureIds[code] = option.id;
  }

  // 2. Variant o'qlari (opsiyalar)
  const axes = {};
  let axisSort = 10;
  for (const [axisCode, axis] of Object.entries(catalog.optionAxes)) {
    const attribute = await upsertAttribute({
      code: axisCode, type: 'SELECT', unit: null, variantAxis: true, sortOrder: axisSort++,
      uz: axis.nameUz, ru: axis.nameRu,
    });
    const options = {};
    for (const [index, value] of axis.values.entries()) {
      const option = await upsertOption(attribute.id, value.code, index + 1, value.labelUz, value.labelRu);
      options[value.code] = option.id;
    }
    axes[axisCode] = { id: attribute.id, options, values: axis.values };
  }

  // 3. Kategoriyalar (faqat shu seriyada ishlatilganlari)
  const categories = {};
  for (const key of new Set(products.map((p) => p.category))) {
    const category = await upsertCategory(key);
    categories[key] = category;
    await linkCategoryAttribute(category.id, attrDimensions.id, true);
    await linkCategoryAttribute(category.id, attrMaterial.id, true);
    await linkCategoryAttribute(category.id, attrTexture.id, false);
    for (const axis of Object.values(axes)) await linkCategoryAttribute(category.id, axis.id, false);
  }

  // 4. Mahsulotlar
  let created = 0;
  let updated = 0;

  for (const item of products) {
    const category = categories[item.category];
    const dimensions = item.dimensionsConfirmed ? item.dimensions : `${item.dimensions}*`;
    const before = await prisma.product.findUnique({ where: { sku: item.sku } });

    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        status: 'ACTIVE', basePrice: item.price ?? 0, currency: 'UZS',
        inStock: true, stockQty: 999, trackInventory: false, allowBackorder: true,
        isBestseller: !!item.bestseller, isNew: !!item.isNew,
        yieldPerCast: item.cavities > 1 ? item.cavities : null,
      },
      create: {
        sku: item.sku, status: 'ACTIVE', basePrice: item.price ?? 0, currency: 'UZS',
        inStock: true, stockQty: 999, trackInventory: false, allowBackorder: true,
        isBestseller: !!item.bestseller, isNew: !!item.isNew,
        yieldPerCast: item.cavities > 1 ? item.cavities : null,
      },
    });
    before ? updated++ : created++;

    // Tarjimalar
    for (const [locale, name, slug, short, desc] of [
      ['uz', item.nameUz, item.slugUz, item.shortUz, item.descUz],
      ['ru', item.nameRu, item.slugRu, item.shortRu, item.descRu],
    ]) {
      await prisma.productTranslation.upsert({
        where: { productId_locale: { productId: product.id, locale } },
        update: { name, slug, shortDescription: short, description: desc, metaTitle: `${name} — SPS`, metaDescription: short },
        create: { productId: product.id, locale, name, slug, shortDescription: short, description: desc, metaTitle: `${name} — SPS`, metaDescription: short },
      });
    }

    // Kategoriya bog'lanishi
    await prisma.productCategory.upsert({
      where: { productId_categoryId: { productId: product.id, categoryId: category.id } },
      update: {},
      create: { productId: product.id, categoryId: category.id },
    });

    // Rasm (bitta MAIN) — qayta yozamiz, boshqa mahsulotlarga tegmaymiz
    await prisma.productMedia.deleteMany({ where: { productId: product.id, type: 'MAIN' } });
    await prisma.productMedia.create({
      data: { productId: product.id, type: 'MAIN', url: item.image, alt: item.nameUz, sortOrder: 1 },
    });

    // Xususiyatlar
    await prisma.productAttributeValue.deleteMany({
      where: { productId: product.id, attributeId: { in: [attrDimensions.id, attrMaterial.id, attrTexture.id] } },
    });
    await prisma.productAttributeValue.create({ data: { productId: product.id, attributeId: attrDimensions.id, textValue: dimensions } });
    await prisma.productAttributeValue.create({ data: { productId: product.id, attributeId: attrMaterial.id, textValue: item.material } });
    if (textureIds[item.texture]) {
      await prisma.productAttributeValue.create({ data: { productId: product.id, attributeId: attrTexture.id, optionId: textureIds[item.texture] } });
    }

    // Variantlar (opsiya kombinatsiyalari) — SKU bo'yicha upsert, o'chirilmaydi
    let combos = [[]];
    for (const axisCode of (item.options || []).filter((code) => axes[code])) {
      const next = [];
      for (const combo of combos) {
        for (const value of axes[axisCode].values) next.push([...combo, { axisCode, value }]);
      }
      combos = next;
    }

    for (const combo of combos) {
      if (combo.length === 0) continue;
      const variantSku = `${item.sku}-${combo.map((c) => c.value.code.toUpperCase()).join('-')}`;
      const variant = await prisma.productVariant.upsert({
        where: { sku: variantSku },
        update: { productId: product.id, price: item.price ?? 0, stockQty: 100, status: 'ACTIVE' },
        create: { productId: product.id, sku: variantSku, price: item.price ?? 0, stockQty: 100, status: 'ACTIVE' },
      });
      await prisma.productVariantOption.deleteMany({ where: { variantId: variant.id } });
      for (const c of combo) {
        await prisma.productVariantOption.create({
          data: { variantId: variant.id, optionId: axes[c.axisCode].options[c.value.code] },
        });
      }
    }
  }

  console.log(`Tayyor: ${created} ta yangi, ${updated} ta yangilangan mahsulot.`);
  console.log('Hech qanday mavjud ma\'lumot o‘chirilmadi.');
}

main()
  .catch((error) => {
    console.error('Import xatosi:', error);
    process.exit(1);
  })
  .finally(async () => {
    if (prisma) await prisma.$disconnect();
  });
