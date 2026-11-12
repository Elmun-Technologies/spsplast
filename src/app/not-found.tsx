import Link from 'next/link';
import { NotFoundBody } from '@/components/site/NotFoundBody';
import { NotFoundLangPick } from '@/components/site/NotFoundLangPick';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import type { Locale } from '@/lib/i18n';

/**
 * Ildiz 404 — saytdagi BARCHA noma'lum manzillar shu yerga tushadi: `dynamicParams = false`
 * bo'lgani uchun Next `/ru/xato-yol` va `/en/catalog/paving/yoq` ga ham shu oldindan
 * tayyorlangan sahifani beradi (`[lang]/not-found.tsx` amalda ishlatilmaydi — 2026-11-12 da
 * curl bilan tasdiqlandi). Shuning uchun header/footer bilan uch tilda server'da tayyorlanadi,
 * til esa brauzerda URL'dan tanlanadi (`NotFoundLangPick`). Pastda til almashtirish
 * havolalari (test 15).
 */
export const metadata = {
  title: "Sahifa topilmadi | Страница не найдена | Page not found — SPS",
  robots: { index: false, follow: false },
};

function View({ lang }: { lang: Locale }) {
  return (
    <>
      <SiteHeader lang={lang} />
      {/* `<main>`: ildiz 404 `[lang]/layout.tsx` dan tashqarida — landmark o'zimiz (axe `region`). */}
      <main id="main-content">
        <NotFoundBody lang={lang} />
        <section style={{ paddingBlock: 'var(--space-6)', borderTop: '1px solid var(--line)' }}>
          <div className="wrap row" style={{ justifyContent: 'center' }}>
            <Link className="sps-btn sps-btn--outline sps-btn--sm" href="/uz/catalog" lang="uz">
              Katalog · UZ
            </Link>
            <Link className="sps-btn sps-btn--outline sps-btn--sm" href="/ru/catalog" lang="ru">
              Каталог · RU
            </Link>
            <Link className="sps-btn sps-btn--outline sps-btn--sm" href="/en/catalog" lang="en">
              Catalog · EN
            </Link>
            <a className="sps-btn sps-btn--link sps-btn--sm" href={`tel:${CONTACTS_2027.mainPhoneRaw}`}>
              {CONTACTS_2027.mainPhone}
            </a>
          </div>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}

export default function NotFound() {
  return <NotFoundLangPick uz={<View lang="uz" />} ru={<View lang="ru" />} en={<View lang="en" />} />;
}
