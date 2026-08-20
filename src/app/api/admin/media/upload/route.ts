import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession, createAuditLog } from '@/lib/auth';
import { getMediaStorageProvider } from '@/lib/storage';

export async function POST(req: NextRequest) {
    // 1. Session check
    const session = await getAdminSession();
    if (!session) {
        return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 401 });
    }

    // 2. Same-origin CSRF verification (Sec-Fetch-Site or origin check)
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    if (origin && host) {
        try {
            const originHost = new URL(origin).host;
            if (originHost !== host) {
                return NextResponse.json({ error: 'CSRF tekshiruvi muvaffaqiyatsiz bo‘ldi' }, { status: 403 });
            }
        } catch {
            // Invalid URL
        }
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const folder = (formData.get('folder') as string) || 'products';
        const productId = formData.get('productId') as string | null;
        const variantId = formData.get('variantId') as string | null;
        const type = (formData.get('type') as string) || 'GALLERY'; // MAIN, GALLERY, MOLD, FINISHED_RESULT, etc.
        const alt = formData.get('alt') as string | null;
        const replaceMediaId = formData.get('replaceMediaId') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'Fayl tanlanmagan' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = file.type;

        const provider = getMediaStorageProvider();

        // 3. File validation (Size, MIME, Magic bytes)
        const valResult = await provider.validate(buffer, mimeType);
        if (!valResult.valid) {
            return NextResponse.json({ error: valResult.error || 'Noto‘g‘ri fayl' }, { status: 400 });
        }

        // 4. Perform upload
        const uploadRes = await provider.upload(buffer, file.name, mimeType, folder);

        let createdMedia = null;
        let oldStorageKeyToDelete: string | null = null;

        // 5. If productId is provided, handle DB record creation & replacement/demotion logic
        if (productId) {
            // Verify product exists
            const product = await db.product.findUnique({ where: { id: productId } });
            if (!product) {
                // Safe cleanup uploaded object if product does not exist
                await provider.delete(uploadRes.key);
                return NextResponse.json({ error: 'Mahsulot topilmadi' }, { status: 404 });
            }

            // Requirement 15: MAIN uniqueness rule. If setting new MAIN, demote previous MAIN to GALLERY
            if (type === 'MAIN') {
                await db.productMedia.updateMany({
                    where: { productId, type: 'MAIN' },
                    data: { type: 'GALLERY' },
                });
            }

            // Requirement 17: Replacement logic
            if (replaceMediaId) {
                const existingMedia = await db.productMedia.findUnique({ where: { id: replaceMediaId } });
                if (existingMedia) {
                    oldStorageKeyToDelete = existingMedia.storageKey;
                    createdMedia = await db.productMedia.update({
                        where: { id: replaceMediaId },
                        data: {
                            url: uploadRes.url,
                            storageKey: uploadRes.key,
                            mimeType: uploadRes.mimeType,
                            width: uploadRes.width,
                            height: uploadRes.height,
                            sizeBytes: uploadRes.sizeBytes,
                            type,
                            alt: alt ?? existingMedia.alt,
                        },
                    });
                }
            }

            if (!createdMedia) {
                createdMedia = await db.productMedia.create({
                    data: {
                        productId,
                        variantId: variantId || null,
                        type,
                        url: uploadRes.url,
                        storageKey: uploadRes.key,
                        mimeType: uploadRes.mimeType,
                        width: uploadRes.width,
                        height: uploadRes.height,
                        sizeBytes: uploadRes.sizeBytes,
                        alt: alt || null,
                    },
                });
            }

            // If replacement succeeded, clean up old storage object safely after DB update
            if (oldStorageKeyToDelete) {
                try {
                    await provider.delete(oldStorageKeyToDelete);
                } catch (e) {
                    console.error('Failed to delete replaced old storage object:', e);
                }
            }

            await createAuditLog(session.adminId, 'MEDIA_UPLOAD', 'ProductMedia', createdMedia.id, {
                productId,
                type,
                url: uploadRes.url,
            });
        }

        return NextResponse.json({
            success: true,
            url: uploadRes.url,
            key: uploadRes.key,
            width: uploadRes.width,
            height: uploadRes.height,
            sizeBytes: uploadRes.sizeBytes,
            media: createdMedia,
            storageMode: provider.name,
        });
    } catch (error: any) {
        console.error('Error in media upload endpoint:', error);
        return NextResponse.json({ error: error.message || 'Fayl yuklashda xatolik' }, { status: 500 });
    }
}
