import Image from 'next/image';
import { getSectionCounts, SECTIONS, SECTION_SLUGS } from '@/lib/catalog2027';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import { type Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { LangSwitch } from '@/components/site/LangSwitch';
import { PDF_CATALOG_HREF } from '@/components/site/SiteHeader';

export function SiteFooter({ lang }: { lang: Locale }) {
  const t = getUi(lang);
  const counts = getSectionCounts();

  return (
    <footer className="ft">
      <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div className="ft-grid">
          <div className="ft-about">
            <Image src="/images/brand/logo-white.webp" alt="SPS Stone Profy Servise" width={72} height={44} />
            <p>{t.footer.about}</p>
            <LangSwitch lang={lang} dark />
          </div>
          <div className="ft-col">
            <span className="sps-eyebrow">{t.footer.catalog}</span>
            {SECTIONS.map((s) => (
              <a key={s} href={`/${lang}/catalog/${SECTION_SLUGS[s]}`}>
                {t.sections[s]} · {counts[s]}
              </a>
            ))}
          </div>
          <div className="ft-col">
            <span className="sps-eyebrow">{t.footer.company}</span>
            <a href={`/${lang}/production`}>{t.footer.production}</a>
            <a href={`/${lang}/production#eksport`}>{t.footer.export}</a>
            <a href={`/${lang}/partners`}>{t.footer.partners}</a>
            <a href={`/${lang}/partners#faq`}>{t.footer.faq}</a>
            <a href={PDF_CATALOG_HREF}>{t.footer.pdf}</a>
          </div>
          <div className="ft-col">
            <span className="sps-eyebrow">{t.footer.contact}</span>
            {CONTACTS_2027.sales.slice(0, 2).map((p) => (
              <a key={p.raw} href={`tel:${p.raw}`} className="mono">
                {p.display}
              </a>
            ))}
            <a href={CONTACTS_2027.telegramUrl}>Telegram · {CONTACTS_2027.telegramHandle}</a>
            <a href={CONTACTS_2027.instagramUrl}>Instagram · {CONTACTS_2027.instagramHandle}</a>
            <a href={`/${lang}/contact`}>{t.footer.hours}</a>
          </div>
        </div>
        <div className="ft-bottom">
          <span>{t.footer.copyright}</span>
          <span style={{ display: 'flex', gap: 24 }}>
            <a href={`/${lang}/privacy`}>{t.footer.privacy}</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
