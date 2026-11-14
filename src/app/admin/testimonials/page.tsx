import { requireUser } from '@/server/session';
import { listTestimonials } from '@/server/testimonials';
import { AdminShell } from '../AdminShell';
import { PublishBar } from '../PublishBar';
import { deleteTestimonialAction } from './actions';
import { TestimonialForm } from './TestimonialForm';

export const metadata = { title: 'Mijoz sharhlari' };

export default async function TestimonialsPage() {
  const { user, db } = await requireUser();
  const rows = await listTestimonials(db);
  return (
    <AdminShell user={user} active="testimonials" title="Mijoz sharhlari">
      <PublishBar db={db} />
      <p className="adm-empty" style={{ marginBottom: 16 }}>
        Saytda faqat "Saytda ko'rinadi" belgili sharhlar chiqadi (eng kam 1 ta — bo'lsa, bosh sahifada ko'rinadi va
        qidiruv tizimlari uchun JSON-LD AggregateRating hosil bo'ladi). Soxta sharh kiritilmasin — faqat haqiqiy
        mijoz izohlari.
      </p>
      <div className="adm-grid">
        {rows.map((r) => (
          <section key={r.id} className="adm-card">
            <h2>
              {r.authorName.uz} <small className="adm-empty">· {r.visible ? 'ko\'rinadi' : 'yashirin'}</small>
            </h2>
            <TestimonialForm testimonial={r} />
            <form action={deleteTestimonialAction} style={{ marginTop: 8 }}>
              <input type="hidden" name="testimonialId" value={r.id} />
              <button className="sps-btn sps-btn--link sps-btn--sm" type="submit">
                Sharhni o'chirish
              </button>
            </form>
          </section>
        ))}
        <section className="adm-card">
          <h2>Yangi sharh</h2>
          <TestimonialForm />
        </section>
      </div>
    </AdminShell>
  );
}
