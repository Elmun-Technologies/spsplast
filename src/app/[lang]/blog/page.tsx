import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Calendar, User, ArrowRight } from 'lucide-react';

export default async function BlogPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);
  let posts: any[] = [];
  try {
    posts = await db.blogPost.findMany({
      where: { isPublished: true },
      include: {
        translations: { where: { locale: lang } },
      },
      orderBy: { publishedAt: 'desc' },
    });
  } catch {
    posts = [];
  }

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-gray-900 py-8">
      <Container>
        <Breadcrumbs lang={lang} items={[{ label: lang === 'ru' ? 'Блог' : 'Blog', active: true }]} className="mb-6" />

        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex px-3 py-1 rounded-full bg-red-50 border border-red-200 text-brand-red text-xs font-bold uppercase tracking-wider">
              {lang === 'ru' ? 'Полезные статьи' : 'Foydali maqolalar'}
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
              {lang === 'ru' ? 'Блог и руководства SPS' : 'SPS blogi va qo‘llanmalari'}
            </h1>
            <p className="text-sm text-gray-600">
              {lang === 'ru' ? 'Советы по производству брусчатки, выбору форм и заливке бетона.' : 'Bruschatka ishlab chiqarishni boshlash, qolip tanlash va beton quyish sirlari haqida mutaxassis maslahatlari.'}
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <p className="font-bold text-gray-900">{lang === 'ru' ? 'Скоро новые статьи' : 'Tez orada yangi maqolalar'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => {
                const trans = post.translations[0] || {};
                const title = trans.title || 'Maqola';
                const excerpt = trans.excerpt || '';

                return (
                  <Link
                    key={post.id}
                    href={`/${lang}/blog/${trans.slug || post.id}`}
                    className="group bg-white border border-gray-200 rounded-2xl overflow-hidden p-5 flex flex-col justify-between hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <div className="space-y-4">
                      <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-[#F8F9FA] border border-gray-100">
                        <Image src={post.coverImage} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-brand-red" />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 group-hover:text-brand-red transition-colors line-clamp-2 leading-snug">{title}</h3>

                      <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{excerpt}</p>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm font-bold text-brand-red pt-4 mt-4 border-t border-gray-100 group-hover:gap-2 transition-all">
                      <span>{lang === 'ru' ? 'Читать подробнее' : 'Batafsil o‘qish'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
