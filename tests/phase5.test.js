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

// 4. Phase 5.1 — Public Catalog Hides Archived & Draft Products
function filterActiveProducts(products) {
    if (!Array.isArray(products)) return [];
    return products.filter((p) => p.status === 'ACTIVE');
}

test('Phase 5.1 — Archived & Draft Products Hidden From Storefront', () => {
    const products = [
        { id: '1', name: 'Active Product', status: 'ACTIVE' },
        { id: '2', name: 'Draft Product', status: 'DRAFT' },
        { id: '3', name: 'Archived Product', status: 'ARCHIVED' },
    ];

    const activeList = filterActiveProducts(products);
    assert.strictEqual(activeList.length, 1);
    assert.strictEqual(activeList[0].id, '1');
});

// 5. Phase 5.1 — Media Fallback Image Logic
function getProductMainImage(product, fallbackUrl = '/images/placeholder-product.png') {
    if (product && Array.isArray(product.images) && product.images.length > 0 && product.images[0].url) {
        return product.images[0].url;
    }
    return fallbackUrl;
}

test('Phase 5.1 — Media Fallback When No Image Provided', () => {
    const productWithImage = { images: [{ url: '/uploads/real.jpg' }] };
    const productNoImage = { images: [] };

    assert.strictEqual(getProductMainImage(productWithImage), '/uploads/real.jpg');
    assert.strictEqual(getProductMainImage(productNoImage), '/images/placeholder-product.png');
});

// 6. Phase 5.1 — Category Attribute Filter Isolation
function filterAttributesByCategory(attributeList, categoryCode) {
    if (!Array.isArray(attributeList)) return [];
    return attributeList.filter((attr) => {
        if (!attr.categoryCodes || attr.categoryCodes.length === 0) return true;
        return attr.categoryCodes.includes(categoryCode);
    });
}

test('Phase 5.1 — Category-Specific Attribute Filter Isolation', () => {
    const attributes = [
        { id: '1', code: 'cavities', categoryCodes: ['BRUSCHATKA'] },
        { id: '2', code: 'thickness', categoryCodes: ['TERMOPANEL'] },
        { id: '3', code: 'material', categoryCodes: [] }, // applies to all
    ];

    const bruschatkaAttrs = filterAttributesByCategory(attributes, 'BRUSCHATKA');
    const termopanelAttrs = filterAttributesByCategory(attributes, 'TERMOPANEL');

    assert.strictEqual(bruschatkaAttrs.length, 2);
    assert.strictEqual(bruschatkaAttrs.some((a) => a.code === 'cavities'), true);
    assert.strictEqual(bruschatkaAttrs.some((a) => a.code === 'thickness'), false);

    assert.strictEqual(termopanelAttrs.length, 2);
    assert.strictEqual(termopanelAttrs.some((a) => a.code === 'thickness'), true);
    assert.strictEqual(termopanelAttrs.some((a) => a.code === 'cavities'), false);
});
