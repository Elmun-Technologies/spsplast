/**
 * Normalizes user input into standard Uzbekistan E.164 format (+998XXXXXXXXX)
 * Also gracefully handles international phone numbers.
 */
export function normalizePhone(input: string): string {
  if (!input) return '';

  // Strip all non-digit characters except leading plus
  let cleaned = input.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  // If number starts with 8 (local UZ dial format like 8901234567) or 998
  if (cleaned.startsWith('8') && cleaned.length === 10) {
    cleaned = '998' + cleaned.slice(1);
  } else if (!cleaned.startsWith('998') && cleaned.length === 9) {
    cleaned = '998' + cleaned;
  }

  return `+${cleaned}`;
}

export function isValidUzPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^\+998\d{9}$/.test(normalized);
}
