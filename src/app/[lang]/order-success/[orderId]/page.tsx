import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { CheckCircle2, ShoppingBag, PhoneCall } from 'lucide-react';

interface OrderSuccessPageProps {
  params: { lang: Locale; orderId: string };
}

export default async function OrderSuccessPage({
  params: { lang, orderId },
}: OrderSuccessPageProps) {
  const dict = getDictionary(lang);

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
      
      <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black text-white">Buyurtmangiz Muvaffaqiyatli Qabul Qilindi!</h1>
        {order && (
          <p className="text-sm text-brand-red font-mono font-bold">
            Buyurtma Raqami: #{order.orderNumber}
          </p>
        )}
      </div>

      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 text-left space-y-4 text-xs sm:text-sm">
        <p className="text-gray-300 leading-relaxed">
          Rahmat, <span className="font-bold text-white">{order?.customerName}</span>! Operatorimiz tez orada kiritilgan <span className="font-bold text-white">{order?.customerPhone}</span> raqamingiz bo‘yicha bog‘lanadi va yetkazib berish tafsilotlarini tasdiqlaydi.
        </p>

        {order && (
          <div className="border-t border-brand-border pt-4 space-y-2">
            <div className="flex justify-between text-gray-400">
              <span>Manzil:</span>
              <span className="text-white font-medium">{order.region}, {order.address}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Jami Summa:</span>
              <span className="text-white font-extrabold text-base">{formatPrice(order.totalAmount, lang)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link href={`/${lang}/catalog`}>
          <Button size="lg" className="gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>Xaridni davom ettirish</span>
          </Button>
        </Link>

        <a href="tel:+998901234567">
          <Button size="lg" variant="secondary" className="gap-2">
            <PhoneCall className="w-4 h-4 text-brand-red" />
            <span>Operator bilan bog‘lanish</span>
          </Button>
        </a>
      </div>

    </div>
  );
}
