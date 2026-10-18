import Link from 'next/link';
import { requireUser } from '@/server/session';
import { PRODUCT_STATUSES, type ProductStatus } from '@/server/db/schema';
import { completeness, listProducts, listSections, productStatusCounts } from '@/server/catalog';
import { AdminShell } from '../AdminShell';
import { PublishBar } from '../PublishBar';
import { bulkStatusAction } from './actions';
import { PRODUCT_STATUS_LABEL as STATUS_LABEL } from './labels';

export const metadata = { title: 'Mahsulotlar' };

const MISSING = { image: 'Rasmsiz', ru: 'Ruscha nomsiz', en: 'Inglizcha nomsiz' } as const;

type Search = { q?: string; section?: string; status?: string; missing?: string };

function href(sp: Search, patch: Partial<Search>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
  const s = p.toString();
  return `/admin/products${s ? `?${s}` : ''}`;
}

function thumb(images: { scene: string | null; sceneSm: string | null; molds: Record<string, string>; tiles: Record<string, string> }) {
  return Object.values(images.molds)[0] || images.sceneSm || images.scene || Object.values(images.tiles)[0] || null;
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { user, db } = await requireUser();
  const sp = await searchParams;
  const status = (PRODUCT_STATUSES as readonly string[]).includes(sp.status ?? '') ? (sp.status as ProductStatus) : undefined;
  const missing = sp.missing && sp.missing in MISSING ? (sp.missing as keyof typeof MISSING) : undefined;
  const [rows, sections, counts] = await Promise.all([
    listProducts(db, { q: sp.q, section: sp.section || undefined, status, missing }),
    listSections(db),
    productStatusCounts(db),
  ]);
  const sectionName = new Map(sections.map((s) => [s.key, s.name.uz ?? s.key]));
  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <AdminShell
      user={user}
      active="products"
      title="Mahsulotlar"
      actions={
        <>
          {user.role === 'admin' ? (
            <Link className="sps-btn sps-btn--outline sps-btn--sm" href="/admin/products/sections">
              Bo'limlar
            </Link>
          ) : null}
          <Link className="sps-btn sps-btn--dark sps-btn--sm" href="/admin/products/new">
            + Yangi mahsulot
          </Link>
        </>
      }
    >
      <PublishBar db={db} />

      {!total ? (
        <section className="adm-card">
          <h2>Katalog hali bazaga import qilinmagan</h2>
          <p className="adm-empty">
            Serverda bir marta <code>npm run catalog:import</code> ni ishga tushiring: hozirgi saytdagi modellar va Excel'dagi 76 ta
            termopanel/fasad dekor mahsuloti (qoralama sifatida) qo'shiladi. Batafsil: docs/ADMIN.md.
          </p>
        </section>
      ) : null}

      <nav className="adm-chips" aria-label="Holat">
        <Link href={href(sp, { status: undefined })} aria-current={!status ? 'true' : undefined}>
          Hammasi <small>{total}</small>
        </Link>
        {PRODUCT_STATUSES.map((s) => (
          <Link key={s} href={href(sp, { status: s })} aria-current={status === s ? 'true' : undefined}>
            {STATUS_LABEL[s]} <small>{counts[s] ?? 0}</small>
          </Link>
        ))}
        {Object.entries(MISSING).map(([k, label]) => (
          <Link key={k} href={href(sp, { missing: missing === k ? undefined : k })} aria-current={missing === k ? 'true' : undefined}>
            {label}
          </Link>
        ))}
      </nav>

      <form className="adm-filters" method="GET" role="search">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        {missing ? <input type="hidden" name="missing" value={missing} /> : null}
        <input className="sps-input q" type="search" name="q" defaultValue={sp.q} placeholder="Kod yoki nom: 70, Monako, TP-001" aria-label="Qidirish" />
        <select className="sps-select" name="section" defaultValue={sp.section ?? ''} aria-label="Bo'lim">
          <option value="">Barcha bo'limlar</option>
          {sections.map((s) => (
            <option key={s.key} value={s.key}>
              {s.name.uz} ({s.total})
            </option>
          ))}
        </select>
        <div className="act">
          <button className="sps-btn sps-btn--dark sps-btn--sm" type="submit">
            Qo'llash
          </button>
          <Link className="sps-btn sps-btn--link sps-btn--sm" href="/admin/products">
            Tozalash
          </Link>
        </div>
      </form>

      <form action={bulkStatusAction}>
        <div className="adm-bulk">
          <span>{rows.length} ta · belgilanganlarni:</span>
          <button className="sps-btn sps-btn--outline sps-btn--sm" type="submit" name="bulk" value="published">
            Nashrga
          </button>
          <button className="sps-btn sps-btn--outline sps-btn--sm" type="submit" name="bulk" value="draft">
            Qoralamaga
          </button>
          <button className="sps-btn sps-btn--outline sps-btn--sm" type="submit" name="bulk" value="archived">
            Arxivga (saytdan olib tashlash)
          </button>
        </div>
        {rows.length ? (
          <ul className="adm-products">
            {rows.map((p) => {
              const c = completeness(p);
              const img = thumb(p.images);
              return (
                <li key={p.id} className={`adm-prod adm-prod--${p.status}`}>
                  <input type="checkbox" name="productIds" value={p.id} aria-label={`Belgilash: ${p.name.uz}`} />
                  <Link href={`/admin/products/${p.id}`} className="adm-prod__img">
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin eskiz */}
                    {img ? <img src={img} alt="" loading="lazy" /> : <span>rasm yo'q</span>}
                  </Link>
                  <div className="adm-prod__body">
                    <Link href={`/admin/products/${p.id}`} className="adm-prod__name">
                      {p.code ? `№ ${p.code} · ` : ''}
                      {p.name.uz}
                    </Link>
                    <small>
                      {sectionName.get(p.section) ?? p.section} · tartib {p.sort}
                    </small>
                    <div className="adm-prod__checks">
                      {c.checks.map((x) => (
                        <span key={x.key} className={x.ok ? 'ok' : x.critical ? 'bad' : 'warn'}>
                          {x.ok ? '✓' : '✕'} {x.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className={`adm-st adm-st--p-${p.status}`}>{STATUS_LABEL[p.status]}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="adm-card">
            <p className="adm-empty">Mahsulot topilmadi.</p>
          </div>
        )}
      </form>
    </AdminShell>
  );
}
