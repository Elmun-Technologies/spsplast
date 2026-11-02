import type { Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import { Icon } from './icons';

/**
 * Telefonda suzuvchi WhatsApp tugmasi (audit 2026-11-02, mijoz yo'li: menyu ochilmaguncha
 * sahifalarda birorta ham wa.me havolasi yo'q edi). JS'siz server komponent; tayyor matn bilan.
 * Model sahifasida yashiriladi (pastki `.mbar` panelida o'zining WhatsApp tugmasi bor),
 * solishtirish paneli ochiq bo'lsa uning ustiga ko'tariladi — CSS `:has()` bilan.
 */
export function MessengerFab({ lang }: { lang: Locale }) {
  const t = getUi(lang).menu;
  return (
    <a
      className="wa-fab"
      href={`${CONTACTS_2027.whatsappUrl}?text=${encodeURIComponent(t.waText)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.waWrite}
    >
      <Icon.whatsapp width={26} height={26} strokeWidth={1.75} aria-hidden="true" />
    </a>
  );
}
