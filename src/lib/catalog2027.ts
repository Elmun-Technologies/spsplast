import { models2027 } from '../data/models2027.ts';
import {
  SECTIONS,
  hasAnyImage,
  modelImage,
  modelSizeGroup,
  type Model,
  type Section,
} from './catalogCore.ts';

/**
 * Katalog 2027 — modellar ro'yxati bilan ishlaydigan qism. Ma'lumotsiz yordamchilar `catalogCore.ts` da
 * (shu yerdan ham qayta eksport qilinadi). Mijoz komponentida faqat yordamchi kerak bo'lsa —
 * `@/lib/catalogCore` dan import qiling, aks holda butun katalog brauzer bundle'iga tushadi.
 */
export * from './catalogCore.ts';

/**
 * Tartib: "ko'p so'raladigan" (manba tartibi), lekin rasmli modellar oldinda —
 * katalog va bosh sahifa rasmsiz kartochka bilan boshlanmasin (UI audit P0-1/P0-2).
 */
const models = (models2027 as unknown as Model[])
  .map((m, i) => ({ m, i, img: hasAnyImage(m) ? 0 : 1 }))
  .sort((a, b) => a.img - b.img || a.i - b.i)
  .map((x) => x.m);

export function getModels(): Model[] {
  return models;
}

export function getTotalCount(): number {
  return models.length;
}

export function getSectionCounts(): Record<Section, number> {
  const counts: Record<Section, number> = Object.fromEntries(SECTIONS.map((x) => [x, 0]));
  for (const m of models) counts[m.section] = (counts[m.section] ?? 0) + 1;
  return counts;
}

/**
 * Navigatsiyada ko'rinadigan bo'limlar: faqat modeli borlari ("0 model" bo'limi
 * foydalanuvchiga ko'rsatilmaydi — sahifasi esa ishlaydi, ma'lumot kelsa o'zi qo'shiladi).
 */
export function getActiveSections(): Section[] {
  // Kamida bitta rasmli modeli bor bo'lim: 1 ta rasmsiz model bilan bo'lim "soxta" ko'rinadi.
  return SECTIONS.filter((x) => models.some((m) => m.section === x && hasAnyImage(m)));
}

export function getModelsBySection(section: Section): Model[] {
  return models.filter((m) => m.section === section);
}

export function getModelBySlug(slug: string): Model | undefined {
  return models.find((m) => m.slug === slug);
}

/* --- Sahifalar uchun yordamchilar (bosqich 3) -------------------------------- */

/** Bosh sahifa bloki: JSON tartibi = "ko'p so'raladigan" (POPULARITY). */
export function getPopular(limit = 12): Model[] {
  return models.slice(0, limit);
}

/**
 * Bo'lim muqovasi: shu bo'limdagi model sahnasi; bo'lmasa fonsiz qolip surati
 * (`contain` bilan ko'rsatiladi). Port/zavod kabi mahsulotga aloqasiz rasm
 * ishlatilmaydi (UI audit P0-4).
 */
export function sectionCoverImage(section: Section): { src: string; fit: 'cover' | 'contain' } {
  const inSection = models.filter((m) => m.section === section);
  const scene = inSection.find((m) => m.images.scene || m.images.sceneSm);
  if (scene) return { src: (scene.images.scene || scene.images.sceneSm) as string, fit: 'cover' };
  const cut = inSection.find((m) => m.images.molds.A || m.images.tiles.A);
  if (cut) return { src: (cut.images.molds.A || cut.images.tiles.A) as string, fit: 'contain' };
  return { src: '/images/site/factory.webp', fit: 'cover' };
}

/** @deprecated `sectionCoverImage` — faqat src kerak bo'lgan joylar uchun. */
export function sectionCover(section: Section): string {
  return sectionCoverImage(section).src;
}

/** "300 × 300 mm — boshqa modellar": avval o'lcham+bo'lim, keyin bo'lim. */
export function relatedModels(m: Model, limit = 4): Model[] {
  const same = models.filter((x) => x.slug !== m.slug && x.section === m.section);
  const bySize = same.filter((x) => modelSizeGroup(x) === modelSizeGroup(m) && modelImage(x));
  const rest = same.filter((x) => !bySize.includes(x) && modelImage(x));
  const out = [...bySize, ...rest];
  if (out.length >= limit) return out.slice(0, limit);
  return [...out, ...same.filter((x) => !out.includes(x))].slice(0, limit);
}
