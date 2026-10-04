import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { blogPosts, getBlogPostBySlug, getBlogAlternates, getBlogTranslation, getRelatedBlogPosts } from '@/lib/catalog';
import { getDictionary, Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { COMPANY_CONTACTS } from '@/lib/constants/contacts';
import { pageMetadata } from '@/lib/seo';
import { parseContent } from '@/lib/blogContent';
import { ArrowLeft, User, Calendar, Phone, ArrowRight } from 'lucide-react';

/**
 * Blog maqolasi sahifasi.
 *
 * Matn Prisma'da oddiy matn sifatida saqlanadi va `@/lib/blogContent` dagi
 * mini-parser orqali bloklarga ajratiladi ("## ", "### ", "- ", "> ").
 * Parser alohida modulda — u `tests/blogContent.test.js` bilan tekshiriladi.
 *
 * Sahifada: muqova, sarlavha, sana, maqola matni, aloqa CTA va o'xshash
 * maqolalar. Metadata (canonical, hreflang, og:image) — `@/lib/seo` orqali.
 */

function ArticleBody({ content }: { content: string }) {
  const blocks = parseContent(content);

  return (
    <div className="max-w-none text-ink-soft text-[15px] sm:text-base leading-[1.75] space-y-4">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'h2':
            return (
              <h2 key={i} className="text-[22px] sm:text-[26px] font-bold text-ink tracking-[-0.02em] pt-4">
                {block.text}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={i} className="text-[18px] sm:text-xl font-bold text-ink pt-2">
                {block.text}
              </h3>
            );
          case 'ul':
            return (
              <ul key={i} className="space-y-2 pl-1">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-red shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          case 'quote':
            return (
              <blockquote key={i} className="border-l-4 border-brand-red bg-surface-soft rounded-r-[16px] px-5 py-4 font-medium text-ink">
                {block.text}
              </blockquote>
            );
          default:
            return <p key={i}>{block.text}</p>;
        }
      })}
    </div>
  );
}

export function generateStaticParams() {
  return blogPosts.flatMap((post) =>
    post.translations.map((translation) => ({ lang: translation.locale, slug: translation.slug }))
  );
}

export default async function BlogPostPage({ params }: { params: Promise<{ lang: Locale; slug: string }> }) {
  const { lang, slug } = await params;
  const dict = getDictionary(lang);

  const post = getBlogPostBySlug(lang, slug);
  if (!post || !post.translations[0]) {
    notFound();
  }

  const postTrans = post.translations[0];
  const related = getRelatedBlogPosts(lang, post.id, 3);

  // Til almashtirgich uchun har bir tildagi slug (statik katalogdan) —
  // hreflang `generateMetadata` ichida `pageMetadata()` orqali beriladi.

  return (
    <article className="bg-surface-page min-h-screen text-ink py-8">
      <Container>
        <div className="max-w-3xl mx-auto space-y-6">
          <Link
            href={`/${lang}/blog`}
            className="inline-flex items-center gap-1.5 text-[13px] text-ink-sub font-semibold hover:text-brand-red transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'ru' ? 'Назад к блогу' : 'Blog ro‘yxatiga qaytish'}</span>
          </Link>

          <div className="space-y-4">
            <h1 className="text-[30px] sm:text-[42px] font-bold text-ink tracking-[-0.03em] leading-[1.1]">
              {postTrans.title}
            </h1>

            {postTrans.excerpt && (
              <p className="text-base text-ink-soft leading-relaxed">{postTrans.excerpt}</p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-[13px] text-ink-sub border-y border-line py-3.5">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4 text-brand-red" />
                {post.author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-ink-sub" />
                {new Date(post.publishedAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ')}
              </span>
            </div>
          </div>

          {post.coverImage && (
            <div className="relative aspect-[16/9] rounded-[24px] overflow-hidden bg-surface-soft">
              <Image
                src={post.coverImage}
                alt={postTrans.title}
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                priority
                className="object-cover"
              />
            </div>
          )}

          <ArticleBody content={postTrans.content} />

          {/* Maqola oxirida aloqa CTA — savol tug'ilsa mijoz yo'qolmasin */}
          <div className="bg-surface border border-line rounded-[20px] p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-bold text-ink">
                {lang === 'ru' ? 'Остались вопросы по материалу?' : 'Maqola bo‘yicha savollaringiz bormi?'}
              </p>
              <p className="text-sm text-ink-soft">
                {lang === 'ru'
                  ? 'Наши специалисты помогут подобрать форму под ваш объём.'
                  : 'Mutaxassislarimiz hajmingizga mos qolip tanlashda yordam beradi.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <a
                href={`tel:${COMPANY_CONTACTS.phoneRaw}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-ink text-white text-sm font-bold hover:bg-black transition-colors min-h-[44px]"
              >
                <Phone className="w-4 h-4" />
                {COMPANY_CONTACTS.phoneDisplay}
              </a>
              <Link
                href={`/${lang}/contact`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-surface-soft text-ink text-sm font-bold hover:bg-[#E9EDF3] transition-colors min-h-[44px]"
              >
                {dict.nav.contact}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {related.length > 0 && (
            <section className="pt-4 space-y-4">
              <h2 className="text-xl font-bold text-ink">
                {lang === 'ru' ? 'Читайте также' : 'Yana o‘qing'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map((item) => {
                  const trans = item.translations[0];
                  if (!trans) return null;
                  return (
                    <Link
                      key={item.id}
                      href={`/${lang}/blog/${trans.slug}`}
                      className="group bg-surface border border-line rounded-[20px] overflow-hidden hover:border-[#DDE3EB] hover:shadow-lift transition-all"
                    >
                      {item.coverImage && (
                        <div className="relative aspect-[16/10] bg-surface-soft">
                          <Image
                            src={item.coverImage}
                            alt={trans.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 300px"
                            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <p className="text-sm font-bold text-ink group-hover:text-brand-red transition-colors leading-snug">
                          {trans.title}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </Container>
    </article>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale; slug: string }> }) {
  const { lang, slug } = await params;

  const trans = getBlogTranslation(lang, slug);
  if (!trans) return {};

  const description = (trans.excerpt || trans.content || '').replace(/[#>\-]/g, ' ').slice(0, 160);

  // Yagona yordamchi canonical + hreflang + og:image ni bir joyda beradi;
  // blog uchun og:image sifatida muqova rasmi ishlatiladi (P0-11).
  return pageMetadata({
    lang,
    path: `/blog/${slug}`,
    title: `${trans.title} | SPS Blog`,
    description,
    image: trans.post.coverImage,
    imageAlt: trans.title,
    type: 'article',
  });
}
