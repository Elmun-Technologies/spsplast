import uz from '@/dictionaries/uz.json';
import ru from '@/dictionaries/ru.json';

export type Locale = 'uz' | 'ru' | 'en';

export const locales: Locale[] = ['uz', 'ru', 'en'];

export const defaultLocale: Locale = 'uz';

const dictionaries = {
  uz,
  ru,
  // EN uchun eski (2026) lug'at hali yo'q: eski sahifalar uz ga qaytadi.
  // Yangi sayt qatlami src/dictionaries/ui/* dan foydalanadi.
} as Record<string, typeof uz>;

export function getDictionary(locale: Locale = defaultLocale) {
  return dictionaries[locale] || dictionaries.uz;
}

export function isValidLocale(lang: string): lang is Locale {
  return (locales as string[]).includes(lang);
}
