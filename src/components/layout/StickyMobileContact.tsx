'use client';

import React, { useState } from 'react';
import { Phone, Send, ShoppingCart, MessageSquare, ChevronUp, X } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { trackEvent } from '@/lib/analytics';
import { COMPANY_CONTACTS } from '@/lib/constants/contacts';

export const StickyMobileContact: React.FC = () => {
  const cartTotalItems = useCartStore((s) => s.getTotalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      {/* Contact sheet */}
      {contactOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex items-end justify-center p-4 pb-20">
          <div className="absolute inset-0 bg-black/40" onClick={() => setContactOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-900">Aloqa usullari</h4>
              <button onClick={() => setContactOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 space-y-2">
              <a
                href={`tel:${COMPANY_CONTACTS.phoneRaw}`}
                onClick={() => trackEvent('phone_click', { location: 'sticky_mobile_sheet' })}
                className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 hover:bg-emerald-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
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
                className="flex items-center gap-3 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 hover:bg-sky-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center text-white">
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
                className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200 text-green-900 hover:bg-green-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white">
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

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-2.5 max-w-md mx-auto">
          {/* Contact Dropdown Trigger */}
          <button
            onClick={() => setContactOpen(!contactOpen)}
            className="flex flex-1 items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-black transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>Aloqa</span>
            <ChevronUp className={`w-4 h-4 transition-transform ${contactOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Cart Trigger - bigger touch target 44px */}
          <button
            onClick={toggleCart}
            className="relative flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-brand-red text-white hover:bg-brand-red-dark transition-colors font-bold text-sm shadow-red min-h-[44px]"
            aria-label="Savatni ochish"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Savat</span>
            {cartTotalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-gray-900 text-white rounded-full text-xs font-bold flex items-center justify-center px-1 border-2 border-white">
                {cartTotalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
