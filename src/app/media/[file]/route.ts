import { getDb } from '@/server/db/client';
import { getMedia } from '@/server/media';

/**
 * Admin'dan yuklangan rasmlar: `/media/{sha256-24}.webp`. Mazmun xeshdan nomlangan —
 * o'zgarmaydi, shuning uchun CDN va brauzer bir yil keshlaydi.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const m = /^([a-f0-9]{24})\.webp$/.exec(file);
  const db = getDb();
  if (!m || !db) return new Response('Not found', { status: 404 });
  const row = await getMedia(db, m[1]);
  if (!row) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: {
      'Content-Type': row.mime,
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
