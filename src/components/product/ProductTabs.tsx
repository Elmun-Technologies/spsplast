'use client';

import React, { useState } from 'react';
import { Locale } from '@/lib/i18n';
import { COMPANY_CONTACTS } from '@/lib/constants/contacts';
import { Truck, ShieldCheck, RefreshCw, FileText } from 'lucide-react';

interface ProductTabsProps {
  lang: Locale;
  description: string;
  specs: {
    dimensions?: string | null;
    material?: string | null;
    weight?: string | null;
    yieldPerCast?: number | null;
    durabilityCasts?: number | null;
    sku: string;
  };
}

const tabs = [
  { id: 'desc', labelUz: 'Tavsif', labelRu: 'Описание' },
  { id: 'specs', labelUz: 'Xususiyatlar', labelRu: 'Характеристики' },
  { id: 'delivery', labelUz: 'Yetkazib berish', labelRu: 'Доставка' },
  { id: 'reviews', labelUz: 'Sharhlar', labelRu: 'Отзывы' },
];

export const ProductTabs: React.FC<ProductTabsProps> = ({ lang, description, specs }) => {
  const [active, setActive] = useState('desc');

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-1 p-1.5 bg-[#F8F9FA] border-b border-gray-200 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all min-h-[40px] ${
              active === tab.id ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-white'
            }`}
          >
            {lang === 'ru' ? tab.labelRu : tab.labelUz}
          </button>
        ))}
      </div>

      <div className="p-6 sm:p-7">
        {active === 'desc' && (
          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
            {description ? (
              <p className="text-sm sm:text-base leading-relaxed">{description}</p>
            ) : (
              <p className="text-sm text-gray-500">
                {lang === 'ru'
                  ? 'Высококачественная пластиковая форма для производства брусчатки и бетонных изделий. Европейское сырье, гарантия 300+ заливок.'
                  : 'Bruschatka va beton mahsulotlari uchun yuqori sifatli plastik qolip. Yevropa xomashyosi, 300+ quyish kafolati.'}
              </p>
            )}
            <div className="mt-6 p-4 rounded-xl bg-[#F8F9FA] border border-gray-200">
              <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-red" />
                {lang === 'ru' ? 'Преимущества' : 'Afzalliklari'}
              </h4>
              <ul className="text-sm text-gray-600 space-y-1.5 list-disc pl-5">
                <li>{lang === 'ru' ? 'Точная геометрия и гладкая поверхность' : 'Aniq geometriya va silliq sirt'}</li>
                <li>{lang === 'ru' ? 'Устойчивость к щелочам и вибрации' : 'Ishqor va vibratsiyaga chidamli'}</li>
                <li>{lang === 'ru' ? 'Легкое извлечение готового изделия' : 'Tayyor mahsulotni oson ajratish'}</li>
                <li>{lang === 'ru' ? 'Работает с любым бетоном' : 'Har qanday beton bilan ishlaydi'}</li>
              </ul>
            </div>
          </div>
        )}

        {active === 'specs' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between p-3 rounded-xl bg-[#F8F9FA] border border-gray-200">
                <span className="text-gray-500">SKU / Artikul</span>
                <span className="font-mono font-bold text-gray-900">{specs.sku}</span>
              </div>
              {specs.dimensions && (
                <div className="flex justify-between p-3 rounded-xl bg-[#F8F9FA] border border-gray-200">
                  <span className="text-gray-500">{lang === 'ru' ? 'Размер' : 'O‘lcham'}</span>
                  <span className="font-bold text-gray-900">{specs.dimensions}</span>
                </div>
              )}
              {specs.material && (
                <div className="flex justify-between p-3 rounded-xl bg-[#F8F9FA] border border-gray-200">
                  <span className="text-gray-500">{lang === 'ru' ? 'Материал' : 'Material'}</span>
                  <span className="font-bold text-gray-900">{specs.material}</span>
                </div>
              )}
              {specs.weight && (
                <div className="flex justify-between p-3 rounded-xl bg-[#F8F9FA] border border-gray-200">
                  <span className="text-gray-500">{lang === 'ru' ? 'Вес' : 'Og‘irlik'}</span>
                  <span className="font-bold text-gray-900">{specs.weight}</span>
                </div>
              )}
              {specs.yieldPerCast && (
                <div className="flex justify-between p-3 rounded-xl bg-white border-2 border-brand-red/20">
                  <span className="text-gray-600">{lang === 'ru' ? 'За 1 заливку' : '1 quyishda'}</span>
                  <span className="font-bold text-brand-red">{specs.yieldPerCast} dona</span>
                </div>
              )}
              {specs.durabilityCasts && (
                <div className="flex justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-emerald-700">{lang === 'ru' ? 'Ресурс' : 'Resurs'}</span>
                  <span className="font-bold text-emerald-700">{specs.durabilityCasts}+ marta</span>
                </div>
              )}
            </div>
          </div>
        )}

        {active === 'delivery' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#F8F9FA] border border-gray-200 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-brand-red" />
                </div>
                <h4 className="font-bold text-sm text-gray-900">{lang === 'ru' ? 'Доставка' : 'Yetkazib berish'}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {lang === 'ru' ? 'По Узбекистану 1-3 дня, почта и курьер. Точная стоимость уточняется оператором.' : 'O‘zbekiston bo‘ylab 1-3 kun, pochta va kuryer. Narx operator tomonidan aniqlanadi.'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#F8F9FA] border border-gray-200 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <h4 className="font-bold text-sm text-gray-900">{lang === 'ru' ? 'Гарантия' : 'Kafolat'}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {lang === 'ru' ? 'Гарантия 300+ заливок, возврат в течение 14 дней если брак.' : '300+ quyish kafolati, 14 kun ichida nuqson bo‘lsa qaytarish.'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#F8F9FA] border border-gray-200 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-bold text-sm text-gray-900">{lang === 'ru' ? 'Самовывоз' : 'Olib ketish'}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {COMPANY_CONTACTS.addressUz} — {lang === 'ru' ? 'бесплатно' : 'bepul'} 09:00-18:00
                </p>
              </div>
            </div>
          </div>
        )}

        {active === 'reviews' && (
          <div className="text-center py-10 space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto text-gray-400">
              ★
            </div>
            <h4 className="font-bold text-gray-900">{lang === 'ru' ? 'Пока нет отзывов' : 'Hozircha sharhlar yo‘q'}</h4>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              {lang === 'ru' ? 'Будьте первым, кто оставит отзыв о товаре.' : 'Birinchi bo‘lib sharh qoldiring.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
