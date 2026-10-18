import Link from 'next/link';
import { requireUser } from '@/server/session';
import { listSections } from '@/server/catalog';
import { AdminShell } from '../../AdminShell';
import { PublishBar } from '../../PublishBar';
import { deleteSectionAction } from '../actions';
import { SectionForm } from './SectionForm';

export const metadata = { title: "Bo'limlar" };

export default async function SectionsPage() {
  const { user, db } = await requireUser('admin');
  const sections = await listSections(db);
  return (
    <AdminShell
      user={user}
      active="products"
      title="Katalog bo'limlari"
      actions={
        <Link className="sps-btn sps-btn--link sps-btn--sm" href="/admin/products">
          ← Mahsulotlar
        </Link>
      }
    >
      <PublishBar db={db} />
      <p className="adm-empty" style={{ marginBottom: 16 }}>
        Saytdagi menyu va filtrlarda faqat nashr qilingan mahsuloti bor bo'limlar ko'rinadi — bo'sh bo'lim mijozga "0 model"
        bo'lib chiqmaydi.
      </p>
      <div className="adm-grid">
        {sections.map((s) => (
          <section key={s.key} className="adm-card">
            <h2>
              {s.name.uz} <small className="adm-empty">· {s.key} · {s.published} nashrda / {s.total} jami</small>
            </h2>
            <SectionForm section={s} />
            {s.total === 0 ? (
              <form action={deleteSectionAction} style={{ marginTop: 8 }}>
                <input type="hidden" name="sectionKey" value={s.key} />
                <button className="sps-btn sps-btn--link sps-btn--sm" type="submit">
                  Bo'limni o'chirish
                </button>
              </form>
            ) : null}
          </section>
        ))}
        <section className="adm-card">
          <h2>Yangi bo'lim</h2>
          <SectionForm />
        </section>
      </div>
    </AdminShell>
  );
}
