'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Price } from '@/components/ui/Price';
import { StockBadge } from '@/components/ui/StockBadge';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { Button } from '@/components/ui/Button';
import { LeadModal } from '@/components/lead/LeadModal';
import { Locale } from '@/lib/i18n';
import { Eye, ShoppingBag } from 'lucide-react';

/**
 * Tez ko'rish modali.
 *
 * Savat olib tashlangani uchun tugma endi to'g'ridan-to'g'ri zayafka formasini
 * ochadi (miqdor tanlagich qiymati formaga o'tadi).
 */
interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Locale;
  product: any;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ isOpen, onClose, lang, product }) => {
  const [qty, setQty] = useState(1);
  const [leadOpen, setLeadOpen] = useState(false);

  if (!product) return null;

  const title = lang === 'ru' ? product.titleRu : product.titleUz;
  const image = product.images?.[0]?.url;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative aspect-square bg-surface-soft rounded-[18px] overflow-hidden p-4">
            {image ? (
              <Image src={image} alt={title} fill sizes="(max-width: 768px) 100vw, 400px" className="object-contain p-4" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[12px] font-semibold text-ink-sub">SPS</div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] bg-surface-soft px-2.5 py-1 rounded-full text-ink-sub">SKU: {product.sku}</span>
              <StockBadge inStock={product.inStock} lang={lang} />
            </div>

            <h3 className="text-[18px] font-semibold text-ink leading-snug tracking-[-0.015em]">{title}</h3>

            <Price price={product.price} oldPrice={product.oldPrice} lang={lang} size="lg" showDiscountBadge />

            {product.dimensions && (
              <p className="text-sm text-ink-soft">
                {lang === 'ru' ? 'Размер' : 'O‘lchami'}:{' '}
                <span className="font-medium text-ink">{product.dimensions}</span>
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <QuantitySelector quantity={qty} onDecrease={() => setQty(Math.max(1, qty - 1))} onIncrease={() => setQty(qty + 1)} />
              <button
                onClick={() => setLeadOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-sm min-h-[46px] bg-brand-red text-white hover:bg-brand-red-dark transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                {lang === 'ru' ? 'Оставить заявку' : 'Zayafka berish'}
              </button>
            </div>

            <Link href={`/${lang}/product/${product.slug}`} onClick={onClose} className="block">
              <Button variant="outline" className="w-full gap-2">
                <Eye className="w-4 h-4" />
                {lang === 'ru' ? 'Подробнее' : 'Batafsil ko‘rish'}
              </Button>
            </Link>
          </div>
        </div>
      </Modal>

      {leadOpen && (
        <LeadModal
          isOpen
          onClose={() => setLeadOpen(false)}
          lang={lang}
          product={{ title, sku: product.sku }}
          defaultQuantity={qty}
        />
      )}
    </>
  );
};
