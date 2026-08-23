'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ImageOff, Sparkles } from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BeforeAfterSlider } from './BeforeAfterSlider';

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
  const [moldErr, setMoldErr] = useState(false);
  const [resultErr, setResultErr] = useState(false);
  const [mode, setMode] = useState<'split' | 'slider'>('slider');

  const hasBoth = moldImage && resultImage && !moldErr && !resultErr;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 text-gray-900 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="red" className="gap-1">
              <Sparkles className="w-3 h-3" />
              SPS Signature
            </Badge>
            <div className="flex items-center gap-1 p-1 rounded-full bg-gray-100 border border-gray-200">
              <button
                onClick={() => setMode('slider')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${mode === 'slider' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Slider
              </button>
              <button
                onClick={() => setMode('split')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${mode === 'split' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Split
              </button>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {lang === 'ru' ? 'Выберите форму — увидите результат' : 'Qolipni tanlang — natijasini ko‘ring'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {lang === 'ru' ? 'Сравните форму и готовое изделие — интерактивный слайдер' : 'Qolip va tayyor mahsulotni solishtiring — interaktiv slayder'}
          </p>
        </div>

        {productSlug && (
          <Link href={`/${lang}/product/${productSlug}`}>
            <Button variant="primary" size="md" className="gap-2 shrink-0 rounded-xl">
              <span>{lang === 'ru' ? 'Смотреть продукт' : 'Mahsulotni ko‘rish'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </div>

      {hasBoth && mode === 'slider' ? (
        <BeforeAfterSlider beforeImage={moldImage!} afterImage={resultImage!} beforeLabel="QOLIP" afterLabel="BETON NATIJA" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5 flex flex-col bg-[#F8F9FA] border border-gray-200 p-3 rounded-xl">
            <div className="relative aspect-[4/3] w-full bg-white rounded-xl border border-gray-200/80 overflow-hidden flex items-center justify-center p-3">
              <div className="absolute top-2.5 left-2.5 z-10">
                <Badge variant="dark" size="sm">QOLIP</Badge>
              </div>
              {moldImage && !moldErr ? (
                <Image src={moldImage} alt={moldTitle} fill sizes="40vw" onError={() => setMoldErr(true)} className="object-contain p-3" />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 p-4">
                  <ImageOff className="w-7 h-7 mb-1" />
                  <span className="text-xs font-bold uppercase">Qolip Media</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-xs font-medium text-gray-500 uppercase">SPS MATRITSA</span>
              <span className="font-semibold text-gray-900 truncate max-w-[180px]">{moldTitle}</span>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col items-center justify-center py-2">
            <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-sm">
              <ArrowRight className="w-5 h-5 rotate-90 md:rotate-0" />
            </div>
            <span className="text-xs font-bold tracking-wider text-gray-400 uppercase mt-2">NATIJA</span>
          </div>

          <div className="md:col-span-5 flex flex-col bg-[#F8F9FA] border border-gray-200 p-3 rounded-xl">
            <div className="relative aspect-[4/3] w-full bg-white rounded-xl border border-gray-200/80 overflow-hidden flex items-center justify-center p-3">
              <div className="absolute top-2.5 left-2.5 z-10">
                <Badge variant="red" size="sm">BETON NATIJA</Badge>
              </div>
              {resultImage && !resultErr ? (
                <Image src={resultImage} alt={resultTitle} fill sizes="40vw" onError={() => setResultErr(true)} className="object-contain p-3" />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 p-4">
                  <ImageOff className="w-7 h-7 mb-1" />
                  <span className="text-xs font-bold uppercase">Beton Natija</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-xs font-bold text-brand-red uppercase">BETON MAHSULOT</span>
              <span className="font-semibold text-gray-900 truncate max-w-[180px]">{resultTitle}</span>
            </div>
          </div>
        </div>
      )}

      {productPrice && (
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">{moldTitle}</span>
          <span className="text-lg font-bold text-gray-900">{formatPrice(productPrice, lang)}</span>
        </div>
      )}
    </div>
  );
};
