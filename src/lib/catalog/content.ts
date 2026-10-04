import { blogPosts, catalog } from './data';
import type { StaticBlogPost, StaticProject } from './types';

/**
 * Blog va loyihalar (statik kontent).
 *
 * Manba: `prisma/data/content-2026.json` → `src/data/catalog.json`.
 * Blog matni oddiy string: sahifadagi mini-parser (`src/lib/blogContent.ts`)
 * uni bloklarga ajratadi.
 */

export interface BlogPostView {
  id: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  translations: StaticBlogPost['translations'];
}

function toView(post: StaticBlogPost, locale: string): BlogPostView {
  return {
    id: post.id,
    coverImage: post.coverImage,
    author: post.author,
    publishedAt: post.publishedAt,
    translations: post.translations.filter((translation) => translation.locale === locale),
  };
}

/** Blog ro'yxati: eng yangi postlar birinchi. */
export function getBlogPosts(locale: string = 'uz'): BlogPostView[] {
  return [...blogPosts]
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .map((post) => toView(post, locale));
}

export function getBlogPostBySlug(locale: string, slug: string): BlogPostView | null {
  const post = blogPosts.find((entry) =>
    entry.isPublished && entry.translations.some((t) => t.locale === locale && t.slug === slug)
  );
  return post ? toView(post, locale) : null;
}

export function getRelatedBlogPosts(locale: string, currentId: string, take: number = 3): BlogPostView[] {
  return getBlogPosts(locale)
    .filter((post) => post.id !== currentId)
    .slice(0, take);
}

/** Til almashtirgich/canonical uchun: barcha til slug'lari. */
export function getBlogAlternates(postId: string): Record<string, string> {
  const post = blogPosts.find((entry) => entry.id === postId);
  if (!post) return {};
  return Object.fromEntries(post.translations.map((translation) => [translation.locale, translation.slug]));
}

/** Metadata uchun: tarjima + postning umumiy maydonlari (muqova rasmi). */
export function getBlogTranslation(locale: string, slug: string) {
  const post = blogPosts.find((entry) =>
    entry.translations.some((translation) => translation.locale === locale && translation.slug === slug)
  );
  if (!post) return null;

  const translation = post.translations.find((t) => t.locale === locale && t.slug === slug);
  if (!translation) return null;

  return {
    ...translation,
    post: {
      id: post.id,
      coverImage: post.coverImage,
      publishedAt: post.publishedAt,
      translations: post.translations.map(({ locale: l, slug: s }) => ({ locale: l, slug: s })),
    },
  };
}

export function getProjects(): StaticProject[] {
  return [...catalog.projects].sort((a, b) => a.sortOrder - b.sortOrder);
}
