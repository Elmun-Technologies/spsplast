'use client';

import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getDictionary, Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';

export default function ContactPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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
          message,
          type: 'CONSULTATION',
        }),
      });

      if (res.ok) {
        setSent(true);
        trackEvent('generate_lead', { lead_type: 'CONSULTATION' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="px-3 py-1 rounded-full bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-bold uppercase tracking-wider">
          Bog‘lanish
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white">
          SPS PLAST Bilan Aloqaga Chiqing
        </h1>
        <p className="text-sm text-gray-300">
          Mahsulotlar mavjudligi, ulgurji buyurtma va texnik maslahatlar uchun telefon yoki messenjerlar orqali bog‘lanishingiz mumkin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-brand-border pb-3">
              Aloqa Rekvizitlari
            </h3>

            <div className="space-y-4 text-xs sm:text-sm">
              <a
                href="tel:+998901234567"
                onClick={() => trackEvent('phone_click', { location: 'contact_page' })}
                className="flex items-center gap-3 p-3 rounded-xl bg-brand-dark border border-brand-border hover:border-brand-red text-white transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-red/10 border border-brand-red/30 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-brand-red" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Telefon raqamimiz</p>
                  <p className="font-bold text-white text-base">+998 (90) 123-45-67</p>
                </div>
              </a>

              <a
                href="https://t.me/spsplast"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('telegram_click', { location: 'contact_page' })}
                className="flex items-center gap-3 p-3 rounded-xl bg-brand-dark border border-brand-border hover:border-brand-red text-white transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Telegram Menejer</p>
                  <p className="font-bold text-sky-400 text-sm">@spsplast_bot</p>
                </div>
              </a>

              <a
                href="https://wa.me/998901234567"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('whatsapp_click', { location: 'contact_page' })}
                className="flex items-center gap-3 p-3 rounded-xl bg-brand-dark border border-brand-border hover:border-brand-red text-white transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">WhatsApp Chat</p>
                  <p className="font-bold text-green-400 text-sm">+998 (90) 123-45-67</p>
                </div>
              </a>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-dark border border-brand-border text-white">
                <div className="w-10 h-10 rounded-lg bg-brand-card flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-brand-red" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Zavod Manzili</p>
                  <p className="font-bold text-white text-xs">Toshkent, Sergeli sanoat zonasi, 4-bino</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-dark border border-brand-border text-white">
                <div className="w-10 h-10 rounded-lg bg-brand-card flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Ish Vaqti</p>
                  <p className="font-bold text-white text-xs">Dushanba - Shanba: 09:00 - 18:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 bg-brand-card border border-brand-border rounded-2xl p-6 sm:p-8 space-y-6">
          <h3 className="text-xl font-bold text-white border-b border-brand-border pb-4">
            Xabar yoki Konsultatsiya So‘rovi Yuborish
          </h3>

          {sent ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto text-2xl font-bold">
                ✓
              </div>
              <h4 className="text-xl font-bold text-white">Xabaringiz Qabul Qilindi!</h4>
              <p className="text-xs text-gray-300">Tez orada mutaxassisimiz siz bilan bog‘lanadi.</p>
              <Button onClick={() => setSent(false)}>Boshqa xabar yuborish</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Ismingiz *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ali Vohidov"
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Telefon Raqamingiz *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998901234567"
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Savolingiz yoki Izoh
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Bruschatka qoliplari va ulgurji narxlar haqida ma’lumot berishingizni so‘rayman..."
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              <Button type="submit" isLoading={loading} size="lg" className="w-full font-bold">
                Xabarni Yuborish
              </Button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
