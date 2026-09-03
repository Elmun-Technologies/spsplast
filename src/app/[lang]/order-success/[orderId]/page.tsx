import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { CheckCircle2, ShoppingBag, Phone, Truck, ShieldCheck, ArrowRight, Package } from 'lucide-react';
import { COMPANY_CONTACTS } from '@/lib/constants/contacts';

interface OrderSuccessPageProps {
  params: { lang: Locale; orderId: string };
}

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function OrderSuccessPage({ params: { lang, orderId } }: OrderSuccessPageProps) {
  const dict = getDictionary(lang);

  let order: any = null;
  try {
    order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
  } catch {}

  return (
    <div className="bg-[#F8F9FA] min-h-screen py-8 text-gray-900">
      <Container>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-4 py-8">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-emerald-100 rounded-2xl rotate-3" />
              <div className="relative w-20 h-20 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight uppercase">
                {lang === 'ru' ? 'Заказ принят!' : 'Buyurtma qabul qilindi!'}
              </h1>
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                {lang === 'ru'
                  ? 'Спасибо! Оператор свяжется с вами в течение 15 минут для подтверждения доставки.'
                  : 'Rahmat! Operator 15 daqiqa ichida yetkazib berishni tasdiqlash uchun bog‘lanadi.'}
              </p>
              {order && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-white font-mono text-sm font-bold mt-2">
                  <Package className="w-4 h-4 text-brand-red" />
                  <span>#{order.orderNumber}</span>
                </div>
              )}
            </div>
          </div>

          {order && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3">
                {lang === 'ru' ? 'Детали заказа' : 'Buyurtma tafsilotlari'}
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{lang === 'ru' ? 'Покупатель' : 'Xaridor'}:</span>
                  <span className="font-bold text-gray-900">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{lang === 'ru' ? 'Телефон' : 'Telefon'}:</span>
                  <span className="font-mono font-bold text-gray-900">{order.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{lang === 'ru' ? 'Регион' : 'Mintaqa'}:</span>
                  <span className="font-medium text-gray-900">{order.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{lang === 'ru' ? 'Адрес' : 'Manzil'}:</span>
                  <span className="font-medium text-gray-900 text-right max-w-[200px] truncate">{order.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{lang === 'ru' ? 'Доставка' : 'Yetkazib berish'}:</span>
                  <span className="font-bold text-emerald-700">{order.deliveryType === 'PICKUP' ? (lang === 'ru' ? 'Самовывоз (бесплатно)' : 'Olib ketish (bepul)') : lang === 'ru' ? 'Курьер' : 'Kuryer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{lang === 'ru' ? 'Оплата' : 'To‘lov'}:</span>
                  <span className="font-medium text-gray-900">{order.paymentMethod}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">{lang === 'ru' ? 'Товары' : 'Mahsulotlar'} ({order.items.length})</h4>
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm p-2.5 rounded-xl bg-[#F8F9FA] border border-gray-200">
                    <span className="font-medium text-gray-900 truncate max-w-[200px]">{item.productName} × {item.quantity}</span>
                    <span className="font-bold text-gray-900">{formatPrice(item.lineTotal, lang)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-xl font-black text-gray-900 pt-4 border-t border-gray-200 uppercase">
                <span>{lang === 'ru' ? 'Итого' : 'Jami'}:</span>
                <span className="text-brand-red">{formatPrice(order.totalAmount, lang)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Phone className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">15 daqiqa</div>
                <div className="text-xs text-gray-500">Operator bog'lanadi</div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">1-3 kun</div>
                <div className="text-xs text-gray-500">Yetkazib berish</div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">100% kafolat</div>
                <div className="text-xs text-gray-500">Sifatli material</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href={`/${lang}/catalog`} className="w-full sm:w-auto">
              <Button size="lg" className="w-full gap-2 rounded-full min-h-[48px] font-bold">
                <ShoppingBag className="w-5 h-5" />
                <span>{lang === 'ru' ? 'Продолжить покупки' : 'Xaridni davom ettirish'}</span>
              </Button>
            </Link>

            <a href={`tel:${COMPANY_CONTACTS.phoneRaw}`} className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full gap-2 rounded-full min-h-[48px] font-bold">
                <Phone className="w-5 h-5 text-brand-red" />
                <span>{COMPANY_CONTACTS.phoneDisplay}</span>
              </Button>
            </a>
          </div>

          <div className="text-center pt-4">
            <Link href={`/${lang}`} className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1">
              <span>{lang === 'ru' ? 'На главную' : 'Bosh sahifaga'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
