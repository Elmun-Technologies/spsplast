'use client';

import React, { useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';
import { Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';

interface CrossSellProps {
  lang: Locale;
  title?: string;
  subtitle?: string;
  categorySlug?: string;
  currentProductId?: string;
  limit?: number;
}

export const CrossSell: React.FC<CrossSellProps> = ({
  lang,
  title,
  subtitle,
  categorySlug,
  currentProductId,
  limit = 4,
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`/api/products?locale=${lang}`);
        if (res.ok) {
          const data = await res.json();
          let all = data.products || [];
          // map to ProductCard shape
          all = all.map((p: any) => {
            const trans = p.translations?.find((t: any) => t.locale === lang) || p.translations?.[0] || {};
            return {
              id: p.id,
              slug: trans.slug || p.sku,
              sku: p.sku,
              titleUz: trans.name || p.sku,
              titleRu: trans.name || p.sku,
              price: p.basePrice,
              oldPrice: p.compareAtPrice,
              inStock: p.inStock,
              images: p.media?.map((m: any) => ({ url: m.url })) || [],
            };
          });
          let filtered = all.filter((p: any) => p.id !== currentProductId);
          // if categorySlug, try filter by slug in title? Simplified: keep all for now
          filtered = filtered.slice(0, limit);
          setProducts(filtered);
        }
      } catch {}
      setLoading(false);
    };
    fetchProducts();
  }, [lang, categorySlug, currentProductId, limit]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-6">
      <Container>
        <SectionHeader
          title={title || (lang === 'ru' ? 'С этим покупают' : 'Birga xarid qilishadi')}
          subtitle={subtitle || (lang === 'ru' ? 'Часто берут вместе' : 'Ko‘pincha birga olishadi')}
        />
        {loading ? <ProductGridSkeleton count={limit} /> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} lang={lang} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
};
