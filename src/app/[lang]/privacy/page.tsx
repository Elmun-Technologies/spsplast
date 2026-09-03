import React from 'react';
import { getDictionary, Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function PrivacyPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-gray-900 py-8">
      <Container>
        <Breadcrumbs lang={lang} items={[{ label: dict.footer.privacy, active: true }]} className="mb-6" />
        <div className="max-w-3xl bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{dict.footer.privacy}</h1>
            <p className="text-xs text-gray-500 mt-1">Oxirgi yangilanish: {new Date().toLocaleDateString()}</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">1. Umumiy qoidalar</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Ushbu Maxfiylik siyosati SPS MCHJ saytidan (sps.uz) foydalanuvchilarning shaxsiy ma’lumotlarini yig‘ish, saqlash va qayta ishlash tartibini belgilaydi.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">2. Yig‘iladigan ma’lumotlar</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Buyurtma rasmiylashtirishda va ulgurji so‘rov yuborishda quyidagi ma’lumotlar yig‘iladi: Ism, Telefon raqami, Viloyat va Manzil, Kompaniya nomi hamda UTM teglar.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">3. Ma’lumotlardan foydalanish</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Kiritilgan shaxsiy ma’lumotlar faqat buyurtmani yetkazib berish, mijoz bilan bog‘lanish va sifatni oshirish maqsadida ishlatiladi hamda uchinchi shaxslarga berilmaydi.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
