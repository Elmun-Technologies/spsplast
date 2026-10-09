import Link from 'next/link';
import { NotFoundBody } from '@/components/site/NotFoundBody';
import { CONTACTS_2027 } from '@/lib/contacts2027';

/**
 * Ildiz 404 — `[lang]` segmentidan tashqaridagi (noma'lum til prefiksli)
 * so'rovlar shu yerga tushadi: asosiy matn o'zbekcha, ostida RU/EN
 * kataloglariga havola (test 15 shu havolalarni tekshiradi).
 */
export const metadata = {
  title: "Sahifa topilmadi | Страница не найдена | Page not found — SPS",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <NotFoundBody lang="uz" />
      <section style={{ paddingBlock: 'var(--space-6)', borderTop: '1px solid var(--line)' }}>
        <div className="wrap row" style={{ justifyContent: 'center' }}>
          <span className="sps-label">RU / EN:</span>
          <Link className="sps-btn sps-btn--outline sps-btn--sm" href="/ru/catalog">
            Каталог · RU
          </Link>
          <Link className="sps-btn sps-btn--outline sps-btn--sm" href="/en/catalog">
            Catalog · EN
          </Link>
          <a className="sps-btn sps-btn--link sps-btn--sm" href={`tel:${CONTACTS_2027.mainPhoneRaw}`}>
            {CONTACTS_2027.mainPhone}
          </a>
        </div>
      </section>
    </>
  );
}
