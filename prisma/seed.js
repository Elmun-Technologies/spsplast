const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with Production Foundation models...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.adminSession.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.productMedia.deleteMany();
  await prisma.productAttributeValue.deleteMany();
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

  // 1. Create Admin User (Safely from environment variables)
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        name: 'SPS Plast Admin',
        passwordHash,
        role: 'ADMIN',
      },
    });
    console.log(`Admin user created safely for: ${adminEmail}`);
  } else {
    console.warn('SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD environment variables not provided. Skipping admin creation.');
  }

  // 2. Create Dynamic Attributes
  const attrDimensions = await prisma.attributeDefinition.create({
    data: {
      code: 'dimensions',
      type: 'TEXT',
      unit: 'mm',
      filterable: true,
      translations: {
        create: [
          { locale: 'uz', name: 'O‘lchami' },
          { locale: 'ru', name: 'Размер' },
        ],
      },
    },
  });

  const attrMaterial = await prisma.attributeDefinition.create({
    data: {
      code: 'material',
      type: 'TEXT',
      unit: null,
      filterable: true,
      translations: {
        create: [
          { locale: 'uz', name: 'Material' },
          { locale: 'ru', name: 'Материал' },
        ],
      },
    },
  });

  const attrTexture = await prisma.attributeDefinition.create({
    data: {
      code: 'texture',
      type: 'SELECT',
      unit: null,
      filterable: true,
      translations: {
        create: [
          { locale: 'uz', name: 'Tekstura / Yuzasi' },
          { locale: 'ru', name: 'Фактура / Поверхность' },
        ],
      },
    },
  });

  // Texture Options
  await prisma.attributeOption.create({
    data: {
      attributeId: attrTexture.id,
      code: 'brick',
      sortOrder: 1,
      translations: {
        create: [
          { locale: 'uz', label: 'G‘isht simon' },
          { locale: 'ru', label: 'Кирпичная фактура' },
        ],
      },
    },
  });

  // 3. Create Categories
  const catBruschatka = await prisma.category.create({
    data: {
      sortOrder: 1,
      image: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
      translations: {
        create: [
          { locale: 'uz', name: 'Bruschatka qoliplari', slug: 'bruschatka-qoliplari', description: 'Bruschatka va trotuar plitka qoliplari' },
          { locale: 'ru', name: 'Формы для брусчатки', slug: 'formy-dlya-bruschatki', description: 'Формы для брусчатки и тротуарной плитки' },
        ],
      },
    },
  });

  const catTermopanel = await prisma.category.create({
    data: {
      sortOrder: 2,
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      translations: {
        create: [
          { locale: 'uz', name: 'Termopanel va Fasad', slug: 'termopanel', description: 'Fasadni issiqlik saqlovchi termopanellar' },
          { locale: 'ru', name: 'Термопанели и фасад', slug: 'termopaneli', description: 'Фасадные утепляющие термопанели' },
        ],
      },
    },
  });

  const catBordyur = await prisma.category.create({
    data: {
      sortOrder: 3,
      image: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80',
      translations: {
        create: [
          { locale: 'uz', name: 'Bordyur qoliplari', slug: 'bordyur-qoliplari', description: 'Trotuar va yo‘l bordyur qoliplari' },
          { locale: 'ru', name: 'Формы для бордюров', slug: 'formy-dlya-bordyurov', description: 'Формы для тротуарных бордюров' },
        ],
      },
    },
  });

  // Link Category Attributes
  await prisma.categoryAttribute.create({
    data: { categoryId: catBruschatka.id, attributeId: attrDimensions.id, required: true },
  });
  await prisma.categoryAttribute.create({
    data: { categoryId: catBruschatka.id, attributeId: attrMaterial.id, required: true },
  });

  // 4. Create Representative Mold Products (Generate 12 items)
  for (let i = 1; i <= 12; i++) {
    await prisma.product.create({
      data: {
        sku: `SPS-BR-00${i}`,
        status: 'ACTIVE',
        basePrice: 15000 + i * 1000,
        compareAtPrice: i % 3 === 0 ? 18000 + i * 1000 : null,
        inStock: i % 5 !== 0,
        stockQty: 500,
        isBestseller: i <= 4,
        isNew: i > 8,
        yieldPerCast: 6,
        durabilityCasts: 350,
        translations: {
          create: [
            {
              locale: 'uz',
              name: `Bruschatka qolipi "Model ${i}"`,
              slug: `bruschatka-qolipi-model-${i}`,
              shortDescription: '2mm ABS plastikdan tayyorlangan yuqori sifatli qolip',
              description: 'Yuqori chidamlilikka ega ABS plastik qolipi. 300+ quyish resursiga ega.',
            },
            {
              locale: 'ru',
              name: `Форма для брусчатки "Модель ${i}"`,
              slug: `forma-dlya-bruschatki-model-${i}`,
              shortDescription: 'Форма из 2мм ABS пластика',
              description: 'Высокопрочная форма из ABS пластика. Ресурс более 300 заливок.',
            },
          ],
        },
        categories: {
          create: [{ categoryId: catBruschatka.id }],
        },
        media: {
          create: [
            {
              type: 'MOLD',
              url: `https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80&sig=${i}`,
              alt: 'Qolip tasviri',
              sortOrder: 1,
            },
            {
              type: 'FINISHED_RESULT',
              url: `https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80&sig=${i}`,
              alt: 'Tayyor quyilgan bruschatka natijasi',
              sortOrder: 2,
            },
          ],
        },
        attributeValues: {
          create: [
            { attributeId: attrDimensions.id, textValue: '300x200x45 mm' },
            { attributeId: attrMaterial.id, textValue: 'ABS Plastik 2mm' },
          ],
        },
      },
    });
  }

  // 5. Create Representative Thermopanel Products (Generate 8 items)
  for (let i = 1; i <= 8; i++) {
    await prisma.product.create({
      data: {
        sku: `SPS-TP-00${i}`,
        status: 'ACTIVE',
        basePrice: 120000 + i * 5000,
        compareAtPrice: i % 2 === 0 ? 140000 + i * 5000 : null,
        inStock: true,
        stockQty: 1200,
        isBestseller: i <= 3,
        isNew: i > 6,
        translations: {
          create: [
            {
              locale: 'uz',
              name: `Fasad Termopanel "Tekstura ${i}"`,
              slug: `termopanel-tekstura-${i}`,
              shortDescription: 'Issiqlik saqlovchi va suv o‘tkazmaydigan fasad paneli',
              description: 'Penopolistirol va mramor qoplamali zamonaviy termopanel.',
            },
            {
              locale: 'ru',
              name: `Фасадная термопанель "Текстура ${i}"`,
              slug: `termopanel-tekstura-${i}-ru`,
              shortDescription: 'Утепляющая фасадная панель с пенополистиролом',
              description: 'Современная фасадная панель с мраморной крошкой.',
            },
          ],
        },
        categories: {
          create: [{ categoryId: catTermopanel.id }],
        },
        media: {
          create: [
            {
              type: 'MAIN',
              url: `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80&sig=${i+10}`,
              alt: 'Termopanel',
              sortOrder: 1,
            },
          ],
        },
        attributeValues: {
          create: [
            { attributeId: attrDimensions.id, textValue: '1000x500x50 mm' },
            { attributeId: attrMaterial.id, textValue: 'Penopolistirol + Mramor' },
          ],
        },
      },
    });
  }

  // 5.5 Create Category 3 Products (Bordyur - Generate 6 items)
  for (let i = 1; i <= 6; i++) {
    await prisma.product.create({
      data: {
        sku: `SPS-BD-00${i}`,
        status: 'ACTIVE',
        basePrice: 25000 + i * 2000,
        compareAtPrice: null,
        inStock: true,
        stockQty: 800,
        isBestseller: i === 1,
        isNew: false,
        translations: {
          create: [
            {
              locale: 'uz',
              name: `Yo'l Bordyuri "Model ${i}"`,
              slug: `bordyur-model-${i}`,
              shortDescription: 'Mustahkam beton quyish uchun bordyur qolipi',
              description: 'Sifatli va uzoq muddat xizmat qiladigan bordyur qolipi.',
            },
            {
              locale: 'ru',
              name: `Дорожный бордюр "Модель ${i}"`,
              slug: `bordyur-model-${i}-ru`,
              shortDescription: 'Форма для заливки прочных бордюров',
              description: 'Качественная и долговечная форма для бордюров.',
            },
          ],
        },
        categories: {
          create: [{ categoryId: catBordyur.id }],
        },
        media: {
          create: [
            {
              type: 'MAIN',
              url: `https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80&sig=${i+20}`,
              alt: 'Bordyur',
              sortOrder: 1,
            },
          ],
        },
        attributeValues: {
          create: [
            { attributeId: attrDimensions.id, textValue: '500x200x80 mm' },
            { attributeId: attrMaterial.id, textValue: 'ABS Plastik' },
          ],
        },
      },
    });
  }

  // 6. Create Seed Banners, Projects & Blog Posts
  await prisma.banner.create({
    data: {
      titleUz: 'Qurilish va ishlab chiqarish uchun sifatli mahsulotlar',
      titleRu: 'Качественные товары для строительства и производства',
      subTitleUz: 'Termopanel, bruschatka qoliplari va beton mahsulotlari.',
      subTitleRu: 'Профессиональные решения для брусчатки и бетона.',
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=1600&q=80',
      position: 'HERO',
      isActive: true,
    },
  });

  await prisma.project.create({
    data: {
      titleUz: 'Toshkent shahridagi hovli bruschatka qoplamasi',
      titleRu: 'Укладка брусчатки в частном дворе, г. Ташкент',
      descriptionUz: 'SPS-BR-001 qolipi yordamida 250 kv.m maydon bruschatka bilan qoplandi.',
      descriptionRu: 'Покрытие 250 кв.м с использованием формы SPS-BR-001.',
      location: 'Toshkent, Yunusobod',
      productUsed: 'Bruschatka qolipi "6 ta g‘isht"',
      afterImage: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
    },
  });

  await prisma.blogPost.create({
    data: {
      author: 'SPS Plast Mutaxassisi',
      coverImage: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
      isPublished: true,
      translations: {
        create: [
          {
            locale: 'uz',
            slug: 'bruschatka-qolipi-qanday-tanlanadi',
            title: 'Bruschatka qolipi qanday tanlanadi? Maslahatlar',
            excerpt: 'Plastik qolipning qalinligi va resursining ahamiyati haqida.',
            content: 'Bruschatka va trotuar plitkalari ishlab chiqarishda qolip tanlash eng muhim bosqichdir...',
          },
          {
            locale: 'ru',
            slug: 'kak-vybrat-formu-dlya-bruschatki',
            title: 'Как выбрать форму для брусчатки? Советы',
            excerpt: 'О важности толщины и ресурса пластиковых форм.',
            content: 'Выбор формы является ключевым этапом при производстве брусчатки...',
          },
        ],
      },
    },
  });

  console.log('Database successfully seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
