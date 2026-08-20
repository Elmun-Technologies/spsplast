import uz from '@/dictionaries/uz.json';
import ru from '@/dictionaries/ru.json';

export type Locale = 'uz' | 'ru';

export const defaultLocale: Locale = 'uz';

const dictionaries = {
  uz,
  ru,
};

export function getDictionary(locale: Locale = defaultLocale) {
  return dictionaries[locale] || dictionaries.uz;
}

export function isValidLocale(lang: string): lang is Locale {
  return lang === 'uz' || lang === 'ru';
}
