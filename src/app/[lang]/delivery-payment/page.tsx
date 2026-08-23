import React from 'react';
import { getDictionary, Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Truck, CreditCard, Clock, ShieldCheck, MapPin, Phone } from 'lucide-react';
import { COMPANY_CONTACTS } from '@/lib/constants/contacts';

export default function DeliveryPaymentPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-gray-900 py-8">
      <Container>
        <Breadcrumbs lang={lang} items={[{ label: dict.footer.deliveryTerms, active: true }]} className="mb-6" />

        <div className="max-w-4xl space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">{dict.footer.deliveryTerms}</h1>
            <p className="text-sm text-gray-500 mt-2">SPS Plast — ishonchli yetkazib berish va qulay to'lov</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                <Truck className="w-6 h-6 text-brand-red" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Yetkazib berish shartlari</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Toshkent bo'ylab kuryer orqali 24 soat ichida. Viloyat va tumanlarga pochta hamda yuk mashinalari orqali 1-3 kun ichida yetkazib beriladi. 1,000,000 so'mdan yuqori buyurtmalar uchun bepul.
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5 pt-2">
                <li>Toshkent shahri — 1 kun, 50,000 so'mdan</li>
                <li>Viloyatlar — 1-3 kun, kelishilgan narx</li>
                <li>Ombordan olib ketish — bepul, 09:00-18:00</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">To'lov usullari</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Naqd, Click/Payme, Uzum va B2B uchun bank o'tkazmasi. Click/Payme linki operator tasdiqlagandan keyin SMS orqali yuboriladi.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-bold">CLICK</span>
                <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-bold">PAYME</span>
                <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-bold">UZUM</span>
                <span className="px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-bold">BANK</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Ish vaqti</h3>
              <p className="text-sm text-gray-600">Dushanba - Shanba: 09:00 - 18:00</p>
              <p className="text-sm text-gray-600">Yakshanba: dam olish</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Manzil va aloqa</h3>
              <p className="text-sm text-gray-600 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                {COMPANY_CONTACTS.addressUz}
              </p>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                {COMPANY_CONTACTS.phoneDisplay}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
