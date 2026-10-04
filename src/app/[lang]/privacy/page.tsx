import React from 'react';
import { getDictionary, Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
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
    path: '/privacy',
    title: isRu ? 'Политика конфиденциальности | SPS' : 'Maxfiylik siyosati | SPS',
    description: isRu
      ? 'Как сайт собирает и использует персональные данные: данные заказов, cookie-файлы, формы связи и права пользователя.'
      : 'Sayt shaxsiy ma’lumotlarni qanday yig‘adi va ishlatadi: buyurtma ma’lumotlari, cookie fayllar, aloqa shakllari va foydalanuvchi huquqlari.',
  });
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const dict = getDictionary(lang);

  return (
    <div className="bg-surface-page min-h-screen text-ink py-8">
      <Container>
        <Breadcrumbs lang={lang} items={[{ label: dict.footer.privacy, active: true }]} className="mb-6" />
        <div className="max-w-3xl bg-surface border border-line rounded-[20px] p-6 sm:p-8 shadow-card space-y-6">
          <div>
            <h1 className="text-[30px] sm:text-[38px] font-bold text-ink tracking-[-0.03em] leading-[1.15]">{dict.footer.privacy}</h1>
            <p className="text-xs text-ink-sub mt-1">Oxirgi yangilanish: {new Date().toLocaleDateString()}</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink">1. Umumiy qoidalar</h2>
            <p className="text-sm text-ink-soft leading-relaxed">
              Ushbu Maxfiylik siyosati SPS MCHJ saytidan (sps.uz) foydalanuvchilarning shaxsiy ma’lumotlarini yig‘ish, saqlash va qayta ishlash tartibini belgilaydi.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink">2. Yig‘iladigan ma’lumotlar</h2>
            <p className="text-sm text-ink-soft leading-relaxed">
              Buyurtma rasmiylashtirishda va ulgurji so‘rov yuborishda quyidagi ma’lumotlar yig‘iladi: Ism, Telefon raqami, Viloyat va Manzil, Kompaniya nomi hamda UTM teglar.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink">3. Ma’lumotlardan foydalanish</h2>
            <p className="text-sm text-ink-soft leading-relaxed">
              Kiritilgan shaxsiy ma’lumotlar faqat buyurtmani yetkazib berish, mijoz bilan bog‘lanish va sifatni oshirish maqsadida ishlatiladi hamda uchinchi shaxslarga berilmaydi.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
