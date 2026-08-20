'use client';

import React from 'react';
import { Phone, Send, ShoppingCart, MessageSquare } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { trackEvent } from '@/lib/analytics';

export const StickyMobileContact: React.FC = () => {
  const cartTotalItems = useCartStore((s) => s.getTotalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-card/95 backdrop-blur-md border-t border-brand-border px-4 py-2.5 shadow-2xl">
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        {/* Phone Call */}
        <a
          href="tel:+998901234567"
          onClick={() => trackEvent('phone_click', { location: 'sticky_mobile' })}
          className="flex flex-1 items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Qo‘ng‘iroq</span>
        </a>

        {/* Telegram */}
        <a
          href="https://t.me/spsplast"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('telegram_click', { location: 'sticky_mobile' })}
          className="flex flex-1 items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Telegram</span>
        </a>

        {/* WhatsApp */}
        <a
          href="https://wa.me/998901234567"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('whatsapp_click', { location: 'sticky_mobile' })}
          className="flex flex-1 items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-xs transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </a>

        {/* Cart Trigger */}
        <button
          onClick={toggleCart}
          className="relative flex items-center justify-center p-2.5 rounded-lg bg-brand-red text-white hover:bg-brand-red-dark transition-colors"
          aria-label="Cart"
        >
          <ShoppingCart className="w-4 h-4" />
          {cartTotalItems > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-brand-red rounded-full text-[10px] font-bold flex items-center justify-center">
              {cartTotalItems}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
