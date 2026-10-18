import { settingValue } from './integrations.ts';

/**
 * Kontaktlar — redesign 2027 (standart qiymatlar: docs/design-handoff/HANDOFF.md 1-bo'lim).
 * Admin → "Sozlamalar" → Kontaktlar orqali o'zgartiriladi (nashr paytida
 * `src/data/site.generated.ts` ga tushadi); bo'sh maydon — HANDOFF qiymati.
 * Sahifalarda telefon qattiq yozilmaydi — faqat shu obyekt (test 7).
 */
const raw = (phone: string) => `+${phone.replace(/\D/g, '')}`;
const handle = (h: string) => (h.startsWith('@') ? h : `@${h}`);

const main = settingValue('phone_main');
const tg = handle(settingValue('telegram_handle'));
const ig = handle(settingValue('instagram_handle'));
const email = settingValue('email') || null;

export const CONTACTS_2027 = {
  sales: [
    { display: main, raw: raw(main), main: true, whatsapp: true },
    ...[settingValue('phone_sales2'), settingValue('phone_sales3')]
      .filter(Boolean)
      .map((p) => ({ display: p, raw: raw(p), main: false, whatsapp: false })),
  ],
  office: { display: settingValue('phone_office'), raw: raw(settingValue('phone_office')) },
  mainPhone: main,
  mainPhoneRaw: raw(main),
  telegramHandle: tg,
  telegramUrl: `https://t.me/${tg.slice(1)}`,
  instagramHandle: ig,
  instagramUrl: `https://instagram.com/${ig.slice(1)}`,
  whatsappUrl: `https://wa.me/${raw(main).slice(1)}`,
  /** `null` — biznes hali bermagan: e-pochta qatori saytda ko'rsatilmaydi. */
  email,
  address: {
    uz: settingValue('address_uz'),
    ru: settingValue('address_ru'),
    en: settingValue('address_en'),
  },
  coords: { lat: 41.299833, lng: 69.150472 },
  workHours: 'Du–Sha · 09:00–18:00',
} as const;
