import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { Calendar, User, ArrowRight } from 'lucide-react';

export default async function BlogPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);
  const posts = await db.blogPost.findMany({
    where: { isPublished: true },
    include: {
      translations: { where: { locale: lang } },
    },
    orderBy: { publishedAt: 'desc' },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-bold uppercase tracking-wider">
          Foydali Maqolalar
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white">
          SPS Plast Blogi va Qo‘llanmalari
        </h1>
        <p className="text-sm text-gray-300">
          Bruschatka ishlab chiqarishni boshlash, qolip tanlash va beton quyish sirlari haqida mutaxassis maslahatlari.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => {
          const trans = post.translations[0] || {};
          const title = trans.title || 'Maqola';
          const excerpt = trans.excerpt || '';

          return (
            <Link
              key={post.id}
              href={`/${lang}/blog/${trans.slug || post.id}`}
              className="group bg-brand-card border border-brand-border rounded-2xl overflow-hidden p-5 flex flex-col justify-between hover:border-brand-red transition-colors shadow-lg"
            >
              <div className="space-y-4">
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-black/40">
                  <Image
                    src={post.coverImage}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-brand-red" />
                    {post.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-brand-red transition-colors line-clamp-2">
                  {title}
                </h3>

                <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">{excerpt}</p>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-brand-red pt-4 mt-4 border-t border-brand-border/60">
                <span>Batafsil o‘qish</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
