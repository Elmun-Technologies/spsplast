import React from 'react';
import Link from 'next/link';
import { getDictionary, Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { COMPANY_CONTACTS } from '@/lib/constants/contacts';
import { pageMetadata } from '@/lib/seo';
import {
  Truck,
  CreditCard,
  Clock,
  ShieldCheck,
  MapPin,
  Phone,
  PackageCheck,
  RefreshCw,
  FileText,
  Banknote,
  ArrowRight,
} from 'lucide-react';

/**
 * Yetkazib berish va to'lov sahifasi (docs/MADANI-RAQOBAT-AUDITI.md, P1-5/P1-6).
 *
 * Ilgari bu sahifa faqat o'zbek tilida edi (rus versiyada ham o'zbekcha matn
 * chiqardi), to'lov usullari ro'yxatida esa amalda mavjud bo'lmagan "UZUM"
 * ko'rsatilgan edi. Endi matn ikki tilda va faqat haqiqatda mavjud usullar
 * yozilgan: naqd, yuridik shaxslar uchun bank o'tkazmasi hamda to'lov tartibi
 * menejer bilan kelishilishi (P0-8 — sayt va'da bermaydi, jarayon aniq).
 */

/**
 * SEO (docs/MADANI-RAQOBAT-AUDITI.md, P0-11): sahifada ilgari metadata yo'q edi.
 * Yetkazib berish shartlari qidiruvda eng ko'p so'raladigan mavzulardan biri,
 * shuning uchun sarlavha va tavsif aniq shakllantirilgan.
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const isRu = lang === 'ru';
  return pageMetadata({
    lang,
    path: '/delivery-payment',
    title: isRu ? 'Доставка и условия оплаты | SPS' : 'Yetkazib berish va to‘lov shartlari | SPS',
    description: isRu
      ? 'Доставка по Ташкенту и регионам Узбекистана, самовывоз со склада. Оплата: наличные или банковский перевод для юридических лиц.'
      : 'Toshkent va viloyatlarga yetkazib berish, ombordan olib ketish. To‘lov: naqd yoki yuridik shaxslar uchun bank o‘tkazmasi.',
  });
}

export default async function DeliveryPaymentPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const dict = getDictionary(lang);
  const isRu = lang === 'ru';

  const deliveryRows = [
    {
      icon: <Truck className="w-5 h-5 text-brand-red" />,
      title: isRu ? 'Ташкент (курьер)' : 'Toshkent shahri (kuryer)',
      text: isRu
        ? 'Доставка в течение 1 рабочего дня. Тариф зависит от адреса и объёма заказа — точную сумму менеджер сообщает до оплаты.'
        : '1 ish kuni ichida yetkaziladi. Tarif manzil va buyurtma hajmiga bog‘liq — aniq summani menejer to‘lovdan oldin aytadi.',
    },
    {
      icon: <PackageCheck className="w-5 h-5 text-brand-red" />,
      title: isRu ? 'Регионы Узбекистана' : 'O‘zbekiston viloyatlari',
      text: isRu
        ? 'Отправляем транспортными компаниями в течение 1–3 рабочих дней. Стоимость — по тарифу перевозчика.'
        : 'Yuk tashish kompaniyalari orqali 1–3 ish kuni ichida yuboriladi. Narx — tashuvchi tarifi bo‘yicha.',
    },
    {
      icon: <MapPin className="w-5 h-5 text-brand-red" />,
      title: isRu ? 'Самовывоз со склада' : 'Ombordan olib ketish',
      text: isRu
        ? 'Бесплатно. Заказ собираем после подтверждения — приезжайте в рабочее время и проверьте товар на месте.'
        : 'Bepul. Buyurtmani tasdiqlangach yig‘amiz — ish vaqtida kelib, mahsulotni joyida tekshirib oling.',
    },
  ];

  const paymentRows = [
    {
      icon: <Banknote className="w-5 h-5 text-brand-red" />,
      title: isRu ? 'Наличные' : 'Naqd',
      text: isRu
        ? 'При самовывозе со склада или при получении — по согласованию с менеджером.'
        : 'Ombordan olib ketishda yoki yetkazib berishda — menejer bilan kelishilgan holda.',
    },
    {
      icon: <CreditCard className="w-5 h-5 text-brand-red" />,
      title: isRu ? 'Порядок оплаты' : 'To‘lov tartibi',
      text: isRu
        ? 'Способ оплаты согласуется с менеджером: наличные при самовывозе или счёте для юридических лиц.'
        : 'To‘lov usuli menejer bilan kelishiladi: ombordan olib ketishda naqd yoki yuridik shaxslar uchun hisob-faktura.',
    },
    {
      icon: <FileText className="w-5 h-5 text-brand-red" />,
      title: isRu ? 'Банковский перевод (B2B)' : 'Bank o‘tkazmasi (B2B)',
      text: isRu
        ? 'Для юридических лиц: договор, счёт и документы с НДС или без НДС. Реквизиты — на странице контактов.'
        : 'Yuridik shaxslar uchun: shartnoma, hisob-faktura va QQS bilan yoki QQSsiz hujjatlar. Rekvizitlar kontakt sahifasida.',
    },
  ];

  return (
    <div className="bg-surface-page min-h-screen text-ink py-8">
      <Container>
        <Breadcrumbs lang={lang} items={[{ label: dict.footer.deliveryTerms, active: true }]} className="mb-6" />

        <div className="max-w-4xl space-y-8">
          <div>
            <h1 className="text-[28px] sm:text-[36px] font-bold text-ink tracking-[-0.03em] leading-[1.15]">
              {dict.footer.deliveryTerms}
            </h1>
            <p className="text-sm sm:text-base text-ink-soft mt-2">
              {isRu
                ? 'Доставка по всему Узбекистану и понятные условия оплаты — без скрытых доплат.'
                : 'Butun O‘zbekiston bo‘ylab yetkazib berish va tushunarli to‘lov shartlari — yashirin qo‘shimchalarsiz.'}
            </p>
          </div>

          {/* Yetkazib berish */}
          <section className="bg-surface border border-line rounded-[20px] p-6 sm:p-7 shadow-card space-y-5">
            <div className="flex items-center gap-3 border-b border-line-soft pb-4">
              <div className="w-11 h-11 rounded-[16px] bg-[#FEF0F0] flex items-center justify-center">
                <Truck className="w-6 h-6 text-brand-red" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink">
                  {isRu ? 'Условия доставки' : 'Yetkazib berish shartlari'}
                </h2>
                <p className="text-[12px] text-ink-sub">
                  {isRu
                    ? 'Сроки отсчитываются от подтверждения заказа менеджером'
                    : 'Muddat menejer buyurtmani tasdiqlaganidan boshlab hisoblanadi'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {deliveryRows.map((row) => (
                <div key={row.title} className="p-4 rounded-[16px] bg-surface-soft border border-line space-y-2">
                  <div className="w-10 h-10 rounded-[14px] bg-surface border border-line flex items-center justify-center">
                    {row.icon}
                  </div>
                  <h3 className="font-bold text-ink text-sm">{row.title}</h3>
                  <p className="text-sm text-ink-soft leading-relaxed">{row.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* To'lov */}
          <section className="bg-surface border border-line rounded-[20px] p-6 sm:p-7 shadow-card space-y-5">
            <div className="flex items-center gap-3 border-b border-line-soft pb-4">
              <div className="w-11 h-11 rounded-[16px] bg-blue-50 border border-blue-100 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-ink">
                {isRu ? 'Способы оплаты' : 'To‘lov usullari'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {paymentRows.map((row) => (
                <div key={row.title} className="p-4 rounded-[16px] bg-surface-soft border border-line space-y-2">
                  <div className="w-10 h-10 rounded-[14px] bg-surface border border-line flex items-center justify-center">
                    {row.icon}
                  </div>
                  <h3 className="font-bold text-ink text-sm">{row.title}</h3>
                  <p className="text-sm text-ink-soft leading-relaxed">{row.text}</p>
                </div>
              ))}
            </div>

            <p className="text-[12px] text-ink-sub leading-relaxed">
              {isRu
                ? 'Внимание: оплата производится только после подтверждения заказа менеджером. Мы никогда не просим переводить деньги на личные карты.'
                : 'Diqqat: to‘lov faqat menejer buyurtmani tasdiqlaganidan keyin amalga oshiriladi. Biz hech qachon shaxsiy kartalarga pul o‘tkazishni so‘ramaymiz.'}
            </p>
          </section>

          {/* Kafolat va qaytarish */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface border border-line rounded-[20px] p-6 space-y-3 shadow-card">
              <div className="w-11 h-11 rounded-[16px] bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-ink">{isRu ? 'Гарантия качества' : 'Sifat kafolati'}</h2>
              <p className="text-sm text-ink-soft leading-relaxed">
                {isRu
                  ? 'Вся продукция изготавливается на нашем производстве и проходит проверку перед отгрузкой. Если обнаружен заводской дефект — заменим изделие или вернём деньги.'
                  : 'Barcha mahsulotlar o‘z ishlab chiqarishimizda tayyorlanadi va jo‘natishdan oldin tekshiriladi. Zavod nuqsoni aniqlansa — mahsulotni almashtiramiz yoki pulini qaytaramiz.'}
              </p>
              <Link
                href={`/${lang}/returns`}
                className="inline-flex items-center gap-2 text-sm font-bold text-brand-red hover:gap-3 transition-all"
              >
                {isRu ? 'Условия возврата' : 'Qaytarish shartlari'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-surface border border-line rounded-[20px] p-6 space-y-3 shadow-card">
              <div className="w-11 h-11 rounded-[16px] bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-ink">{isRu ? 'Время работы' : 'Ish vaqti'}</h2>
              <p className="text-sm text-ink-soft">
                {isRu ? COMPANY_CONTACTS.workHoursRu : COMPANY_CONTACTS.workHoursUz}
              </p>
              <p className="text-sm text-ink-soft flex items-center gap-2">
                <Phone className="w-4 h-4 text-ink-sub" />
                <a href={`tel:${COMPANY_CONTACTS.phoneRaw}`} className="font-semibold hover:text-brand-red transition-colors">
                  {COMPANY_CONTACTS.phoneDisplay}
                </a>
              </p>
              <p className="text-sm text-ink-soft flex items-start gap-2">
                <MapPin className="w-4 h-4 text-ink-sub shrink-0 mt-0.5" />
                <span>{isRu ? COMPANY_CONTACTS.addressRu : COMPANY_CONTACTS.addressUz}</span>
              </p>
            </div>
          </section>

          {/* Qaytarish qisqa ko'rinishi */}
          <section className="bg-[#EDF0F5] rounded-[24px] p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[16px] bg-surface flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-brand-red" />
              </div>
              <h2 className="text-lg font-bold text-ink">
                {isRu ? 'Если что-то пошло не так' : 'Agar biror narsa kutilganidek bo‘lmasa'}
              </h2>
            </div>
            <ul className="space-y-2 text-sm text-ink-soft">
              {(isRu
                ? [
                    'Заводской дефект — замена или возврат средств.',
                    'Ошибка в заказе с нашей стороны — исправляем за свой счёт.',
                    'Изменение заказа до отправки — без штрафов, позвоните менеджеру.',
                  ]
                : [
                    'Zavod nuqsoni — almashtirish yoki pulni qaytarish.',
                    'Buyurtmadagi xato bizning tomondan bo‘lsa — o‘z hisobimizdan tuzatamiz.',
                    'Jo‘natishdan oldin buyurtmani o‘zgartirish — jarimasiz, menejerga qo‘ng‘iroq qiling.',
                  ]
              ).map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-red shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${lang}/how-to-order`}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-ink text-white font-semibold text-sm rounded-full hover:bg-black transition-colors min-h-[48px]"
            >
              {isRu ? 'Как сделать заказ' : 'Qanday buyurtma berish'}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/${lang}/contact`}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-surface text-ink font-semibold text-sm rounded-full hover:bg-[#F7F8FA] transition-colors min-h-[48px] border border-line"
            >
              {dict.nav.contact}
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
