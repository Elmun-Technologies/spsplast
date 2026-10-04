import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { COMPANY_CONTACTS } from '@/lib/constants/contacts';
import { getDictionary } from '@/lib/i18n';
import { pageMetadata } from '@/lib/seo';
import {
  Compass,
  ClipboardList,
  PhoneCall,
  Truck,
  ShieldCheck,
  FileText,
  Clock,
  CreditCard,
  ArrowRight,
} from 'lucide-react';

/**
 * "Qanday buyurtma berish" sahifasi (docs/MADANI-RAQOBAT-AUDITI.md, P1-3).
 *
 * Raqibda shunday sahifa bor va u ishlaydi: yangi mijoz "nima qilishim kerak?"
 * degan savolga bir joyda javob topadi. Bizda bunday sahifa yo'q edi — bu
 * esa telefon qilishdan oldin ikkilanishning eng katta sababi.
 *
 * Sahifa statik: DB'ga murojaat qilmaydi (build ham, ISR ham xavfsiz).
 */

interface Step {
  number: number;
  icon: React.ReactNode;
  titleUz: string;
  titleRu: string;
  textUz: string;
  textRu: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    icon: <Compass className="w-6 h-6 text-brand-red" />,
    titleUz: 'Mahsulotni tanlang',
    titleRu: 'Выберите товар',
    textUz:
      'Katalogdan kerakli qolip yoki dekor elementini tanlang. Har bir kartada o‘lcham, material va narx ko‘rsatilgan — kerak bo‘lsa filtrlar bilan toraytiring.',
    textRu:
      'Выберите нужную форму или декор-элемент в каталоге. В каждой карточке указаны размер, материал и цена — при необходимости сузьте выбор фильтрами.',
  },
  {
    number: 2,
    icon: <ClipboardList className="w-6 h-6 text-brand-red" />,
    titleUz: 'Savatga qo‘shing yoki 1-klikda buyurtma bering',
    titleRu: 'Добавьте в корзину или оформите в 1 клик',
    textUz:
      'Miqdorni kiriting — 10+ va 50+ dona uchun narx avtomatik pasayadi. Shoshayotgan bo‘lsangiz, telefon raqamini qoldirib bir klikda buyurtma bering.',
    textRu:
      'Укажите количество — при 10+ и 50+ штук цена снижается автоматически. Если спешите, оставьте номер телефона и оформите заказ в один клик.',
  },
  {
    number: 3,
    icon: <PhoneCall className="w-6 h-6 text-brand-red" />,
    titleUz: 'Menejer tasdiqlaydi',
    titleRu: 'Менеджер подтверждает',
    textUz:
      'Ish vaqtida menejerimiz buyurtmani tekshiradi, mavjudligini tasdiqlaydi va yetkazib berish shartlarini kelishadi. Savollaringiz bo‘lsa shu bosqichda yordam beradi.',
    textRu:
      'В рабочее время менеджер проверит заказ, подтвердит наличие и согласует условия доставки. Если есть вопросы — поможет на этом этапе.',
  },
  {
    number: 4,
    icon: <Truck className="w-6 h-6 text-brand-red" />,
    titleUz: 'Yetkazib oling yoki olib keting',
    titleRu: 'Получите доставку или самовывоз',
    textUz:
      'Toshkent shahri bo‘ylab yetkazib beramiz, viloyatlarga yuk tashish kompaniyalari orqali yuboramiz. Ombordan o‘zingiz olib ketish bepul.',
    textRu:
      'Доставляем по Ташкенту, в регионы отправляем транспортными компаниями. Самовывоз со склада — бесплатно.',
  },
];

const PAYMENTS = [
  {
    icon: <CreditCard className="w-5 h-5 text-brand-red" />,
    titleUz: 'Click / Payme',
    titleRu: 'Click / Payme',
    textUz: 'Buyurtma tasdiqlangach to‘lov havolasi yuboriladi.',
    textRu: 'После подтверждения заказа отправляем ссылку на оплату.',
  },
  {
    icon: <FileText className="w-5 h-5 text-brand-red" />,
    titleUz: 'Bank o‘tkazmasi (B2B)',
    titleRu: 'Банковский перевод (B2B)',
    textUz: 'Yuridik shaxslar uchun shartnoma va hisob-faktura bilan.',
    textRu: 'Для юридических лиц — по договору с выставлением счёта.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-brand-red" />,
    titleUz: 'Naqd',
    titleRu: 'Наличные',
    textUz: 'Ombordan olib ketishda joyida to‘lash mumkin.',
    textRu: 'При самовывозе со склада можно оплатить на месте.',
  },
];

const FAQ = [
  {
    qUz: 'Buyurtma qancha vaqtda tasdiqlanadi?',
    qRu: 'Как быстро подтверждается заказ?',
    aUz:
      'Ish vaqtida (dushanba–shanba, 09:00–18:00) menejer buyurtmani qabul qilib, imkon qadar tez bog‘lanadi. Ish vaqtidan tashqari qoldirilgan buyurtmalar keyingi ish kunida ko‘rib chiqiladi.',
    aRu:
      'В рабочее время (понедельник–суббота, 09:00–18:00) менеджер принимает заказ и связывается как можно быстрее. Заказы, оставленные вне рабочего времени, обрабатываются в следующий рабочий день.',
  },
  {
    qUz: 'Ulgurji (optom) buyurtma bering — bu yerda ishlaydimi?',
    qRu: 'Работает ли оформление оптового заказа здесь?',
    aUz:
      'Ha. Savatdagi miqdor oshgani sari chegirma avtomatik qo‘llanadi. Katta hajm uchun alohida shartlar kerak bo‘lsa, “Ulgurji narx so‘rash” tugmasini bosing — menejer individual taklif tayyorlaydi.',
    aRu:
      'Да. С ростом количества в корзине скидка применяется автоматически. Если для крупного объёма нужны отдельные условия, нажмите «Запросить оптовую цену» — менеджер подготовит индивидуальное предложение.',
  },
  {
    qUz: 'To‘lovni qachon qilaman?',
    qRu: 'Когда нужно оплачивать?',
    aUz:
      'Buyurtma menejer tomonidan tasdiqlanganidan keyin. Naqd to‘lov — ombordan olib ketishda, Click/Payme — havola orqali, bank o‘tkazmasi — hisob-faktura bo‘yicha.',
    aRu:
      'После подтверждения заказа менеджером. Наличные — при самовывозе со склада, Click/Payme — по ссылке, банковский перевод — по счёту.',
  },
  {
    qUz: 'Yetkazib berish narxi qanday hisoblanadi?',
    qRu: 'Как рассчитывается стоимость доставки?',
    aUz:
      'Toshkent shahri bo‘ylab tarif manzil va hajmga qarab belgilanadi; viloyatlarga yuk tashish kompaniyasi tarifi bo‘yicha. Aniq summani menejer tasdiqlash bosqichida aytadi — to‘lovdan oldin.',
    aRu:
      'По Ташкенту тариф зависит от адреса и объёма; в регионы — по тарифу транспортной компании. Точную сумму менеджер называет на этапе подтверждения, до оплаты.',
  },
  {
    qUz: 'Buyurtmani o‘zgartirsam yoki bekor qilsam bo‘ladimi?',
    qRu: 'Можно ли изменить или отменить заказ?',
    aUz:
      'Buyurtma yuborilishidan oldin — bemalol. Menejerga qo‘ng‘iroq qiling yoki yozing, miqdor va manzilni tuzatamiz.',
    aRu:
      'До отправки заказа — без проблем. Позвоните или напишите менеджеру, скорректируем количество и адрес.',
  },
];

export default async function HowToOrderPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const dict = getDictionary(lang);
  const isRu = lang === 'ru';

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((item) => ({
      '@type': 'Question',
      name: isRu ? item.qRu : item.qUz,
      acceptedAnswer: { '@type': 'Answer', text: isRu ? item.aRu : item.aUz },
    })),
  };

  const stepsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: isRu ? 'Как заказать продукцию SPS' : 'SPS mahsulotini qanday buyurtma qilish',
    step: STEPS.map((step) => ({
      '@type': 'HowToStep',
      position: step.number,
      name: isRu ? step.titleRu : step.titleUz,
      text: isRu ? step.textRu : step.textUz,
    })),
  };

  return (
    <div className="bg-surface-page min-h-screen text-ink py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(stepsJsonLd) }} />

      <Container>
        <Breadcrumbs
          lang={lang}
          items={[{ label: isRu ? 'Как заказать' : 'Qanday buyurtma berish', active: true }]}
          className="mb-6"
        />

        <div className="space-y-10">
          {/* Header */}
          <div className="relative overflow-hidden rounded-[24px] bg-[#EDF0F5] p-6 sm:p-9">
            <div className="absolute -right-24 -top-24 w-[320px] h-[320px] rounded-full bg-brand-red/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="inline-flex px-3 py-1 rounded-full bg-surface text-[12px] font-semibold text-ink-soft">
                {isRu ? '4 шага' : '4 qadam'}
              </span>
              <h1 className="text-[30px] sm:text-[40px] font-bold tracking-[-0.03em] leading-[1.1]">
                {isRu ? 'Как сделать заказ' : 'Qanday buyurtma berish'}
              </h1>
              <p className="text-[15px] sm:text-base text-ink-soft leading-relaxed">
                {isRu
                  ? 'От выбора товара до получения на складе. Мы работаем по всему Узбекистану и сотрудничаем с оптовыми покупателями и компаниями.'
                  : 'Mahsulotni tanlashdan omborda olishgacha. Biz butun O‘zbekiston bo‘ylab ishlaymiz va ulgurji xaridorlar hamda kompaniyalar bilan hamkorlik qilamiz.'}
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-[13px] text-ink-soft">
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-red" />
                  {isRu ? COMPANY_CONTACTS.workHoursRu : COMPANY_CONTACTS.workHoursUz}
                </span>
                <a href={`tel:${COMPANY_CONTACTS.phoneRaw}`} className="inline-flex items-center gap-2 font-semibold hover:text-brand-red transition-colors">
                  <PhoneCall className="w-4 h-4 text-brand-red" />
                  {COMPANY_CONTACTS.phoneDisplay}
                </a>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="bg-surface border border-line rounded-[20px] p-6 shadow-card space-y-3 flex gap-4"
              >
                <div className="shrink-0 space-y-3">
                  <div className="w-12 h-12 rounded-[16px] bg-surface-soft flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-brand-red">
                      {isRu ? `Шаг ${step.number}` : `${step.number}-qadam`}
                    </span>
                  </div>
                  <h2 className="text-[17px] font-bold text-ink leading-snug">
                    {isRu ? step.titleRu : step.titleUz}
                  </h2>
                  <p className="text-sm text-ink-soft leading-relaxed">
                    {isRu ? step.textRu : step.textUz}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${lang}/catalog`}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-brand-red text-white font-semibold text-[15px] rounded-full hover:bg-brand-red-dark transition-colors min-h-[50px] shadow-[0_12px_28px_-12px_rgba(230,28,36,0.75)]"
            >
              {dict.nav.viewCatalog}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/${lang}/contact`}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-surface text-ink font-semibold text-sm rounded-full hover:bg-[#F7F8FA] transition-colors min-h-[50px] border border-line"
            >
              {dict.nav.getConsultation}
            </Link>
          </div>

          {/* Payments */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-[-0.02em]">
              {isRu ? 'Способы оплаты' : 'To‘lov usullari'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PAYMENTS.map((payment) => (
                <div key={payment.titleUz} className="bg-surface border border-line rounded-[20px] p-5 space-y-2 shadow-card">
                  <div className="w-10 h-10 rounded-[14px] bg-surface-soft flex items-center justify-center">
                    {payment.icon}
                  </div>
                  <h3 className="font-bold text-ink text-sm">{isRu ? payment.titleRu : payment.titleUz}</h3>
                  <p className="text-sm text-ink-soft leading-relaxed">
                    {isRu ? payment.textRu : payment.textUz}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-[-0.02em]">
              {isRu ? 'Частые вопросы о заказе' : 'Buyurtma bo‘yicha ko‘p beriladigan savollar'}
            </h2>
            <div className="space-y-3">
              {FAQ.map((item) => (
                <details
                  key={item.qUz}
                  className="group bg-surface border border-line rounded-[16px] p-5 open:shadow-card transition-all"
                >
                  <summary className="flex items-center justify-between gap-4 font-semibold text-sm text-ink list-none cursor-pointer">
                    <span>{isRu ? item.qRu : item.qUz}</span>
                    <span className="text-ink-sub group-open:rotate-45 transition-transform text-lg leading-none">
                      +
                    </span>
                  </summary>
                  <p className="text-sm text-ink-soft mt-3 pt-3 border-t border-line-soft leading-relaxed">
                    {isRu ? item.aRu : item.aUz}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section className="bg-surface border border-line rounded-[24px] p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-[16px] bg-surface-soft flex items-center justify-center shrink-0">
                <PhoneCall className="w-6 h-6 text-brand-red" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-ink">
                  {isRu ? 'Поможем с выбором' : 'Tanlashda yordam beramiz'}
                </h2>
                <p className="text-sm text-ink-soft max-w-xl">
                  {isRu
                    ? 'Расскажите, что нужно изготовить — подберём формы под ваш объём и посчитаем стоимость.'
                    : 'Nima ishlab chiqarmoqchi ekaningizni ayting — hajmingizga mos qolip tanlaymiz va narxni hisoblaymiz.'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <a
                href={`tel:${COMPANY_CONTACTS.phoneRaw}`}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-ink text-white font-semibold text-sm rounded-full hover:bg-black transition-colors min-h-[48px]"
              >
                <PhoneCall className="w-4 h-4" />
                {COMPANY_CONTACTS.phoneDisplay}
              </a>
              <Link
                href={`/${lang}/contact`}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-surface-soft text-ink font-semibold text-sm rounded-full hover:bg-[#E9EDF3] transition-colors min-h-[48px]"
              >
                {isRu ? 'Написать' : 'Yozish'}
              </Link>
            </div>
          </section>
        </div>
      </Container>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const isRu = lang === 'ru';

  return pageMetadata({
    lang,
    path: '/how-to-order',
    title: isRu ? 'Как сделать заказ — SPS' : 'Qanday buyurtma berish — SPS',
    description: isRu
      ? 'Четыре шага от выбора товара до получения: выбор, оформление, подтверждение менеджером, доставка или самовывоз по всему Узбекистану.'
      : 'Mahsulot tanlashdan omborda olishgacha 4 qadam: tanlash, rasmiylashtirish, menejer tasdiqlashi, yetkazib berish yoki olib ketish.',
  });
}
