'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ImageOff } from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { formatPrice } from '@/lib/utils';

interface MoldResultShowcaseProps {
  moldImage?: string;
  resultImage?: string;
  moldTitle?: string;
  resultTitle?: string;
  productSlug?: string;
  productPrice?: number;
  lang: Locale;
}

export const MoldResultShowcase: React.FC<MoldResultShowcaseProps> = ({
  moldImage,
  resultImage,
  moldTitle = 'Bruschatka Plastik Qolipi',
  resultTitle = 'Tayyor Beton Bruschatka',
  productSlug,
  productPrice,
  lang,
}) => {
  const [moldErr, setMoldErr] = React.useState(false);
  const [resultErr, setResultErr] = React.useState(false);

  return (
    <section className="my-12 py-10 px-6 sm:px-8 bg-[#F6F7F8] border border-neutral-200 rounded-xs text-[#111111]">
      {/* Section Header */}
      <div className="max-w-3xl mb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-brand-red/10 border border-brand-red/20 text-brand-red text-[11px] font-mono font-bold uppercase tracking-wider mb-2 rounded-xs">
          <span className="w-1.5 h-1.5 bg-brand-red rounded-full"></span>
          SPS Signature
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#111111] tracking-tight font-sans">
          {lang === 'ru' ? 'Выберите форму — увидите результат' : 'Qolipni tanlang — natijasini ko‘ring'}
        </h2>
        <p className="text-sm text-[#667085] mt-2 font-sans">
          {lang === 'ru'
            ? 'Сравните форму и готовое брусчатое изделие перед покупкой.'
            : 'Qolip va undan tayyorlangan bruschatkani xarid qilishdan oldin solishtiring.'}
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: QOLIP */}
        <div className="md:col-span-5 flex flex-col group bg-white border border-neutral-200 p-4 rounded-xs">
          <div className="relative aspect-[4/3] w-full bg-[#F6F7F8] rounded-xs overflow-hidden p-4 flex items-center justify-center border border-neutral-100">
            <div className="absolute top-3 left-3 z-10 bg-[#111111] text-white px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xs">
              QOLIP
            </div>
            {moldImage && !moldErr ? (
              <Image
                src={moldImage}
                alt={moldTitle}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                onError={() => setMoldErr(true)}
                className="object-contain p-4 group-hover:scale-104 transition-transform duration-300"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-neutral-400 p-4 select-none">
                <ImageOff className="w-8 h-8 mb-1" />
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-500">Qolip Media</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs font-mono text-[#667085] uppercase">SPS MATRITSA</span>
            <span className="text-sm font-bold text-[#111111] truncate">{moldTitle}</span>
          </div>
        </div>

        {/* Center: Arrow Indicator */}
        <div className="md:col-span-2 flex flex-col items-center justify-center py-2">
          <div className="w-10 h-10 rounded-full bg-white border border-neutral-300 text-brand-red flex items-center justify-center shadow-xs">
            <ArrowRight className="w-5 h-5 rotate-90 md:rotate-0" />
          </div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#667085] uppercase mt-2">
            NATIJA
          </span>
        </div>

        {/* Right: TAYYOR NATIJA */}
        <div className="md:col-span-5 flex flex-col group bg-white border border-neutral-200 p-4 rounded-xs">
          <div className="relative aspect-[4/3] w-full bg-[#F6F7F8] rounded-xs overflow-hidden p-4 flex items-center justify-center border border-neutral-100">
            <div className="absolute top-3 left-3 z-10 bg-brand-red text-white px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xs">
              TAYYOR NATIJA
            </div>
            {resultImage && !resultErr ? (
              <Image
                src={resultImage}
                alt={resultTitle}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                onError={() => setResultErr(true)}
                className="object-contain p-4 group-hover:scale-104 transition-transform duration-300"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-neutral-400 p-4 select-none">
                <ImageOff className="w-8 h-8 mb-1" />
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-500">Beton Natija</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs font-mono text-brand-red uppercase">BETON MAHSULOT</span>
            <span className="text-sm font-bold text-[#111111] truncate">{resultTitle}</span>
          </div>
        </div>
      </div>

      {/* Footer Info & CTA */}
      <div className="mt-6 pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-[#111111]">{moldTitle}</h4>
          {productPrice && (
            <p className="text-base font-extrabold text-[#111111] mt-0.5">
              {formatPrice(productPrice, lang)}
            </p>
          )}
        </div>
        {productSlug && (
          <Link
            href={`/${lang}/product/${productSlug}`}
            className="inline-flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xs transition-colors shadow-xs"
          >
            <span>{lang === 'ru' ? 'Смотреть продукт' : 'Mahsulotni ko‘rish'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </section>
  );
};
