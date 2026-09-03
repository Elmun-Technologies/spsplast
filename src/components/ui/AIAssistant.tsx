'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Calculator, Package, Phone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';
import Link from 'next/link';

interface AIAssistantProps {
  lang: Locale;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actions?: { label: string; href?: string; onClick?: () => void }[];
}

const QUICK_QUESTIONS = [
  { uz: 'Qancha qolip kerak? 50m² uchun', ru: 'Сколько нужно форм для 50м²?' },
  { uz: 'Ulgurji narx bormi?', ru: 'Есть ли оптовые скидки?' },
  { uz: 'Yetkazib berish qancha?', ru: 'Сколько стоит доставка?' },
  { uz: 'Qaysi qolipni tanlash kerak?', ru: 'Какую форму выбрать?' },
];

function getBotResponse(input: string, lang: Locale): Message {
  const lower = input.toLowerCase();

  if (lower.includes('50') && (lower.includes('m²') || lower.includes('m2') || lower.includes('kvadrat') || lower.includes('площадь'))) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      text:
        lang === 'ru'
          ? 'Для 50м² брусчатки 30x30 нужно примерно 550 форм (11 шт на 1м²). При заказе от 50 шт скидка -10%. Хотите, я посчитаю точнее?'
          : '50m² bruschatka 30x30 uchun taxminan 550 ta qolip kerak (1m² ga 11 dona). 50+ donada -10% chegirma. Aniqroq hisoblab beraymi?',
      actions: [
        { label: lang === 'ru' ? 'Перейти в каталог' : 'Katalogga o‘tish', href: `/${lang}/catalog?category=bruschatka-qoliplari` },
        { label: lang === 'ru' ? 'Калькулятор' : 'Kalkulyator', href: `/${lang}/catalog` },
      ],
    };
  }

  if (lower.includes('ulgurji') || lower.includes('опт') || lower.includes('chegirma') || lower.includes('скидк')) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      text:
        lang === 'ru'
          ? 'Да, оптовые скидки: 10-49 шт -5%, 50+ шт -10%. Для юр. лиц договор и счет-фактура. Оставьте заявку, менеджер предложит персональную цену.'
          : 'Ha, ulgurji chegirmalar: 10-49 dona -5%, 50+ dona -10%. Yuridik shaxslar uchun shartnoma va hisob-faktura. So‘rov qoldiring, menejer shaxsiy narx beradi.',
      actions: [{ label: lang === 'ru' ? 'Запросить опт' : 'Ulgurji so‘rash', href: `/${lang}/contact` }],
    };
  }

  if (lower.includes('yetkazib') || lower.includes('доставк') || lower.includes('toshkent') || lower.includes('viloyat')) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      text:
        lang === 'ru'
          ? 'Доставка: Ташкент — 1 день от 50,000 сум, регионы — 1-3 дня. От 1,000,000 сум бесплатно. Самовывоз из Сергели — бесплатно 09:00-18:00.'
          : 'Yetkazib berish: Toshkent — 1 kun 50,000 so‘mdan, viloyatlar — 1-3 kun. 1,000,000 so‘mdan yuqori bepul. Sergeli omboridan olib ketish bepul 09:00-18:00.',
      actions: [{ label: lang === 'ru' ? 'Условия доставки' : 'Yetkazib berish shartlari', href: `/${lang}/delivery-payment` }],
    };
  }

  if (lower.includes('qaysi') || lower.includes('tanlash') || lower.includes('выбрать') || lower.includes('какую')) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      text:
        lang === 'ru'
          ? 'Для начала бизнеса советую 30x30 "8 кирпичей" — самая популярная. Для фасада — термопанель "Кирпич". Для бордюров — 50x20. Расскажите, для чего вам формы?'
          : 'Biznes boshlash uchun 30x30 "8 kirpich" — eng ommabop. Fasad uchun termopanel "G‘isht". Bordyur uchun 50x20. Qoliplar nima uchun kerakligini ayting?',
      actions: [
        { label: 'Bruschatka', href: `/${lang}/catalog?category=bruschatka-qoliplari` },
        { label: 'Termopanel', href: `/${lang}/catalog?category=termopanel` },
      ],
    };
  }

  if (lower.includes('material') || lower.includes('abs') || lower.includes('plastik') || lower.includes('resurs') || lower.includes('300')) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      text:
        lang === 'ru'
          ? 'Наши формы изготовлены из полипропилена и АБС пластика. Ресурс зависит от модели и условий использования — уточните у менеджера.'
          : 'Qoliplarimiz polipropilen va ABS plastikdan tayyorlanadi. Resurs modelga va ishlatish shartlariga bog‘liq — menejerdan aniqlashtiring.',
    };
  }

  return {
    id: Date.now().toString(),
    role: 'assistant',
    text:
      lang === 'ru'
        ? 'Я помогу выбрать формы, посчитать количество для вашей площади и оформить оптовый заказ. Задайте вопрос или выберите быстрый вариант ниже.'
        : 'Men sizga qolip tanlash, maydon bo‘yicha hisoblash va ulgurji buyurtma berishda yordam beraman. Savol bering yoki tezkor variantni tanlang.',
    actions: [
      { label: lang === 'ru' ? 'Каталог' : 'Katalog', href: `/${lang}/catalog` },
      { label: lang === 'ru' ? 'Связаться' : 'Bog‘lanish', href: `/${lang}/contact` },
    ],
  };
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ lang }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: lang === 'ru' ? 'Привет! Я помощник SPS. Чем могу помочь?' : 'Salom! Men SPS yordamchisiman. Qanday yordam bera olaman?',
      actions: QUICK_QUESTIONS.slice(0, 3).map((q) => ({ label: lang === 'ru' ? q.ru : q.uz })),
    },
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    trackEvent('ai_chat_message', { message: text });

    setTimeout(() => {
      const botMsg = getBotResponse(text, lang);
      setMessages((prev) => [...prev, botMsg]);
    }, 600);

    setInput('');
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-40 w-14 h-14 rounded-full bg-brand-red text-white shadow-red flex items-center justify-center hover:bg-brand-red-dark hover:scale-105 transition-all"
          aria-label="AI yordamchi"
        >
          <Bot className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-0 lg:bottom-6 right-0 lg:right-6 z-50 w-full lg:w-[380px] h-[70vh] lg:h-[520px] bg-white border border-gray-200 lg:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-2">
          <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold">SPS AI</div>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {lang === 'ru' ? 'Онлайн' : 'Onlayn'}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-2 hover:bg-white/10 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8F9FA]">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-3.5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-brand-red text-white rounded-br-md' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md shadow-xs'}`}>
                  <div>{m.text}</div>
                  {m.actions && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {m.actions.map((a, idx) => (
                        <button
                          key={idx}
                          onClick={() => (a.href ? (window.location.href = a.href) : a.onClick ? a.onClick() : sendMessage(a.label))}
                          className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-900 hover:text-white border border-gray-200 text-xs font-semibold transition-colors"
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {QUICK_QUESTIONS.slice(0, 4).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(lang === 'ru' ? q.ru : q.uz)}
                  className="px-2.5 py-1 rounded-full bg-[#F8F9FA] border border-gray-200 text-xs text-gray-700 hover:border-brand-red hover:text-brand-red hover:bg-red-50 transition-colors"
                >
                  {lang === 'ru' ? q.ru : q.uz}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={lang === 'ru' ? 'Напишите сообщение...' : 'Xabar yozing...'}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-sm focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 outline-none min-h-[44px]"
              />
              <button type="submit" className="w-11 h-11 rounded-xl bg-brand-red text-white flex items-center justify-center hover:bg-brand-red-dark shrink-0">
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
