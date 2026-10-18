import type { LeadStatus } from '@/server/db/schema';

/** Admin panel matnlari (menejerlar uchun o'zbekcha). */
export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Yangi',
  contacted: "Bog'lanildi",
  quoted: 'Taklif yuborildi',
  won: 'Kelishildi',
  lost: 'Rad etildi',
};

export const TYPE_LABEL: Record<string, string> = {
  quick: 'Tez zayafka',
  list: "Zayafka ro'yxati",
  partners: 'Ulgurji forma',
};

export const CLIENT_LABEL: Record<string, string> = {
  workshop: 'Sex',
  dealer: 'Diler',
  builder: 'Quruvchi',
  private: 'Xususiy',
};

export const ROLE_LABEL: Record<string, string> = { admin: 'Administrator', manager: 'Menejer' };

const dt = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Asia/Tashkent',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return dt.format(new Date(d));
}

let regions: Intl.DisplayNames | null = null;
/** ISO-2 → "Qozog'iston" (ICU'da uz bo'lmasa ru). Kod bo'lmasa matn o'zi. */
export function countryName(value: string | null | undefined): string {
  if (!value) return '—';
  if (!/^[A-Z]{2}$/.test(value)) return value;
  try {
    regions ??= new Intl.DisplayNames(['uz', 'ru'], { type: 'region' });
    return regions.of(value) || value;
  } catch {
    return value;
  }
}

export function waLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}`;
}

export function telLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
