import { notFound } from 'next/navigation';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getPages } from '@/lib/pages';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import {
  READY_SECTIONS,
  SECTION_SLUGS,
  getReadyBySection,
  getReadyModels,
  modelImage,
  readySectionFromSlug,
  sectionLabel,
  sectionPath,
} from '@/lib/catalog2027';
import { CatalogHead } from '@/components/catalog2027/CatalogHead';
import { CatalogClient } from '@/components/catalog2027/CatalogClient';
import { JsonLd } from '@/components/site/JsonLd';
import { jsonLdBreadcrumb, noindexMetadata, pageMetadata } from '@/lib/seo';
import { seoOverride } from '@/lib/seoOverrides';

// Noma'lum bo'lim — qattiq 404 (soft-404 emas); filtrlar mijoz tomonida (CatalogClient).
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((lang) => READY_SECTIONS.map((s) => ({ lang, section: SECTION_SLUGS[s] })));
}

/** SERP uchun: bo'lim matnidan ≤ 160 belgi — butun gaplar, juda qisqa chiqsa so'z chegarasida "…" bilan. */
function snippet(text: string | undefined): string {
  const max = 160;
  if (!text || text.length <= max) return text ?? '';
  let out = '';
  for (const s of text.split(/(?<=\.) /)) {
    if (out && `${out} ${s}`.length > max) break;
    out = out ? `${out} ${s}` : s;
  }
  if (out.length >= 90 && out.length <= max) return out;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,.;:—–-]+$/, '')}…`;
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; section: string }> }) {
  const { lang, section } = await params;
  const locale = (isValidLocale(lang) ? lang : 'uz') as Locale;
  const sec = readySectionFromSlug(section);
  if (!sec) return { title: 'SPS' };
  const r = getPages(locale).ready;
  const models = getReadyBySection(sec);
  const title = `${sectionLabel(sec, locale)} — ${r.title.toLowerCase()}`;
  const description = snippet(r.sectionIntros[sec]) || `${sectionLabel(sec, locale)}. ${r.sectionLeadTemplate.replace('{n}', String(models.length))}`;
  // Bo'sh bo'lim indekslanmaydi (yupqa kontent); mahsulot qo'shilgach o'zi indekslanadi.
  if (!models.length) return { ...noindexMetadata(locale, title), description };
  return pageMetadata({
    lang: locale,
    path: sectionPath(sec),
    title,
    description,
    image: models.map((m) => modelImage(m)).find(Boolean) ?? undefined,
  });
}

export default async function ReadySectionPage({ params }: { params: Promise<{ lang: string; section: string }> }) {
  const { lang: langParam, section } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const sec = readySectionFromSlug(section);
  if (!sec) notFound();
  const p = getPages(lang);
  const r = p.ready;
  const models = getReadyBySection(sec);
  const o = seoOverride(lang, sectionPath(sec));

  return (
    <>
      <JsonLd
        data={jsonLdBreadcrumb(lang, [
          { name: 'SPS', path: '' },
          { name: r.title, path: '/ready' },
          { name: sectionLabel(sec, lang), path: sectionPath(sec) },
        ])}
      />
      <CatalogHead
        lang={lang}
        crumbs={[{ href: `/${lang}/ready`, label: r.title }, { label: sectionLabel(sec, lang) }]}
        title={o?.h1 || sectionLabel(sec, lang)}
        intro={o?.intro || r.sectionIntros[sec]}
        lead={r.sectionLeadTemplate.replace('{n}', String(models.length))}
        catalog={null}
        pattern="charogon"
      />
      <div className="wrap sec">
        {models.length ? (
          <CatalogClient lang={lang} models={models} variant="catalog" searchPlaceholder={r.searchPlaceholder} foundLabel={r.foundLabel} total={getReadyModels().length} />
        ) : (
          <div className="ct-note">
            <b>{r.emptyTitle}</b>
            <span>{r.emptyText}</span>
            <a className="sps-btn sps-btn--primary" href={`/${lang}/request`}>
              {r.cta}
            </a>
            <a
              className="sps-btn sps-btn--outline"
              href={`${CONTACTS_2027.whatsappUrl}?text=${encodeURIComponent(r.waText)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </div>
        )}
      </div>
    </>
  );
}
