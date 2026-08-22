import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();
  const categorySlug = searchParams.get('category')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ products: [], categories: [] });
  }

  try {
    const products = await db.product.findMany({
      where: {
        status: 'ACTIVE',
        AND: [
          categorySlug
            ? {
                categories: {
                  some: {
                    category: {
                      translations: {
                        some: { slug: categorySlug },
                      },
                    },
                  },
                },
              }
            : {},
          {
            OR: [
              { sku: { contains: query, mode: 'insensitive' } },
              {
                translations: {
                  some: {
                    name: { contains: query, mode: 'insensitive' },
                  },
                },
              },
            ],
          },
        ],
      },
      take: 8,
      include: {
        translations: true,
        media: { orderBy: { sortOrder: 'asc' }, take: 1 },
      },
    });

    const categories = await db.category.findMany({
      where: {
        status: 'ACTIVE',
        translations: {
          some: {
            name: { contains: query, mode: 'insensitive' },
          },
        },
      },
      take: 4,
      include: {
        translations: true,
      },
    });

    const mappedProducts = products.map((p) => {
      const transUz = p.translations.find((t) => t.locale === 'uz') || p.translations[0];
      const transRu = p.translations.find((t) => t.locale === 'ru') || p.translations[0];
      return {
        id: p.id,
        sku: p.sku,
        slug: transUz?.slug || p.id,
        titleUz: transUz?.name || '',
        titleRu: transRu?.name || transUz?.name || '',
        price: p.basePrice,
        oldPrice: p.compareAtPrice,
        inStock: p.inStock,
        images: p.media.map((m) => ({ url: m.url, altText: m.alt })),
      };
    });

    const mappedCategories = categories.map((c) => {
      const trans = c.translations[0];
      return {
        id: c.id,
        slug: trans?.slug || c.id,
        name: trans?.name || '',
      };
    });

    return NextResponse.json({
      products: mappedProducts,
      categories: mappedCategories,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ products: [], categories: [] }, { status: 500 });
  }
}
