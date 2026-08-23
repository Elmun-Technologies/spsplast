import React from 'react';
import Image from 'next/image';
import { getDictionary, Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Factory, Cpu, Layers, Wrench, ShieldCheck } from 'lucide-react';

export default function ProductionPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-gray-900 py-8">
      <Container>
        <Breadcrumbs lang={lang} items={[{ label: lang === 'ru' ? 'Производство' : 'Ishlab chiqarish', active: true }]} className="mb-6" />

        <div className="max-w-5xl space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-flex px-3 py-1 rounded-full bg-red-50 border border-red-200 text-brand-red text-xs font-bold uppercase tracking-wider">
              Zavod va Texnologiya
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
              {lang === 'ru' ? 'Как мы производим?' : 'Biz qanday ishlab chiqaramiz?'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              {lang === 'ru'
                ? 'Этапы производства, качество сырья и автоматизированное вакуум-формовочное оборудование на заводе SPS Plast.'
                : 'SPS Plast zavodida ishlab chiqarish bosqichlari, xomashyo sifati va avtomatlashtirilgan vakuum formovka uskunalari bilan tanishing.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              {[
                {
                  icon: Cpu,
                  title: lang === 'ru' ? '1. Вакуум-формовка и CNC' : '1. Vakuum-formovka va CNC',
                  desc:
                    lang === 'ru'
                      ? 'Матрицы изготавливаются на немецких ЧПУ станках с точностью 0.05мм. Готовый бетон идеально ровный.'
                      : 'Matritsalarimiz Germaniya CNC uskunalarida 0.05mm aniqlikda tayyorlanadi. Beton mutlaqo tekis va geometrik mukammal.',
                },
                {
                  icon: Layers,
                  title: lang === 'ru' ? '2. Первичный ABS пластик 2-3мм' : '2. 2mm va 3mm ABS plastik',
                  desc:
                    lang === 'ru'
                      ? 'Мы не используем вторсырье. Только новый эластичный ABS и полипропилен — устойчив к холоду и жаре.'
                      : 'Qayta ishlangan plastik ishlatmaymiz. Faqat yangi elastik ABS va polipropilen — sovuq va issiqqa chidamli.',
                },
                {
                  icon: Wrench,
                  title: lang === 'ru' ? '3. Легкое извлечение' : '3. Oson ajralish (Easy Release)',
                  desc:
                    lang === 'ru'
                      ? 'Специальная гладкость внутренней поверхности предотвращает прилипание бетона и ускоряет процесс в 2 раза.'
                      : 'Ichki yuzaning maxsus silliqligi beton yopishishini oldini oladi va 2 barobar tezlashtiradi.',
                },
              ].map((item) => (
                <div key={item.title} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-2 shadow-sm">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-brand-red" />
                    </span>
                    {item.title}
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                <Image
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80"
                  alt="Production line 1"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                <Image
                  src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80"
                  alt="Production line 2"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="col-span-2 bg-gray-900 text-white rounded-2xl p-5 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-sm">300+ quyish kafolati</div>
                  <div className="text-xs text-gray-400">Har bir partiya laboratoriya testidan o'tadi</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
