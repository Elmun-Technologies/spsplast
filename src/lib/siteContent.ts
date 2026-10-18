import { settingValue } from './integrations.ts';
import { CONTACTS_2027 } from './contacts2027.ts';

/**
 * Admin → "Sozlamalar" dagi raqamlar sahifa matnlariga `{years}`, `{capacity}`,
 * `{objects}`, `{countries}`, `{countryList}` tokenlari orqali qo'yiladi
 * (`getPages()`). Standart qiymatlar — tasdiqlangan raqamlar (CLAUDE.md qoida 3).
 */
export type Lang = 'uz' | 'ru' | 'en';

const LABELS: Record<Lang, [string, string, string]> = {
  uz: ['Telefon', 'E-pochta', 'Manzil'],
  ru: ['Телефон', 'E-mail', 'Адрес'],
  en: ['Phone', 'E-mail', 'Address'],
};

export function siteStats(lang: Lang) {
  const [phone, mail, addr] = LABELS[lang];
  return {
    contactLine: [
      `${phone}: ${CONTACTS_2027.mainPhone}`,
      `Telegram: ${CONTACTS_2027.telegramHandle}`,
      CONTACTS_2027.email ? `${mail}: ${CONTACTS_2027.email}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    addressLine: `${addr}: ${CONTACTS_2027.address[lang]}`,
    address: CONTACTS_2027.address[lang],
    years: settingValue('stat_years'),
    capacity: settingValue('stat_capacity'),
    objects: settingValue('stat_objects'),
    countries: settingValue('stat_countries'),
    countryList: settingValue(`export_countries_${lang}`),
  };
}

export function applyStats(text: string, lang: Lang): string {
  if (!text.includes('{')) return text;
  const s = siteStats(lang) as Record<string, string>;
  return text.replace(/\{(years|capacity|objects|countries|countryList|contactLine|addressLine|address)\}/g, (_m, k: string) => s[k]);
}

/** Lug'atning barcha satrlariga (funksiya natijalariga ham) tokenlarni qo'llaydi. */
export function applyStatsDeep<T>(node: T, lang: Lang): T {
  if (typeof node === 'string') return applyStats(node, lang) as T;
  if (typeof node === 'function') {
    const fn = node as unknown as (...a: unknown[]) => unknown;
    return ((...a: unknown[]) => applyStatsDeep(fn(...a), lang)) as T;
  }
  if (Array.isArray(node)) return node.map((v) => applyStatsDeep(v, lang)) as T;
  if (node && typeof node === 'object') {
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, applyStatsDeep(v, lang)])) as T;
  }
  return node;
}
