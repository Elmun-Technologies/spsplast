import React from 'react';
import { getDictionary, Locale } from '@/lib/i18n';

export default function ReturnsPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-gray-300 text-sm leading-relaxed">
      <h1 className="text-3xl font-black text-white">{dict.footer.returns}</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">Qaytarish va Almashish Qoidalari</h2>
        <p>
          Xaridor zavod defekti yoki brak mahsulot aniqlanganda, 14 kun ichida mahsulotni almashtirish yoki pulni qaytarib olish huquqiga ega.
        </p>
        <p>
          Qaytariladigan mahsulot ishlatilmagan va tovar ko‘rinishini saqlab qolgan bo‘lishi lozim.
        </p>
      </section>
    </div>
  );
}
