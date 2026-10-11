/**
 * Tekshiruv marshrutlari (Stage 6).
 *
 * Bitta ro'yxat uchta joyda ishlatiladi:
 *  - `scripts/audit-seo-dom.mjs`  — SSR HTML'dagi SEO/DOM qoidalari;
 *  - `scripts/audit-a11y.mjs`     — axe-core a11y tekshiruvi;
 *  - `scripts/visual/compare-screens.mjs` — Playwright skrinshotlari.
 *
 * `expect` maydonlari:
 *  - status    — kutilgan HTTP status (200 yoki 404);
 *  - noindex   — sahifa indekslanmasligi kerak (compare/request/404);
 *  - jsonLd    — sahifada kutilgan JSON-LD @type'lari;
 *  - allowCyrillic — uz sahifasida kirillcha matn ruxsat etilgan (ildiz 404:
 *    u uch tilga ham yo'l ko'rsatadi).
 */

export const SITE_ORIGIN = process.env.AUDIT_ORIGIN || 'http://127.0.0.1:3000';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sps.uz').replace(/\/$/, '');

export const AUDIT_ROUTES = [
  { path: '/', lang: null, expect: { status: 307 } },

  { path: '/uz', lang: 'uz', expect: { jsonLd: ['Organization', 'WebSite'] } },
  { path: '/ru', lang: 'ru', expect: { jsonLd: ['Organization', 'WebSite'] } },
  { path: '/en', lang: 'en', expect: { jsonLd: ['Organization', 'WebSite'] } },

  { path: '/uz/catalog', lang: 'uz', expect: { jsonLd: ['BreadcrumbList'] } },
  { path: '/ru/catalog', lang: 'ru', expect: { jsonLd: ['BreadcrumbList'] } },
  { path: '/en/catalog', lang: 'en', expect: { jsonLd: ['BreadcrumbList'] } },

  { path: '/uz/catalog/paving', lang: 'uz', expect: { jsonLd: ['BreadcrumbList'] } },
  { path: '/ru/catalog/facade', lang: 'ru', expect: { jsonLd: ['BreadcrumbList'] } },
  { path: '/en/catalog/decor', lang: 'en', expect: { jsonLd: ['BreadcrumbList'] } },
  { path: '/uz/catalog/bench', lang: 'uz', expect: { jsonLd: ['BreadcrumbList'] } },
  // 0 model: marshrut ishlaydi, lekin sitemap'da yo'q (yupqa kontent).
  { path: '/uz/catalog/fence', lang: 'uz', expect: { jsonLd: ['BreadcrumbList'], thin: true } },

  { path: '/uz/catalog/paving/01-monako', lang: 'uz', expect: { jsonLd: ['BreadcrumbList', 'Product', 'FAQPage'] } },
  { path: '/ru/catalog/paving/15-floriya', lang: 'ru', expect: { jsonLd: ['BreadcrumbList', 'Product', 'FAQPage'] } },
  { path: '/en/catalog/decor/kapitel-40-tepa', lang: 'en', expect: { jsonLd: ['BreadcrumbList', 'Product', 'FAQPage'] } },
  // Rasmsiz model: fallback (placeholder) va alt matnlari tekshiriladi.
  { path: '/uz/catalog/paving/70-kabanchik-17-5-naqshli', lang: 'uz', expect: { jsonLd: ['Product'], noImage: true } },

  { path: '/uz/partners', lang: 'uz', expect: { jsonLd: ['BreadcrumbList', 'FAQPage'] } },
  { path: '/ru/partners', lang: 'ru', expect: { jsonLd: ['BreadcrumbList', 'FAQPage'] } },
  { path: '/en/partners', lang: 'en', expect: { jsonLd: ['BreadcrumbList', 'FAQPage'] } },

  { path: '/uz/production', lang: 'uz', expect: { jsonLd: ['BreadcrumbList'] } },
  { path: '/ru/production', lang: 'ru', expect: { jsonLd: ['BreadcrumbList'] } },
  { path: '/en/production', lang: 'en', expect: { jsonLd: ['BreadcrumbList'] } },

  { path: '/uz/contact', lang: 'uz', expect: { jsonLd: ['BreadcrumbList', 'LocalBusiness'] } },
  { path: '/ru/contact', lang: 'ru', expect: { jsonLd: ['BreadcrumbList', 'LocalBusiness'] } },
  { path: '/en/contact', lang: 'en', expect: { jsonLd: ['BreadcrumbList', 'LocalBusiness'] } },

  { path: '/uz/privacy', lang: 'uz', expect: { jsonLd: ['BreadcrumbList'] } },
  { path: '/ru/privacy', lang: 'ru', expect: { jsonLd: ['BreadcrumbList'] } },
  { path: '/en/privacy', lang: 'en', expect: { jsonLd: ['BreadcrumbList'] } },

  // Foydalanuvchi holatiga bog'liq: noindex + sitemap'da yo'q.
  { path: '/uz/compare', lang: 'uz', expect: { noindex: true } },
  { path: '/ru/request', lang: 'ru', expect: { noindex: true } },

  // 404: status, noindex va brendlangan tana.
  { path: '/uz/catalog/paving/this-model-does-not-exist', lang: 'uz', expect: { status: 404, noindex: true, allowCyrillic: true } },
  { path: '/xx', lang: null, expect: { status: 404, noindex: true, allowCyrillic: true } },

  // 301 migratsiya: eski manzillar yangi sahifaga tushishi kerak.
  { path: '/uz/product/g001-floriya', lang: null, expect: { status: 301, redirectTo: '/uz/catalog/paving/15-floriya' } },
  { path: '/uz/blog', lang: null, expect: { status: 301, redirectTo: '/uz' } },
  { path: '/produkciya', lang: null, expect: { status: 301, redirectTo: '/ru/catalog' } },
];

/**
 * Playwright skrinshot rejasi: `docs/design-handoff/screens/` dagi fayllarga
 * mos keladi (01-bosh-sahifa ... 13-404). `action` — suratga olishdan oldin
 * bajariladigan interaktivlik (menyu, filtr oynasi, tez zayafka).
 */
/**
 * Screenshot rejasi. `id` — fayl nomi (`screens-actual/<id>-<kind>.png`).
 *
 * MUHIM: mobil va desktop etalonlarining raqamlash tartibi HAR XIL
 * (mobil: 03-katalog, 06-model, 13-404; desktop: 02-katalog, 03-model, 11-404).
 * Shuning uchun desktop etaloni `refDesktop` bilan aniq ko'rsatiladi; u bo'lmasa
 * `id` ishlatiladi. i18n ekranlari `screens/i18n/` papkasida, nomlari bir xil.
 */
export const SHOT_PLAN = [
  { id: '01-bosh-sahifa', path: '/uz', mobile: true, desktop: true, ref: 'bosh-sahifa' },
  { id: '02-menyu', path: '/uz', mobile: true, action: 'menu', ref: 'menyu' },
  { id: '03-katalog', refDesktop: '02-katalog', path: '/uz/catalog', mobile: true, desktop: true, ref: 'katalog' },
  { id: '04-filtr', path: '/uz/catalog', mobile: true, action: 'filters', ref: 'filtr' },
  { id: '05-zayafka-oynasi', path: '/uz/catalog', mobile: true, action: 'quickLead', ref: 'zayafka-oynasi' },
  { id: '06-model', refDesktop: '03-model', path: '/uz/catalog/paving/01-monako', mobile: true, desktop: true, ref: 'model' },
  { id: '07-solishtirish', refDesktop: '04-solishtirish', path: '/uz/compare', mobile: true, desktop: true, action: 'seedCompare', ref: 'solishtirish' },
  { id: '08-zayafka-royxati', refDesktop: '05-zayafka-royxati', path: '/uz/request', mobile: true, desktop: true, action: 'seedRequest', ref: 'zayafka-royxati' },
  { id: '09-ulgurji', refDesktop: '06-ulgurji', path: '/uz/partners', mobile: true, desktop: true, ref: 'ulgurji' },
  { id: '10-ishlab-chiqarish', refDesktop: '07-ishlab-chiqarish', path: '/uz/production', mobile: true, desktop: true, ref: 'ishlab-chiqarish' },
  { id: '11-kontakt', refDesktop: '08-kontakt', path: '/uz/contact', mobile: true, desktop: true, ref: 'kontakt' },
  { id: '12-maxfiylik', refDesktop: '10-maxfiylik', path: '/uz/privacy', mobile: true, desktop: true, ref: 'maxfiylik' },
  { id: '13-404', refDesktop: '11-404', path: '/uz/catalog/paving/yoq-model', mobile: true, desktop: true, ref: '404' },
  // desktop/09-holatlar.jpg — holatlar varaqasi (bo'sh ro'yxat, yuklanish, xato).
  { id: '09-holatlar', path: '/uz/request', desktop: true, ref: 'holatlar' },
  // i18n ekranlari: ru/en bosh sahifa, mobil va desktop.
  { id: 'ru-mobil-bosh-sahifa', path: '/ru', mobile: true, ref: 'ru-bosh-sahifa' },
  { id: 'ru-desktop-bosh-sahifa', path: '/ru', desktop: true, ref: 'ru-bosh-sahifa' },
  { id: 'en-mobil-bosh-sahifa', path: '/en', mobile: true, ref: 'en-bosh-sahifa' },
  { id: 'en-desktop-bosh-sahifa', path: '/en', desktop: true, ref: 'en-bosh-sahifa' },
];

/**
 * Playwright kontekst parametrlari.
 *
 * MUHIM: `width`/`height` **`viewport` obyekti ichida** bo'lishi shart —
 * `browser.newContext({ width: 390 })` e'tiborsiz qoldiriladi va Playwright
 * standart 1280×720 ni ishlatadi (shunda "mobil" suratlari aslida desktop
 * bo'lib chiqadi, `.hd-burger` esa `display: none` bo'ladi).
 */
export const VIEWPORTS = {
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
};
