import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession, createAuditLog } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const media = await db.productMedia.findMany({
      where: { productId: id },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ media });
  } catch (error) {
    return NextResponse.json({ error: 'Medialarni yuklashda xatolik' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { type, url, alt, variantId, sortOrder } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL talab qilinadi' }, { status: 400 });
    }

    const media = await db.productMedia.create({
      data: {
        productId: id,
        variantId: variantId || null,
        type: type || 'GALLERY',
        url,
        alt: alt || null,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ success: true, media });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server xatosi' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { media } = body;

    if (!Array.isArray(media)) {
      return NextResponse.json({ error: 'Media massivi talab qilinadi' }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      for (const item of media) {
        await tx.productMedia.update({
          where: { id: item.id },
          data: {
            sortOrder: item.sortOrder,
            type: item.type,
            alt: item.alt,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server xatosi' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const mediaId = searchParams.get('mediaId');

  if (!mediaId) {
    return NextResponse.json({ error: 'mediaId talab qilinadi' }, { status: 400 });
  }

  try {
    const mediaItem = await db.productMedia.findUnique({ where: { id: mediaId } });
    await db.productMedia.delete({ where: { id: mediaId } });

    if (mediaItem?.storageKey) {
      try {
        const { getMediaStorageProvider } = await import('@/lib/storage');
        const provider = getMediaStorageProvider();
        await provider.delete(mediaItem.storageKey);
      } catch (stErr) {
        console.error('Failed to delete media file from storage:', stErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server xatosi' }, { status: 500 });
  }
}
