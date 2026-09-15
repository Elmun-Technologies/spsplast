import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { Calendar, User, ArrowLeft } from 'lucide-react';

export default async function BlogPostDetailPage({
  params: { lang, slug },
}: {
  params: { lang: Locale; slug: string };
}) {
  const dict = getDictionary(lang);
  const postTrans = await db.blogPostTranslation.findFirst({
    where: { slug, locale: lang },
    include: { post: true },
  });

  if (!postTrans || !postTrans.post || !postTrans.post.isPublished) {
    notFound();
  }

  const post = postTrans.post;

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <Link
        href={`/${lang}/blog`}
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-sub font-semibold hover:text-brand-red transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Blog ro‘yxatiga qaytish</span>
      </Link>

      <div className="space-y-4">
        <h1 className="text-[30px] sm:text-[42px] font-bold text-ink tracking-[-0.03em] leading-[1.1]">{postTrans.title}</h1>

        <div className="flex items-center gap-6 text-[13px] text-ink-sub border-y border-line py-3.5">
          <span className="flex items-center gap-1">
            <User className="w-4 h-4 text-brand-red" />
            {post.author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-ink-sub" />
            {new Date(post.publishedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="relative aspect-[16/9] rounded-[24px] overflow-hidden bg-surface-soft">
        <Image src={post.coverImage} alt={postTrans.title} fill sizes="(max-width: 1024px) 100vw, 896px" priority className="object-cover" />
      </div>

      <div className="max-w-none text-ink-soft text-[15px] sm:text-base leading-[1.75] space-y-4">
        {postTrans.content.split('\n\n').map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
