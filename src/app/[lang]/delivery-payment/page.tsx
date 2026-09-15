import React from 'react';
import { getDictionary, Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Truck, CreditCard, Clock, ShieldCheck, MapPin, Phone } from 'lucide-react';
import { COMPANY_CONTACTS } from '@/lib/constants/contacts';

export default function DeliveryPaymentPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);

  return (
    <div className="bg-surface-page min-h-screen text-ink py-8">
      <Container>
        <Breadcrumbs lang={lang} items={[{ label: dict.footer.deliveryTerms, active: true }]} className="mb-6" />

        <div className="max-w-4xl space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-ink tracking-tight">{dict.footer.deliveryTerms}</h1>
            <p className="text-sm text-ink-sub mt-2">SPS — ishonchli yetkazib berish va qulay to'lov</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-surface border border-line rounded-[20px] p-6 space-y-3 shadow-sm">
              <div className="w-11 h-11 rounded-[16px] bg-red-50 border border-red-100 flex items-center justify-center">
                <Truck className="w-6 h-6 text-brand-red" />
              </div>
              <h3 className="text-lg font-bold text-ink">Yetkazib berish shartlari</h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Toshkent bo'ylab kuryer orqali 24 soat ichida. Viloyat va tumanlarga pochta hamda yuk mashinalari orqali 1-3 kun ichida yetkazib beriladi. 1,000,000 so'mdan yuqori buyurtmalar uchun bepul.
              </p>
              <ul className="text-sm text-ink-soft space-y-1 list-disc pl-5 pt-2">
                <li>Toshkent shahri — 1 kun, 50,000 so'mdan</li>
                <li>Viloyatlar — 1-3 kun, kelishilgan narx</li>
                <li>Ombordan olib ketish — bepul, 09:00-18:00</li>
              </ul>
            </div>

            <div className="bg-surface border border-line rounded-[20px] p-6 space-y-3 shadow-sm">
              <div className="w-11 h-11 rounded-[16px] bg-blue-50 border border-blue-100 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-ink">To'lov usullari</h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Naqd, Click/Payme, Uzum va B2B uchun bank o'tkazmasi. Click/Payme linki operator tasdiqlagandan keyin SMS orqali yuboriladi.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-3 py-1 rounded-full bg-surface-soft border border-line text-xs font-bold">CLICK</span>
                <span className="px-3 py-1 rounded-full bg-surface-soft border border-line text-xs font-bold">PAYME</span>
                <span className="px-3 py-1 rounded-full bg-surface-soft border border-line text-xs font-bold">UZUM</span>
                <span className="px-3 py-1 rounded-full bg-ink text-white text-xs font-bold">BANK</span>
              </div>
            </div>

            <div className="bg-surface border border-line rounded-[20px] p-6 space-y-3 shadow-sm">
              <div className="w-11 h-11 rounded-[16px] bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-ink">Ish vaqti</h3>
              <p className="text-sm text-ink-soft">Dushanba - Shanba: 09:00 - 18:00</p>
              <p className="text-sm text-ink-soft">Yakshanba: dam olish</p>
            </div>

            <div className="bg-surface border border-line rounded-[20px] p-6 space-y-3 shadow-sm">
              <div className="w-11 h-11 rounded-[16px] bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-ink">Manzil va aloqa</h3>
              <p className="text-sm text-ink-soft flex items-start gap-2">
                <MapPin className="w-4 h-4 text-ink-sub shrink-0 mt-0.5" />
                {COMPANY_CONTACTS.addressUz}
              </p>
              <p className="text-sm text-ink-soft flex items-center gap-2">
                <Phone className="w-4 h-4 text-ink-sub" />
                {COMPANY_CONTACTS.phoneDisplay}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
