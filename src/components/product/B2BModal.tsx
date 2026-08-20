'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { getDictionary, Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';

interface B2BModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Locale;
  productName?: string;
  productId?: string;
}

export const B2BModal: React.FC<B2BModalProps> = ({
  isOpen,
  onClose,
  lang,
  productName,
  productId,
}) => {
  const dict = getDictionary(lang);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [company, setCompany] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          company,
          quantity: parseInt(quantity, 10) || 1,
          productId,
          message: productName ? `Mahsulot: ${productName}. ${message}` : message,
          type: 'B2B_WHOLESALE',
        }),
      });

      if (res.ok) {
        setSuccess(true);
        trackEvent('generate_lead', {
          lead_type: 'B2B_WHOLESALE',
          product_name: productName,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setName('');
    setPhone('+998');
    setCompany('');
    setQuantity('100');
    setMessage('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleReset} title={dict.b2bModal.title}>
      {success ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>
          <h4 className="text-lg font-bold text-white">So‘rovingiz qabul qilindi!</h4>
          <p className="text-xs text-gray-300">
            Mutaxassisimiz tez orada siz bilan bog‘lanib, ulgurji narx va maxsus chegirmalarni taqdim etadi.
          </p>
          <Button onClick={handleReset} className="w-full mt-4">
            Tushunarli
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-gray-400 mb-2">{dict.b2bModal.subtitle}</p>

          {productName && (
            <div className="p-2.5 rounded-lg bg-brand-dark border border-brand-border text-xs text-brand-red font-semibold">
              Mahsulot: {productName}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Ismingiz *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Sardor"
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Telefon raqamingiz *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998901234567"
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              {dict.b2bModal.company}
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Masalan: ООО Bruschatka Plus"
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              {dict.b2bModal.quantity}
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="100"
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Qo‘shimcha savol yoki talablar
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Yetkazib berish joyi, to‘lov shakli..."
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <Button type="submit" isLoading={loading} className="w-full mt-2 font-bold">
            {dict.b2bModal.submit}
          </Button>
        </form>
      )}
    </Modal>
  );
};
