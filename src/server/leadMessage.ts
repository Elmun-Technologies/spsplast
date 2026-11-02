import { escapeTelegramHtml } from '../lib/telegram.ts';
import { getModelBySlug, modelName, modelSetSize } from '../lib/catalog2027.ts';

/**
 * Zayafkaning Telegram xabari (parse_mode HTML). Bitta joyda: `/api/leads` yangi zayafkani
 * shu bilan yuboradi, admin esa Telegram'ga yetmagan zayafkani shu bilan qayta yuboradi
 * (audit 2026-11-02, texnik: yetmagan zayafka faqat dashboard raqamida qolib ketardi).
 * Foydalanuvchi kiritgan har bir qiymat `escapeTelegramHtml` dan o'tadi.
 */
export type LeadMessageItem = { slug: string; code?: string | null; name?: string | null; m2?: number | null; molds?: number | null };

export type LeadMessageInput = {
  number: string;
  id?: number | null;
  type: string;
  clientType?: string | null;
  name: string;
  /** Normallashtirilgan (E.164) raqam. */
  phone: string;
  /** Mijoz formaga yozgan ko'rinish (normallashtirilgandan farq qilsa ko'rsatiladi). */
  phoneTyped?: string | null;
  city?: string | null;
  country?: string | null;
  volumeM2?: number | null;
  company?: string | null;
  material?: string | null;
  message?: string | null;
  lang: string;
  pageUrl?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  items: LeadMessageItem[];
  createdAt: Date;
  siteUrl: string;
  /** Admin'dan qayta yuborilgan xabar sarlavhasida belgi. */
  resent?: boolean;
};

const CLIENT_LABELS: Record<string, string> = {
  workshop: 'Sex',
  dealer: 'Diler',
  builder: 'Quruvchi',
  private: 'Xususiy',
};

export function tashkentTime(now: Date): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Asia/Tashkent',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(now);
  } catch {
    return now.toISOString();
  }
}

export function formatLeadMessage(i: LeadMessageInput): string {
  const typeLabel =
    i.type === 'list' ? `Zayafka ro'yxati (${i.items.length} model)` : i.type === 'partners' ? 'Ulgurji forma' : 'Tez zayafka';

  const lines: string[] = [
    `${i.resent ? '🔁 Qayta yuborildi · ' : '🟥 Yangi zayafka · '}${i.number}`,
    `Turi: ${escapeTelegramHtml(typeLabel)}`,
  ];

  const client = i.clientType ? CLIENT_LABELS[i.clientType] : null;
  lines.push(`Mijoz: ${escapeTelegramHtml([client, i.name].filter(Boolean).join(' · '))}`);

  const digits = i.phone.replace(/\D/g, '');
  lines.push(`Telefon: <a href="tel:+${digits}">${escapeTelegramHtml(i.phone)}</a>  (WhatsApp: wa.me/${digits})`);
  // Raqam davlat kodi bo'yicha to'ldirilgan bo'lsa — menejer mijoz nima yozganini ham ko'rsin.
  if (i.phoneTyped && i.phoneTyped.replace(/\D/g, '') !== digits) lines.push(`Mijoz yozgani: ${escapeTelegramHtml(i.phoneTyped)}`);

  const place = [i.city, i.country].filter(Boolean).join(', ');
  if (place) lines.push(`Shahar: ${escapeTelegramHtml(place)}`);
  if (i.volumeM2) lines.push(`Kunlik hajm: ${i.volumeM2} m²`);
  if (i.company) lines.push(`Kompaniya: ${escapeTelegramHtml(i.company)}`);
  if (i.material) lines.push(`Material: ${escapeTelegramHtml(i.material.toUpperCase())}`);

  if (i.items.length) {
    lines.push('', 'Modellar:');
    for (const item of i.items) {
      const model = getModelBySlug(item.slug);
      const label = model
        ? `№ ${model.code || '—'} ${modelName(model, 'uz')}`
        : [item.code ? `№ ${item.code}` : null, item.name || item.slug].filter(Boolean).join(' ');
      const setNote = model && modelSetSize(model) > 1 ? " (to'plam A+B)" : '';
      if (item.m2) {
        lines.push(
          item.molds
            ? `• ${escapeTelegramHtml(label)}${setNote} — ${item.m2} m²/kun ≈ ${item.molds.toLocaleString('ru-RU')} qolip`
            : `• ${escapeTelegramHtml(label)}${setNote} — ${item.m2} m²/kun, soni menejer hisoblaydi`,
        );
      } else {
        lines.push(`• ${escapeTelegramHtml(label)}${setNote}`);
      }
    }
  }

  if (i.message) lines.push('', `Izoh: ${escapeTelegramHtml(i.message)}`);
  lines.push(`Til: ${i.lang} · Sahifa: ${escapeTelegramHtml(i.pageUrl || '—')}`);
  if (i.utmSource || i.utmMedium || i.utmCampaign || i.gclid || i.fbclid) {
    lines.push(
      `Manba: ${escapeTelegramHtml([i.utmSource, i.utmMedium, i.utmCampaign].filter(Boolean).join(' / ') || 'to‘g‘ridan-to‘g‘ri')}`,
    );
  }
  lines.push(`Vaqt: ${tashkentTime(i.createdAt)} (Toshkent)`);
  if (i.id) lines.push(`<a href="${i.siteUrl}/admin/leads/${i.id}">Admin'da ochish →</a>`);
  return lines.join('\n');
}
