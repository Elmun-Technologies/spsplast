'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Price } from '@/components/ui/Price';
import { StockBadge } from '@/components/ui/StockBadge';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/lib/store/cartStore';
import { formatPrice } from '@/lib/utils';
import { Locale } from '@/lib/i18n';
import { ShoppingCart, Check, Eye } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Locale;
  product: any;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ isOpen, onClose, lang, product }) => {
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const title = lang === 'ru' ? product.titleRu : product.titleUz;
  const image = product.images?.[0]?.url;

  const handleAdd = () => {
    addItem({
      productId: product.id,
      title,
      sku: product.sku,
      price: product.price,
      image: image || '',
      quantity: qty,
    });
    trackEvent('add_to_cart', { item_id: product.id, from: 'quick_view' });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative aspect-square bg-[#F8F9FA] rounded-xl border border-gray-200 overflow-hidden p-4">
          {image ? <Image src={image} alt={title} fill className="object-contain p-4" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">SPS</div>}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">SKU: {product.sku}</span>
            <StockBadge inStock={product.inStock} lang={lang} />
          </div>

          <h3 className="text-lg font-bold text-gray-900 leading-tight">{title}</h3>

          <Price price={product.price} oldPrice={product.oldPrice} lang={lang} size="lg" showDiscountBadge />

          {product.dimensions && <p className="text-sm text-gray-600">O‘lchami: <span className="font-mono font-bold text-gray-900">{product.dimensions}</span></p>}

          <div className="flex items-center gap-3 pt-2">
            <QuantitySelector quantity={qty} onDecrease={() => setQty(Math.max(1, qty - 1))} onIncrease={() => setQty(qty + 1)} />
            <button
              onClick={handleAdd}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm min-h-[44px] ${added ? 'bg-emerald-600 text-white' : 'bg-brand-red text-white hover:bg-brand-red-dark'}`}
            >
              {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              {added ? 'Savatda' : 'Savatga'}
            </button>
          </div>

          <Link href={`/${lang}/product/${product.slug}`} onClick={onClose} className="block">
            <Button variant="outline" className="w-full rounded-xl gap-2">
              <Eye className="w-4 h-4" />
              {lang === 'ru' ? 'Подробнее' : 'Batafsil ko‘rish'}
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
};
