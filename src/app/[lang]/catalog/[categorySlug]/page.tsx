import { redirect } from 'next/navigation';

export default function CategorySlugRedirect({
  params,
}: {
  params: { lang: string; categorySlug: string };
}) {
  redirect(`/${params.lang}/catalog?category=${params.categorySlug}`);
}
