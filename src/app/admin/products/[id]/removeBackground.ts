'use client';

/**
 * Brauzerda fon olib tashlash (admin rasm yuklash): U²-Net small (u2netp, Apache-2.0)
 * + onnxruntime-web (MIT), fayllar `/public/admin-ai/` da o'zimizda — rasm hech qayerga
 * yuborilmaydi, ommaviy sayt bu fayllarni yuklamaydi. Natija — shaffof PNG (keyin
 * server uni WebP'ga o'giradi, chetlarini kesadi).
 */

type OrtTensor = { data: Float32Array; dims: number[] };
type OrtSession = { inputNames: string[]; outputNames: string[]; run: (feeds: Record<string, unknown>) => Promise<Record<string, OrtTensor>> };
type Ort = {
  env: { wasm: { wasmPaths: string; numThreads: number } };
  Tensor: new (type: string, data: Float32Array, dims: number[]) => unknown;
  InferenceSession: { create: (url: string, opts?: unknown) => Promise<OrtSession> };
};

const BASE = '/admin-ai/';
const SIZE = 320;
const MAX_SIDE = 2400;

let sessionPromise: Promise<{ ort: Ort; session: OrtSession }> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('AI kutubxonasi yuklanmadi'));
    document.head.appendChild(s);
  });
}

async function getSession() {
  sessionPromise ??= (async () => {
    const w = window as unknown as { ort?: Ort };
    if (!w.ort) await loadScript(`${BASE}ort.wasm.min.js`);
    const ort = w.ort as Ort;
    ort.env.wasm.wasmPaths = BASE;
    ort.env.wasm.numThreads = 1; // COOP/COEP sarlavhalarisiz ham ishlasin
    const session = await ort.InferenceSession.create(`${BASE}u2netp.onnx`, { executionProviders: ['wasm'] });
    return { ort, session };
  })();
  try {
    return await sessionPromise;
  } catch (e) {
    sessionPromise = null;
    throw e;
  }
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Faylni fonsiz PNG'ga aylantiradi. `preview` — ko'rsatish uchun object URL. */
export async function removeBackground(file: File): Promise<{ blob: Blob; preview: string }> {
  const { ort, session } = await getSession();
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const W = Math.round(bmp.width * scale);
  const H = Math.round(bmp.height * scale);

  // 1) Model kirishi: 320×320, ImageNet normalizatsiyasi, CHW.
  const small = canvas(SIZE, SIZE).getContext('2d', { willReadFrequently: true })!;
  small.drawImage(bmp, 0, 0, SIZE, SIZE);
  const px = small.getImageData(0, 0, SIZE, SIZE).data;
  const input = new Float32Array(3 * SIZE * SIZE);
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];
  for (let i = 0; i < SIZE * SIZE; i += 1) {
    for (let c = 0; c < 3; c += 1) input[c * SIZE * SIZE + i] = (px[i * 4 + c] / 255 - mean[c]) / std[c];
  }
  const out = await session.run({ [session.inputNames[0]]: new ort.Tensor('float32', input, [1, 3, SIZE, SIZE]) });
  const pred = out[session.outputNames[0]].data;

  // 2) Maska: min-max → kontrast (yarim shaffof "tuman" qolmasin) → asl o'lchamga silliq kattalashtirish.
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of pred) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const maskCtx = canvas(SIZE, SIZE).getContext('2d')!;
  const md = maskCtx.createImageData(SIZE, SIZE);
  for (let i = 0; i < SIZE * SIZE; i += 1) {
    const n = (pred[i] - lo) / (hi - lo || 1);
    const a = Math.max(0, Math.min(1, (n - 0.12) / 0.76));
    md.data[i * 4 + 3] = Math.round(a * 255);
  }
  maskCtx.putImageData(md, 0, 0);
  const big = canvas(W, H).getContext('2d', { willReadFrequently: true })!;
  big.imageSmoothingQuality = 'high';
  big.drawImage(maskCtx.canvas, 0, 0, W, H);
  const alpha = big.getImageData(0, 0, W, H).data;

  // 3) Asl rasm + alfa.
  const outCtx = canvas(W, H).getContext('2d', { willReadFrequently: true })!;
  outCtx.drawImage(bmp, 0, 0, W, H);
  const img = outCtx.getImageData(0, 0, W, H);
  for (let i = 3; i < img.data.length; i += 4) img.data[i] = alpha[i];
  outCtx.putImageData(img, 0, 0);
  bmp.close();

  const blob = await new Promise<Blob>((res, rej) => outCtx.canvas.toBlob((b) => (b ? res(b) : rej(new Error('PNG yaratilmadi'))), 'image/png'));
  return { blob, preview: URL.createObjectURL(blob) };
}
