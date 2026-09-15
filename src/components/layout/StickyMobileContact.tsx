'use client';

import React, { useState } from 'react';
import { Phone, Send, ShoppingCart, MessageSquare, ChevronUp, X } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { useUIStore } from '@/lib/store/uiStore';
import { trackEvent } from '@/lib/analytics';
import { COMPANY_CONTACTS } from '@/lib/constants/contacts';

export const StickyMobileContact: React.FC<{ lang?: string }> = () => {
  const cartTotalItems = useCartStore((s) => s.getTotalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const bottomBarOwner = useUIStore((s) => s.bottomBarOwner);
  const [contactOpen, setContactOpen] = useState(false);

  // Yields the bottom edge to the product page's sticky "add to cart" bar.
  const hidden = bottomBarOwner === 'product';

  return (
    <>
      {/* Contact sheet */}
      {contactOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex items-end justify-center p-4 pb-20">
          <div className="absolute inset-0 bg-black/40" onClick={() => setContactOpen(false)} />
          <div className="relative w-full max-w-sm bg-surface rounded-[20px] shadow-pop border border-line overflow-hidden animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between p-4 border-b border-line-soft">
              <h4 className="text-[15px] font-semibold text-ink">Aloqa usullari</h4>
              <button onClick={() => setContactOpen(false)} className="p-1.5 rounded-full text-ink-sub hover:bg-surface-soft transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 space-y-2">
              <a
                href={`tel:${COMPANY_CONTACTS.phoneRaw}`}
                onClick={() => trackEvent('phone_click', { location: 'sticky_mobile_sheet' })}
                className="flex items-center gap-3 p-3 rounded-[16px] bg-emerald-50 border text-emerald-900 hover:bg-emerald-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-[14px] bg-emerald-600 flex items-center justify-center text-white">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Qo'ng'iroq qilish</div>
                  <div className="text-xs text-emerald-700">{COMPANY_CONTACTS.phoneDisplay}</div>
                </div>
              </a>
              <a
                href={COMPANY_CONTACTS.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('telegram_click', { location: 'sticky_mobile_sheet' })}
                className="flex items-center gap-3 p-3 rounded-[16px] bg-sky-50 border border-sky-200 text-sky-900 hover:bg-sky-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-[14px] bg-sky-600 flex items-center justify-center text-white">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Telegram</div>
                  <div className="text-xs text-sky-700">{COMPANY_CONTACTS.telegramHandle}</div>
                </div>
              </a>
              <a
                href={COMPANY_CONTACTS.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('whatsapp_click', { location: 'sticky_mobile_sheet' })}
                className="flex items-center gap-3 p-3 rounded-[16px] bg-green-50 border border-green-200 text-green-900 hover:bg-green-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-[14px] bg-green-600 flex items-center justify-center text-white">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">WhatsApp</div>
                  <div className="text-xs text-green-700">{COMPANY_CONTACTS.phoneDisplay}</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-line px-3 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-transform duration-300 ${hidden ? 'translate-y-full' : 'translate-y-0'}`}
        aria-hidden={hidden}
      >
        <div className="flex items-center gap-2.5 max-w-md mx-auto">
          {/* Contact Dropdown Trigger */}
          <button
            onClick={() => setContactOpen(!contactOpen)}
            tabIndex={hidden ? -1 : undefined}
            className="flex flex-1 items-center justify-center gap-2 py-3 px-4 rounded-[16px] bg-ink text-white font-bold text-sm hover:bg-black transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>Aloqa</span>
            <ChevronUp className={`w-4 h-4 transition-transform ${contactOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Cart Trigger - bigger touch target 44px */}
          <button
            onClick={toggleCart}
            tabIndex={hidden ? -1 : undefined}
            className="relative flex items-center justify-center gap-2 py-3 px-5 rounded-full bg-brand-red text-white hover:bg-brand-red-dark transition-colors font-semibold text-sm shadow-red min-h-[46px]"
            aria-label="Savatni ochish"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Savat</span>
            {cartTotalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-ink text-white rounded-full text-xs font-bold flex items-center justify-center px-1 ring-2 ring-white">
                {cartTotalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
