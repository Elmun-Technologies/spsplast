'use client';

import { useEffect } from 'react';
import { Locale } from '@/lib/i18n';

/**
 * `<html lang>` ni faol tilga moslashtiradi.
 *
 * Nega kerak: butun ilova uchun yagona `<html>` elementi `app/layout.tsx` da
 * turadi (admin sahifalari ham undan foydalanadi), shuning uchun u faqat
 * standart qiymatni bera oladi — `lang="uz"`. Rus tilidagi sahifada bu ekran
 * o'quvchi uchun noto'g'ri talaffuz va qidiruv tizimi uchun noto'g'ri til
 * signali bo'lardi.
 *
 * Nega inline script emas, `useEffect`: HTML parse paytida atributni
 * o'zgartirsak, React hydration o'sha atributni server qiymatiga ("uz") qayta
 * yozishi yoki hydration xatosi haqida ogohlantirishi mumkin. `useEffect`
 * hydration tugagach ishlaydi va React keyingi renderlarda bu atributga
 * tegmaydi (props o'zgarmaydi).
 *
 * Uzoq muddatli yechim — har bir til uchun alohida root layout (route groups
 * bilan `[lang]/layout.tsx` ichida `<html lang={lang}>`), bu esa butun
 * marshrut daraxtini qayta tashkil qilishni talab qiladi.
 */
export function HtmlLangSync({ lang }: { lang: Locale }) {
  useEffect(() => {
    if (document.documentElement.lang !== lang) {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  return null;
}
