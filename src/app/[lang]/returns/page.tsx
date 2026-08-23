import React from 'react';
import { getDictionary, Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { RefreshCw, ShieldCheck, Clock } from 'lucide-react';

export default function ReturnsPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-gray-900 py-8">
      <Container>
        <Breadcrumbs lang={lang} items={[{ label: dict.footer.returns, active: true }]} className="mb-6" />
        <div className="max-w-3xl space-y-6">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{dict.footer.returns}</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-2 shadow-sm">
              <RefreshCw className="w-6 h-6 text-brand-red" />
              <h3 className="font-bold text-gray-900">14 kun</h3>
              <p className="text-sm text-gray-600">Nuqsonli mahsulotni almashtirish yoki qaytarish</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-2 shadow-sm">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <h3 className="font-bold text-gray-900">100% kafolat</h3>
              <p className="text-sm text-gray-600">Zavod braki bo‘lsa to‘liq qaytarish</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-2 shadow-sm">
              <Clock className="w-6 h-6 text-blue-600" />
              <h3 className="font-bold text-gray-900">Tezkor</h3>
              <p className="text-sm text-gray-600">1-2 kun ichida hal qilamiz</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Qaytarish va almashish qoidalari</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Xaridor zavod defekti yoki brak mahsulot aniqlanganda, 14 kun ichida mahsulotni almashtirish yoki pulni qaytarib olish huquqiga ega.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Qaytariladigan mahsulot ishlatilmagan va tovar ko‘rinishini saqlab qolgan bo‘lishi lozim. Ishlatilgan yoki shikastlangan mahsulotlar qaytarilmaydi.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
