/**
 * Yuklashdan oldin rasmni brauzerda kichraytirish (audit 2026-11-02, texnik).
 *
 * Vercel funksiyasi 4,5 MB dan katta so'rov tanasini qabul qilmaydi (413), telefon surati esa
 * ko'pincha 5–12 MB. Server baribir WebP ga aylantirib 1400/800 px gacha kichraytiradi, shuning
 * uchun bu yerda 2400 px va WebP (shaffoflik saqlanadi) — sifat yo'qolmaydi.
 */
export const SAFE_UPLOAD_BYTES = 3.5 * 1024 * 1024;

async function encode(bitmap: ImageBitmap, maxSide: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/webp', quality),
  );
}

export async function shrinkForUpload(file: File): Promise<File> {
  if (file.size <= SAFE_UPLOAD_BYTES) return file;
  // EXIF burilishi hisobga olinadi (telefon suratlari yonboshlab qolmasin).
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    for (const [side, q] of [
      [2400, 0.9],
      [2000, 0.85],
      [1600, 0.8],
    ] as const) {
      const blob = await encode(bitmap, side, q);
      if (blob.size <= SAFE_UPLOAD_BYTES) {
        return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
      }
    }
  } finally {
    bitmap.close();
  }
  throw new Error('Rasmni 3,5 MB gacha kichraytirib bo‘lmadi');
}
