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
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link
        href={`/${lang}/blog`}
        className="inline-flex items-center gap-1.5 text-xs text-brand-red font-bold hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Blog ro‘yxatiga qaytish</span>
      </Link>

      <div className="space-y-4">
        <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">{postTrans.title}</h1>

        <div className="flex items-center gap-6 text-xs text-gray-400 border-y border-brand-border/60 py-3">
          <span className="flex items-center gap-1">
            <User className="w-4 h-4 text-brand-red" />
            {post.author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-gray-500" />
            {new Date(post.publishedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="relative aspect-[16/9] rounded-3xl overflow-hidden border border-brand-border shadow-2xl bg-black/40">
        <Image src={post.coverImage} alt={postTrans.title} fill className="object-cover" />
      </div>

      <div className="prose prose-invert max-w-none text-gray-300 text-sm sm:text-base leading-relaxed space-y-4">
        {postTrans.content.split('\n\n').map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
