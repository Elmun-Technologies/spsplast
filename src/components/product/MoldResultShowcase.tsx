import React from 'react';
import Image from 'next/image';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { getDictionary, Locale } from '@/lib/i18n';

interface MoldResultShowcaseProps {
  moldImage: string;
  resultImage: string;
  moldTitle?: string;
  resultTitle?: string;
  lang: Locale;
}

export const MoldResultShowcase: React.FC<MoldResultShowcaseProps> = ({
  moldImage,
  resultImage,
  moldTitle = 'Plastik Qolip',
  resultTitle = 'Tayyor Beton / Bruschatka Mahsuloti',
  lang,
}) => {
  const dict = getDictionary(lang);

  return (
    <div className="bg-gradient-to-r from-brand-card via-brand-card/90 to-brand-card border border-brand-border rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden my-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/5 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red text-xs font-extrabold uppercase tracking-wider mb-3">
          <CheckCircle2 className="w-4 h-4" />
          SPS PLAST Exclusive USP
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-white">
          {dict.product.resultHeader}
        </h3>
        <p className="text-sm text-gray-400 mt-2">{dict.product.resultDesc}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-11 gap-6 items-center">
        {/* Left: Plastic Mold */}
        <div className="md:col-span-5 flex flex-col items-center group">
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-brand-border group-hover:border-brand-red transition-all shadow-xl bg-black/50">
            <Image
              src={moldImage}
              alt="Plastik Qolip"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-3 left-3 bg-brand-dark/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-brand-border text-xs font-bold text-white">
              1. Qolip (Mold)
            </div>
          </div>
          <p className="text-xs text-gray-300 font-semibold mt-3">{moldTitle}</p>
        </div>

        {/* Middle: Arrow indicator */}
        <div className="md:col-span-1 flex items-center justify-center my-2 md:my-0">
          <div className="w-12 h-12 rounded-full bg-brand-red text-white flex items-center justify-center shadow-red animate-pulse">
            <ArrowRight className="w-6 h-6 rotate-90 md:rotate-0" />
          </div>
        </div>

        {/* Right: Finished Product */}
        <div className="md:col-span-5 flex flex-col items-center group">
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-emerald-500/40 group-hover:border-emerald-400 transition-all shadow-xl bg-black/50">
            <Image
              src={resultImage}
              alt="Tayyor Mahsulot"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-3 left-3 bg-emerald-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/30 text-xs font-bold text-emerald-300">
              2. Tayyor Natija (Result)
            </div>
          </div>
          <p className="text-xs text-emerald-400 font-semibold mt-3">{resultTitle}</p>
        </div>
      </div>
    </div>
  );
};
