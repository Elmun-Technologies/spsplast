'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ImageOff } from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

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
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 text-gray-900 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="red">SPS Signature</Badge>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
            {lang === 'ru' ? 'Выберите форму — увидите результат' : 'Qolipni tanlang — natijasini ko‘ring'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {lang === 'ru'
              ? 'Сравните форму и готовое изделие перед покупкой'
              : 'Qolip va undan tayyorlangan mahsulotni xarid qilishdan oldin solishtiring'}
          </p>
        </div>

        {productSlug && (
          <Link href={`/${lang}/product/${productSlug}`}>
            <Button variant="primary" size="sm" className="gap-1.5 shrink-0">
              <span>{lang === 'ru' ? 'Смотреть продукт' : 'Mahsulotni ko‘rish'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        )}
      </div>

      {/* Grid Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Left: Mold */}
        <div className="md:col-span-5 flex flex-col bg-[#F8F9FA] border border-gray-200 p-3 rounded-lg">
          <div className="relative aspect-[4/3] w-full bg-white rounded border border-gray-200/80 overflow-hidden flex items-center justify-center p-3">
            <div className="absolute top-2 left-2 z-10">
              <Badge variant="dark" size="sm">QOLIP</Badge>
            </div>
            {moldImage && !moldErr ? (
              <Image
                src={moldImage}
                alt={moldTitle}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                onError={() => setMoldErr(true)}
                className="object-contain p-2"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 p-4 select-none">
                <ImageOff className="w-7 h-7 mb-1" />
                <span className="text-[10px] font-mono font-bold uppercase text-gray-400">Qolip Media</span>
              </div>
            )}
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-500 uppercase">SPS MATRITSA</span>
            <span className="text-xs font-semibold text-gray-900 truncate max-w-[200px]">{moldTitle}</span>
          </div>
        </div>

        {/* Center: Indicator Arrow */}
        <div className="md:col-span-2 flex flex-col items-center justify-center py-1">
          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 text-brand-red flex items-center justify-center">
            <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
          </div>
          <span className="text-[10px] font-mono font-bold tracking-wider text-gray-400 uppercase mt-1">
            NATIJA
          </span>
        </div>

        {/* Right: Finished Product */}
        <div className="md:col-span-5 flex flex-col bg-[#F8F9FA] border border-gray-200 p-3 rounded-lg">
          <div className="relative aspect-[4/3] w-full bg-white rounded border border-gray-200/80 overflow-hidden flex items-center justify-center p-3">
            <div className="absolute top-2 left-2 z-10">
              <Badge variant="red" size="sm">BETON NATIJA</Badge>
            </div>
            {resultImage && !resultErr ? (
              <Image
                src={resultImage}
                alt={resultTitle}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                onError={() => setResultErr(true)}
                className="object-contain p-2"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 p-4 select-none">
                <ImageOff className="w-7 h-7 mb-1" />
                <span className="text-[10px] font-mono font-bold uppercase text-gray-400">Beton Natija</span>
              </div>
            )}
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-brand-red uppercase">BETON MAHSULOT</span>
            <span className="text-xs font-semibold text-gray-900 truncate max-w-[200px]">{resultTitle}</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      {productPrice && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">{moldTitle}</span>
          <span className="text-base font-bold text-gray-900">{formatPrice(productPrice, lang)}</span>
        </div>
      )}
    </div>
  );
};
