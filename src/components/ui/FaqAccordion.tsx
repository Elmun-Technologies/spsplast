import { ChevronDown } from 'lucide-react';
import type { FaqEntry } from '@/lib/faq';

/**
 * FAQ akkordeoni — JS talab qilmaydigan `<details>` asosida.
 *
 * Nima uchun `<details>`: sahifa statik generatsiya qilinadi va JS yuklanmagunicha
 * ham savol-javoblar ochilishi kerak (ham foydalanuvchi, ham qidiruv roboti
 * uchun). Alohida holat boshqaruvi yo'q — matn serverda tayyor HTML bo'lib
 * keladi.
 */
export const FaqAccordion: React.FC<{ items: FaqEntry[]; className?: string }> = ({
  items,
  className = '',
}) => (
  <div className={`space-y-3 ${className}`}>
    {items.map((item) => (
      <details
        key={item.q}
        className="group bg-surface-soft rounded-[16px] p-4 cursor-pointer open:bg-surface open:shadow-card transition-all"
      >
        <summary className="flex items-center justify-between gap-3 font-semibold text-sm text-ink list-none">
          <span>{item.q}</span>
          <ChevronDown className="w-4 h-4 shrink-0 text-ink-sub group-open:rotate-180 transition-transform" />
        </summary>
        <p className="text-sm text-ink-soft mt-3 pt-3 border-t border-line leading-relaxed">{item.a}</p>
      </details>
    ))}
  </div>
);
