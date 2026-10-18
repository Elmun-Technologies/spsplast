'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/server/session';
import { PRODUCT_STATUSES, type ProductStatus } from '@/server/db/schema';
import { deleteProduct, deleteSection, saveProduct, saveSection, setProductsStatus, slugify } from '@/server/catalog';
import { MAX_UPLOAD_BYTES, uploadImage, type ImageRole } from '@/server/media';

/**
 * Mahsulot / bo'lim / rasm amallari. Mahsulotlarni administrator ham, menejer ham
 * tahrirlay oladi; bo'limlar va o'chirish — faqat administrator.
 */

export type ProductFormState = { error?: string; ok?: string; id?: number } | undefined;

const loc = z.object({ uz: z.string().nullable(), ru: z.string().nullable(), en: z.string().nullable() });
const clean = (v: { uz: string | null; ru: string | null; en: string | null }) => ({
  uz: v.uz?.trim() || null,
  ru: v.ru?.trim() || null,
  en: v.en?.trim() || null,
});
const payloadSchema = z.object({
  status: z.enum(PRODUCT_STATUSES),
  section: z.string().min(1),
  code: z.string().max(20).nullable(),
  slug: z.string().max(90),
  sort: z.coerce.number().int().min(0).max(100000),
  name: loc,
  subtitle: loc,
  note: loc,
  kg: z.string().max(20).nullable(),
  sizeEstimated: z.boolean(),
  molds: z.array(z.object({ l: z.string().max(3), size: z.string().max(40).nullable(), depth: z.string().max(10).nullable(), g: z.number().nullable() })).max(6),
  tiles: z.array(z.object({ l: z.string().max(3), size: z.string().max(40).nullable(), per: z.string().max(30).nullable() })).max(6),
  specs: z.array(z.object({ k: loc, v: loc })).max(30),
  images: z.object({
    scene: z.string().nullable(),
    sceneSm: z.string().nullable(),
    molds: z.record(z.string()),
    tiles: z.record(z.string()),
  }),
});

export async function saveProductAction(_prev: ProductFormState, fd: FormData): Promise<ProductFormState> {
  const { db } = await requireUser();
  const productId = Number(fd.get('productId')) || null;
  let raw: unknown;
  try {
    raw = JSON.parse(String(fd.get('payload') ?? ''));
  } catch {
    return { error: "Forma ma'lumoti buzilgan." };
  }
  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) return { error: `Maydon xato: ${parsed.error.issues[0]?.path.join('.')}` };
  const p = parsed.data;
  const name = clean(p.name);
  const slug = p.slug.trim() || slugify([p.code, name.uz].filter(Boolean).join(' '));
  const note = clean(p.note);
  const res = await saveProduct(db, productId, {
    ...p,
    slug,
    code: p.code?.trim() || null,
    kg: p.kg?.trim() || null,
    name,
    subtitle: clean(p.subtitle),
    note: note.uz || note.ru || note.en ? note : null,
    specs: p.specs.filter((s) => s.k.uz?.trim()).map((s) => ({ k: clean(s.k), v: clean(s.v) })),
    molds: p.molds.filter((m) => m.size || m.depth || m.g),
    tiles: p.tiles.filter((t) => t.size || t.per),
  });
  if (res.error) return { error: res.error };
  revalidatePath('/admin/products');
  if (!productId) redirect(`/admin/products/${res.id}?saved=1`);
  revalidatePath(`/admin/products/${productId}`);
  return { ok: 'Saqlandi. Saytga chiqishi uchun "Nashr qilish".', id: res.id };
}

export async function uploadImageAction(fd: FormData): Promise<{ url?: string; smUrl?: string; warnings?: string[]; error?: string }> {
  const { user, db } = await requireUser();
  const file = fd.get('file');
  const role = String(fd.get('role')) as ImageRole;
  if (!(file instanceof File) || !file.size) return { error: 'Fayl tanlanmagan.' };
  if (file.size > MAX_UPLOAD_BYTES) return { error: 'Rasm 15 MB dan katta.' };
  if (!['scene', 'mold', 'tile'].includes(role)) return { error: "Rasm turi noto'g'ri." };
  try {
    const res = await uploadImage(db, Buffer.from(await file.arrayBuffer()), role, {
      userId: user.id,
      originalName: file.name.slice(0, 200),
      trim: fd.get('trim') !== '0',
    });
    return res;
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Rasm saqlanmadi.' };
  }
}

export async function bulkStatusAction(fd: FormData): Promise<void> {
  const { db } = await requireUser();
  const status = String(fd.get('bulk')) as ProductStatus;
  const ids = fd.getAll('productIds').map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (!PRODUCT_STATUSES.includes(status) || !ids.length) return;
  await setProductsStatus(db, ids, status);
  revalidatePath('/admin/products');
}

export async function deleteProductAction(fd: FormData): Promise<void> {
  const { db } = await requireUser('admin');
  const productId = Number(fd.get('productId'));
  if (!Number.isInteger(productId) || productId < 1) return;
  await deleteProduct(db, productId);
  revalidatePath('/admin/products');
  redirect('/admin/products');
}

export async function saveSectionAction(_prev: ProductFormState, fd: FormData): Promise<ProductFormState> {
  const { db } = await requireUser('admin');
  const s = (k: string) => String(fd.get(k) ?? '').trim();
  const err = await saveSection(
    db,
    {
      key: s('sectionKey'),
      slug: s('slug'),
      name: { uz: s('name_uz') || null, ru: s('name_ru') || null, en: s('name_en') || null },
      sort: Number(s('sort')) || 0,
      visible: fd.get('visible') === 'on',
    },
    fd.get('isNew') === '1',
  );
  if (err) return { error: err };
  revalidatePath('/admin/products/sections');
  return { ok: 'Saqlandi.' };
}

export async function deleteSectionAction(fd: FormData): Promise<void> {
  const { db } = await requireUser('admin');
  await deleteSection(db, String(fd.get('sectionKey') ?? ''));
  revalidatePath('/admin/products/sections');
}
