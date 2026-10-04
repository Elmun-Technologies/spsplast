#!/usr/bin/env node
/**
 * Blog va loyihalar kontentini bazaga yozadi.
 *
 * Manba: `prisma/data/content-2026.json` (uz/ru matnlari, muqova rasmlari).
 *
 * `prisma/seed.js` dan farqi: bu skript HECH NARSA O'CHIRMAYDI va mavjud
 * buyurtma/lead/mahsulotlarga tegmaydi. Faqat blog postlari va loyihalarni
 * slug (blog) / sarlavha (loyiha) bo'yicha upsert qiladi — shuning uchun
 * production bazada ham xavfsiz va qayta-qayta ishga tushirsa bo'ladi.
 *
 *   node scripts/import-content.js            # yozadi
 *   node scripts/import-content.js --dry-run  # faqat nima bo'lishini ko'rsatadi
 */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const content = require('../prisma/data/content-2026.json');

const DRY_RUN = process.argv.includes('--dry-run');

// Rust-siz Prisma client (engineType = "client") — ulanish @prisma/adapter-pg
// orqali beriladi, xuddi prisma/seed.js va src/lib/db.ts dagi kabi.
const prisma = DRY_RUN
  ? null
  : new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function importBlog() {
  let created = 0;
  let updated = 0;

  for (const post of content.blog) {
    const existing = await prisma.blogPostTranslation.findFirst({
      where: { locale: 'uz', slug: post.slug },
      select: { postId: true },
    });

    if (DRY_RUN) {
      console.log(`  [dry] blog ${existing ? 'update' : 'create'}  ${post.slug}`);
      continue;
    }

    const publishDate = new Date(post.publishedAt);

    if (existing) {
      await prisma.blogPost.update({
        where: { id: existing.postId },
        data: {
          coverImage: post.coverImage,
          author: post.author || 'SPS Plast mutaxassisi',
          isPublished: true,
          publishedAt: publishDate,
        },
      });

      for (const locale of ['uz', 'ru']) {
        const localized = post[locale];
        await prisma.blogPostTranslation.upsert({
          where: { postId_locale: { postId: existing.postId, locale } },
          update: {
            slug: localized.slug || post.slug,
            title: localized.title,
            excerpt: localized.excerpt,
            content: localized.content,
          },
          create: {
            postId: existing.postId,
            locale,
            slug: localized.slug || post.slug,
            title: localized.title,
            excerpt: localized.excerpt,
            content: localized.content,
          },
        });
      }
      updated += 1;
    } else {
      await prisma.blogPost.create({
        data: {
          coverImage: post.coverImage,
          author: post.author || 'SPS Plast mutaxassisi',
          isPublished: true,
          publishedAt: publishDate,
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
      created += 1;
    }
  }

  return { created, updated };
}

async function importProjects() {
  let created = 0;
  let updated = 0;

  for (const project of content.projects) {
    // `Project` modelida slug yo'q, shuning uchun mos yozuvni sarlavha bo'yicha
    // topamiz (kontent faylidagi sarlavhalar barqaror va takrorlanmaydi).
    const existing = await prisma.project.findFirst({
      where: { titleUz: project.uz.title },
      select: { id: true },
    });

    const data = {
      titleUz: project.uz.title,
      titleRu: project.ru.title,
      descriptionUz: project.uz.description,
      descriptionRu: project.ru.description,
      location: project.location,
      productUsed: project.productUsed,
      beforeImage: project.beforeImage,
      afterImage: project.afterImage,
    };

    if (DRY_RUN) {
      console.log(`  [dry] project ${existing ? 'update' : 'create'}  ${project.uz.title}`);
      continue;
    }

    if (existing) {
      await prisma.project.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.project.create({ data });
      created += 1;
    }
  }

  return { created, updated };
}

async function main() {
  if (!DRY_RUN && !process.env.DATABASE_URL) {
    console.error('DATABASE_URL topilmadi. .env faylini to‘ldiring yoki --dry-run ishlatilgan.');
    process.exit(1);
  }

  console.log(`Kontent importi: ${content.blog.length} maqola, ${content.projects.length} loyiha`);
  if (DRY_RUN) console.log('(dry-run rejimi — bazaga yozilmaydi)\n');

  // Rasm fayllari haqiqatan mavjudligini tekshiramiz: yo'q rasm bilan sahifa
  // ochilsa Next Image 500 qaytaradi, shuning uchun import paytida bilgan ma'qul.
  const fs = require('fs');
  const path = require('path');
  const missing = [];
  for (const post of content.blog) {
    if (!fs.existsSync(path.join(__dirname, '..', 'public', post.coverImage))) missing.push(post.coverImage);
  }
  for (const project of content.projects) {
    for (const image of [project.beforeImage, project.afterImage]) {
      if (!fs.existsSync(path.join(__dirname, '..', 'public', image))) missing.push(image);
    }
  }
  if (missing.length > 0) {
    console.warn('!! Quyidagi rasmlar topilmadi (avval `python3 scripts/build-media.py`):');
    for (const m of missing) console.warn('   ', m);
    console.warn('');
  }

  const blog = await importBlog();
  const projects = await importProjects();

  console.log(`\nBlog: ${blog.created} ta yangi, ${blog.updated} ta yangilandi`);
  console.log(`Loyihalar: ${projects.created} ta yangi, ${projects.updated} ta yangilandi`);
  console.log('Kontent importi tugadi.');

  if (prisma) await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('Import xatosi:', error);
  if (prisma) await prisma.$disconnect();
  process.exit(1);
});
