import { siteSnapshot } from '../data/site.generated.ts';

/**
 * Admin → "Integratsiyalar" maydonlari. Qiymat bazada (`site_settings`), saytga
 * "Nashr qilish" bilan chiqadi; bo'sh bo'lsa env o'zgaruvchisi ishlatiladi.
 * Formatlar qat'iy tekshiriladi — qiymat skript ichiga qo'yiladi (XSS bo'lmasin).
 */
export type IntegrationField = {
  key: string;
  label: string;
  group: 'analytics' | 'ads' | 'verification' | 'contacts' | 'stats';
  env?: string;
  pattern: RegExp;
  placeholder: string;
  help: string;
  where: string;
  /** Bo'sh qolsa saytda ishlatiladigan standart qiymat (kontaktlar, raqamlar). */
  fallback?: string;
};

const PHONE = /^\+\d[\d ()-]{6,22}$/;
/** Matn maydonlari (manzil, davlatlar ro'yxati): HTML/shablon belgilarisiz. */
const SAFE_TEXT = /^[^<>{}`]{2,300}$/;

export const INTEGRATION_FIELDS: IntegrationField[] = [
  {
    key: 'gtm_id',
    label: 'Google Tag Manager',
    group: 'analytics',
    env: 'NEXT_PUBLIC_GTM_ID',
    pattern: /^GTM-[A-Z0-9]{4,12}$/,
    placeholder: 'GTM-…',
    help: "GTM ulansa GA4 va boshqa teglarni GTM ichida sozlang (GA4 maydoni bo'sh qolsin, ikki marta hisoblanmasin).",
    where: 'tagmanager.google.com → Container ID',
  },
  {
    key: 'ga4_id',
    label: 'Google Analytics 4',
    group: 'analytics',
    env: 'NEXT_PUBLIC_GA_MEASUREMENT_ID',
    pattern: /^G-[A-Z0-9]{6,14}$/,
    placeholder: 'G-…',
    help: 'Measurement ID. GTM ulangan bo\'lsa bu ishlatilmaydi.',
    where: 'analytics.google.com → Admin → Data streams',
  },
  {
    key: 'yandex_metrica_id',
    label: 'Yandex Metrica',
    group: 'analytics',
    env: 'NEXT_PUBLIC_YANDEX_METRICA_ID',
    pattern: /^\d{5,12}$/,
    placeholder: '12345678',
    help: 'Hisoblagich raqami. Vebvizor va xarita (clickmap) yoqilgan.',
    where: 'metrika.yandex.ru → Hisoblagich sozlamalari',
  },
  {
    key: 'meta_pixel_id',
    label: 'Meta (Facebook/Instagram) Pixel',
    group: 'ads',
    env: 'NEXT_PUBLIC_META_PIXEL_ID',
    pattern: /^\d{10,20}$/,
    placeholder: '123456789012345',
    help: "Zayafka → 'Lead', model sahifasi → 'ViewContent' voqealari avtomatik ketadi.",
    where: 'business.facebook.com → Events Manager',
  },
  {
    key: 'tiktok_pixel_id',
    label: 'TikTok Pixel',
    group: 'ads',
    pattern: /^[A-Z0-9]{15,25}$/,
    placeholder: 'CXXXXXXXXXXXXXXXXXXX',
    help: 'Ixtiyoriy. Sahifa ko\'rish va zayafka (SubmitForm).',
    where: 'ads.tiktok.com → Events → Web',
  },
  {
    key: 'google_site_verification',
    label: 'Google Search Console',
    group: 'verification',
    pattern: /^[A-Za-z0-9_-]{20,80}$/,
    placeholder: 'abc123…  (faqat content qiymati)',
    help: "HTML tag usuli: <meta name=\"google-site-verification\" content=\"…\"> dagi content qiymatini qo'ying.",
    where: 'search.google.com/search-console → Mulk qo\'shish → HTML tag',
  },
  {
    key: 'yandex_verification',
    label: 'Yandex Webmaster',
    group: 'verification',
    pattern: /^[a-f0-9]{8,40}$/i,
    placeholder: '1a2b3c4d5e6f7a8b',
    help: '<meta name="yandex-verification" content="…"> dagi qiymat.',
    where: 'webmaster.yandex.ru → Sayt qo\'shish → Meta-teg',
  },
  {
    key: 'bing_verification',
    label: 'Bing Webmaster',
    group: 'verification',
    pattern: /^[A-F0-9]{20,40}$/i,
    placeholder: '0123456789ABCDEF…',
    help: '<meta name="msvalidate.01" content="…"> dagi qiymat.',
    where: 'bing.com/webmasters',
  },
  {
    key: 'facebook_domain_verification',
    label: 'Meta domen tasdiqlash',
    group: 'verification',
    pattern: /^[a-z0-9]{20,40}$/,
    placeholder: 'abcdef1234567890…',
    help: '<meta name="facebook-domain-verification" content="…"> — reklama uchun domen tasdig\'i.',
    where: 'business.facebook.com → Brand safety → Domains',
  },
  // --- Kontaktlar (sayt sarlavhasi, footer, kontakt sahifasi, JSON-LD) ---
  { key: 'phone_main', label: 'Asosiy savdo telefoni (WhatsApp)', group: 'contacts', pattern: PHONE, placeholder: '+998 98 300 77 72', fallback: '+998 98 300 77 72', help: "Header, mobil 'qo'ng'iroq' tugmasi, WhatsApp havolasi.", where: 'xalqaro formatda, + bilan' },
  { key: 'phone_sales2', label: 'Savdo telefoni 2', group: 'contacts', pattern: PHONE, placeholder: '+998 33 338 77 72', fallback: '+998 33 338 77 72', help: 'Kontakt sahifasi va footer.', where: 'ixtiyoriy' },
  { key: 'phone_sales3', label: 'Savdo telefoni 3', group: 'contacts', pattern: PHONE, placeholder: '+998 33 888 77 72', fallback: '+998 33 888 77 72', help: 'Kontakt sahifasi.', where: 'ixtiyoriy' },
  { key: 'phone_office', label: 'Ofis telefoni', group: 'contacts', pattern: PHONE, placeholder: '+998 78 777 00 07', fallback: '+998 78 777 00 07', help: 'Kontakt sahifasi.', where: 'ixtiyoriy' },
  { key: 'telegram_handle', label: 'Telegram', group: 'contacts', pattern: /^@?[A-Za-z0-9_]{5,32}$/, placeholder: '@spsplastuz', fallback: '@spsplastuz', help: 'Kanal yoki menejer akkaunti.', where: '@username' },
  { key: 'instagram_handle', label: 'Instagram', group: 'contacts', pattern: /^@?[A-Za-z0-9_.]{2,30}$/, placeholder: '@spsplast.uz', fallback: '@spsplast.uz', help: 'Footer va kontakt sahifasi.', where: '@username' },
  { key: 'email', label: 'E-pochta', group: 'contacts', pattern: /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/, placeholder: 'sales@sps.uz', help: "Kiritilsa kontakt sahifasi, footer va maxfiylik siyosatida ko'rinadi.", where: 'ixtiyoriy' },
  { key: 'address_uz', label: 'Manzil (UZ)', group: 'contacts', pattern: SAFE_TEXT, placeholder: "Toshkent, Uchtepa tumani, Xalqa yo'li ko'chasi, 7A", fallback: "Toshkent, Uchtepa tumani, Xalqa yo'li ko'chasi, 7A", help: '', where: '' },
  { key: 'address_ru', label: 'Manzil (RU)', group: 'contacts', pattern: SAFE_TEXT, placeholder: 'Ташкент, Учтепинский район, ул. Халка йули, 7A', fallback: 'Ташкент, Учтепинский район, ул. Халка йули, 7A', help: '', where: '' },
  { key: 'address_en', label: 'Manzil (EN)', group: 'contacts', pattern: SAFE_TEXT, placeholder: '7A Khalqa yoli street, Uchtepa district, Tashkent', fallback: '7A Khalqa yoli street, Uchtepa district, Tashkent', help: '', where: '' },
  // --- Saytdagi raqamlar (bosh sahifa, ishlab chiqarish, ulgurji, FAQ — 3 tilda) ---
  { key: 'stat_years', label: 'Tajriba, yil', group: 'stats', pattern: /^\d{1,3}$/, placeholder: '20', fallback: '20', help: '"20 yil tajriba" — barcha sahifalarda.', where: '' },
  { key: 'stat_capacity', label: "Oylik quvvat, m²", group: 'stats', pattern: /^\d{1,3}( \d{3}){0,3}$/, placeholder: '18 000', fallback: '18 000', help: "Minglar bo'shliq bilan: 18 000.", where: '' },
  { key: 'stat_objects', label: 'Obyektlar soni', group: 'stats', pattern: /^\d{1,6}\+?$/, placeholder: '740+', fallback: '740+', help: '', where: '' },
  { key: 'stat_countries', label: 'Eksport davlatlari soni', group: 'stats', pattern: /^\d{1,3}\+?$/, placeholder: '8', fallback: '8', help: "Masalan 12 yoki 10+. Ro'yxatni ham yangilang.", where: '' },
  { key: 'export_countries_uz', label: "Davlatlar ro'yxati (UZ)", group: 'stats', pattern: SAFE_TEXT, placeholder: "Rossiya, Qozog'iston, …", fallback: "Rossiya, Qozog'iston, Qirg'iziston, Tojikiston, Ozarbayjon, Gruziya, Armaniston, Belarus", help: 'Ulgurji sahifasidagi eksport jadvali.', where: '' },
  { key: 'export_countries_ru', label: "Davlatlar ro'yxati (RU)", group: 'stats', pattern: SAFE_TEXT, placeholder: 'Россия, Казахстан, …', fallback: 'Россия, Казахстан, Кыргызстан, Таджикистан, Азербайджан, Грузия, Армения, Беларусь', help: '', where: '' },
  { key: 'export_countries_en', label: "Davlatlar ro'yxati (EN)", group: 'stats', pattern: SAFE_TEXT, placeholder: 'Russia, Kazakhstan, …', fallback: 'Russia, Kazakhstan, Kyrgyzstan, Tajikistan, Azerbaijan, Georgia, Armenia, Belarus', help: '', where: '' },
];

/** Sayt sozlamasi: admin (snapshot) → env → standart qiymat. Noto'g'ri format e'tiborga olinmaydi. */
export function settingValue(key: string): string {
  const f = INTEGRATION_FIELDS.find((x) => x.key === key);
  if (!f) return '';
  return integrationValue(key) || f.fallback || '';
}

export function isValidIntegration(key: string, value: string): boolean {
  const f = INTEGRATION_FIELDS.find((x) => x.key === key);
  return !!f && (value === '' || f.pattern.test(value));
}

/** Sayt ishlatadigan yakuniy qiymatlar: snapshot (admin) → env → bo'sh. Noto'g'ri format tashlanadi. */
export function integrationValue(key: string): string {
  const f = INTEGRATION_FIELDS.find((x) => x.key === key);
  if (!f) return '';
  const fromAdmin = siteSnapshot?.settings?.[key]?.trim() || '';
  const fromEnv = (f.env && process.env[f.env]?.trim()) || '';
  const v = fromAdmin || fromEnv;
  return v && f.pattern.test(v) ? v : '';
}

export function analyticsConfig() {
  return {
    gtm: integrationValue('gtm_id'),
    ga4: integrationValue('ga4_id'),
    metrica: integrationValue('yandex_metrica_id'),
    pixel: integrationValue('meta_pixel_id'),
    tiktok: integrationValue('tiktok_pixel_id'),
  };
}

/** Next `metadata.verification` (Search Console, Yandex, Bing, Meta). */
export function verificationMeta() {
  const google = integrationValue('google_site_verification');
  const yandex = integrationValue('yandex_verification');
  const bing = integrationValue('bing_verification');
  const fb = integrationValue('facebook_domain_verification');
  const other: Record<string, string> = {};
  if (bing) other['msvalidate.01'] = bing;
  if (fb) other['facebook-domain-verification'] = fb;
  return {
    ...(google ? { google } : {}),
    ...(yandex ? { yandex } : {}),
    ...(Object.keys(other).length ? { other } : {}),
  };
}
