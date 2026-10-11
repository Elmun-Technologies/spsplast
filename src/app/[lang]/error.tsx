'use client';

import { usePathname } from 'next/navigation';
import { Icon } from '@/components/site/icons';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import { isValidLocale, type Locale } from '@/lib/i18n';
import { getPages } from '@/lib/pages';

/**
 * Xatolik chegarasi (error boundary).
 *
 * Next bu faylga `params` uzatmaydi, shuning uchun til `usePathname()` ning
 * birinchi segmentidan olinadi (404 dagi kabi). Vizual til 404 sahifasi bilan
 * bir xil: kulgi fon, markazlashtirilgan karta, qizil aksent (style-B).
 *
 * Xom xato matni faqat developmentda ko'rsatiladi — production foydalanuvchisi
 * harakatga undaydigan xabar va bog'lanish yo'llarini ko'radi.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const segment = pathname?.split('/')[1] ?? '';
  const lang: Locale = isValidLocale(segment) ? segment : 'uz';
  const p = getPages(lang).error;

  const isDev = process.env.NODE_ENV !== 'production';
  const Alert = Icon.alert;
  const Refresh = Icon.refresh;
  const Tel = Icon.phone;

  return (
    <section className="state-sec">
      <div className="wrap state-card">
        <div className="state-mark" aria-hidden="true">
          <Alert strokeWidth={1.5} />
        </div>

        <h1 className="h1">{p.title}</h1>
        <p className="lead muted">{isDev && error?.message ? error.message : p.text}</p>

        <div className="state-actions">
          <button className="sps-btn sps-btn--primary" type="button" onClick={reset}>
            <Refresh strokeWidth={1.5} />
            {p.retry}
          </button>
          <a className="sps-btn sps-btn--outline" href={`/${lang}/catalog`}>
            {p.catalog}
          </a>
          <a className="sps-btn sps-btn--outline" href={`/${lang}`}>
            {p.home}
          </a>
        </div>

        <a className="state-tel" href={`tel:${CONTACTS_2027.mainPhoneRaw}`}>
          <Tel strokeWidth={1.5} />
          {CONTACTS_2027.mainPhone} · {p.call}
        </a>
      </div>
    </section>
  );
}
