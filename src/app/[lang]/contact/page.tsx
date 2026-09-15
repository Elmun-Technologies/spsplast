'use client';

import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { getDictionary, Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';
import { COMPANY_CONTACTS } from '@/lib/constants/contacts';

function formatPhone(value: string) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('998')) digits = digits.slice(3);
  digits = digits.slice(0, 9);
  if (!digits) return '+998';
  let formatted = '+998';
  if (digits.length > 0) formatted += ' ' + digits.slice(0, 2);
  if (digits.length > 2) formatted += ' ' + digits.slice(2, 5);
  if (digits.length > 5) formatted += ' ' + digits.slice(5, 7);
  if (digits.length > 7) formatted += ' ' + digits.slice(7, 9);
  return formatted;
}

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
          phone: phone.replace(/\s/g, ''),
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
    <div className="bg-surface-page min-h-screen text-ink">
      <Container>
        <div className="py-12 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex px-3 py-1 rounded-full bg-[#FEF0F0] text-brand-red text-[12px] font-semibold">
              {lang === 'ru' ? 'Контакты' : 'Bog‘lanish'}
            </span>
            <h1 className="text-[30px] sm:text-[42px] font-bold text-ink tracking-[-0.03em] leading-[1.1]">
              SPS {lang === 'ru' ? 'Свяжитесь с нами' : 'Bilan aloqaga chiqing'}
            </h1>
            <p className="text-sm sm:text-base text-ink-soft">
              {lang === 'ru'
                ? 'По вопросам наличия, оптовых заказов и технической консультации свяжитесь по телефону или мессенджерам.'
                : 'Mahsulotlar mavjudligi, ulgurji buyurtma va texnik maslahatlar uchun telefon yoki messenjerlar orqali bog‘lanishingiz mumkin.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Contact Info Cards */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-surface border border-line rounded-[20px] p-6 space-y-4 shadow-card">
                <h3 className="text-base font-bold text-ink border-b border-line-soft pb-3">
                  {lang === 'ru' ? 'Реквизиты' : 'Aloqa rekvizitlari'}
                </h3>

                <div className="space-y-3">
                  <a
                    href={`tel:${COMPANY_CONTACTS.phoneRaw}`}
                    onClick={() => trackEvent('phone_click', { location: 'contact_page' })}
                    className="flex items-center gap-3 p-4 rounded-[16px] bg-surface-soft border border-line hover:border-brand-red hover:bg-[#FEF0F0] text-ink transition-colors group"
                  >
                    <div className="w-11 h-11 rounded-[16px] bg-surface border border-line group-hover:border-red-200 flex items-center justify-center shrink-0 shadow-card">
                      <Phone className="w-5 h-5 text-brand-red" />
                    </div>
                    <div>
                      <p className="text-ink-sub text-xs">{lang === 'ru' ? 'Телефон' : 'Telefon raqamimiz'}</p>
                      <p className="font-bold text-ink text-base">{COMPANY_CONTACTS.phoneDisplay}</p>
                    </div>
                  </a>

                  <a
                    href={COMPANY_CONTACTS.telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent('telegram_click', { location: 'contact_page' })}
                    className="flex items-center gap-3 p-4 rounded-[16px] bg-surface-soft border border-line hover:border-sky-300 hover:bg-sky-50 text-ink transition-colors group"
                  >
                    <div className="w-11 h-11 rounded-[16px] bg-surface border border-line group-hover:border-sky-200 flex items-center justify-center shrink-0 shadow-card">
                      <Send className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-ink-sub text-xs">Telegram</p>
                      <p className="font-bold text-sky-700 text-sm">{COMPANY_CONTACTS.telegramHandle}</p>
                    </div>
                  </a>

                  <a
                    href={COMPANY_CONTACTS.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent('whatsapp_click', { location: 'contact_page' })}
                    className="flex items-center gap-3 p-4 rounded-[16px] bg-surface-soft border border-line hover:border-green-300 hover:bg-green-50 text-ink transition-colors group"
                  >
                    <div className="w-11 h-11 rounded-[16px] bg-surface border border-line group-hover:border-green-200 flex items-center justify-center shrink-0 shadow-card">
                      <MessageSquare className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-ink-sub text-xs">WhatsApp</p>
                      <p className="font-bold text-green-700 text-sm">{COMPANY_CONTACTS.phoneDisplay}</p>
                    </div>
                  </a>

                  <div className="flex items-center gap-3 p-4 rounded-[16px] bg-surface-soft border border-line">
                    <div className="w-11 h-11 rounded-[16px] bg-surface border border-line flex items-center justify-center shrink-0 shadow-card">
                      <MapPin className="w-5 h-5 text-brand-red" />
                    </div>
                    <div>
                      <p className="text-ink-sub text-xs">{lang === 'ru' ? 'Адрес завода' : 'Zavod manzili'}</p>
                      <p className="font-bold text-ink text-sm">{lang === 'ru' ? COMPANY_CONTACTS.addressRu : COMPANY_CONTACTS.addressUz}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-[16px] bg-surface-soft border border-line">
                    <div className="w-11 h-11 rounded-[16px] bg-surface border border-line flex items-center justify-center shrink-0 shadow-card">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-ink-sub text-xs">{lang === 'ru' ? 'Время работы' : 'Ish vaqti'}</p>
                      <p className="font-bold text-ink text-sm">Dushanba - Shanba: 09:00 - 18:00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7 bg-surface border border-line rounded-[20px] p-6 sm:p-8 space-y-6 shadow-card">
              <h3 className="text-lg font-bold text-ink border-b border-line-soft pb-4">
                {lang === 'ru' ? 'Отправить сообщение' : 'Xabar yoki konsultatsiya so‘rovi yuborish'}
              </h3>

              {sent ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-[20px] bg-emerald-100 text-emerald-600 border flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold text-ink">{lang === 'ru' ? 'Сообщение получено!' : 'Xabaringiz qabul qilindi!'}</h4>
                  <p className="text-sm text-ink-soft max-w-sm mx-auto">
                    {lang === 'ru' ? 'Наш специалист свяжется с вами в ближайшее время.' : 'Tez orada mutaxassisimiz siz bilan bog‘lanadi.'}
                  </p>
                  <Button onClick={() => setSent(false)} className="mt-2">
                    {lang === 'ru' ? 'Отправить еще' : 'Boshqa xabar yuborish'}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-ink-soft mb-1.5">
                      {lang === 'ru' ? 'Ваше имя' : 'Ismingiz'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ali Vohidov"
                      className="w-full bg-surface border border-[#DDE3EB] rounded-[16px] px-4 py-3 text-[16px] md:text-sm text-ink focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 min-h-[48px]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink-soft mb-1.5">
                      {lang === 'ru' ? 'Телефон' : 'Telefon raqamingiz'} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="+998 90 123 45 67"
                      className="w-full bg-surface border border-[#DDE3EB] rounded-[16px] px-4 py-3 text-[16px] md:text-sm text-ink focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 min-h-[48px] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink-soft mb-1.5">
                      {lang === 'ru' ? 'Сообщение' : 'Savolingiz yoki izoh'}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={lang === 'ru' ? 'Расскажите, что вас интересует...' : 'Bruschatka qoliplari va ulgurji narxlar haqida ma’lumot berishingizni so‘rayman...'}
                      className="w-full bg-surface border border-[#DDE3EB] rounded-[16px] px-4 py-3 text-[16px] md:text-sm text-ink focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
                    />
                  </div>

                  <Button type="submit" isLoading={loading} size="lg" className="w-full font-bold rounded-[16px] min-h-[48px]">
                    {lang === 'ru' ? 'Отправить сообщение' : 'Xabarni yuborish'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
