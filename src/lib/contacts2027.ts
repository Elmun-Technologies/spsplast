/**
 * Kontaktlar — redesign 2027 (yagona manba: docs/design-handoff/HANDOFF.md 1-bo'lim).
 * Eski `contacts.ts` dagi @sps_stone / sps.stone handledari HANDOFF bilan zid —
 * savol docs/data-questions.md da (MANUAL ro'yxat).
 */
export const CONTACTS_2027 = {
  sales: [
    { display: '+998 98 300 77 72', raw: '+998983007772', main: true, whatsapp: true },
    { display: '+998 33 338 77 72', raw: '+998333387772', main: false, whatsapp: false },
    { display: '+998 33 888 77 72', raw: '+998338887772', main: false, whatsapp: false },
  ],
  office: { display: '+998 78 777 00 07', raw: '+998787770007' },
  mainPhone: '+998 98 300 77 72',
  mainPhoneRaw: '+998983007772',
  telegramHandle: '@spsplastuz',
  telegramUrl: 'https://t.me/spsplastuz',
  instagramHandle: '@spsplast.uz',
  instagramUrl: 'https://instagram.com/spsplast.uz',
  whatsappUrl: 'https://wa.me/998983007772',
  address: {
    uz: "Toshkent, Uchtepa tumani, Xalqa yo'li ko'chasi, 7A",
    ru: 'Ташкент, Учтепинский район, ул. Халка йули, 7A',
    en: '7A Khalqa yoli street, Uchtepa district, Tashkent',
  },
  coords: { lat: 41.299833, lng: 69.150472 },
  workHours: 'Du–Sha · 09:00–18:00',
} as const;
