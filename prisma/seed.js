const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productAttribute.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.project.deleteMany();
  await prisma.banner.deleteMany();

  // Create Admin User
  await prisma.adminUser.create({
    data: {
      email: 'admin@spsplast.uz',
      name: 'SPS Plast Admin',
      password: 'admin123', // Demo password
      role: 'ADMIN',
    },
  });

  // Create Categories
  const catTermopanel = await prisma.category.create({
    data: {
      slug: 'termopanel',
      nameUz: 'Termopanel va Fasad',
      nameRu: 'Термопанели и фасад',
      descriptionUz: 'Fasadni issiqlik saqlovchi va ko‘rkam bezatuvchi zamonaviy termopanellar',
      descriptionRu: 'Современные термопанели для утепления и отделки фасада',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      sortOrder: 1,
    },
  });

  const catBruschatka = await prisma.category.create({
    data: {
      slug: 'bruschatka-qoliplari',
      nameUz: 'Bruschatka qoliplari',
      nameRu: 'Формы для брусчатки',
      descriptionUz: 'Bruschatka va trotuar plitkalari ishlab chiqarish uchun yuqori chidamli plastik qoliplar',
      descriptionRu: 'Высокопрочные пластиковые формы для производства брусчатки и тротуарной плитки',
      image: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
      sortOrder: 2,
    },
  });

  const catBordyur = await prisma.category.create({
    data: {
      slug: 'bordyur-qoliplari',
      nameUz: 'Bordyur qoliplari',
      nameRu: 'Формы для бордюров',
      descriptionUz: 'Yo‘l va hovli bordyurlari quyish uchun professional va mustahkam qoliplar',
      descriptionRu: 'Профессиональные и прочные формы для отливки дорожных и тротуарных бордюров',
      image: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80',
      sortOrder: 3,
    },
  });

  const catZina = await prisma.category.create({
    data: {
      slug: 'zina-va-beton-qoliplari',
      nameUz: 'Zina va beton qoliplari',
      nameRu: 'Формы для ступеней и бетона',
      descriptionUz: 'Beton zinalar, qoplamalar va arxitektura detallari uchun plastik qoliplar',
      descriptionRu: 'Пластиковые формы для бетонных ступеней, накрывок и архитектурных элементов',
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      sortOrder: 4,
    },
  });

  const catDekor = await prisma.category.create({
    data: {
      slug: 'dekorativ-qoliplar',
      nameUz: 'Dekorativ va devor qoliplari',
      nameRu: 'Декоративные и фасадные формы',
      descriptionUz: '3D fasad toshlari, devor panellari va dekorativ buyumlar qoliplari',
      descriptionRu: 'Формы для 3D фасадных камней, стеновых панелей и декора',
      image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
      sortOrder: 5,
    },
  });

  // Seed Products
  const productsData = [
    {
      slug: 'bruschatka-qolipi-6-kirpich',
      sku: 'SPS-BR-001',
      titleUz: 'Bruschatka qolipi "6 ta g‘isht" (6 Kirpich)',
      titleRu: 'Форма для брусчатки "6 кирпичей"',
      descriptionUz: 'Yuqori sifatli 2mm ABS plastikdan tayyorlangan 6 talik g‘isht ko‘rinishidagi bruschatka qolipi. Yuqori elastiklik va 300+ marotaba beton quyish resursiga ega.',
      descriptionRu: 'Форма для брусчатки в виде 6 кирпичей из качественного ABS пластика 2мм. Высокая эластичность и ресурс более 300 заливок бетона.',
      price: 18000,
      oldPrice: 22000,
      isBestseller: true,
      isNew: true,
      inStock: true,
      stockQty: 500,
      dimensions: '300x200x45 mm',
      thickness: '45 mm',
      material: 'ABS Plastik 2mm',
      weight: '0.65 kg',
      yieldPerCast: 6,
      durabilityCasts: 350,
      shape: 'G‘isht simon',
      texture: 'G‘adir-budur toshsimon',
      categoryId: catBruschatka.id,
      resultImage: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
      resultTitleUz: 'Tayyor Bruschatka "6 Kirpich" Namunasi',
      resultTitleRu: 'Образец готовой брусчатки "6 Кирпичей"',
      images: [
        'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80'
      ],
      attributes: [
        { keyUz: 'Material', keyRu: 'Материал', valueUz: 'ABS Plastik 2mm', valueRu: 'ABS Пластик 2мм' },
        { keyUz: 'Bir quyishda', keyRu: 'За одну заливку', valueUz: '6 ta bruschatka', valueRu: '6 штук брусчатки' },
        { keyUz: 'Resurs', keyRu: 'Ресурс', valueUz: '300-400 quyish', valueRu: '300-400 заливок' }
      ]
    },
    {
      slug: 'termopanel-gishin-travertin',
      sku: 'SPS-TP-002',
      titleUz: 'Fasad Termopanel "Travertin Tekstura"',
      titleRu: 'Фасадная термопанель "Текстура Травертин"',
      descriptionUz: 'Penopolistirol va mermer qoplamali issiqlik saqlovchi va suv o‘tkazmaydigan fasad paneli. Binoni birdaniga ham bezaydi, ham issiq ushlaydi.',
      descriptionRu: 'Утепляющая и водонепроницаемая фасадная панель с пенополистиролом и мраморным покрытием. Одновременно утепляет и украшает фасад.',
      price: 125000,
      oldPrice: 145000,
      isBestseller: true,
      isNew: false,
      inStock: true,
      stockQty: 1200,
      dimensions: '1000x500x50 mm',
      thickness: '50 mm',
      material: 'Penopolistirol + Mramor kırıntısı',
      weight: '3.2 kg',
      yieldPerCast: null,
      durabilityCasts: null,
      shape: 'To‘g‘ri to‘rtburchak',
      texture: 'Klassik Travertin',
      categoryId: catTermopanel.id,
      resultImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      resultTitleUz: 'Termopanel o‘rnatilgan tayyor uy fasadi',
      resultTitleRu: 'Готовый фасад дома с термопанелями',
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80'
      ],
      attributes: [
        { keyUz: 'Issiqlik izolyatsiyasi', keyRu: 'Теплоизоляция', valueUz: 'Zichlik 25kg/m³', valueRu: 'Плотность 25кг/м³' },
        { keyUz: 'Rang tanlovi', keyRu: 'Выбор цвета', valueUz: 'Kulrang, Jigarrang, Beige', valueRu: 'Серый, Коричневый, Бежевый' }
      ]
    },
    {
      slug: 'bordyur-qolipi-trotuar-50cm',
      sku: 'SPS-BD-003',
      titleUz: 'Trotuar Bordyur Qolipi (50 sm)',
      titleRu: 'Форма для тротуарного бордюра (50 см)',
      descriptionUz: 'Yo‘laklar va trotuarlar uchun ixcham va mustahkam bordyur qolipi. Geometrik aniq o‘lcham va geometriya kafolatlangan.',
      descriptionRu: 'Компактная и прочная форма бордюра для дорожек и тротуаров. Точная геометрия и высокая износостойкость.',
      price: 35000,
      oldPrice: null,
      isBestseller: false,
      isNew: true,
      inStock: true,
      stockQty: 250,
      dimensions: '500x200x80 mm',
      thickness: '80 mm',
      material: 'Polipropilen 3mm',
      weight: '1.2 kg',
      yieldPerCast: 1,
      durabilityCasts: 500,
      shape: 'Pryamoy bordyur',
      texture: 'Silliq finish',
      categoryId: catBordyur.id,
      resultImage: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80',
      resultTitleUz: 'Tayyor Trotuar Bordyuri',
      resultTitleRu: 'Готовый тротуарный бордюр',
      images: [
        'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80'
      ],
      attributes: [
        { keyUz: 'Resurs', keyRu: 'Ресурс', valueUz: '500+ quyish', valueRu: '500+ заливок' }
      ]
    },
    {
      slug: 'zina-qolipi-mramor-mosaika',
      sku: 'SPS-ZN-004',
      titleUz: 'Beton Zina Zillali Qolipi (Zina va Qoplama)',
      titleRu: 'Форма для бетонной ступени и проступи',
      descriptionUz: 'Hovli va binolar kirish qismi uchun silliq yoki tosh teksturali beton zina quyish qolipi. Siyg‘anmas yuzaga ega.',
      descriptionRu: 'Форма для заливки бетонных ступеней для входа в дом. Противоскользящая фактура и высокая прочность.',
      price: 65000,
      oldPrice: 75000,
      isBestseller: true,
      isNew: false,
      inStock: true,
      stockQty: 180,
      dimensions: '1200x350x50 mm',
      thickness: '50 mm',
      material: 'Vakuumli ABS Plastik 3mm',
      weight: '2.4 kg',
      yieldPerCast: 1,
      durabilityCasts: 300,
      shape: 'Zina pog‘onasi',
      texture: 'Anti-slip relief',
      categoryId: catZina.id,
      resultImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      resultTitleUz: 'Tayyor quyilgan beton zina namunasi',
      resultTitleRu: 'Пример готовой бетонной ступени',
      images: [
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
      ],
      attributes: [
        { keyUz: 'Xususiyati', keyRu: 'Особенность', valueUz: 'Sirpanib ketmaydigan yutuvchi relief', valueRu: 'Противоскользящий рельеф' }
      ]
    },
    {
      slug: 'dekorativ-3d-fasad-tosh-qolipi',
      sku: 'SPS-DK-005',
      titleUz: 'Dekorativ 3D Fasad Tosh Qolipi "Slates"',
      titleRu: 'Форма для декоративного 3D фасадного камня "Сланец"',
      descriptionUz: 'Ichki va tashqi devorlarni bezash uchun sun’iy tosh (gips yoki beton) quyish qolipi. Tabiiy slanets tosh effektini beradi.',
      descriptionRu: 'Форма для отливки искусственного камня из гипса или бетона для внутренней и наружной отделки.',
      price: 45000,
      oldPrice: 50000,
      isBestseller: false,
      isNew: true,
      inStock: true,
      stockQty: 300,
      dimensions: '500x400x30 mm',
      thickness: '30 mm',
      material: 'ABS Plastik 2mm',
      weight: '0.9 kg',
      yieldPerCast: 8,
      durabilityCasts: 400,
      shape: 'Tabiiy toshlar',
      texture: 'Slates relief',
      categoryId: catDekor.id,
      resultImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
      resultTitleUz: 'Devorga terilgan 3D Slates toshlari',
      resultTitleRu: '3D камни "Сланец" на стене',
      images: [
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80'
      ],
      attributes: [
        { keyUz: 'Resurs', keyRu: 'Ресурс', valueUz: '400+ quyish', valueRu: '400+ заливок' }
      ]
    }
  ];

  for (const item of productsData) {
    const { images, attributes, ...pData } = item;
    const createdProduct = await prisma.product.create({
      data: pData,
    });

    for (let i = 0; i < images.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: createdProduct.id,
          url: images[i],
          altText: createdProduct.titleUz,
          order: i,
        },
      });
    }

    for (const attr of attributes) {
      await prisma.productAttribute.create({
        data: {
          productId: createdProduct.id,
          ...attr,
        },
      });
    }
  }

  // Seed Banners
  await prisma.banner.create({
    data: {
      titleUz: 'Qurilish va ishlab chiqarish uchun sifatli mahsulotlar',
      titleRu: 'Качественные товары для строительства и производства',
      subTitleUz: 'Termopanel, bruschatka qoliplari va beton mahsulotlari uchun professional yechimlar.',
      subTitleRu: 'Профессиональные решения для термопанелей, форм брусчатки и бетона.',
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=1600&q=80',
      linkUrl: '/catalog',
      position: 'HERO',
      isActive: true,
    },
  });

  // Seed Projects
  await prisma.project.create({
    data: {
      titleUz: 'Toshkent shahridagi hovli bruschatka qoplamasi',
      titleRu: 'Укладка брусчатки в частном дворе, г. Ташкент',
      descriptionUz: 'SPS-BR-001 qolipi yordamida 250 kv.m maydon bruschatka bilan qoplandi.',
      descriptionRu: 'Покрытие 250 кв.м с использованием формы SPS-BR-001.',
      location: 'Toshkent, Yunusobod',
      productUsed: 'Bruschatka qolipi "6 ta g‘isht"',
      afterImage: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
      beforeImage: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80',
    },
  });

  // Seed Blog Posts
  await prisma.blogPost.create({
    data: {
      slug: 'bruschatka-qolipi-qanday-tanlanadi',
      titleUz: 'Bruschatka qolipi qanday tanlanadi? Ishlab chiqarish bo‘yicha maslahatlar',
      titleRu: 'Как выбрать форму для брусчатки? Советы по производству',
      excerptUz: 'Plastik qolipning qalinligi, elastikligi va resursining ahamiyati haqida batafsil ma’lumot.',
      excerptRu: 'Подробно о важности толщины, эластичности и ресурса пластиковых форм.',
      contentUz: 'Bruschatka va trotuar plitkalari ishlab chiqarishda qolip tanlash eng muhim bosqichdir. ABS plastik va polipropilen qoliplarning asosiy farqlari...',
      contentRu: 'Выбор формы является ключевым этапом при производстве брусчатки...',
      coverImage: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
      author: 'SPS Plast Texnologi',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
