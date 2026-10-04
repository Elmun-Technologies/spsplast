import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { buttonStyles } from '@/components/ui/Button';
import { COMPANY_CONTACTS } from '@/lib/constants/contacts';

/**
 * 404 sahifasi (butun sayt uchun).
 *
 * Ilgari Next.js ning standart "This page could not be found" sahifasi
 * ko'rinardi — foydalanuvchi uchun yo'l yo'q (header, katalog havolasi yoki
 * aloqa ma'lumoti yo'q edi), qidiruv tizimi uchun esa brend sahifasi emas.
 *
 * Bu sahifa `[lang]` segmentidan tashqarida turadi (noma'lum til prefiksi ham
 * shu yerga tushadi), shuning uchun matn ikki tilda — o'zbekcha asosiy,
 * ruscha izoh — va har ikkala til katalogiga havola beriladi.
 */
export const metadata = {
  title: 'Sahifa topilmadi | Страница не найдена | SPS',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-page text-ink font-sans">
      <Container className="flex-1 flex items-center justify-center py-16">
        <div className="max-w-xl w-full text-center">
          <Link href="/uz" className="inline-flex items-center gap-2.5 mb-8">
            <span className="text-2xl font-bold tracking-[-0.03em] text-ink">
              SPS<span className="text-brand-red">.</span>
            </span>
          </Link>

          <p className="text-[13px] font-bold text-brand-red tracking-[0.18em] uppercase mb-3">
            404
          </p>
          <h1 className="text-[26px] sm:text-[32px] font-bold tracking-[-0.025em] leading-tight">
            Bunday sahifa yo‘q
          </h1>
          <p className="mt-3 text-sm text-ink-soft leading-relaxed">
            Havola eskirgan bo‘lishi mumkin. Katalogdan qolipni toping yoki
            qo‘ng‘iroq qiling — kerakli modelni birga tanlaymiz.
          </p>
          <p className="mt-2 text-sm text-ink-sub leading-relaxed">
            Такой страницы нет — возможно, ссылка устарела. Посмотрите каталог
            или позвоните нам.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/uz/catalog" className={buttonStyles({ size: 'lg', className: 'w-full sm:w-auto' })}>
              Katalog (uz)
            </Link>
            <Link
              href="/ru/catalog"
              className={buttonStyles({ variant: 'secondary', size: 'lg', className: 'w-full sm:w-auto' })}
            >
              Каталог (ru)
            </Link>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-2 text-sm">
            <a
              href={`tel:${COMPANY_CONTACTS.phoneRaw}`}
              className="font-semibold text-ink-soft hover:text-brand-red transition-colors"
            >
              {COMPANY_CONTACTS.phoneDisplay}
            </a>
            <Link href="/uz/contact" className="text-ink-sub hover:text-brand-red transition-colors">
              Aloqa sahifasi / Контакты
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
