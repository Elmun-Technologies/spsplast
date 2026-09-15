'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ArrowRightLeft, Trash2 } from 'lucide-react';
import { useCompareStore } from '@/lib/store/compareStore';
import { Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';

interface CompareBarProps {
  lang: Locale;
}

export const CompareBar: React.FC<CompareBarProps> = ({ lang }) => {
  const items = useCompareStore((s) => s.items);
  const remove = useCompareStore((s) => s.removeCompare);
  const clear = useCompareStore((s) => s.clearCompare);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-3xl bg-ink border border-gray-800 rounded-[20px] shadow-pop p-3 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-[16px] bg-surface/10 flex items-center justify-center">
          <ArrowRightLeft className="w-5 h-5 text-white" />
        </div>
        <div className="text-white">
          <div className="text-sm font-bold">{lang === 'ru' ? `Сравнение (${items.length})` : `Taqqoslash (${items.length})`}</div>
          <div className="text-xs text-ink-sub hidden sm:block">{items.map((i) => i.title.slice(0, 20)).join(', ')}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2">
          {items.slice(0, 4).map((item) => (
            <div key={item.id} className="relative w-10 h-10 rounded-lg bg-surface border border-line p-1">
              <Image src={item.image} alt={item.title} fill sizes="40px" className="object-contain p-1" />
              <button
                onClick={() => remove(item.id)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        <button onClick={clear} className="p-2 text-ink-sub hover:text-white">
          <Trash2 className="w-4 h-4" />
        </button>

        <Link href={`/${lang}/compare`}>
          <Button size="sm" className="rounded-[16px] gap-1.5 bg-surface text-black hover:bg-surface-soft font-bold">
            <span>{lang === 'ru' ? 'Сравнить' : 'Taqqoslash'}</span>
            <ArrowRightLeft className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
