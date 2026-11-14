import type { Locale } from '@/lib/i18n';
import { testimonialAuthorName, testimonialAuthorRole, testimonialText } from '@/lib/testimonials2027';
import type { SnapshotTestimonial } from '@/lib/snapshotTypes';

/**
 * Mijoz sharhlari (audit 2026-11-02, 3-bosqich: "ishonch dalillari", texnik
 * tayyorgarlik). Admin hali haqiqiy sharh kiritmagan bo'lsa `items` bo'sh —
 * komponent `null` qaytaradi, saytda hech narsa ko'rinmaydi (soxta sharh yo'q).
 *
 * Uslub ataylab sodda (mavjud token/klasslar: `.sec`, `.sps-eyebrow`, `.h1`,
 * `.lead`, `.muted`) — bu bo'lim HANDOFF maketida yo'q (yangi funksiya), shuning
 * uchun maxsus vizual dizayn o'rniga minimal, boshqa bo'limlar bilan uyg'un
 * ko'rinish tanlandi; keyinroq dizayn bosqichida nafislashtirilishi mumkin.
 */
export function Testimonials({
  items,
  lang,
  eyebrowLabel,
  eyebrow,
  title,
}: {
  items: SnapshotTestimonial[];
  lang: Locale;
  eyebrowLabel: string;
  eyebrow: string;
  title: string;
}) {
  if (!items.length) return null;
  return (
    <section className="sec sec-alt">
      <div className="wrap">
        <p className="sps-eyebrow">
          <b>{eyebrowLabel}</b> · {eyebrow}
        </p>
        <h2 className="h1" style={{ marginBottom: 'var(--space-5)' }}>
          {title}
        </h2>
        <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {items.map((t) => {
            const role = testimonialAuthorRole(t, lang);
            return (
              <blockquote
                key={t.id}
                style={{
                  margin: 0,
                  padding: 'var(--space-4)',
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                }}
              >
                {t.rating ? (
                  <span aria-hidden="true" style={{ color: 'var(--red-ink)', letterSpacing: 2 }}>
                    {'★'.repeat(t.rating)}
                    {'☆'.repeat(5 - t.rating)}
                  </span>
                ) : null}
                <p className="body" style={{ margin: 0 }}>
                  {testimonialText(t, lang)}
                </p>
                <footer style={{ marginTop: 'var(--space-1)' }}>
                  <b>{testimonialAuthorName(t, lang)}</b>
                  {role ? <span className="muted"> · {role}</span> : null}
                </footer>
              </blockquote>
            );
          })}
        </div>
      </div>
    </section>
  );
}
