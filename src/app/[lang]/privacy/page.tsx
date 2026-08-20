import React from 'react';
import { getDictionary, Locale } from '@/lib/i18n';

export default function PrivacyPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-gray-300 text-sm leading-relaxed">
      <h1 className="text-3xl font-black text-white">{dict.footer.privacy}</h1>
      <p className="text-xs text-gray-400">Oxirgi yangilanish: {new Date().toLocaleDateString()}</p>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">1. Umumiy qoidalar</h2>
        <p>
          Ushbu Maxfiylik siyosati SPS PLAST MCHJ saytidan (spsplast.uz) foydalanuvchilarning shaxsiy ma’lumotlarini yig‘ish, saqlash va qayta ishlash tartibini belgilaydi.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">2. Yig‘iladigan ma’lumotlar</h2>
        <p>
          Buyurtma rasmiylashtirishda va ulgurji so‘rov yuborishda quyidagi ma’lumotlar yig‘iladi: Ism, Telefon raqami, Viloyat va Manzil, Kompaniya nomi hamda UTM teglar.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">3. Ma’lumotlardan foydalanish</h2>
        <p>
          Kiritilgan shaxsiy ma’lumotlar faqat buyurtmani yetkazib berish, mijoz bilan bog‘lanish va sifatni oshirish maqsadida ishlatiladi hamda uchinchi shaxslarga berilmaydi.
        </p>
      </section>
    </div>
  );
}
