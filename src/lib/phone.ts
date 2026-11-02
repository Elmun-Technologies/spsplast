/**
 * Telefon raqamini E.164 ko'rinishiga keltirish (`+<davlat kodi><raqam>`).
 *
 * Mijozlar raqamni har xil yozadi: `90 123 45 67` (O'zbekiston), `8 701 123 45 67`
 * (Qozog'iston/Rossiya, mahalliy "8"), `0555 123 456` (Qirg'iziston, mahalliy "0").
 * Davlat kodisiz yozilgan raqam qaysi davlatniki ekanini faqat forma bilsa bo'ladi —
 * shuning uchun `dial` (tanlangan davlat kodi, masalan `+996`) ixtiyoriy uzatiladi.
 *
 * Qoidalar (audit 2026-11-02, mijoz yo'li):
 * - `+` yoki `00` bilan boshlansa — xalqaro, o'zgarmaydi;
 * - 11 raqam `8…` (ikkinchisi 0 emas) yoki `7…` — Rossiya/Qozog'iston: `+7` + 10 raqam;
 * - 11 raqam `80…` — Belarus (`8 0xx`): `+375`;
 * - 9 raqam — `dial` bo'yicha, `dial` bo'lmasa O'zbekiston (`+998`);
 * - 10 raqam `8…` — eski O'zbekiston formati (`8 90 …`): `+998`;
 * - mahalliy `0…` — faqat `dial` bilan (aks holda noaniq, validatsiyadan o'tmaydi).
 */

/** Ma'lum davlat kodlari va `+` dan keyingi raqamlar soni (kod bilan birga). */
const LENGTHS: Record<string, number> = {
  '998': 12, // O'zbekiston
  '7': 11, // Rossiya, Qozog'iston
  '375': 12, // Belarus
  '996': 12, // Qirg'iziston
  '992': 12, // Tojikiston
  '994': 12, // Ozarbayjon
  '374': 11, // Armaniston
  '995': 12, // Gruziya
  '993': 11, // Turkmaniston
};

function dialDigits(dial?: string): string {
  const d = (dial || '').replace(/\D/g, '');
  return d.length >= 1 && d.length <= 4 ? d : '';
}

export function normalizePhone(input: string, dial?: string): string {
  if (!input) return '';
  const raw = input.trim();
  let digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  // Xalqaro yozuv: "+..." yoki "00..."
  if (raw.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;

  const code = dialDigits(dial);

  // Davlat kodi bilan, lekin "+" siz yozilgan: 998901234567, 79161234567, 996555123456 …
  if (code && code !== '7' && digits.startsWith(code) && LENGTHS[code] === digits.length) return `+${digits}`;
  if (digits.startsWith('998') && digits.length === 12) return `+${digits}`;

  // Rossiya / Qozog'iston: 8 xxx xxx xx xx yoki 7 xxx xxx xx xx (11 raqam)
  if (digits.length === 11 && digits.startsWith('8') && digits[1] !== '0') return `+7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith('7')) return `+${digits}`;
  // Belarus: 8 0xx xxx xx xx
  if (digits.length === 11 && digits.startsWith('80')) return `+375${digits.slice(2)}`;

  // Mahalliy "0" prefiksi (Qirg'iziston, Ozarbayjon, Gruziya, Armaniston, Belarus …)
  if (digits.startsWith('0')) {
    if (!code || code === '998') return `+${digits}`; // noaniq — validatsiya rad etadi
    digits = digits.replace(/^0+/, '');
    return `+${code}${digits}`;
  }

  // Eski O'zbekiston formati: 8 90 123 45 67 (10 raqam)
  if (digits.length === 10 && digits.startsWith('8') && (!code || code === '998')) return `+998${digits.slice(1)}`;

  // Davlat kodisiz milliy raqam
  if (code && code !== '998') {
    const want = LENGTHS[code];
    if (!want || code.length + digits.length === want) return `+${code}${digits}`;
  }
  if (digits.length === 9) return `+998${digits}`;

  return `+${digits}`;
}

export function isValidUzPhone(phone: string): boolean {
  return /^\+998\d{9}$/.test(normalizePhone(phone));
}

/**
 * Xalqaro telefon validatsiyasi (HANDOFF 5: +998, +7, +992 ...).
 * E.164: `+`, birinchi raqam 0 emas, jami 9..15 raqam; ma'lum davlat kodlarida uzunlik aniq tekshiriladi.
 */
export function isValidIntlPhone(input: string, dial?: string): boolean {
  if (!input || input.trim().length < 7 || input.trim().length > 32) return false;
  const n = normalizePhone(input, dial);
  if (!/^\+[1-9]\d{8,14}$/.test(n)) return false;
  const digits = n.slice(1);
  for (const len of [3, 1]) {
    const want = LENGTHS[digits.slice(0, len)];
    if (want) return digits.length === want;
  }
  return true;
}
