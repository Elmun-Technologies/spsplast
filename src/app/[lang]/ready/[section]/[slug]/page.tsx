import Image from 'next/image';
import { notFound } from 'next/navigation';
import { isValidLocale, locales, formatNumber, type Locale } from '@/lib/i18n';
import { getPages } from '@/lib/pages';
import { getUi } from '@/lib/ui';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import {
  SECTION_SLUGS,
  getReadyBySlug,
  getMoldBySlug,
  getReadyModels,
  hasAnyImage,
  localizedText,
  modelImage,
  modelName,
  modelPath,
  readySectionFromSlug,
  relatedReady,
  sectionLabel,
  sectionPath,
  type Model,
} from '@/lib/catalog2027';
import { JsonLd } from '@/components/site/JsonLd';
import { ReadyGallery } from '@/components/ready2027/ReadyGallery';
import { ReadyActions } from '@/components/ready2027/ReadyActions';
import { jsonLdBreadcrumb, jsonLdProduct, pageMetadata } from '@/lib/seo';
import { readySeoTitle } from '@/lib/seoTitles';

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((lang) =>
    getReadyModels().map((m) => ({ lang, section: SECTION_SLUGS[m.section], slug: m.slug })),
  );
}

function find(section: string, slug: string): Model | undefined {
  const sec = readySectionFromSlug(section);
  const m = getReadyBySlug(slug);
  return sec && m && m.section === sec ? m : undefined;
}

/**
 * Rasmlar tartibi: mahsulotning o'zi (`images.scene`) → fasaddagi ko'rinish va variantlar (`images.tiles`) →
 * qo'shimcha suratlar (`images.molds`; tayyor mahsulotda bu maydon qolip emas, oddiy qo'shimcha surat).
 */
function gallery(m: Model, lang: Locale, facadeAlt: string): { src: string; alt: string }[] {
  const name = modelName(m, lang);
  const out: { src: string; alt: string }[] = [];
  const push = (src: string | null | undefined, alt: string) => {
    if (src && !out.some((x) => x.src === src)) out.push({ src, alt });
  };
  push(m.images.scene || m.images.sceneSm, name);
  for (const src of Object.values(m.images.tiles)) push(src, `${name} — ${facadeAlt}`);
  for (const src of Object.values(m.images.molds)) push(src, name);
  return out;
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; section: string; slug: string }> }) {
  const { lang, section, slug } = await params;
  const locale = (isValidLocale(lang) ? lang : 'uz') as Locale;
  const m = find(section, slug);
  if (!m) return { title: 'SPS' };
  const r = getPages(locale).ready;
  const name = modelName(m, locale);
  const size = m.tiles[0]?.size;
  const sub = localizedText(m.subtitle, locale) || sectionLabel(m.section, locale);
  return pageMetadata({
    lang: locale,
    path: modelPath(m),
    title: readySeoTitle(name, localizedText(m.subtitle, locale) ?? '', size),
    description: `${name}${size ? ` ${size}` : ''} — ${sub}. ${r.priceNote}`,
    image: modelImage(m) ?? undefined,
    // Rasmsiz mahsulot indekslanmaydi (qoliplardagi kabi `autoNoindex`) — rasm qo'shilgach o'zi ochiladi.
    noindex: !hasAnyImage(m),
  });
}

export default async function ReadyProductPage({ params }: { params: Promise<{ lang: string; section: string; slug: string }> }) {
  const { lang: langParam, section, slug } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const m = find(section, slug);
  if (!m) notFound();
  const p = getPages(lang);
  const r = p.ready;
  const t = getUi(lang);
  const name = modelName(m, lang);
  const sub = localizedText(m.subtitle, lang);
  const note = localizedText(m.note, lang);
  const images = gallery(m, lang, r.facadeAlt);
  const related = relatedReady(m, 4);
  const tile = m.tiles[0];

  // Xususiyatlar: o'lcham, 1 m² dagi soni, og'irligi + admin'dagi erkin jadval (rang, tekstura, mustahkamlik …).
  const rows: { k: string; v: string }[] = [];
  if (tile?.size) rows.push({ k: t.catalog.mSize, v: tile.size });
  if (tile?.per) rows.push({ k: t.catalog.mPer, v: `${formatNumber(lang, tile.per)} ${t.catalog.dona}` });
  if (m.kg) rows.push({ k: t.catalog.mWeight, v: `${formatNumber(lang, m.kg)} kg` });
  for (const s of m.specs) {
    const k = localizedText(s.k, lang);
    const v = localizedText(s.v, lang);
    if (k && v) rows.push({ k, v });
  }

  const waText = r.waAboutTemplate.replace('{name}', `${m.code ? `№ ${m.code} ` : ''}${name}`);
  const waHref = `${CONTACTS_2027.whatsappUrl}?text=${encodeURIComponent(waText)}`;

  return (
    <>
      <JsonLd
        data={jsonLdBreadcrumb(lang, [
          { name: 'SPS', path: '' },
          { name: r.title, path: '/ready' },
          { name: sectionLabel(m.section, lang), path: sectionPath(m.section) },
          { name, path: modelPath(m) },
        ])}
      />
      <JsonLd
        data={jsonLdProduct({
          lang,
          path: modelPath(m),
          name,
          description: sub || note,
          image: modelImage(m),
          sku: m.code,
          category: sectionLabel(m.section, lang),
          service: t.seo.offerService,
        })}
      />
      <div className="wrap sec rd-page">
        <nav aria-label="breadcrumb">
          <ol className="crumbs">
            <li>
              <a href={`/${lang}/ready`}>{r.title}</a>
            </li>
            <li>
              <a href={`/${lang}${sectionPath(m.section)}`}>{sectionLabel(m.section, lang)}</a>
            </li>
            <li aria-current="page">{name}</li>
          </ol>
        </nav>
        <div className="rd-pdp">
          {images.length ? (
            <ReadyGallery images={images} label={name} />
          ) : (
            <div className="rd-gal__main rd-gal__main--empty">{t.catalog.photoSoon}</div>
          )}
          <div className="rd-info">
            <p className="sps-eyebrow">
              <b>{sectionLabel(m.section, lang)}</b>
              {m.code ? ` · № ${m.code}` : ''}
            </p>
            <h1 className="h1">{name}</h1>
            {sub ? <p className="lead muted">{sub}</p> : null}
            {rows.length ? (
              <section aria-labelledby="rd-specs">
                <h2 className="h3" id="rd-specs">
                  {r.specsTitle}
                </h2>
                <dl className="rd-spec">
                  {rows.map((x) => (
                    <div key={x.k}>
                      <dt>{x.k}</dt>
                      <dd>{x.v}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
            {note ? <p className="body">{note}</p> : null}
            <p className="body muted">{r.priceNote}</p>
            <ReadyActions model={m} lang={lang} waHref={waHref} />
          </div>
        </div>

        {related.length ? (
          <section className="hm-stack" aria-labelledby="rd-rel">
            <h2 className="h2" id="rd-rel">
              {r.related}
            </h2>
            <div className="rel">
              {related.map((x) => {
                const img = x.images.sceneSm || modelImage(x);
                return (
                  <a className="rc rc--ready" key={x.slug} href={`/${lang}${modelPath(x)}`}>
                    {img ? (
                      <Image
                        src={img}
                        alt={modelName(x, lang)}
                        width={400}
                        height={300}
                        sizes="(max-width: 640px) 50vw, (max-width: 1100px) 25vw, 300px"
                        loading="lazy"
                      />
                    ) : null}
                    <div>
                      <span className="mono">{x.code ? `№ ${x.code}` : ''}</span>
                      <b>{modelName(x, lang)}</b>
                      <span className="mono">{x.tiles[0]?.size ?? ''}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        ) : null}

        <p className="body muted">
          {r.moldsCross}{' '}
          {(() => {
            // Shu mahsulot quyiladigan qolip (slug: `<qolip>-tayyor`) — to'g'ridan-to'g'ri uning sahifasiga
            const twin = getMoldBySlug(m.slug.replace(/-tayyor$/, ''));
            return twin ? (
              <a href={`/${lang}${modelPath(twin)}`}>{r.moldTwinLink}</a>
            ) : (
              <a href={`/${lang}/catalog`}>{r.moldsLink}</a>
            );
          })()}
        </p>
      </div>
    </>
  );
}
