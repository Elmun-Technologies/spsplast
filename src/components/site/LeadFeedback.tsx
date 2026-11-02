'use client';

import { useEffect, useRef } from 'react';
import type { Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import { isValidIntlPhone } from '@/lib/phone';

/**
 * Zayafka formalari uchun umumiy xato/muvaffaqiyat holati (audit 2026-11-02, 1 va 7-bandlar).
 *
 * - Xato matni turiga qarab: ism, telefon, tarmoq, juda ko'p so'rov, yetkazilmadi.
 * - Zayafka yetmagan har qanday holatda mijozga qo'ng'iroq / Telegram / WhatsApp tugmalari
 *   ko'rsatiladi — mijoz yo'qolmaydi.
 * - Brauzerning (ko'pincha inglizcha) `required` xabarlari o'rniga `checkLead()` — formalar
 *   `noValidate` bilan ishlaydi.
 */
export type LeadError = 'name' | 'bad_phone' | 'validation' | 'rate_limit' | 'network' | 'not_delivered' | string;

/** Yuborishdan oldingi tekshiruv: `null` — hammasi joyida. */
export function checkLead(name: string, phone: string, dial?: string): LeadError | null {
  if (name.trim().length < 2) return 'name';
  if (!isValidIntlPhone(phone, dial)) return 'bad_phone';
  return null;
}

/** Bu xatolarda mijoz o'zi tuzatadi — kontakt tugmalari kerak emas. */
const FIXABLE = new Set(['name', 'bad_phone', 'validation']);

export function LeadFormError({ lang, error }: { lang: Locale; error: LeadError }) {
  const t = getUi(lang).catalog;
  // Mobilda xato tugma ostida, ekrandan tashqarida qolmasin.
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'nearest' });
  }, [error]);
  const text =
    error === 'name'
      ? t.formErrorName
      : error === 'bad_phone'
        ? t.formErrorPhone
        : error === 'validation'
          ? t.formError
          : error === 'rate_limit'
            ? t.formRateLimit
            : error === 'network'
              ? t.formErrorNetwork
              : t.formErrorDelivery;
  return (
    <div className="sps-form__error lead-err" role="alert" ref={ref}>
      <span>{text}</span>
      {!FIXABLE.has(error) ? (
        <span className="lead-err__links">
          <a className="sps-btn sps-btn--outline sps-btn--sm" href={`tel:${CONTACTS_2027.mainPhoneRaw}`}>
            {t.formCall} · <span className="mono">{CONTACTS_2027.mainPhone}</span>
          </a>
          <a className="sps-btn sps-btn--outline sps-btn--sm" href={CONTACTS_2027.telegramUrl} target="_blank" rel="noopener noreferrer">
            Telegram
          </a>
          <a className="sps-btn sps-btn--outline sps-btn--sm" href={CONTACTS_2027.whatsappUrl} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        </span>
      ) : null}
    </div>
  );
}

/**
 * Muvaffaqiyat bloki ko'ringanda unga fokus + scroll: forma pastda yuborilsa, "qabul qilindi"
 * xabari ekrandan tashqarida qolib ketmasin (ekran o'quvchi ham uni o'qiydi).
 */
export function useRevealOnShow<T extends HTMLElement>(show: boolean) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!show || !ref.current) return;
    const el = ref.current;
    el.focus({ preventScroll: true });
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }, [show]);
  return ref;
}
