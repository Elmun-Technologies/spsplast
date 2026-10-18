import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/server/session';
import { EMPTY_IMAGES, completeness, getProduct, listSections } from '@/server/catalog';
import { SITE_URL } from '@/lib/seo';
import { AdminShell } from '../../AdminShell';
import { PublishBar } from '../../PublishBar';
import { deleteProductAction, duplicateProductAction } from '../actions';
import { ProductForm, type ProductDraft } from './ProductForm';

export const metadata = { title: 'Mahsulot' };

const EMPTY_LOC = { uz: null, ru: null, en: null };

export default async function ProductEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; copied?: string }>;
}) {
  const { user, db } = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === 'new';
  const productId = isNew ? null : Number(id);
  if (!isNew && (!Number.isInteger(productId) || (productId ?? 0) < 1)) notFound();

  const [row, sections] = await Promise.all([productId ? getProduct(db, productId) : null, listSections(db)]);
  if (!isNew && !row) notFound();

  const initial: ProductDraft = row
    ? {
        status: row.status,
        section: row.section,
        code: row.code,
        slug: row.slug,
        sort: row.sort,
        name: row.name,
        subtitle: row.subtitle,
        note: row.note ?? EMPTY_LOC,
        kg: row.kg,
        sizeEstimated: row.sizeEstimated,
        molds: row.molds,
        tiles: row.tiles,
        specs: row.specs,
        images: row.images,
      }
    : {
        status: 'draft',
        section: sections[0]?.key ?? '',
        code: null,
        slug: '',
        sort: 1000,
        name: EMPTY_LOC,
        subtitle: EMPTY_LOC,
        note: EMPTY_LOC,
        kg: null,
        sizeEstimated: false,
        molds: [],
        tiles: [],
        specs: [],
        images: EMPTY_IMAGES,
      };

  const section = sections.find((s) => s.key === row?.section);
  const liveUrl = row && row.status === 'published' && section ? `${SITE_URL}/uz/catalog/${section.slug}/${row.slug}` : null;
  const c = row ? completeness(row) : null;

  return (
    <AdminShell
      user={user}
      active="products"
      title={row ? `${row.code ? `№ ${row.code} · ` : ''}${row.name.uz}` : 'Yangi mahsulot'}
      actions={
        <>
          {row ? (
            <form action={duplicateProductAction}>
              <input type="hidden" name="productId" value={row.id} />
              <button className="sps-btn sps-btn--outline sps-btn--sm" type="submit">
                Nusxa olish (o&apos;xshash mahsulot)
              </button>
            </form>
          ) : null}
          <Link className="sps-btn sps-btn--link sps-btn--sm" href="/admin/products">
            ← Mahsulotlar
          </Link>
        </>
      }
    >
      {sp.copied ? (
        <p className="adm-msg adm-msg--ok" style={{ marginBottom: 16 }}>
          Nusxa qoralama sifatida yaratildi — kod, nom va rasmlarni o&apos;zgartirib saqlang.
        </p>
      ) : null}
      {sp.saved ? (
        <p className="adm-msg adm-msg--ok" style={{ marginBottom: 16 }}>
          Mahsulot yaratildi. Saytga chiqishi uchun holatni "Nashrda" qilib, "Nashr qilish" ni bosing.
        </p>
      ) : null}
      <PublishBar db={db} />
      {c ? (
        <div className="adm-publish" style={{ marginBottom: 16 }}>
          <div>
            <b>To'liqlik: {c.score}%</b>
            <small>
              {c.checks
                .filter((x) => !x.ok)
                .map((x) => x.label)
                .join(' · ') || 'Hammasi joyida'}
            </small>
          </div>
        </div>
      ) : null}
      <ProductForm productId={productId} initial={initial} sections={sections.map((s) => ({ key: s.key, name: s.name }))} liveUrl={liveUrl} />
      {row && user.role === 'admin' ? (
        <form action={deleteProductAction} className="adm-card adm-danger">
          <input type="hidden" name="productId" value={row.id} />
          <div>
            <b>Butunlay o'chirish</b>
            <small>Qaytarib bo'lmaydi. Saytdan vaqtincha olib tashlash uchun "Arxiv" holatidan foydalaning.</small>
          </div>
          <button className="sps-btn sps-btn--outline sps-btn--sm" type="submit">
            O'chirish
          </button>
        </form>
      ) : null}
    </AdminShell>
  );
}
