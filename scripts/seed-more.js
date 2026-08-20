const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MORE categories and products...');

  // 1. Create 3 more categories
  const cat3D = await prisma.category.create({
    data: {
      sortOrder: 4,
      image: 'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=800&q=80',
      translations: {
        create: [
          { locale: 'uz', name: '3D Panellar', slug: '3d-panellar', description: 'Ichki bezak uchun 3D panellar' },
          { locale: 'ru', name: '3D Панели', slug: '3d-paneli', description: '3D панели для интерьера' },
        ],
      },
    },
  });

  const catDekor = await prisma.category.create({
    data: {
      sortOrder: 5,
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      translations: {
        create: [
          { locale: 'uz', name: 'Dekorativ G\'ishtlar', slug: 'dekorativ-gishtlar', description: 'Dekorativ g\'isht qoliplari' },
          { locale: 'ru', name: 'Декоративный кирпич', slug: 'dekorativniy-kirpich', description: 'Формы для декоративного кирпича' },
        ],
      },
    },
  });

  const catFasad = await prisma.category.create({
    data: {
      sortOrder: 6,
      image: 'https://images.unsplash.com/photo-1523413363574-c30aa1c2a516?auto=format&fit=crop&w=800&q=80',
      translations: {
        create: [
          { locale: 'uz', name: 'Fasad Dekori', slug: 'fasad-dekori', description: 'Fasad bezaklari uchun qoliplar' },
          { locale: 'ru', name: 'Фасадный декор', slug: 'fasadniy-decor', description: 'Формы для фасадного декора' },
        ],
      },
    },
  });

  // 2. Generate products for 3D Panellar
  for (let i = 1; i <= 4; i++) {
    await prisma.product.create({
      data: {
        sku: `SPS-3D-00${i}`,
        status: 'ACTIVE',
        basePrice: 45000 + i * 2000,
        inStock: true,
        stockQty: 300,
        isBestseller: true,
        translations: {
          create: [
            { locale: 'uz', name: `3D Panel "To'lqin ${i}"`, slug: `3d-panel-tolqin-${i}`, description: 'Ajoyib 3D dizayn' },
            { locale: 'ru', name: `3D Панель "Волна ${i}"`, slug: `3d-panel-volna-${i}`, description: 'Отличный 3D дизайн' },
          ],
        },
        categories: { create: [{ categoryId: cat3D.id }] },
        media: {
          create: [
            { type: 'MAIN', url: `https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=800&q=80&sig=${i+30}`, sortOrder: 1 },
          ],
        },
      },
    });
  }

  // 3. Generate products for Dekorativ G'ishtlar
  for (let i = 1; i <= 4; i++) {
    await prisma.product.create({
      data: {
        sku: `SPS-DK-00${i}`,
        status: 'ACTIVE',
        basePrice: 15000 + i * 1000,
        inStock: true,
        stockQty: 800,
        isBestseller: true,
        translations: {
          create: [
            { locale: 'uz', name: `Dekorativ g'isht qolipi ${i}`, slug: `dekor-gisht-${i}`, description: 'Interyer uchun g\'isht' },
            { locale: 'ru', name: `Форма для декор. кирпича ${i}`, slug: `decor-kirpich-${i}`, description: 'Кирпич для интерьера' },
          ],
        },
        categories: { create: [{ categoryId: catDekor.id }] },
        media: {
          create: [
            { type: 'MAIN', url: `https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80&sig=${i+40}`, sortOrder: 1 },
          ],
        },
      },
    });
  }

  // 4. Generate products for Fasad Dekori
  for (let i = 1; i <= 4; i++) {
    await prisma.product.create({
      data: {
        sku: `SPS-FD-00${i}`,
        status: 'ACTIVE',
        basePrice: 55000 + i * 5000,
        inStock: true,
        stockQty: 200,
        isBestseller: true,
        translations: {
          create: [
            { locale: 'uz', name: `Fasad karnizi ${i}`, slug: `fasad-karniz-${i}`, description: 'Uy fasadi uchun karniz' },
            { locale: 'ru', name: `Фасадный карниз ${i}`, slug: `fasad-karniz-ru-${i}`, description: 'Карниз для фасада' },
          ],
        },
        categories: { create: [{ categoryId: catFasad.id }] },
        media: {
          create: [
            { type: 'MAIN', url: `https://images.unsplash.com/photo-1523413363574-c30aa1c2a516?auto=format&fit=crop&w=800&q=80&sig=${i+50}`, sortOrder: 1 },
          ],
        },
      },
    });
  }

  console.log('More seed data inserted!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
