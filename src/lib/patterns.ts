import type { CSSProperties } from 'react';

/**
 * Naqsh fonlari (2026-11-23): bosma katalogdagi qoliplarning chiziqli naqshlari (`public/images/site/patterns`,
 * har biri 0.2–12 KB WebP, 8 rangli lossless, shaffof fonda chiziq). CSS `.pat::before` uni **mask** sifatida past
 * shaffoflikda takrorlaydi (rang — `tone`; mask LCP nomzodi emas), matn o'qilishiga ta'sir qilmaydi, sahifa JS'iga hech narsa qo'shmaydi.
 *
 * Joylar: bosh sahifa (tanlov bloki — girih, raqamlar bandi — yulduz), katalog/bo'lim sarlavhasi (bo'limga xos),
 * footer CTA (yulduz). Yangi naqsh — avval `public/images/site/patterns/<nom>.webp` (alfa kanalli), keyin shu ro'yxatga.
 */
export const PATTERNS = ['girih', 'ornament', 'kirpich', 'charogon', 'aleya', 'dubay', 'spil', 'yulduz'] as const;
export type PatternName = (typeof PATTERNS)[number];

/** Bo'lim → naqsh (bo'limning o'z ko'rinishi): trotuar — ornament, fasad — g'isht, zabor — reykalar … */
const SECTION_PATTERN: Record<string, PatternName> = {
  trotuar: 'ornament',
  fasad: 'kirpich',
  termopanel: 'charogon',
  fasad_dekor: 'aleya',
  dekor: 'aleya',
  zabor: 'dubay',
  skameyka: 'spil',
};

/** Admin qo'shgan yangi bo'lim — umumiy SPS naqshi (girih). */
export function sectionPattern(section?: string | null): PatternName {
  return (section && SECTION_PATTERN[section]) || 'girih';
}

/** `.pat` elementiga beriladigan CSS o'zgaruvchisi. `tone`: och fonda `ink`, qorong'i fonda `light`. */
export function patternStyle(name: PatternName, tone: 'ink' | 'light' = 'ink'): CSSProperties {
  return {
    ['--pat' as string]: `url(/images/site/patterns/${name}.webp)`,
    ['--pat-c' as string]: tone === 'ink' ? '#15171a' : '#fff',
  } as CSSProperties;
}
