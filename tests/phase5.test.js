const test = require('node:test');
const assert = require('node:assert');

// 1. SEO JSON-LD Product Schema Builder Test
function generateProductJsonLd(product, baseUrl = 'https://spsplast.uz') {
    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        sku: product.sku,
        description: product.description || '',
        image: product.image ? [`${baseUrl}${product.image}`] : [],
        offers: {
            '@type': 'Offer',
            price: product.basePrice,
            priceCurrency: 'UZS',
            availability: product.stockQty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `${baseUrl}/uz/product/${product.slug}`,
        },
    };
}

// 2. Mold vs Finished Result Media Filter Test
function filterMediaByType(mediaList, targetType) {
    if (!Array.isArray(mediaList)) return [];
    return mediaList.filter((item) => item.type === targetType);
}

// 3. Search Query Normalization & Filter Matching Test
function matchesSearchQuery(product, query) {
    if (!query || !query.trim()) return true;
    const q = query.toLowerCase().trim();
    const name = (product.name || '').toLowerCase();
    const sku = (product.sku || '').toLowerCase();
    const desc = (product.description || '').toLowerCase();
    return name.includes(q) || sku.includes(q) || desc.includes(q);
}

// -------------------------------------------------------------
// TESTS
// -------------------------------------------------------------

test('Phase 5 — SEO JSON-LD Product Schema Generator', () => {
    const mockProduct = {
        name: 'Qolip 30x30 Termopanel',
        sku: 'QL-3030',
        description: 'Yuqori sifatli gips qolipi',
        image: '/uploads/mold-1.jpg',
        basePrice: 150000,
        stockQty: 25,
        slug: 'qolip-30x30-termopanel',
    };

    const jsonLd = generateProductJsonLd(mockProduct);

    assert.strictEqual(jsonLd['@context'], 'https://schema.org');
    assert.strictEqual(jsonLd['@type'], 'Product');
    assert.strictEqual(jsonLd.name, 'Qolip 30x30 Termopanel');
    assert.strictEqual(jsonLd.sku, 'QL-3030');
    assert.strictEqual(jsonLd.offers.price, 150000);
    assert.strictEqual(jsonLd.offers.priceCurrency, 'UZS');
    assert.strictEqual(jsonLd.offers.availability, 'https://schema.org/InStock');
});

test('Phase 5 — Mold vs Finished Result Media Classification', () => {
    const mediaList = [
        { id: '1', type: 'MOLD', url: '/images/mold.jpg' },
        { id: '2', type: 'FINISHED_RESULT', url: '/images/result.jpg' },
        { id: '3', type: 'GALLERY', url: '/images/gallery.jpg' },
    ];

    const molds = filterMediaByType(mediaList, 'MOLD');
    const results = filterMediaByType(mediaList, 'FINISHED_RESULT');

    assert.strictEqual(molds.length, 1);
    assert.strictEqual(molds[0].url, '/images/mold.jpg');

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].url, '/images/result.jpg');
});

test('Phase 5 — Search Query & SKU Matching', () => {
    const product = {
        name: 'Fasad Termopaneli Gips',
        sku: 'FAS-001',
        description: 'Termopanel ishlab chiqarish uchun tayyor qolip',
    };

    assert.strictEqual(matchesSearchQuery(product, 'fasad'), true);
    assert.strictEqual(matchesSearchQuery(product, 'FAS-001'), true);
    assert.strictEqual(matchesSearchQuery(product, 'qolip'), true);
    assert.strictEqual(matchesSearchQuery(product, 'plastik'), false);
});
