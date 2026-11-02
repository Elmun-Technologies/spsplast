import { type Locale } from '@/lib/i18n';
import { getPages } from '@/lib/pages';
import { type Section, SECTION_SLUGS, calcMolds, getModelsBySection, getPopular, modelName, modelPerM2, sectionLabel } from '@/lib/catalog2027';
import { EXPORT_COUNTRIES, getSeoTags, type ExportCountry, type SeoTag } from '@/lib/seoPages';

/**
 * SEO bloklari (docs/SEO-2028-RU.md 2-bo'lim) — bo'lim, teg va eksport sahifalarida
 * qayta ishlatiladi. Hammasi server komponent: matn SSR HTML'da (qidiruv tizimi uchun).
 */

export const tagHref = (lang: Locale, section: Section, tag: SeoTag) => `/${lang}/catalog/${SECTION_SLUGS[section]}/tag/${tag}`;
export const exportHref = (lang: Locale, country: ExportCountry) => `/${lang}/export/${country}`;

/** Bo'lim teg sahifalariga havolalar (chip'lar). `current` — joriy teg (aria-current). */
export function TagChips({ lang, section, current }: { lang: Locale; section: Section; current?: SeoTag }) {
  const tags = getSeoTags(section);
  if (!tags.length) return null;
  const p = getPages(lang).seo;
  return (
    <nav className="seo-tags" aria-label={p.tagNavLabel}>
      {tags.map((t) => (
        <a key={t.tag} href={tagHref(lang, section, t.tag)} aria-current={t.tag === current ? 'page' : undefined}>
          {p.tags[t.tag].name} <span>{t.count}</span>
        </a>
      ))}
    </nav>
  );
}

/**
 * Bo'limdagi barcha modellarning ixcham ro'yxati (kod + nom). Katalog setkasi 24 tadan ko'rsatadi
 * ("Yana +12" — JS), shuning uchun 60 ta model sahifasiga saytda havola yo'q edi, faqat sitemap'da
 * (audit 2026-11-02, SEO). Mijozga ham tezkor indeks: kodni bilsa — bir bosishda.
 */
export function ModelIndex({ lang, section }: { lang: Locale; section: Section }) {
  const models = getModelsBySection(section);
  if (models.length < 2) return null;
  const title = getPages(lang).seo.modelIndexTitle(sectionLabel(section, lang));
  return (
    <section className="seo-index">
      <div className="wrap">
        <h2 className="seo-countries__title">{title}</h2>
        <nav aria-label={title}>
          <ul>
            {models.map((m) => (
              <li key={m.slug}>
                <a href={`/${lang}/catalog/${SECTION_SLUGS[m.section]}/${m.slug}`}>
                  {m.code ? <span className="mono">№ {m.code}</span> : null} {modelName(m, lang)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}

/** "Qoliplarni 8 davlatga yetkazamiz" — eksport sahifalariga ichki havolalar. */
export function CountriesStrip({ lang, exclude, title }: { lang: Locale; exclude?: ExportCountry; title?: string }) {
  const g = getPages(lang).seo.geo;
  return (
    <section className="seo-countries">
      <div className="wrap seo-countries__in">
        <h2 className="seo-countries__title">{title ?? g.stripTitle}</h2>
        <nav aria-label={title ?? g.stripTitle}>
          {EXPORT_COUNTRIES.filter((c) => c.key !== exclude).map((c) => (
            <a key={c.key} href={exportHref(lang, c.key)}>
              {g.countries[c.key].name}
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}

/** Trotuar plitkasi qolipini tanlash qo'llanmasi: qalinlik jadvali (teg sahifalariga havola), qolip soni, material. */
export function PavingGuide({ lang }: { lang: Locale }) {
  const s = getPages(lang).seo;
  const g = s.guide;
  const thickness = getSeoTags('trotuar').filter((t) => ['walk-25-30', 'yard-35-40', 'parking-45-50'].includes(t.tag));
  const example = getPopular(40).find((m) => m.section === 'trotuar' && modelPerM2(m) && calcMolds(m, 100));
  const exMolds = example ? calcMolds(example, 100) : null;
  return (
    <section className="sec seo-guide">
      <div className="wrap seo-guide__in">
        <h2 className="h1">{g.title}</h2>
        {thickness.length ? (
          <div className="seo-guide__block">
            <h3 className="h3">{g.thicknessTitle}</h3>
            <table className="seo-table">
              <thead>
                <tr>
                  <th scope="col">{g.colUse}</th>
                  <th scope="col">{g.colThickness}</th>
                  <th scope="col">{g.colModels}</th>
                </tr>
              </thead>
              <tbody>
                {thickness.map((t) => {
                  const [use, mm] = s.tags[t.tag].name.split(' · ');
                  return (
                    <tr key={t.tag}>
                      <td>
                        <a href={tagHref(lang, 'trotuar', t.tag)}>{use}</a>
                      </td>
                      <td>{mm}</td>
                      <td>{t.count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
        {example && exMolds ? (
          <div className="seo-guide__block">
            <h3 className="h3">{g.countTitle}</h3>
            <p className="body muted">
              {g.countText(modelName(example, lang), String(modelPerM2(example)), 100, String(exMolds).replace(/\B(?=(\d{3})+(?!\d))/g, ' '))}
            </p>
          </div>
        ) : null}
        <div className="seo-guide__block">
          <h3 className="h3">{g.materialTitle}</h3>
          <p className="body muted">{g.materialText}</p>
        </div>
      </div>
    </section>
  );
}
