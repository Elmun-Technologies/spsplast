import { modelName, sectionLabel } from './catalog2027.ts';
import type { Model, Section } from './catalog2027.ts';
import type { Locale } from './i18n.ts';
import { getUi, pluralModels } from './ui.ts';

/**
 * Katalog sahifalarining `<title>` shablonlari (audit 2026-11-02, SEO 1-band).
 *
 * Mijoz "формы для тротуарной плитки" / "plitka qoliplari" deb qidiradi — sarlavhada
 * faqat "Тротуарная плитка" bo'lsa, sahifa plitka sotuvchilar bilan raqobatlashadi.
 * So'zlar lug'atda (`getUi(lang).seo.sectionMolds/modelMold`) — Matnlar CMS'dan o'zgaradi.
 * `<title>` shablon qo'shimchasi " · SPS Plast" (12 belgi) bilan 65 belgidan oshmasligi kerak.
 */
const BRAND_SUFFIX = 12;
const MAX = 65 - BRAND_SUFFIX;

export function sectionSeoTitle(section: Section, lang: Locale, count: number): string {
  const s = getUi(lang).seo;
  const label = sectionLabel(section, lang);
  const subject =
    s.sectionMolds[section] ||
    (lang === 'ru' ? `${label}: ${s.sectionMoldsFallback}` : `${label} ${s.sectionMoldsFallback}`);
  return `${subject} — ${count} ${pluralModels(lang, count)}`;
}

export function catalogSeoTitle(lang: Locale, total: number): string {
  return `${getUi(lang).seo.catalogTitle} — ${total} ${pluralModels(lang, total)}`;
}

export function modelSeoTitle(model: Model, lang: Locale): string {
  const s = getUi(lang).seo;
  const name = modelName(model, lang);
  const mold = s.modelMold[model.section] || s.modelMoldFallback;
  const size = model.tiles[0]?.size || model.molds[0]?.size || '';
  const code = model.code ? `№ ${model.code}` : '';
  const base = lang === 'ru' ? `${mold} «${name}»` : `${name} ${mold}`;
  // Uzun nomlarda avval kod, keyin o'lcham tushib qoladi — asosiy so'rov va nom qoladi.
  const candidates = [
    [base, size, code ? `· ${code}` : ''],
    [base, size],
    [base, code ? `· ${code}` : ''],
    [base],
  ].map((parts) => parts.filter(Boolean).join(' '));
  return candidates.find((c) => c.length <= MAX) ?? candidates[candidates.length - 1];
}

/**
 * Tayyor mahsulot sarlavhasi (2026-11-24). Ba'zi nomlarda turi yo'q ("30×60 Кирпич", "4 тали травертин") —
 * qidiruvdagi so'z ("термопанель", "фасадная плитка") sarlavhaga kirmasdi. Nomda subtitle'ning biror so'zi
 * (o'zagi, 4+ harf) bo'lmasa, subtitle oldinga qo'shiladi; bo'lsa ("45×120 Карниз") — takrorlanmaydi.
 */
export function readySeoTitle(name: string, subtitle: string, size?: string | null): string {
  const lower = name.toLowerCase();
  const stems = subtitle
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter((w) => w.length >= 4)
    .map((w) => w.slice(0, 5));
  const base = !subtitle || stems.some((s) => lower.includes(s)) ? name : `${subtitle} ${name}`;
  const withSize = size ? `${base} ${size}` : base;
  return withSize.length <= MAX ? withSize : base;
}
