import React from 'react';
import Image from 'next/image';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { MapPin, CheckCircle2 } from 'lucide-react';

export default async function ProjectsPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);
  const projects = await db.project.findMany();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-bold uppercase tracking-wider">
          Real Obyektlar
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white">
          Bajarilgan Loyihalar va Obyektlar
        </h1>
        <p className="text-sm text-gray-300">
          SPS Plast qoliplaridan quyilgan bruschatka va fasad mahsulotlari bilan bezatilgan tayyor uylar va loyihalar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-xl space-y-4 p-5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* After image showcase */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black/40 border border-brand-border">
                <Image
                  src={proj.afterImage}
                  alt={proj.titleUz}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md backdrop-blur-md">
                  Tayyor Natija
                </div>
              </div>

              <h3 className="text-lg font-bold text-white leading-snug">
                {lang === 'ru' ? proj.titleRu : proj.titleUz}
              </h3>

              <p className="text-xs text-gray-300 line-clamp-3">
                {lang === 'ru' ? proj.descriptionRu : proj.descriptionUz}
              </p>
            </div>

            <div className="pt-3 border-t border-brand-border/60 flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1 text-gray-400">
                <MapPin className="w-3.5 h-3.5 text-brand-red" />
                {proj.location}
              </span>
              <span className="text-brand-red font-semibold">{proj.productUsed}</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
