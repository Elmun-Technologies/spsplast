import { redirect } from 'next/navigation';

export default async function CategorySlugRedirect({
  params,
}: {
  params: Promise<{ lang: string; categorySlug: string }>;
}) {
  const { lang, categorySlug } = await params;
  redirect(`/${lang}/catalog?category=${categorySlug}`);
}
