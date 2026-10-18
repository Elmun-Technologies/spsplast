import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import type { Db } from './db/client.ts';
import { media } from './db/schema.ts';

/**
 * Admin'dan yuklangan rasmlar: har qanday format → WebP (EXIF burilishi to'g'rilanadi,
 * metadata olib tashlanadi). Qolip/plitka suratlarida bir xil fon chetlari kesiladi (trim),
 * shaffoflik saqlanadi (fon olib tashlangan PNG'lar uchun). Bazada saqlanadi va
 * `/media/{id}.webp` orqali uzoq kesh bilan beriladi.
 */

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export type ImageRole = 'scene' | 'mold' | 'tile';

const SIZES: Record<ImageRole, number> = { scene: 1400, mold: 800, tile: 800 };

async function store(db: Db, buf: Buffer, info: { width: number; height: number }, userId: number | null, originalName: string | null) {
  const id = createHash('sha256').update(buf).digest('hex').slice(0, 24);
  await db
    .insert(media)
    .values({ id, mime: 'image/webp', width: info.width, height: info.height, bytes: buf.length, data: buf, originalName, createdBy: userId })
    .onConflictDoNothing();
  return `/media/${id}.webp`;
}

export type UploadResult = { url: string; smUrl?: string; width: number; height: number; warnings: string[] };

export async function uploadImage(
  db: Db,
  input: Buffer,
  role: ImageRole,
  opts: { userId?: number | null; originalName?: string | null; trim?: boolean } = {},
): Promise<UploadResult> {
  if (input.length > MAX_UPLOAD_BYTES) throw new Error('Rasm 15 MB dan katta.');
  let meta;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new Error("Fayl rasm emas yoki buzilgan (JPG, PNG, WebP, HEIC qo'llanadi).");
  }
  const warnings: string[] = [];
  const srcW = meta.autoOrient?.width ?? meta.width ?? 0;
  const srcH = meta.autoOrient?.height ?? meta.height ?? 0;
  if (Math.max(srcW, srcH) < (role === 'scene' ? 1200 : 700)) {
    warnings.push(`Rasm kichik (${srcW}×${srcH}) — saytda xira ko'rinishi mumkin.`);
  }

  let pipe = sharp(input).rotate();
  if (role !== 'scene' && opts.trim !== false) {
    // Bir xil rangli (oq/shaffof) chetlarni kesamiz: qolip kadrni to'ldirsin.
    pipe = sharp(await pipe.trim({ threshold: 12 }).toBuffer());
  }
  if (role !== 'scene' && !meta.hasAlpha) {
    // Fon tozalanmaganini taxminiy aniqlash: burchaklar oq emas va bir-biriga o'xshamasa.
    const { data, info } = await sharp(input).rotate().resize(32, 32, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const px = (x: number, y: number) => {
      const i = (y * info.width + x) * 3;
      return [data[i], data[i + 1], data[i + 2]];
    };
    const corners = [px(0, 0), px(31, 0), px(0, 31), px(31, 31)];
    const whiteish = corners.every((c) => c.every((v) => v > 225));
    if (!whiteish) warnings.push("Fon oq emas — fonni olib tashlangan (shaffof PNG) yoki oq fondagi surat yuklash tavsiya etiladi.");
  }

  const size = SIZES[role];
  const main = await pipe
    .resize({ width: size, height: role === 'scene' ? undefined : size, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  const url = await store(db, main.data, main.info, opts.userId ?? null, opts.originalName ?? null);

  let smUrl: string | undefined;
  if (role === 'scene') {
    const sm = await sharp(main.data).resize({ width: 720, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer({ resolveWithObject: true });
    smUrl = await store(db, sm.data, sm.info, opts.userId ?? null, opts.originalName ?? null);
  }
  return { url, smUrl, width: main.info.width, height: main.info.height, warnings };
}

export async function getMedia(db: Db, id: string) {
  const [row] = await db.select({ data: media.data, mime: media.mime }).from(media).where(eq(media.id, id)).limit(1);
  return row ?? null;
}
