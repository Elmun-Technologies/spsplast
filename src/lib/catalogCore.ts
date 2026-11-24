import { siteSnapshot } from '../data/site.generated.ts';
import type { Locale } from '@/lib/i18n';

/**
 * Katalog 2027 — MA'LUMOTSIZ qism (turlar, bo'limlar, nom/hisob yordamchilari). Mijoz komponentlari
 * shu fayldan import qiladi: `catalog2027.ts` modellar ro'yxatini (~15 KB gzip) ham olib keladi, u esa
 * faqat server/yoki kerak bo'lganda kechiktirib (`useModelLookup`) yuklanadi. 2026-11-23.
 *
 * Katalog 2027. Manba — `src/data/models2027.ts`:
 *  1) admin panel (baza) bilan build — scripts/export-snapshot.mjs nashrdagi mahsulotlarni
 *     shu faylga yozadi ("Nashr qilish"); bo'limlar `src/data/site.generated.ts` da;
 *  2) bazasiz — git'dagi statik nusxa (`data/models-2027.json`, scripts/extract/build_models_2027.py).
 * API sinxron qoladi — sahifalar statik prerender bo'ladi.
 * Sxema: docs/design-handoff/HANDOFF.md 5-bo'lim.
 */
/** Bo'lim kaliti: trotuar, fasad, zabor, dekor, skameyka (+ admin qo'shgan, masalan termopanel). */
export type Section = string;

export type Localized = { uz: string | null; ru: string | null; en: string | null };

export type Mold = { l: string; size: string | null; depth: string | null; g: number | null };
export type Tile = { l: string; size: string | null; per: string | null };

export type Model = {
  key: string;
  code: string | null;
  slug: string;
  section: Section;
  name: Localized;
  subtitle: Localized;
  note?: Localized | null;
  kg: string | null;
  molds: Mold[];
  tiles: Tile[];
  specs: { k: Localized; v: Localized }[];
  sizeEstimated: boolean;
  images: {
    scene: string | null;
    sceneSm: string | null;
    molds: Record<string, string>;
    tiles: Record<string, string>;
  };
};

/**
 * 3D render (tirik surat emas): generator render fayllarini `-3d.webp` bilan nomlaydi
 * (scripts/extract/build_models_2027.py `attach_renders`). Sayt ularni "3D vizualizatsiya" deb
 * belgilaydi; tirik surat yoki admin'dan yuklangan rasm bu nomda bo'lmaydi — belgi o'zi yo'qoladi.
 */
export function isRenderImage(src: string | null | undefined): boolean {
  return !!src && /-3d\.webp(?:\?|$)/.test(src);
}

/**
 * Tayyor mahsulotning asosiy rasmi fonli haqiqiy surat (`…-foto.webp` / `-foto-sm.webp`, masalan skameykalar) —
 * kartochka va galereyada to'liq (cover) ko'rsatiladi; qolganlari fonsiz kesma (studiya fonida, contain).
 */
export function isPhotoImage(src: string | null | undefined): boolean {
  return !!src && /-foto(?:-sm)?(?:-3d)?\.webp(?:\?|$)/.test(src);
}

export type SectionKind = 'molds' | 'ready';
type SectionMeta = { key: Section; slug: string; name: Localized; kind: SectionKind };

/** Standart bo'limlar (admin snapshot bo'lmaganda). Nomlar — HANDOFF atamalari. */
const DEFAULT_SECTIONS: SectionMeta[] = [
  // Admin bazasidagi DEFAULT_SECTIONS (src/server/catalog.ts) bilan bir xil kalit/slug/tartib.
  { key: 'trotuar', slug: 'paving', kind: 'molds', name: { uz: 'Trotuar plitkasi', ru: 'Тротуарная плитка', en: 'Paving tiles' } },
  { key: 'fasad', slug: 'facade', kind: 'molds', name: { uz: 'Fasad plitkasi', ru: 'Фасадная плитка', en: 'Facade tiles' } },
  { key: 'termopanel', slug: 'thermal-panels', kind: 'molds', name: { uz: 'Fasad termopanellari', ru: 'Фасадные термопанели', en: 'Facade thermal panels' } },
  { key: 'fasad_dekor', slug: 'facade-decor', kind: 'molds', name: { uz: 'Fasad dekor elementlari', ru: 'Фасадный декор', en: 'Facade decor elements' } },
  { key: 'zabor', slug: 'fence', kind: 'molds', name: { uz: 'Zabor panellari', ru: 'Заборные панели', en: 'Fence panels' } },
  { key: 'dekor', slug: 'decor', kind: 'molds', name: { uz: 'Dekor panellar', ru: 'Декор-панели', en: 'Decor panels' } },
  { key: 'skameyka', slug: 'bench', kind: 'molds', name: { uz: 'Skameyka oyoqlari', ru: 'Ножки скамеек', en: 'Bench legs' } },
  // Tayyor mahsulotlar (/ready, migratsiya 0004). Mahsulotsiz bo'lim saytda ko'rinmaydi.
  { key: 'tayyor_termopanel', slug: 'thermal-panels', kind: 'ready', name: { uz: 'Termopanellar', ru: 'Термопанели', en: 'Thermal panels' } },
  { key: 'tayyor_bilayn', slug: 'beeline-panels', kind: 'ready', name: { uz: 'Bilayn panellari', ru: 'Панели «Билайн»', en: 'Beeline panels' } },
  { key: 'tayyor_dekor', slug: 'decor-panels', kind: 'ready', name: { uz: 'Dekorativ panellar', ru: 'Декоративные панели', en: 'Decorative panels' } },
  { key: 'tayyor_karniz', slug: 'cornices', kind: 'ready', name: { uz: 'Karnizlar', ru: 'Карнизы', en: 'Cornices' } },
  { key: 'tayyor_tyaga', slug: 'mouldings', kind: 'ready', name: { uz: 'Tyagalar', ru: 'Тяги', en: 'Mouldings' } },
  { key: 'tayyor_pilyastra', slug: 'pilasters', kind: 'ready', name: { uz: 'Pilyastra va nalichniklar', ru: 'Пилястры и наличники', en: 'Pilasters and window trims' } },
  { key: 'tayyor_kapitel', slug: 'capitals', kind: 'ready', name: { uz: 'Kapitel va bazalar', ru: 'Капители и базы', en: 'Capitals and bases' } },
  { key: 'tayyor_tsokol', slug: 'plinth', kind: 'ready', name: { uz: 'Sokol elementlari', ru: 'Цоколь', en: 'Plinth elements' } },
  { key: 'tayyor_tosh', slug: 'facade-stone', kind: 'ready', name: { uz: 'Fasad toshi', ru: 'Фасадный камень', en: 'Facade stone' } },
  { key: 'tayyor_skameyka', slug: 'benches', kind: 'ready', name: { uz: 'Beton skameykalar', ru: 'Бетонные скамейки', en: 'Concrete benches' } },
  { key: 'tayyor_zabor', slug: 'euro-fence', kind: 'ready', name: { uz: 'Yevrozaborlar', ru: 'Еврозаборы', en: 'Euro fences' } },
];

const SECTION_META: SectionMeta[] = siteSnapshot?.sections?.length
  ? siteSnapshot.sections.map((x) => ({ key: x.key, slug: x.slug, name: x.name, kind: x.kind === 'ready' ? 'ready' : 'molds' }))
  : DEFAULT_SECTIONS;

/**
 * Qolip bo'limlari (`/catalog`) — marshrutlar shular uchun yaratiladi, 0 modelli ham. Tayyor mahsulot bo'limlari
 * bu ro'yxatga KIRMAYDI (`READY_SECTIONS`): qolip katalogi, header tablari, filtrlar, sitemap'dagi /catalog
 * yo'llari faqat qoliplar bilan ishlaydi.
 */
export const SECTIONS: Section[] = SECTION_META.filter((x) => x.kind === 'molds').map((x) => x.key);

/** Tayyor mahsulot bo'limlari (`/ready/{slug}`). */
export const READY_SECTIONS: Section[] = SECTION_META.filter((x) => x.kind === 'ready').map((x) => x.key);

/**
 * Bo'lim kaliti → URL slug'i (ikkala yo'nalish; kalitlar unikal, slug faqat yo'nalish ichida unikal).
 * Qoliplar: /{lang}/catalog/{slug}; tayyor: /{lang}/ready/{slug} — URL'ni `sectionPath`/`modelPath` bilan yasang.
 */
export const SECTION_SLUGS: Record<Section, string> = Object.fromEntries(SECTION_META.map((x) => [x.key, x.slug]));

export function isReadySection(section: Section): boolean {
  return READY_SECTIONS.includes(section);
}

/** Bo'lim sahifasi yo'li, til prefiksisiz: `/catalog/paving` yoki `/ready/benches`. */
export function sectionPath(section: Section): string {
  return `/${isReadySection(section) ? 'ready' : 'catalog'}/${SECTION_SLUGS[section]}`;
}

/** Mahsulot sahifasi yo'li, til prefiksisiz. Qolip va tayyor mahsulotni ajratadi — havolalar shu orqali yasalsin. */
export function modelPath(m: Pick<Model, 'section' | 'slug'>): string {
  return `${sectionPath(m.section)}/${m.slug}`;
}

/** Bo'lim nomi: admin'dagi nom → uz → kalit. */
export function sectionLabel(section: Section, lang: Locale): string {
  const meta = SECTION_META.find((x) => x.key === section) ?? DEFAULT_SECTIONS.find((x) => x.key === section);
  return meta?.name[lang] || meta?.name.uz || section;
}

/**
 * Header tablari uchun qisqa nom (7 bo'lim bir qatorga sig'ishi uchun). Admin'dagi bo'limda
 * qisqa nom yo'q, shuning uchun noma'lum kalitda to'liq nom (`sectionLabel`) qaytadi.
 */
const SECTION_SHORT: Record<string, Record<Locale, string>> = {
  trotuar: { uz: 'Trotuar', ru: 'Тротуар', en: 'Paving' },
  fasad: { uz: 'Fasad', ru: 'Фасад', en: 'Facade' },
  termopanel: { uz: 'Termopanel', ru: 'Термопанели', en: 'Thermal panels' },
  fasad_dekor: { uz: 'Fasad dekor', ru: 'Фасадный декор', en: 'Facade decor' },
  zabor: { uz: 'Zabor', ru: 'Заборы', en: 'Fences' },
  dekor: { uz: 'Dekor', ru: 'Декор', en: 'Decor' },
  skameyka: { uz: 'Skameyka', ru: 'Скамейки', en: 'Benches' },
  // Tayyor mahsulotlar (header tablari /ready da)
  tayyor_termopanel: { uz: 'Termopanel', ru: 'Термопанели', en: 'Thermal panels' },
  tayyor_bilayn: { uz: 'Bilayn', ru: 'Билайн', en: 'Beeline' },
  tayyor_dekor: { uz: 'Dekor', ru: 'Декор', en: 'Decor' },
  tayyor_karniz: { uz: 'Karniz', ru: 'Карнизы', en: 'Cornices' },
  tayyor_tyaga: { uz: 'Tyaga', ru: 'Тяги', en: 'Mouldings' },
  tayyor_pilyastra: { uz: 'Pilyastra', ru: 'Пилястры', en: 'Pilasters' },
  tayyor_kapitel: { uz: 'Kapitel', ru: 'Капители', en: 'Capitals' },
  tayyor_tsokol: { uz: 'Sokol', ru: 'Цоколь', en: 'Plinth' },
  tayyor_tosh: { uz: 'Tosh', ru: 'Камень', en: 'Stone' },
  tayyor_skameyka: { uz: 'Skameyka', ru: 'Скамейки', en: 'Benches' },
  tayyor_zabor: { uz: 'Yevrozabor', ru: 'Еврозаборы', en: 'Euro fences' },
};

export function sectionShortLabel(section: Section, lang: Locale): string {
  return SECTION_SHORT[section]?.[lang] || sectionLabel(section, lang);
}

export function sectionFromSlug(slug: string): Section | undefined {
  return SECTIONS.find((s) => SECTION_SLUGS[s] === slug);
}

export function readySectionFromSlug(slug: string): Section | undefined {
  return READY_SECTIONS.find((s) => SECTION_SLUGS[s] === slug);
}

/** Modelda kamida bitta rasm (sahna, qolip yoki plitka) bormi. */
export function hasAnyImage(m: Model): boolean {
  return !!(m.images.scene || m.images.sceneSm || Object.keys(m.images.molds).length || Object.keys(m.images.tiles).length);
}

/**
 * Nom: so'ralgan til; bo'lmasa uz nomidan avtomatik — RU kirill harflarida
 * (CLAUDE.md qoida 5), EN da tavsif so'zlari tarjima qilinadi. Admin'da kiritilgan
 * haqiqiy tarjima har doim ustun.
 */
export function modelName(m: Model, lang: Locale): string {
  const own = m.name[lang];
  if (own) return own;
  // Tipografik apostrof (o‘, g‘, ’) — lug'at va transliteratsiya ASCII `'` bilan ishlaydi.
  const uz = (m.name.uz || m.slug).replace(/[‘’ʻʼ`]/g, "'");
  if (lang === 'ru') return uzToCyrillic(translateWords(uz, UZ_RU_WORDS));
  if (lang === 'en') return uzToEnglishName(uz);
  return uz;
}

const UZ_EN_WORDS: Record<string, string> = {
  naqshli: 'patterned', gladkiy: 'smooth', gladkoe: 'smooth', shershaviy: 'textured', shershavoe: 'textured',
  "to'plam": 'set', "toʻplam": 'set', bilan: 'with', kubik: 'cube', aylana: 'circle', okrujnost: 'circle',
  "yog'och": 'wood', "yogʻoch": 'wood', yaltiroq: 'glossy', toshli: 'stone', "sakkiz": 'eight', qirra: 'edge',
  forma: 'forms', uzor: 'pattern', gul: 'flower', "g'isht": 'brick', "gʻisht": 'brick', kirpich: 'brick',
};

const UZ_RU_WORDS: Record<string, string> = {
  naqshli: 'узорчатый', gladkiy: 'гладкий', gladkoe: 'гладкое', shershaviy: 'шершавый', shershavoe: 'шершавое',
  "to'plam": 'набор', "toʻplam": 'набор', bilan: 'с', aylana: 'круг', "yog'och": 'дерево', "yogʻoch": 'дерево',
  yaltiroq: 'глянцевый', toshli: 'каменный', sakkiz: 'восемь', qirra: 'граней', uzor: 'узор', gul: 'цветок',
  "g'isht": 'кирпич', "gʻisht": 'кирпич', kubik: 'кубик', forma: 'формы',
};

function translateWords(text: string, dict: Record<string, string>): string {
  return text
    .split(/(\s+|[(),])/)
    .map((w) => dict[w.toLowerCase()] ?? w)
    .join('');
}

function uzToEnglishName(uz: string): string {
  return translateWords(uz, UZ_EN_WORDS);
}

/** O'zbek lotin → rus kirill (nomlar uchun yetarli soddalashtirilgan qoidalar). */
export function uzToCyrillic(text: string): string {
  const pairs: [RegExp, string][] = [
    [/sh/gi, 'ш'], [/ch/gi, 'ч'], [/ya/gi, 'я'], [/yu/gi, 'ю'], [/yo/gi, 'ё'], [/ts/gi, 'ц'],
    [/o['ʻ‘’]/gi, 'у'], [/g['ʻ‘’]/gi, 'г'], [/ye/gi, 'е'],
  ];
  const single: Record<string, string> = {
    a: 'а', b: 'б', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'и', j: 'ж', k: 'к', l: 'л', m: 'м', n: 'н',
    o: 'о', p: 'п', q: 'к', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', x: 'х', y: 'й', z: 'з', c: 'к', w: 'в',
  };
  let out = text;
  for (const [re, rep] of pairs) {
    out = out.replace(re, (mt) => (mt[0] === mt[0].toUpperCase() && mt[0] !== mt[0].toLowerCase() ? rep.toUpperCase() : rep));
  }
  out = out.replace(/[a-z]/gi, (ch) => {
    const r = single[ch.toLowerCase()];
    if (!r) return ch;
    return ch === ch.toUpperCase() ? r.toUpperCase() : r;
  });
  // Rus imlosi: so'z oxiridagi "-ий" qattiq undoshdan keyin "-ый"; apostroflar olib tashlanadi.
  return out.replace(/([бвдзлмнпрстф])ий\b/giu, '$1ый').replace(/['ʻ‘’]/g, '');
}

export function localizedText(value: Localized | null | undefined, lang: Locale): string | null {
  if (!value) return null;
  return value[lang] || value.uz;
}

/* --- Filtr uchun hosila maydonlar (HANDOFF 5) ------------------------------- */

export type UseGroup = 'walk' | 'yard' | 'car';

export function modelThickness(m: Model): number | null {
  const depth = m.molds[0]?.depth;
  if (!depth) return null;
  const v = Number(depth);
  return Number.isFinite(v) ? v : null;
}

export function modelUse(m: Model): UseGroup | null {
  if (m.section !== 'trotuar') return null;
  const t = modelThickness(m);
  if (t === null) return null;
  if (t <= 30) return 'walk';
  if (t <= 40) return 'yard';
  return 'car';
}

export type SizeGroup = '300' | '400' | '200' | 'other';

export function modelSizeGroup(m: Model): SizeGroup {
  const size = m.tiles[0]?.size || m.molds[0]?.size || '';
  if (size.startsWith('300×300')) return '300';
  if (size.startsWith('400×400')) return '400';
  if (size.startsWith('200×200')) return '200';
  return 'other';
}

export function modelSetSize(m: Model): 1 | 2 | 3 {
  const n = m.molds.length;
  return n >= 3 ? 3 : n === 2 ? 2 : 1;
}

/** Kalkulyator: qolip soni = ceil(m² × dona_1m²); vazn = m² × kg. */
export function calcMolds(m: Model, m2: number): number | null {
  const per = Number(String(m.tiles[0]?.per ?? '').replace(',', '.'));
  if (!Number.isFinite(per) || per <= 0) return null;
  return Math.ceil(m2 * per);
}

export function calcWeight(m: Model, m2: number): number | null {
  const kg = Number(String(m.kg ?? '').replace(',', '.'));
  if (!Number.isFinite(kg) || kg <= 0) return null;
  return Math.round(m2 * kg * 100) / 100;
}

/** Kartochka/galereya uchun birinchi mavjud rasm. */
export function modelImage(m: Model): string | null {
  return (
    m.images.scene ||
    m.images.sceneSm ||
    m.images.tiles.A ||
    Object.values(m.images.molds)[0] ||
    Object.values(m.images.tiles)[0] ||
    null
  );
}

export function modelTileSize(m: Model): string | null {
  return m.tiles[0]?.size || null;
}

export function modelMoldSize(m: Model): string | null {
  return m.molds[0]?.size || null;
}

export function modelPerM2(m: Model): string | null {
  return m.tiles[0]?.per || null;
}

/** Qolip harfi (A/B/C) — to'plam izohida: "2 (A + B)". */
export function moldLetters(m: Model): string {
  return m.molds.map((x) => x.l).filter(Boolean).join(' + ');
}
