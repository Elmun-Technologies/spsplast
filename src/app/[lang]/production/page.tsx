import React from 'react';
import Image from 'next/image';
import { getDictionary, Locale } from '@/lib/i18n';
import { Factory, Cpu, Layers, ShieldAlert, Wrench } from 'lucide-react';

export default function ProductionPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-bold uppercase tracking-wider">
          Zavod va Texnologiya
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white">
          Biz Qanday Ishlab Chiqaramiz?
        </h1>
        <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
          SPS Plast zavodida ishlab chiqarish bosqichlari, xomashyo sifati va avtomatlashtirilgan vakuum formovka uskunalari bilan tanishing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Cpu className="w-6 h-6 text-brand-red" />
              1. Vakuum-Formovka va Aniq CNC Qoliplar
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Bizning matritsalarimiz Germaniyaning CNC uskunalarida 0.05mm aniqlikda tayyorlanadi. Bu tayyor quyilgan betonning mutlaqo tekkis va geometrik mukammal bo‘lishini ta’minlaydi.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-brand-red" />
              2. 2mm va 3mm Birinchi Navli ABS Plastik
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Biz qayta ishlangan (вторсырье) mo‘rt plastik ishlatmaymiz. Faqat yangi elastik ABS va Polipropilen granulalari ishlatiladi. Shu sababli qoliplarimiz sovuq va issiqqa o‘ta chidamli.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Wrench className="w-6 h-6 text-brand-red" />
              3. Qolipdan Oson Ajralish (Easy Release)
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Qolip ichki yuzasining maxsus silliqlik darajasi betonning yopishib qolishini oldini oladi va ajratish jarayonini 2 barobar tezlashtiradi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-brand-border bg-black/40">
            <Image
              src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80"
              alt="Production line 1"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-brand-border bg-black/40">
            <Image
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80"
              alt="Production line 2"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

    </div>
  );
}
