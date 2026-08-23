'use client';

import React from 'react';
import Link from 'next/link';
import { Package, Search, Heart, ArrowRightLeft, ShoppingBag } from 'lucide-react';
import { Button } from './Button';
import { Locale } from '@/lib/i18n';

interface EmptyStateProps {
  lang: Locale;
  type: 'search' | 'catalog' | 'wishlist' | 'compare' | 'cart';
  query?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ lang, type, query }) => {
  const configs = {
    search: {
      icon: Search,
      titleUz: query ? `"${query}" topilmadi` : 'Qidiruv natijasi yo‘q',
      titleRu: query ? `По запросу "${query}" ничего не найдено` : 'Ничего не найдено',
      descUz: 'SKU, o‘lcham yoki nomni tekshirib, qayta urinib ko‘ring. Yoki kategoriyalardan tanlang.',
      descRu: 'Проверьте артикул, размер или название и попробуйте снова.',
      cta: lang === 'ru' ? 'В каталог' : 'Katalogga o‘tish',
      href: `/${lang}/catalog`,
    },
    catalog: {
      icon: Package,
      titleUz: 'Mahsulotlar topilmadi',
      titleRu: 'Товары не найдены',
      descUz: 'Tanlangan filtrga mos mahsulot yo‘q. Filtrlarni tozalab qayta urinib ko‘ring.',
      descRu: 'Нет товаров по выбранным фильтрам. Сбросьте фильтры.',
      cta: lang === 'ru' ? 'Сбросить фильтры' : 'Filtrlarni tozalash',
      href: `/${lang}/catalog`,
    },
    wishlist: {
      icon: Heart,
      titleUz: 'Sevimlilar bo‘sh',
      titleRu: 'Избранное пусто',
      descUz: 'Yoqqan mahsulotlarni yurakchani bosib saqlang, keyin bu yerda ko‘rasiz.',
      descRu: 'Сохраняйте товары, нажимая на сердце.',
      cta: lang === 'ru' ? 'В каталог' : 'Katalogga',
      href: `/${lang}/catalog`,
    },
    compare: {
      icon: ArrowRightLeft,
      titleUz: 'Taqqoslash bo‘sh',
      titleRu: 'Сравнение пусто',
      descUz: '4 tagacha mahsulotni taqqoslash uchun qo‘shing, farqlarini yonma-yon ko‘rasiz.',
      descRu: 'Добавьте до 4 товаров для сравнения.',
      cta: lang === 'ru' ? 'В каталог' : 'Katalogga',
      href: `/${lang}/catalog`,
    },
    cart: {
      icon: ShoppingBag,
      titleUz: 'Savat bo‘sh',
      titleRu: 'Корзина пуста',
      descUz: 'Hozircha savatda hech narsa yo‘q. Katalogdan tanlashni boshlang.',
      descRu: 'В корзине пока ничего нет. Начните с каталога.',
      cta: lang === 'ru' ? 'В каталог' : 'Katalogga o‘tish',
      href: `/${lang}/catalog`,
    },
  };

  const cfg = configs[type];
  const Icon = cfg.icon;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-10 sm:p-14 text-center shadow-sm max-w-2xl mx-auto">
      {/* Custom industrial illustration — no AI feel, pure CSS */}
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 bg-[#F8F9FA] border-2 border-dashed border-gray-200 rounded-2xl rotate-3" />
        <div className="absolute inset-0 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-center -rotate-2">
          <Icon className="w-10 h-10 text-gray-300" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">!</div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 tracking-tight">{lang === 'ru' ? (cfg as any).titleRu : (cfg as any).titleUz}</h3>
      <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">{lang === 'ru' ? (cfg as any).descRu : (cfg as any).descUz}</p>

      <Link href={cfg.href} className="inline-flex mt-6">
        <Button className="rounded-xl gap-2 font-bold min-h-[44px]">
          <span>{cfg.cta}</span>
        </Button>
      </Link>
    </div>
  );
};
