'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw, Phone } from 'lucide-react';
import { COMPANY_CONTACTS } from '@/lib/constants/contacts';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const pathname = usePathname();
  const isRu = Boolean(pathname?.startsWith('/ru'));
  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <div className="bg-[#F8F9FA] min-h-screen py-16">
      <Container>
        <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-brand-red" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">
            {isRu ? 'Что-то пошло не так' : 'Xatolik yuz berdi'}
          </h1>
          {/* Raw error text is only shown in development — production users get an actionable message */}
          <p className="text-sm text-gray-500">
            {isDev && error?.message
              ? error.message
              : isRu
              ? 'Страница не загрузилась. Попробуйте ещё раз или свяжитесь с нами — поможем оформить заказ.'
              : 'Sahifa yuklanmadi. Qayta urinib ko‘ring yoki biz bilan bog‘laning — buyurtmani birga rasmiylashtiramiz.'}
          </p>

          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full rounded-xl gap-2 min-h-[48px]">
              <RefreshCw className="w-4 h-4" />
              {isRu ? 'Загрузить снова' : 'Qayta yuklash'}
            </Button>

            <Link
              href={`/${isRu ? 'ru' : 'uz'}`}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm font-bold text-gray-900 hover:bg-gray-50 min-h-[48px]"
            >
              {isRu ? 'На главную' : 'Bosh sahifaga'}
            </Link>
          </div>

          <a
            href={`tel:${COMPANY_CONTACTS.phoneRaw}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-red hover:underline pt-1"
          >
            <Phone className="w-4 h-4" />
            {COMPANY_CONTACTS.phoneDisplay}
          </a>
        </div>
      </Container>
    </div>
  );
}
