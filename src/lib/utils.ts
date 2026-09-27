import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, locale: string = 'uz'): string {
  if (locale === 'ru') {
    return new Intl.NumberFormat('ru-RU').format(price) + ' сум';
  }
  return new Intl.NumberFormat('uz-UZ').format(price) + ' so‘m';
}

/**
 * Narxi katalogda ko'rsatilmagan pozitsiyalar (basePrice = 0) uchun "0 so'm"
 * emas, "Narx so'rash" ko'rsatiladi — savat va checkout satrlarida ham.
 */
export function formatPriceOrRequest(price: number, locale: string = 'uz'): string {
  if (!price || price <= 0) {
    return locale === 'ru' ? 'Цена по запросу' : 'Narx so‘rash';
  }
  return formatPrice(price, locale);
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('998')) {
    return `+998 (${cleaned.slice(3, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8, 10)}-${cleaned.slice(10, 12)}`;
  }
  return phone;
}
