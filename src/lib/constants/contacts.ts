/**
 * Kompaniyaning yagona kontakt manbasi.
 *
 * Bu fayl butun sayt uchun "single source of truth": Header, Footer, kontakt
 * sahifasi, Telegram/WhatsApp tugmalari va JSON-LD shu yerdan o'qiydi.
 *
 * Ma'lumotlar eski `sps.uz` saytidagi (2017-yilgi CMS) haqiqiy rekvizitlar
 * asosida to'ldirilgan — ilgari bu yerda faqat "Toshkent sh., Uzbekistan"
 * degan umumiy manzil va 1 ta telefon bor edi, natijada mijoz zavod manzilini,
 * ish vaqtini va qo'shimcha raqamlarni topa olmasdi (docs/MADANI-RAQOBAT-AUDITI.md, P0-3).
 *
 * Diqqat: `addressUz` / `addressRu` / `email` / `phoneRaw` / `phoneDisplay`
 * kalitlari eski kodda ishlatilgani uchun nomi o'zgarmaydi — yangi maydonlar
 * qo'shimcha sifatida keladi.
 */

export interface CompanyPhone {
  /** Saytda ko'rinadigan format: +998 (98) 300-77-72 */
  display: string;
  /** `tel:` havolasi uchun format: +998983007772 */
  raw: string;
  /** Bu raqam nima uchun — mijozga tushunarli bo'lishi uchun */
  label: { uz: string; ru: string };
}

export const COMPANY_CONTACTS = {
  companyName: 'SPS STONE PROFY SERVISE',
  legalName: 'ООО «STONE PROFY SERVISE»',

  /** Asosiy raqam — barcha tugmalar shunga ulanadi. */
  phoneDisplay: '+998 (98) 300-77-72',
  phoneRaw: '+998983007772',

  /**
   * Qolgan raqamlar: savdo, ombor va shahar raqami.
   * `phones[0]` har doim asosiy raqam bilan bir xil bo'lishi kerak.
   */
  phones: [
    { display: '+998 (98) 300-77-72', raw: '+998983007772', label: { uz: 'Savdo bo‘limi', ru: 'Отдел продаж' } },
    { display: '+998 (33) 888-77-72', raw: '+998338887772', label: { uz: 'Buyurtmalar', ru: 'Заказы' } },
    { display: '+998 (33) 338-77-72', raw: '+998333387772', label: { uz: 'Ombor va yetkazish', ru: 'Склад и доставка' } },
    { display: '+998 (78) 777-00-07', raw: '+998787770007', label: { uz: 'Ofis (shahar raqami)', ru: 'Офис (городской)' } },
  ] as CompanyPhone[],

  telegramUrl: 'https://t.me/+998983007772',
  telegramHandle: '@sps_stone',
  whatsappUrl: 'https://wa.me/998983007772',
  instagramUrl: 'https://instagram.com/sps.stone',
  website: 'https://sps.uz',

  /** Qisqa manzil (kartalar, footer). */
  addressUz: 'Toshkent sh., Uchtepa tumani, Xalqa yo‘li ko‘chasi, 7A',
  addressRu: 'г. Ташкент, Учтепинский район, ул. Халка йули, д. 7А',

  /** To'liq yuridik manzil. */
  legalAddressUz: 'O‘zbekiston Respublikasi, Toshkent sh., Uchtepa tumani, Xalqa yo‘li ko‘chasi, 7A',
  legalAddressRu: 'Республика Узбекистан, г. Ташкент, Учтепинский район, ул. Халка йули, д. 7А',

  workHoursUz: 'Dushanba – Shanba, 09:00 – 18:00',
  workHoursRu: 'Понедельник – Суббота, 09:00 – 18:00',

  email: 'stoneprofyservise@mail.ru',

  /**
   * Yandex Maps: koordinatalar 41.299833, 69.150472 (Xalqa yo‘li 7A).
   * `mapUrl` — tashqi havola, `mapEmbedUrl` — sahifaga joylanadigan iframe.
   */
  latitude: 41.299833,
  longitude: 69.150472,
  mapUrl:
    'https://yandex.uz/maps/?ll=69.150472%2C41.299833&z=17&text=%D0%A2%D0%B0%D1%88%D0%BA%D0%B5%D0%BD%D1%82%2C%20%D0%A3%D1%87%D1%82%D0%B5%D0%BF%D0%B8%D0%BD%D1%81%D0%BA%D0%B8%D0%B9%20%D1%80%D0%B0%D0%B9%D0%BE%D0%BD%2C%20%D0%A5%D0%B0%D0%BB%D0%BA%D0%B0%20%D0%B9%D1%83%D0%BB%D0%B8%207%D0%90',
  mapEmbedUrl:
    'https://yandex.uz/map-widget/v1/?ll=69.150472%2C41.299833&z=16&pt=69.150472,41.299833,pm2rdm',

  /** To'lov va shartnoma uchun rekvizitlar (B2B xaridorlar so'raydi). */
  requisites: {
    accountNumber: '2020 8000 1048 0307 7001',
    bankNameUz: '«Hamkorbank» ATB, Uchtepa filiali',
    bankNameRu: 'АКБ «Hamkorbank», Учтепинский филиал',
    mfo: '00083',
    inn: '301330578',
  },
};
