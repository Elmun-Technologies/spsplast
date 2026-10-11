/**
 * SSR HTML qoidalari (Stage 6 tekshiruvi).
 *
 * Bu modul sof funksiyalar to'plami: jsdom `Document` + kutilgan qiymatlarni
 * oladi va xato/ogohlantirish/qayd ro'yxatini qaytaradi. Tarmoq, fayl tizimi
 * va Playwright'ga bog'liq emas — shuning uchun `tests/audits2027.test.js`
 * uni kichik HTML fixture'larida tekshira oladi.
 *
 * Qoidalar HANDOFF 7 (SEO) va 1.1 (narx yo'q) talablaridan kelib chiqadi:
 * title/description/canonical/hreflang/OG, JSON-LD turlari va narxning
 * yo'qligi, bitta `h1`, sarlavha ierarxiyasi, `alt`, forma label'lari,
 * ichki havolarning til prefiksi va o'chirilgan marshrutlarga borga yo'lmaslik.
 */

/** O'chirilgan (2026) marshrutlar — ichki havolalarda uchramasligi kerak. */
const DEAD_SEGMENTS = [
  '/blog', '/projects', '/wishlist', '/search', '/about', '/terms', '/returns',
  '/delivery-payment', '/how-to-order', '/product/', '/catalog-preview',
];

/** Til prefiksisiz yuradigan statik resurslar. */
// `/catalog/` umumiy prefiks EMAS: `/catalog/paving` — bu til prefiksisiz ichki
// havola (xato), shuning uchun faqat haqiqiy fayl yo'llari ro'yxatda.
const ASSET_PREFIXES = ['/_next/', '/catalog/2027/', '/catalog/pdf/', '/images/', '/fonts/', '/icons/', '/favicon.ico', '/sw.js'];

const PRICE_RE = /(\d[\d\s.,]{1,12})\s*(so['‘’]m|so'm|сум|sum\b|USD|\$|₽|евро)/i;
const CYRILLIC_WORD_RE = /[а-яёА-ЯЁЁ]{2,}/g;
const PLACEHOLDER_RE = /\[[^\]\n]{2,60}\]/g;

/** Natija obyekti: xatolar (exit 1), ogohlantirishlar, qaydlar. */
function report() {
  return { errors: [], warnings: [], notes: [] };
}

function text(doc) {
  if (!doc.body) return '';
  // `textContent` script/style ichidagi matnni ham qaytaradi (Next'ning RSC
  // payload'i shu yerda) — kontent tekshiruvlarida bu soxta signal beradi.
  const clone = doc.body.cloneNode(true);
  for (const node of clone.querySelectorAll('script, style, noscript, template')) node.remove();
  return clone.textContent || '';
}

/** `meta[name=...]` / `meta[property=...]` content'i. */
function metaContent(doc, attr, name) {
  const el = doc.querySelector(`meta[${attr}="${name}"]`);
  return el ? (el.getAttribute('content') || '').trim() : null;
}

function allMetaContent(doc, attr, name) {
  return [...doc.querySelectorAll(`meta[${attr}="${name}"]`)].map((el) => (el.getAttribute('content') || '').trim());
}

/* --- 1. Title / description --------------------------------------------- */

export function checkTitleAndDescription(doc, { path, lang, expect = {} }, out) {
  const title = (doc.querySelector('title') || {}).textContent || '';
  const titleLength = title.trim().length;

  if (!title.trim()) out.errors.push(`${path}: <title> bo'sh`);
  // 404 sahifasi uch tilni ham qamrab oladi (ildiz not-found) va indekslanmaydi —
  // uning sarlavhasi SERP chegarasiga tekshirilmaydi.
  if (expect.status !== 404) {
    // SERP'da 65 belgidan keyin kesiladi; 10 belgidan qisqa — kam ma'lumot.
    if (titleLength > 65) out.warnings.push(`${path}: title ${titleLength} belgi (65 dan uzun — SERP'da kesiladi): "${title}"`);
    if (titleLength && titleLength < 10) out.warnings.push(`${path}: title juda qisqa (${titleLength}): "${title}"`);
  }

  const description = metaContent(doc, 'name', 'description');
  if (!description) {
    if (!expect.noindex) out.errors.push(`${path}: meta description yo'q`);
  } else {
    const len = description.length;
    // 404 sahifasi indekslanmaydi — uning tavsifi SERP chegarasiga tekshirilmaydi
    // (ildiz not-found root layout'dagi zaxira tavsifni oladi).
    if (expect.status !== 404) {
      if (len < 50) out.warnings.push(`${path}: description qisqa (${len} belgi)`);
      if (len > 170) out.warnings.push(`${path}: description uzun (${len} belgi — SERP'da kesiladi)`);
    }
    // Rus/ingliz sahifasida o'zbekcha CTA qolmasligi kerak (Stage 5 xatosi).
    if (lang && lang !== 'uz' && /zayafka|qoldiring|hisoblab beradi/i.test(description)) {
      out.errors.push(`${path}: ${lang} description'ida o'zbekcha matn qolgan: "${description}"`);
    }
  }

  // Sarlavha va tavsif har bir tilda haqiqatan farq qilishi kerak.
  if (lang && lang !== 'uz') {
    const uzTitle = title.replace(/^(№\s?\w+\s)?/, '');
    if (uzTitle && /qolip|katalog|zayafka|ishlab chiqarish/i.test(uzTitle)) {
      out.warnings.push(`${path}: ${lang} title'ida o'zbekcha so'z bor: "${title}"`);
    }
  }
}

/* --- 2. Canonical / hreflang / robots / OG ------------------------------- */

export function checkAlternates(doc, { path, lang, siteUrl, expect = {} }, out) {
  const canonicals = [...doc.querySelectorAll('link[rel="canonical"]')].map((l) => l.getAttribute('href'));

  if (expect.noindex) {
    // noindex sahifalarda canonical bosh sahifaga qaraydi (duplikat bo'lmasligi uchun).
    if (canonicals.length > 1) out.errors.push(`${path}: ${canonicals.length} ta canonical`);
  } else {
    if (canonicals.length !== 1) out.errors.push(`${path}: canonical soni ${canonicals.length} (1 kerak)`);
    const expected = `${siteUrl}${path}`;
    if (canonicals[0] !== expected) out.errors.push(`${path}: canonical "${canonicals[0]}" != "${expected}"`);
  }

  const alts = [...doc.querySelectorAll('link[rel="alternate"]')]
    .map((l) => [l.getAttribute('hreflang'), l.getAttribute('href')])
    .filter(([h]) => h);

  // noindex sahifalar (compare/request) va 404 da hreflang bo'lmaydi:
  // ular qidiruv indeksiga kirmaydi, shuning uchun alternate signali keraksiz.
  if (expect.status === 404 || expect.noindex) return;

  const langs = Object.fromEntries(alts);
  for (const key of ['uz', 'ru', 'en', 'x-default']) {
    if (!langs[key]) out.errors.push(`${path}: hreflang "${key}" yo'q`);
  }
  if (langs['x-default'] && langs.uz && langs['x-default'] !== langs.uz) {
    out.errors.push(`${path}: x-default (${langs['x-default']}) uz (${langs.uz}) bilan bir xil emas`);
  }
  for (const [key, href] of alts) {
    if (!href || !href.startsWith('http')) {
      out.errors.push(`${path}: hreflang "${key}" mutlaq URL emas: ${href}`);
    }
  }
  // Sahifa tili o'z hreflang'iga mos kelishi kerak.
  if (lang && langs[lang] && !langs[lang].endsWith(path)) {
    out.errors.push(`${path}: ${lang} hreflang noto'g'ri manzil: ${langs[lang]}`);
  }
}

export function checkRobotsMeta(doc, { path, expect = {} }, out) {
  const robots = allMetaContent(doc, 'name', 'robots');
  const noindexed = robots.some((r) => /noindex/i.test(r));

  if (expect.noindex && !noindexed) out.errors.push(`${path}: noindex kutilgan, meta robots: ${robots.join(" | ") || "yo\u02BBq"}`);
  if (!expect.noindex && noindexed) out.errors.push(`${path}: indekslanadigan sahifada noindex bor`);
  if (robots.length > 2) out.warnings.push(`${path}: ${robots.length} ta meta robots (Next avtomatik noindex qo'shadi)`);
}

export function checkOpenGraph(doc, { path, lang, siteUrl, expect = {} }, out) {
  const ogTitle = metaContent(doc, 'property', 'og:title');
  const ogDescription = metaContent(doc, 'property', 'og:description');
  const ogUrl = metaContent(doc, 'property', 'og:url');
  const ogImage = metaContent(doc, 'property', 'og:image');
  const ogLocale = metaContent(doc, 'property', 'og:locale');
  const twitterCard = metaContent(doc, 'name', 'twitter:card');

  if (!expect.noindex) {
    if (!ogTitle) out.errors.push(`${path}: og:title yo'q`);
    if (!ogDescription) out.errors.push(`${path}: og:description yo'q`);
    if (ogUrl && ogUrl !== `${siteUrl}${path}`) out.errors.push(`${path}: og:url "${ogUrl}" != "${siteUrl}${path}"`);
    if (!ogImage) out.errors.push(`${path}: og:image yo'q`);
    const expectedLocale = lang === 'ru' ? 'ru_RU' : lang === 'en' ? 'en_US' : lang === 'uz' ? 'uz_UZ' : null;
    if (expectedLocale && ogLocale !== expectedLocale) {
      out.errors.push(`${path}: og:locale "${ogLocale}" != "${expectedLocale}"`);
    }
    if (ogImage && !ogImage.startsWith('http')) out.errors.push(`${path}: og:image mutlaq URL emas: ${ogImage}`);
  }
  if (!twitterCard) out.warnings.push(`${path}: twitter:card yo'q`);
}

/* --- 3. Tuzilma: h1, sarlavha ierarxiyasi, til, viewport ---------------- */

export function checkHeadings(doc, { path }, out) {
  const h1s = [...doc.querySelectorAll('h1')];
  if (h1s.length !== 1) out.errors.push(`${path}: h1 soni ${h1s.length} (1 kerak)`);
  if (h1s.length === 1 && !h1s[0].textContent.trim()) out.errors.push(`${path}: h1 matni bo'sh`);

  let previous = 0;
  for (const h of doc.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
    const level = Number(h.tagName.slice(1));
    if (previous && level - previous > 1) {
      out.warnings.push(`${path}: sarlavha darajasi sakraydi h${previous} -> h${level} ("${h.textContent.trim().slice(0, 40)}")`);
    }
    previous = level;
  }
}

export function checkDocumentShell(doc, { path, lang, expect = {} }, out) {
  const html = doc.documentElement;
  const htmlLang = html.getAttribute('lang');
  if (!htmlLang) out.errors.push(`${path}: <html lang> yo'q`);
  // Ma'lum cheklov: yagona root layout tufayli SSR'da doim `uz` chiqadi va
  // gidratatsiyadan keyin HtmlLangSync to'g'rilaydi (CLAUDE.md, Stage 5).
  else if (lang && htmlLang !== lang && !expect.allowLangMismatch) {
    out.warnings.push(`${path}: SSR <html lang="${htmlLang}"> (kutilgan ${lang}) — HtmlLangSync gidratatsiyadan keyin tuzatadi`);
  }

  const viewport = metaContent(doc, 'name', 'viewport');
  if (!viewport || !viewport.includes('width=device-width')) {
    out.errors.push(`${path}: meta viewport yo'q yoki noto'g'ri: ${viewport}`);
  }
  if (!doc.querySelector('meta[charset]')) out.errors.push(`${path}: charset meta yo'q`);
}

/* --- 4. Rasmlar va havolalar -------------------------------------------- */

export function checkImages(doc, { path, expect = {} }, out) {
  const images = [...doc.querySelectorAll('img')];
  if (!images.length && !expect.noImage) out.warnings.push(`${path}: sahifada bitta ham rasm yo'q`);

  images.forEach((img, index) => {
    const src = img.getAttribute('src') || '';
    const alt = img.getAttribute('alt');
    const label = `${path}: img[${index}] ${src.slice(0, 60)}`;

    if (alt === null) {
      out.errors.push(`${label} — alt atributi yo'q`);
    } else if (!alt.trim()) {
      // Bo'sh alt faqat rasm boshqa element bilan bir xil ma'noni takrorlasa
      // to'g'ri: aria-hidden havola, aria-label'li tugma yoki matnli havola ichida.
      const hidden = img.closest('[aria-hidden="true"]');
      const carrier = img.closest('a, button, figure, [aria-label]');
      const described = carrier && (carrier.getAttribute('aria-label') || carrier.textContent.trim().length > 0);
      if (hidden || described) {
        out.notes.push(`${label} — alt bo'sh (yashirin/labelled ota ichida, dekorativ)`);
      } else {
        out.warnings.push(`${label} — alt bo'sh, lekin ota elementda ham nom yo'q`);
      }
    }

    // Format: katalog va sayt rasmlari WebP/AVIF (HANDOFF 0).
    if (src && /\.(png|jpe?g|gif)$/i.test(src) && !src.startsWith('data:')) {
      out.warnings.push(`${label} — WebP emas`);
    }

    // CLS: o'lcham yoki Next `fill` (style) bo'lmasa layout siljiydi.
    const hasSize = (img.getAttribute('width') && img.getAttribute('height')) || img.getAttribute('style');
    if (!hasSize) out.warnings.push(`${label} — width/height yo'q (CLS xavfi)`);

    // Yuqoridagi birinchi rasm `priority` (lazy bo'lmasligi kerak).
    if (index === 0 && img.getAttribute('loading') === 'lazy') {
      out.warnings.push(`${label} — birinchi rasm lazy (LCP sekinlashadi)`);
    }
    if (index > 1 && img.getAttribute('loading') !== 'lazy' && !img.getAttribute('fetchpriority')) {
      out.notes.push(`${label} — loading="lazy" yo'q`);
    }
  });
}

export function checkLinks(doc, { path }, out) {
  const anchors = [...doc.querySelectorAll('a[href]')];
  if (!anchors.length) out.errors.push(`${path}: sahifada havola yo'q`);

  for (const a of anchors) {
    const href = a.getAttribute('href') || '';
    const label = `${path}: <a href="${href}">`;

    if (href === '#' || href === '') {
      out.errors.push(`${label} — manzilsiz havola`);
      continue;
    }

    if (href.startsWith('/')) {
      const isAsset = ASSET_PREFIXES.some((p) => href.startsWith(p));
      const hasLang = /^\/(uz|ru|en)(\/|$)/.test(href);
      if (!isAsset && !hasLang) out.errors.push(`${label} — til prefiksi yo'q`);
      for (const dead of DEAD_SEGMENTS) {
        if (href.includes(dead)) out.errors.push(`${label} — o'chirilgan marshrut`);
      }
    }

    if (a.getAttribute('target') === '_blank') {
      const rel = a.getAttribute('rel') || '';
      if (!rel.includes('noopener')) out.errors.push(`${label} — target="_blank" rel="noopener" siz`);
    }

    // Telefon/Telegram/WhatsApp havolalari — biznes qoidasi (format).
    if (href.startsWith('tel:') && !/^tel:\+\d{9,15}$/.test(href)) {
      out.errors.push(`${label} — tel: E.164 formatida emas`);
    }
  }
}

/* --- 5. Formalar (a11y + honeypot) -------------------------------------- */

export function checkForms(doc, { path }, out) {
  const fields = [...doc.querySelectorAll('input, select, textarea')];
  if (!fields.length) return;

  for (const field of fields) {
    const type = (field.getAttribute('type') || 'text').toLowerCase();
    if (type === 'hidden') continue;

    const id = field.getAttribute('id');
    const name = field.getAttribute('name') || type;
    const label = `${path}: <${field.tagName.toLowerCase()} name="${name}">`;
    const inHidden = field.closest('[aria-hidden="true"]');

    // Honeypot ataylab yashirin — ekran o'quvchi ko'rmasligi kerak.
    if (inHidden) {
      if (type !== 'text' && type !== 'checkbox') out.notes.push(`${label} — honeypot maydon tipi ${type}`);
      continue;
    }

    const hasAria = field.getAttribute('aria-label') || field.getAttribute('aria-labelledby');
    const hasLabel = id && doc.querySelector(`label[for="${id}"]`);
    const wrapped = field.closest('label');
    if (!hasAria && !hasLabel && !wrapped) out.errors.push(`${label} — nomlanmagan (label/aria-label yo'q)`);

    if (type === 'submit' || field.tagName === 'SELECT') continue;
    if (!field.getAttribute('autocomplete') && ['email', 'tel', 'name'].includes(type)) {
      out.warnings.push(`${label} — autocomplete yo'q`);
    }
  }

  // Forma server API'siga yuboriladi: boshqa manzil bo'lmasligi kerak.
  for (const form of doc.querySelectorAll('form')) {
    const action = form.getAttribute('action') || '';
    if (action && !action.startsWith('/') ) out.errors.push(`${path}: <form action="${action}"> — tashqi manzil`);
    if (action.startsWith('/api') && action !== '/api/leads') {
      out.errors.push(`${path}: forma mavjud bo'lmagan API'ga yuboriladi: ${action}`);
    }
  }
}

/* --- 6. JSON-LD ---------------------------------------------------------- */

export function parseJsonLd(doc) {
  const blocks = [];
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    const raw = script.textContent || '';
    try {
      blocks.push({ ok: true, data: JSON.parse(raw) });
    } catch (error) {
      blocks.push({ ok: false, error: error.message, raw: raw.slice(0, 160) });
    }
  }
  return blocks;
}

/** JSON-LD dagi barcha @type'larni (ichma-ich obyektlar ham) yig'adi. */
function collectTypes(node, acc = new Set()) {
  if (Array.isArray(node)) {
    for (const item of node) collectTypes(item, acc);
    return acc;
  }
  if (node && typeof node === 'object') {
    if (typeof node['@type'] === 'string') acc.add(node['@type']);
    if (Array.isArray(node['@type'])) for (const t of node['@type']) acc.add(t);
    for (const value of Object.values(node)) collectTypes(value, acc);
  }
  return acc;
}

export function checkJsonLd(doc, { path, lang, siteUrl, expect = {} }, out) {
  const blocks = parseJsonLd(doc);
  if (!blocks.length) {
    out.errors.push(`${path}: JSON-LD bloki yo'q`);
    return [];
  }

  const items = [];
  for (const block of blocks) {
    if (!block.ok) {
      out.errors.push(`${path}: JSON-LD parse qilinmadi (${block.error}): ${block.raw}`);
      continue;
    }
    const list = Array.isArray(block.data) ? block.data : [block.data];
    for (const data of list) {
      items.push(data);
      if (data['@context'] !== 'https://schema.org') {
        out.errors.push(`${path}: JSON-LD @context noto'g'ri: ${data['@context']}`);
      }
      if (!data['@type']) out.errors.push(`${path}: JSON-LD @type yo'q`);
    }
  }

  const types = collectTypes(items);
  for (const expected of expect.jsonLd || []) {
    if (!types.has(expected)) out.errors.push(`${path}: JSON-LD "${expected}" yo'q (bor: ${[...types].join(', ')})`);
  }

  for (const data of items) {
    const type = data['@type'];
    const serialized = JSON.stringify(data);

    // Eng muhim biznes qoidasi: narx hech qayerda bo'lmasligi kerak.
    if (/"price"\s*:|"priceSpecification"|"lowPrice"|"highPrice"/.test(serialized)) {
      out.errors.push(`${path}: ${type} JSON-LD da narx maydoni bor`);
    }

    if (type === 'Product') {
      if (!data.name) out.errors.push(`${path}: Product name yo'q`);
      if (!data.url || !data.url.startsWith(siteUrl)) out.errors.push(`${path}: Product url noto'g'ri: ${data.url}`);
      if (lang && data.url && !data.url.includes(`/${lang}/`)) {
        out.errors.push(`${path}: Product url til prefiksiga mos emas: ${data.url}`);
      }
      if (!data.offers) out.warnings.push(`${path}: Product offers yo'q`);
      if (data.image && !String(data.image).startsWith(siteUrl)) {
        out.errors.push(`${path}: Product image mutlaq URL emas`);
      }
    }

    if (type === 'BreadcrumbList') {
      const itemsList = data.itemListElement || [];
      if (itemsList.length < 2) out.warnings.push(`${path}: BreadcrumbList juda qisqa (${itemsList.length})`);
      itemsList.forEach((item, index) => {
        if (item.position !== index + 1) out.errors.push(`${path}: Breadcrumb position noto'g'ri (${item.position} != ${index + 1})`);
        if (!item.name) out.errors.push(`${path}: Breadcrumb name yo'q`);
        if (!item.item || !item.item.startsWith(siteUrl)) out.errors.push(`${path}: Breadcrumb item mutlaq URL emas: ${item.item}`);
      });
    }

    if (type === 'FAQPage') {
      const entities = data.mainEntity || [];
      if (!entities.length) out.errors.push(`${path}: FAQPage mainEntity bo'sh`);
      for (const entity of entities) {
        if (entity['@type'] !== 'Question') out.errors.push(`${path}: FAQPage elementi Question emas`);
        if (!entity.name) out.errors.push(`${path}: FAQ savol matni yo'q`);
        const answer = entity.acceptedAnswer;
        if (!answer || answer['@type'] !== 'Answer' || !answer.text) {
          out.errors.push(`${path}: FAQ javobi to'liq emas`);
        }
      }
    }

    if (type === 'LocalBusiness' || type === 'Organization') {
      if (!data.name) out.errors.push(`${path}: ${type} name yo'q`);
      if (!data.telephone || !/^\+\d{9,15}$/.test(data.telephone)) {
        out.errors.push(`${path}: ${type} telephone E.164 emas: ${data.telephone}`);
      }
      if (!data.address || data.address.addressCountry !== 'UZ') {
        out.errors.push(`${path}: ${type} address addressCountry UZ emas`);
      }
      if (!Array.isArray(data.sameAs) || data.sameAs.length < 2) {
        out.warnings.push(`${path}: ${type} sameAs kamida 2 ta ijtimoiy profil bo'lishi kerak`);
      }
    }

    if (type === 'WebSite') {
      const action = data.potentialAction;
      if (!action || action['@type'] !== 'SearchAction') out.errors.push(`${path}: WebSite SearchAction yo'q`);
      else if (!String(action.target && action.target.urlTemplate).includes('{search_term_string}')) {
        out.errors.push(`${path}: SearchAction urlTemplate noto'g'ri`);
      }
    }
  }

  return items;
}

/* --- 7. Kontent qoidalari (biznes) -------------------------------------- */

export function checkContent(doc, { path, lang, expect = {} }, out) {
  const body = text(doc);

  // "yaratish" taqiqi (faqat o'zbekcha matnlar uchun, lekin barcha sahifani tekshiramiz).
  if (/yarat/i.test(body)) out.errors.push(`${path}: "yarat" so'zi uchradi (taqiqlangan — "ishlab chiqarilgan")`);

  // Narx ko'rsatilmaydi: son + valyuta birikmasi bo'lmasligi kerak.
  const price = body.match(PRICE_RE);
  if (price) out.errors.push(`${path}: narx ko'rsatilgan: "${price[0].trim()}"`);

  // Tasdiqlangan raqamlar (bosh sahifa va ishlab chiqarish).
  if (path === `/${lang}` || path.endsWith('/production')) {
    for (const figure of ['20', '18 000', '740', '8']) {
      if (!body.includes(figure)) out.notes.push(`${path}: tasdiqlangan "${figure}" ko'rsatkichi matnda topilmadi`);
    }
  }

  // [...] placeholder'lari — biznes javobi kutilmoqda (hisobotga tushadi).
  const placeholders = [...new Set(body.match(PLACEHOLDER_RE) || [])].filter((p) => /[A-ZА-Я]{3}/.test(p));
  if (placeholders.length) out.notes.push(`${path}: ${placeholders.length} ta placeholder: ${placeholders.slice(0, 4).join(', ')}`);

  // uz sahifasida kirillcha matn qolmasligi kerak (ildiz 404 bundan mustasno).
  if (lang === 'uz' && !expect.allowCyrillic) {
    const cyrillic = body.match(CYRILLIC_WORD_RE) || [];
    if (cyrillic.length >= 3) {
      out.warnings.push(`${path}: uz sahifasida ${cyrillic.length} ta kirillcha so'z: ${cyrillic.slice(0, 5).join(', ')}`);
    }
  }

  // Bo'sh bo'lim (0 model): foydalanuvchi buni tushunishi kerak.
  if (expect.thin && !/topilmadi|yo'q|0/.test(body)) {
    out.warnings.push(`${path}: bo'sh bo'lim sahifasida tushuntirish matni ko'rinmadi`);
  }
}

/**
 * Barcha qoidalarni bir chaqiruvda ishlatadi.
 * @returns {{errors: string[], warnings: string[], notes: string[]}}
 */
export function auditDocument(options) {
  const out = report();
  const { doc } = options;

  checkDocumentShell(doc, options, out);
  checkTitleAndDescription(doc, options, out);
  checkAlternates(doc, options, out);
  checkRobotsMeta(doc, options, out);
  checkOpenGraph(doc, options, out);
  checkHeadings(doc, options, out);
  checkImages(doc, options, out);
  checkLinks(doc, options, out);
  checkForms(doc, options, out);
  checkJsonLd(doc, options, out);
  checkContent(doc, options, out);

  return out;
}
