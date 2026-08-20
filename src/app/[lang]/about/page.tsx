import React from 'react';
import Image from 'next/image';
import { getDictionary, Locale } from '@/lib/i18n';
import { Building2, Award, Users, ShieldCheck, Factory, Target } from 'lucide-react';

export default function AboutPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-bold uppercase tracking-wider">
          Kompaniya Haqida
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white">
          SPS PLAST — Sanoat Darajasidagi Plastik Qoliplar Ishlab Chiqaruvchisi
        </h1>
        <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
          Biz O‘zbekiston va O‘rta Osiyo bo‘ylab termopanel, bruschatka qoliplari va beton mahsulotlari uchun vakuumli yuqori sifatli plastik qoliplar yetkazib beramiz.
        </p>
      </div>

      {/* Grid Image Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border-2 border-brand-border bg-black/40 shadow-2xl">
          <Image
            src="https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=1200&q=80"
            alt="SPS Plast Factory"
            fill
            className="object-cover"
          />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Bizning Maqsadimiz va Ishlab Chiqarish Quvvatimiz
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            SPS Plast kompaniyasi o‘zining zamonaviy avtomatlashtirilgan vakuum-formovka uskunalari yordamida har kuni 2000 dan ortiq plastik qoliplarni ishlab chiqaradi. Bizning asosiy ustunligimiz — bu birinchi navli chidamli ABS plastik xomashyosi hamda beton sexlari uchun 300+ marta sifatli mahsulot quyish kafolatidir.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
              <p className="text-2xl font-black text-brand-red">10+ Yil</p>
              <p className="text-xs text-gray-400">Bozordagi Tajriba</p>
            </div>
            <div className="p-4 rounded-xl bg-brand-card border border-brand-border">
              <p className="text-2xl font-black text-white">500,000+</p>
              <p className="text-xs text-gray-400">Sotilgan Qoliplar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand-card border border-brand-border p-6 rounded-2xl space-y-3">
          <Factory className="w-8 h-8 text-brand-red" />
          <h3 className="text-lg font-bold text-white">Sanoat Standartlari</h3>
          <p className="text-xs text-gray-400">Nemis va Italiya texnologiyasi asosida aniq va mustahkam shakllar.</p>
        </div>

        <div className="bg-brand-card border border-brand-border p-6 rounded-2xl space-y-3">
          <ShieldCheck className="w-8 h-8 text-brand-red" />
          <h3 className="text-lg font-bold text-white">Sifat Nazorati</h3>
          <p className="text-xs text-gray-400">Har bir partiya ishlab chiqarilgandan so‘ng laboratoriya va elastiklik testidan o‘tadi.</p>
        </div>

        <div className="bg-brand-card border border-brand-border p-6 rounded-2xl space-y-3">
          <Users className="w-8 h-8 text-brand-red" />
          <h3 className="text-lg font-bold text-white">B2B Hamkorlik</h3>
          <p className="text-xs text-gray-400">Respublika bo‘yicha 300 dan ortiq yirik va o‘rta bruschatka sexlarining rasmiy ta’minotchisi.</p>
        </div>
      </div>

    </div>
  );
}
