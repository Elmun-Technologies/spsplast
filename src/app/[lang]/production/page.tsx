import React from 'react';
import Image from 'next/image';
import { getDictionary, Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Factory, Cpu, Layers, Wrench, ShieldCheck } from 'lucide-react';

export default function ProductionPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);

  return (
    <div className="bg-surface-page min-h-screen text-ink py-8">
      <Container>
        <Breadcrumbs lang={lang} items={[{ label: lang === 'ru' ? 'Производство' : 'Ishlab chiqarish', active: true }]} className="mb-6" />

        <div className="max-w-5xl space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-flex px-3 py-1 rounded-full bg-[#FEF0F0] text-brand-red text-[12px] font-semibold">
              Zavod va Texnologiya
            </span>
            <h1 className="text-[30px] sm:text-[42px] font-bold text-ink tracking-[-0.03em] leading-[1.1]">
              {lang === 'ru' ? 'Как мы производим?' : 'Biz qanday ishlab chiqaramiz?'}
            </h1>
            <p className="text-sm sm:text-base text-ink-soft leading-relaxed">
              {lang === 'ru'
                ? 'Этапы производства, качество сырья и оборудование на заводе SPS.'
                : 'SPS zavodida ishlab chiqarish bosqichlari, xomashyo sifati va uskunalar bilan tanishing.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              {[
                {
                  icon: Cpu,
                  title: lang === 'ru' ? '1. Формовка' : '1. Qolip tayyorlash',
                  desc:
                    lang === 'ru'
                      ? 'Формы для брусчатки, бордюров и плитки изготавливаются с точной геометрией, которая даёт ровный готовый бетон.'
                      : 'Bruschatka, bordyur va plitka qoliplari aniq geometriya bilan tayyorlanadi, bu esa tekis tayyor beton beradi.',
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
                  title: lang === 'ru' ? '3. Лёгкое извлечение' : '3. Oson ajralish',
                  desc:
                    lang === 'ru'
                      ? 'Гладкая внутренняя поверхность помогает бетону легко отделяться от формы.'
                      : 'Ichki yuzaning silliqligi betonning qolipdan oson ajralishiga yordam beradi.',
                },
              ].map((item) => (
                <div key={item.title} className="bg-surface border border-line rounded-[20px] p-5 space-y-2 shadow-card">
                  <h2 className="text-base font-bold text-ink flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-[16px] bg-[#FEF0F0] flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-brand-red" />
                    </span>
                    {item.title}
                  </h2>
                  <p className="text-sm text-ink-soft leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-square rounded-[20px] overflow-hidden border border-line bg-surface shadow-card">
                <Image
                  src="/catalog/catalog-053.jpg"
                  alt="Production line 1"
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square rounded-[20px] overflow-hidden border border-line bg-surface shadow-card">
                <Image
                  src="/catalog/catalog-027.jpg"
                  alt="Production line 2"
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="col-span-2 bg-ink text-white rounded-[20px] p-5 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-sm">{lang === 'ru' ? 'Качественное сырье' : 'Sifatli xomashyo'}</div>
                  <div className="text-xs text-white/60">{lang === 'ru' ? 'Полипропилен и ABS пластик' : 'Polipropilen va ABS plastik'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
