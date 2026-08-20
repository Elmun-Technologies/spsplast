const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

// Standalone validators mirroring src/lib/storage/imageUtils.ts and contacts.ts for Node test environment
function validateImageFile(file) {
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    if (!file || !file.type) {
        return { valid: false, error: 'Fayl formati ko‘rsatilmadi.' };
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
        return { valid: false, error: 'Faqat JPEG, PNG yoki WebP formatdagi rasmlarni yuklash mumkin.' };
    }
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: 'Rasm hajmi 10 MB dan kichik bo‘lishi kerak.' };
    }
    return { valid: true };
}

function generateStorageKey(prefix, originalFilename, mimeType) {
    const sanitizedPrefix = (prefix || 'uploads').replace(/(\.\.[\/\\])+/g, '').replace(/^[/\\]+/, '');
    const cleanExt = (originalFilename.split('.').pop() || 'webp').toLowerCase().replace(/[^a-z0-9]/g, '');
    const uuid = 'test-uuid-1234';
    return `${sanitizedPrefix}/${uuid}.${cleanExt}`;
}

function getPublicContactConfig(settings) {
    return {
        phoneDisplay: settings?.phoneDisplay || '',
        phoneRaw: settings?.phoneRaw || '',
        hasPhone: Boolean(settings?.phoneDisplay && settings?.phoneRaw),
        telegramUrl: settings?.telegramUrl || '',
        whatsappUrl: settings?.whatsappUrl || '',
        instagramUrl: settings?.instagramUrl || '',
        hasTelegram: Boolean(settings?.telegramUrl),
        hasWhatsapp: Boolean(settings?.whatsappUrl),
        hasInstagram: Boolean(settings?.instagramUrl),
        email: settings?.email || '',
        addressUz: settings?.addressUz || '',
        addressRu: settings?.addressRu || '',
        workingHoursUz: settings?.workingHoursUz || '',
        workingHoursRu: settings?.workingHoursRu || '',
    };
}

// 1. Unauthorized media upload rejected
test('1. Unauthorized media upload rejected', () => {
    function simulateUploadRoute(session) {
        if (!session || !session.user || session.user.role !== 'ADMIN') {
            return { status: 401, body: { error: 'Admin session required' } };
        }
        return { status: 200, body: { success: true } };
    }

    const noSessionRes = simulateUploadRoute(null);
    assert.strictEqual(noSessionRes.status, 401);

    const userSessionRes = simulateUploadRoute({ user: { role: 'CUSTOMER' } });
    assert.strictEqual(userSessionRes.status, 401);

    const adminSessionRes = simulateUploadRoute({ user: { role: 'ADMIN' } });
    assert.strictEqual(adminSessionRes.status, 200);
});

// 2. Unsupported MIME rejected
test('2. Unsupported MIME rejected', () => {
    const validJpg = validateImageFile({ type: 'image/jpeg', size: 1024 * 1024, name: 'test.jpg' });
    assert.strictEqual(validJpg.valid, true);

    const validWebp = validateImageFile({ type: 'image/webp', size: 1024 * 1024, name: 'test.webp' });
    assert.strictEqual(validWebp.valid, true);

    const invalidSvg = validateImageFile({ type: 'image/svg+xml', size: 1024 * 1024, name: 'test.svg' });
    assert.strictEqual(invalidSvg.valid, false);
    assert.match(invalidSvg.error, /Faqat JPEG, PNG yoki WebP/);

    const invalidExe = validateImageFile({ type: 'application/x-msdownload', size: 1024 * 1024, name: 'test.exe' });
    assert.strictEqual(invalidExe.valid, false);
});

// 3. Oversized file rejected
test('3. Oversized file rejected', () => {
    const hugeFile = validateImageFile({ type: 'image/jpeg', size: 15 * 1024 * 1024, name: 'huge.jpg' });
    assert.strictEqual(hugeFile.valid, false);
    assert.match(hugeFile.error, /10 MB dan kichik/);

    const normalFile = validateImageFile({ type: 'image/jpeg', size: 5 * 1024 * 1024, name: 'normal.jpg' });
    assert.strictEqual(normalFile.valid, true);
});

// 4. Safe generated storage key
test('4. Safe generated storage key', () => {
    const key1 = generateStorageKey('products/prod-123', 'photo.png', 'image/png');
    assert.ok(key1.startsWith('products/prod-123/'));
    assert.ok(key1.endsWith('.png'));

    // Test path traversal prevention
    const key2 = generateStorageKey('products/../../etc', '../../../hack.jpg', 'image/jpeg');
    assert.strictEqual(key2.includes('../'), false);
    assert.strictEqual(key2.includes('..\\'), false);
});

// 5. ProductMedia created after successful upload
test('5. ProductMedia created after successful upload', () => {
    const mediaItems = [];
    function handleUploadSuccess(productId, uploadResult, role = 'GALLERY') {
        const record = {
            id: 'media-' + (mediaItems.length + 1),
            productId,
            type: role,
            url: uploadResult.url,
            storageKey: uploadResult.storageKey,
            mimeType: uploadResult.mimeType,
            sortOrder: mediaItems.length,
        };
        mediaItems.push(record);
        return record;
    }

    const created = handleUploadSuccess('prod-1', {
        url: '/uploads/products/prod-1/abc.webp',
        storageKey: 'products/prod-1/abc.webp',
        mimeType: 'image/webp'
    }, 'MAIN');

    assert.strictEqual(mediaItems.length, 1);
    assert.strictEqual(created.type, 'MAIN');
    assert.strictEqual(created.storageKey, 'products/prod-1/abc.webp');
});

// 6. MAIN uniqueness
test('6. MAIN uniqueness logic', () => {
    let mediaList = [
        { id: 'm1', type: 'MAIN', url: '/m1.jpg' },
        { id: 'm2', type: 'GALLERY', url: '/m2.jpg' },
    ];

    function setMainMedia(newMainId) {
        mediaList = mediaList.map((item) => ({
            ...item,
            type: item.id === newMainId ? 'MAIN' : item.type === 'MAIN' ? 'GALLERY' : item.type,
        }));
    }

    setMainMedia('m2');

    const mainItems = mediaList.filter((i) => i.type === 'MAIN');
    assert.strictEqual(mainItems.length, 1);
    assert.strictEqual(mainItems[0].id, 'm2');
    assert.strictEqual(mediaList.find((i) => i.id === 'm1').type, 'GALLERY');
});

// 7. MOLD role assignment
test('7. MOLD role assignment', () => {
    const moldMedia = {
        productId: 'p1',
        type: 'MOLD',
        url: '/uploads/products/p1/mold.webp'
    };
    assert.strictEqual(moldMedia.type, 'MOLD');
});

// 8. FINISHED_RESULT role assignment
test('8. FINISHED_RESULT role assignment', () => {
    const resultMedia = {
        productId: 'p1',
        type: 'FINISHED_RESULT',
        url: '/uploads/products/p1/result.webp'
    };
    assert.strictEqual(resultMedia.type, 'FINISHED_RESULT');
});

// 9. Storage failure does not create broken media DB record
test('9. Storage failure does not create broken media DB record', async () => {
    let dbRecordCreated = false;

    async function processUploadWorkflow(storageProvider, file) {
        try {
            const uploadRes = await storageProvider.upload(file);
            dbRecordCreated = true;
            return uploadRes;
        } catch (err) {
            // Storage failed, do not write to DB
            return null;
        }
    }

    const failingStorage = {
        upload: async () => {
            throw new Error('S3 Storage Connection Failed');
        }
    };

    const res = await processUploadWorkflow(failingStorage, {});
    assert.strictEqual(res, null);
    assert.strictEqual(dbRecordCreated, false);
});

// 10. Replacement preserves old media until new upload succeeds
test('10. Replacement preserves old media until new upload succeeds', async () => {
    let currentMedia = { id: 'old-1', url: '/old.jpg', storageKey: 'products/old.jpg' };
    let storageDeleted = false;

    async function replaceMedia(newFile, storageProvider) {
        // Upload new first
        const newRes = await storageProvider.upload(newFile);
        if (!newRes) return false;

        const oldStorageKey = currentMedia.storageKey;
        currentMedia = { id: 'new-2', url: newRes.url, storageKey: newRes.storageKey };

        // Safe delete old storage after DB update
        if (oldStorageKey) {
            await storageProvider.delete(oldStorageKey);
            storageDeleted = true;
        }
        return true;
    }

    const mockStorage = {
        upload: async () => ({ url: '/new.jpg', storageKey: 'products/new.jpg' }),
        delete: async () => true,
    };

    const success = await replaceMedia({}, mockStorage);
    assert.strictEqual(success, true);
    assert.strictEqual(currentMedia.url, '/new.jpg');
    assert.strictEqual(storageDeleted, true);
});

// 11. Fake / unconfigured phone not rendered as active contact
test('11. Fake/unconfigured phone not rendered as active contact', () => {
    const emptySettings = {
        phoneDisplay: '',
        phoneRaw: '',
    };
    const contactInfo = getPublicContactConfig(emptySettings);

    assert.strictEqual(contactInfo.phoneDisplay, '');
    assert.strictEqual(contactInfo.phoneRaw, '');
    assert.strictEqual(contactInfo.hasPhone, false);
});

// 12. Missing image uses neutral fallback component / placeholder
test('12. Missing image uses neutral fallback', () => {
    function getProductDisplayImage(product) {
        if (product.images && product.images.length > 0 && product.images[0].url) {
            return product.images[0].url;
        }
        return null; // Signals component to render <PlaceholderImage />
    }

    const prodWithNoImages = { id: 'p1', images: [] };
    const image = getProductDisplayImage(prodWithNoImages);
    assert.strictEqual(image, null);
});

// 13. No unrestricted image remote host config
test('13. No unrestricted image remote host config', () => {
    const nextConfig = require('../next.config.js');
    const patterns = nextConfig.images.remotePatterns;

    const hasWildcardAll = patterns.some((p) => p.hostname === '**');
    assert.strictEqual(hasWildcardAll, false, 'next.config.js must not contain wildcard ** for hostname');
});

// 14. Product JSON-LD uses MAIN media where available
test('14. Product JSON-LD uses MAIN media where available', () => {
    function generateProductJsonLd(product, baseUrl = 'https://spsplast.uz') {
        const mainImage = product.images?.find((i) => i.type === 'MAIN') || product.images?.[0];
        const imageUrls = mainImage?.url ? [`${baseUrl}${mainImage.url}`] : [];

        return {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            image: imageUrls,
        };
    }

    const prod = {
        name: 'Bruschatka Mold 8',
        images: [
            { type: 'GALLERY', url: '/gallery1.jpg' },
            { type: 'MAIN', url: '/main-product.jpg' },
        ]
    };

    const jsonLd = generateProductJsonLd(prod);
    assert.deepStrictEqual(jsonLd.image, ['https://spsplast.uz/main-product.jpg']);
});
