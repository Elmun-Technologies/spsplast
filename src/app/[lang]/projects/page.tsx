import React from 'react';
import Image from 'next/image';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { MapPin, CheckCircle2 } from 'lucide-react';

export default async function ProjectsPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);
  let projects: any[] = [];
  try {
    projects = await db.project.findMany();
  } catch {
    projects = [];
  }

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-gray-900 py-8">
      <Container>
        <Breadcrumbs lang={lang} items={[{ label: lang === 'ru' ? 'Проекты' : 'Loyihalar', active: true }]} className="mb-6" />

        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex px-3 py-1 rounded-full bg-red-50 border border-red-200 text-brand-red text-xs font-bold uppercase tracking-wider">
              Real Obyektlar
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
              {lang === 'ru' ? 'Выполненные проекты' : 'Bajarilgan loyihalar'}
            </h1>
            <p className="text-sm text-gray-600">
              {lang === 'ru' ? 'Дома и объекты с брусчаткой из наших форм.' : 'SPS Plast qoliplaridan quyilgan bruschatka bilan bezatilgan uylar va loyihalar.'}
            </p>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
              <p className="text-gray-900 font-bold">{lang === 'ru' ? 'Проекты скоро появятся' : 'Loyihalar tez orada qo‘shiladi'}</p>
              <p className="text-sm text-gray-500">Hozirda loyiha ma'lumotlari mavjud emas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((proj) => (
                <div key={proj.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="relative aspect-[4/3] bg-[#F8F9FA] border-b border-gray-200">
                    <Image src={proj.afterImage} alt={proj.titleUz} fill className="object-cover" />
                    <div className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">Tayyor Natija</div>
                  </div>
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-gray-900 leading-snug">{lang === 'ru' ? proj.titleRu : proj.titleUz}</h3>
                      <p className="text-sm text-gray-600 line-clamp-3">{lang === 'ru' ? proj.descriptionRu : proj.descriptionUz}</p>
                    </div>
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <MapPin className="w-4 h-4 text-brand-red" />
                        {proj.location}
                      </span>
                      <span className="inline-flex items-center gap-1 text-brand-red font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {proj.productUsed}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
