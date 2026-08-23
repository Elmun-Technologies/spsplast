import React from 'react';
import Image from 'next/image';
import { getDictionary, Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { Building2, Award, Users, ShieldCheck, Factory, Target } from 'lucide-react';
import { COMPANY_CONTACTS } from '@/lib/constants/contacts';

export default function AboutPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-gray-900">
      <Container>
        <div className="py-12 space-y-12">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-flex px-3 py-1 rounded-full bg-red-50 border border-red-200 text-brand-red text-xs font-bold uppercase tracking-wider">
              {lang === 'ru' ? 'О компании' : 'Kompaniya haqida'}
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              SPS PLAST — {lang === 'ru' ? 'Промышленные пластиковые формы' : 'Sanoat darajasidagi plastik qoliplar'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              {lang === 'ru'
                ? 'Мы поставляем высококачественные вакуумные пластиковые формы для термопанелей, брусчатки и бетонных изделий по всему Узбекистану и Центральной Азии.'
                : 'Biz O‘zbekiston va O‘rta Osiyo bo‘ylab termopanel, bruschatka qoliplari va beton mahsulotlari uchun vakuumli yuqori sifatli plastik qoliplar yetkazib beramiz.'}
            </p>
          </div>

          {/* Grid Image Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 bg-[#F8F9FA] shadow-xs">
              <Image
                src="https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=1200&q=80"
                alt="SPS Plast Factory"
                fill
                className="object-cover"
              />
            </div>

            <div className="space-y-5">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {lang === 'ru' ? 'Наша цель и мощности' : 'Maqsadimiz va ishlab chiqarish quvvatimiz'}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {lang === 'ru'
                  ? 'Компания SPS Plast ежедневно производит более 2000 пластиковых форм на современном автоматизированном вакуумно-формовочном оборудовании. Наше преимущество — высококачественное сырье ABS и гарантия 300+ заливок для бетонных цехов.'
                  : 'SPS Plast kompaniyasi o‘zining zamonaviy avtomatlashtirilgan vakuum-formovka uskunalari yordamida har kuni 2000 dan ortiq plastik qoliplarni ishlab chiqaradi. Bizning asosiy ustunligimiz — bu birinchi navli chidamli ABS plastik xomashyosi hamda beton sexlari uchun 300+ marta sifatli mahsulot quyish kafolatidir.'}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#F8F9FA] border border-gray-200">
                  <p className="text-3xl font-black text-brand-red">10+ Yil</p>
                  <p className="text-xs font-semibold text-gray-600 mt-1">{lang === 'ru' ? 'Опыт на рынке' : 'Bozordagi tajriba'}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 text-white">
                  <p className="text-3xl font-black text-white">500,000+</p>
                  <p className="text-xs text-gray-400 mt-1">{lang === 'ru' ? 'Проданных форм' : 'Sotilgan qoliplar'}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
                <div className="font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  {COMPANY_CONTACTS.addressUz}
                </div>
                <div className="text-xs mt-1">{COMPANY_CONTACTS.phoneDisplay} • {COMPANY_CONTACTS.email}</div>
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-gray-200 p-6 rounded-2xl space-y-3 shadow-xs hover:shadow-sm transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                <Factory className="w-6 h-6 text-brand-red" />
              </div>
              <h3 className="text-base font-bold text-gray-900">{lang === 'ru' ? 'Промышленные стандарты' : 'Sanoat standartlari'}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {lang === 'ru' ? 'Точные и прочные формы по немецким и итальянским технологиям.' : 'Nemis va Italiya texnologiyasi asosida aniq va mustahkam shakllar.'}
              </p>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-2xl space-y-3 shadow-xs hover:shadow-sm transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">{lang === 'ru' ? 'Контроль качества' : 'Sifat nazorati'}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {lang === 'ru' ? 'Каждая партия проходит лабораторные испытания на эластичность.' : 'Har bir partiya ishlab chiqarilgandan so‘ng laboratoriya va elastiklik testidan o‘tadi.'}
              </p>
            </div>

            <div className="bg-white border border-gray-200 p-6 rounded-2xl space-y-3 shadow-xs hover:shadow-sm transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">B2B Hamkorlik</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {lang === 'ru' ? 'Официальный поставщик 300+ цехов по всей республике.' : 'Respublika bo‘yicha 300 dan ortiq yirik va o‘rta bruschatka sexlarining rasmiy ta’minotchisi.'}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
