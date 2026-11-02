import Image from 'next/image';
import { getSectionCounts, SECTION_SLUGS, sectionLabel, getActiveSections } from '@/lib/catalog2027';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import { type Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { LangSwitch } from '@/components/site/LangSwitch';
import { PDF_CATALOG_HREF } from '@/components/site/SiteHeader';
import { Icon } from '@/components/site/icons';
import { getPages } from '@/lib/pages';
import { EXPORT_COUNTRIES } from '@/lib/seoPages';

/** Footer (Redesign 2028): CTA band (zayafka + Telegram) → 4 ustun → pastki qator. */
export function SiteFooter({ lang }: { lang: Locale }) {
  const t = getUi(lang);
  const counts = getSectionCounts();
  const [mainPhone, ...otherPhones] = CONTACTS_2027.sales;
  const geo = getPages(lang).seo.geo;

  return (
    <footer className="ft">
      <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div className="ft-cta">
          <p className="ft-cta__title">{t.footer.ctaTitle}</p>
          <div className="ft-cta__btns">
            <a className="sps-btn sps-btn--primary" href={`/${lang}/request`}>
              {t.header.cta}
            </a>
            <a className="sps-btn sps-btn--on-ink" href={`${CONTACTS_2027.whatsappUrl}?text=${encodeURIComponent(t.menu.waText)}`} target="_blank" rel="noopener noreferrer">
              <Icon.whatsapp width={18} height={18} strokeWidth={1.75} aria-hidden="true" />
              {t.menu.whatsapp}
            </a>
            <a className="sps-btn sps-btn--on-ink" href={CONTACTS_2027.telegramUrl} target="_blank" rel="noopener noreferrer">
              <Icon.telegram width={18} height={18} strokeWidth={1.75} aria-hidden="true" />
              {t.menu.telegram}
            </a>
          </div>
        </div>
        <div className="ft-grid">
          <div className="ft-about">
            <Image src="/images/brand/logo-white.webp" alt="SPS Stone Profy Servise" width={66} height={40} />
            <p>{t.footer.about}</p>
            <LangSwitch lang={lang} dark label={t.a11y.langNavFooter} />
          </div>
          <div className="ft-col">
            <span className="sps-eyebrow">{t.footer.catalog}</span>
            {getActiveSections().map((s) => (
              <a key={s} href={`/${lang}/catalog/${SECTION_SLUGS[s]}`}>
                {sectionLabel(s, lang)} · {counts[s]}
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
            <span className="sps-eyebrow">{t.footer.export}</span>
            {/* Eksport (geo) sahifalariga ichki havolalar — har sahifadan (docs/SEO-2028-RU.md) */}
            {EXPORT_COUNTRIES.map((c) => (
              <a key={c.key} href={`/${lang}/export/${c.key}`}>
                {geo.countries[c.key].name}
              </a>
            ))}
          </div>
          <div className="ft-col">
            <span className="sps-eyebrow">{t.footer.contact}</span>
            {mainPhone ? (
              <a href={`tel:${mainPhone.raw}`} className="mono ft-phone">
                {mainPhone.display}
              </a>
            ) : null}
            {otherPhones.slice(0, 1).map((p) => (
              <a key={p.raw} href={`tel:${p.raw}`} className="mono">
                {p.display}
              </a>
            ))}
            <a href={CONTACTS_2027.whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp · {CONTACTS_2027.mainPhone}</a>
            <a href={CONTACTS_2027.telegramUrl}>Telegram · {CONTACTS_2027.telegramHandle}</a>
            <a href={CONTACTS_2027.instagramUrl}>Instagram · {CONTACTS_2027.instagramHandle}</a>
            {CONTACTS_2027.email ? <a href={`mailto:${CONTACTS_2027.email}`}>{CONTACTS_2027.email}</a> : null}
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
