import React from 'react';
import { getDictionary, Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { RefreshCw, ShieldCheck, Clock } from 'lucide-react';
import { pageMetadata } from '@/lib/seo';

/**
 * SEO: sarlavha, tavsif, canonical va uz/ru hreflang (x-default bilan).
 * Ilgari bu sahifada generateMetadata yo'q edi va u bosh sahifa sarlavhasini
 * meros olardi (docs/MADANI-RAQOBAT-AUDITI.md, P0-11).
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const isRu = lang === 'ru';
  return pageMetadata({
    lang,
    path: '/returns',
    title: isRu ? 'Возврат и обмен — условия | SPS' : 'Qaytarish va almashtirish shartlari | SPS',
    description: isRu
      ? 'При заводском дефекте изделие заменяется или возвращаются деньги. Порядок возврата, сроки и необходимые данные.'
      : 'Zavod nuqsoni aniqlansa mahsulot almashtiriladi yoki puli qaytariladi. Qaytarish tartibi, muddatlar va zarur ma’lumotlar.',
  });
}

export default async function ReturnsPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const dict = getDictionary(lang);

  return (
    <div className="bg-surface-page min-h-screen text-ink py-8">
      <Container>
        <Breadcrumbs lang={lang} items={[{ label: dict.footer.returns, active: true }]} className="mb-6" />
        <div className="max-w-3xl space-y-6">
          <h1 className="text-[28px] sm:text-[32px] font-bold text-ink tracking-[-0.025em] leading-[1.15]">{dict.footer.returns}</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface border border-line rounded-[20px] p-5 space-y-2 shadow-card">
              <RefreshCw className="w-6 h-6 text-brand-red" />
              <h3 className="font-bold text-ink">Almashtirish</h3>
              <p className="text-sm text-ink-soft">Zavod defekti bo‘lsa — almashtiramiz yoki pulini qaytaramiz</p>
            </div>
            <div className="bg-surface border border-line rounded-[20px] p-5 space-y-2 shadow-card">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <h3 className="font-bold text-ink">Zavod javobgarligi</h3>
              <p className="text-sm text-ink-soft">Har bir partiya jo‘natishdan oldin tekshiriladi</p>
            </div>
            <div className="bg-surface border border-line rounded-[20px] p-5 space-y-2 shadow-card">
              <Clock className="w-6 h-6 text-blue-600" />
              <h3 className="font-bold text-ink">Murojaat</h3>
              <p className="text-sm text-ink-soft">Menejerga qo‘ng‘iroq qilish kifoya</p>
            </div>
          </div>

          <div className="bg-surface border border-line rounded-[20px] p-6 sm:p-8 shadow-card space-y-4">
            <h2 className="text-lg font-bold text-ink">Qaytarish va almashish qoidalari</h2>
            <p className="text-sm text-ink-soft leading-relaxed">
              Mahsulot zavod defekti bilan chiqsa, menejer bilan bog‘laning: partiyani ko‘rib chiqamiz va
              mahsulotni almashtiramiz yoki pulini qaytaramiz. Aniq shartlar buyurtma paytida kelishiladi.
            </p>
            <p className="text-sm text-ink-soft leading-relaxed">
              Mahsulot ishlatilmagan va tovar ko‘rinishini saqlab qolgan bo‘lishi lozim. Batafsil shartlarni
              menejerdan so‘rashingiz mumkin.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
