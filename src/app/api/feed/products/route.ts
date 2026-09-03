import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const format = url.searchParams.get('format') || 'xml';
  const lang = url.searchParams.get('lang') || 'uz';

  try {
    const products = await db.product.findMany({
      where: { status: 'ACTIVE' },
      take: 500,
      include: {
        translations: { where: { locale: lang } },
        media: { take: 1, orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'json') {
      return NextResponse.json({
        products: products.map((p) => ({
          id: p.id,
          sku: p.sku,
          title: p.translations[0]?.name || p.sku,
          slug: p.translations[0]?.slug || p.sku,
          price: p.basePrice,
          oldPrice: p.compareAtPrice,
          image: p.media[0]?.url || null,
          inStock: p.inStock,
          url: `/${lang}/product/${p.translations[0]?.slug || p.sku}`,
        })),
      });
    }

    // XML for Yandex Market / Uzum
    const xmlItems = products
      .map((p) => {
        const trans = p.translations[0];
        const title = trans?.name?.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] || c)) || p.sku;
        const desc = (trans?.description || '').slice(0, 300).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] || c));
        return `
    <offer id="${p.id}" available="${p.inStock ? 'true' : 'false'}">
      <name>${title}</name>
      <vendor>SPS</vendor>
      <vendorCode>${p.sku}</vendorCode>
      <price>${p.basePrice}</price>
      ${p.compareAtPrice ? `<oldprice>${p.compareAtPrice}</oldprice>` : ''}
      <currencyId>UZS</currencyId>
      <picture>${p.media[0]?.url || ''}</picture>
      <url>https://sps.uz/${lang}/product/${trans?.slug || p.sku}</url>
      <description>${desc}</description>
      <param name="Material">ABS</param>
      <param name="Resurs">resurs modelga bog‘liq</param>
    </offer>`;
      })
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${new Date().toISOString()}">
  <shop>
    <name>SPS</name>
    <company>SPS MCHJ</company>
    <url>https://sps.uz</url>
    <currencies><currency id="UZS" rate="1"/></currencies>
    <categories>
      <category id="1">Bruschatka qoliplari</category>
      <category id="2">Termopanellar</category>
      <category id="3">Bordyur qoliplari</category>
    </categories>
    <offers>
${xmlItems}
    </offers>
  </shop>
</yml_catalog>`;

    return new NextResponse(xml, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  } catch (e: any) {
    console.error('Feed error', e);
    return NextResponse.json({ error: 'Feed failed', details: e.message }, { status: 500 });
  }
}
