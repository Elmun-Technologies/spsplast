import React from 'react';
import { getDictionary, Locale } from '@/lib/i18n';
import { Truck, CreditCard, Clock, ShieldAlert } from 'lucide-react';

export default function DeliveryPaymentPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <h1 className="text-3xl font-black text-white">{dict.footer.deliveryTerms}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-3">
          <Truck className="w-8 h-8 text-brand-red" />
          <h3 className="text-lg font-bold text-white">Yetkazib Berish Shartlari</h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            Toshkent bo‘ylab kuryer orqali 24 soat ichida. Viloyat va tumanlarga pochta hamda yuk mashinalari orqali 1-3 kun ichida yetkazib beriladi.
          </p>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-3">
          <CreditCard className="w-8 h-8 text-brand-red" />
          <h3 className="text-lg font-bold text-white">To‘lov Usullari</h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            Mahsulotni qabul qilib olganda naqd pulda, Click/Payme linki orqali onlayn, va B2B buyurtmalar uchun bank o‘tkazmasi orqali.
          </p>
        </div>
      </div>
    </div>
  );
}
