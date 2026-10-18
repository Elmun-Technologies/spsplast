'use client';

/**
 * O'z tashrif statistikamiz uchun mijoz qismi (admin → "Tashriflar").
 * Cookie ishlatilmaydi: tashrifchi ID — localStorage, sessiya — sessionStorage
 * (30 daqiqa harakatsizlikdan keyin yangi sessiya). Storage yopiq bo'lsa
 * xotirada ishlaydi. Ma'lumot `navigator.sendBeacon('/api/track')` bilan ketadi.
 */

const VID_KEY = 'sps_vid';
const SID_KEY = 'sps_sid';
const ATTR_KEY = 'sps_attr';
const SESSION_IDLE_MS = 30 * 60 * 1000;

type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
};

const memory: Record<string, string> = {};

function get(storage: 'local' | 'session', key: string): string | null {
  try {
    return (storage === 'local' ? window.localStorage : window.sessionStorage).getItem(key);
  } catch {
    return memory[`${storage}:${key}`] ?? null;
  }
}

function set(storage: 'local' | 'session', key: string, value: string): void {
  try {
    (storage === 'local' ? window.localStorage : window.sessionStorage).setItem(key, value);
  } catch {
    memory[`${storage}:${key}`] = value;
  }
}

function randomId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 20);
}

export function visitorId(): string {
  let id = get('local', VID_KEY);
  if (!id) {
    id = randomId();
    set('local', VID_KEY, id);
  }
  return id;
}

/** Sessiya ID; har chaqiruvda faollik vaqti yangilanadi. */
export function sessionId(): string {
  const now = Date.now();
  const raw = get('session', SID_KEY);
  let [id, last] = raw ? raw.split('.') : [];
  if (!id || !last || now - Number(last) > SESSION_IDLE_MS) id = randomId();
  set('session', SID_KEY, `${id}.${now}`);
  return id;
}

/** Sessiyaning birinchi sahifasidagi UTM va referrer (keyingi sahifalarda yo'qolmasin). */
export function attribution(): Attribution {
  const stored = get('session', ATTR_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as Attribution;
    } catch {
      // qayta yig'amiz
    }
  }
  const sp = new URLSearchParams(window.location.search);
  const attr: Attribution = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'fbclid'] as const) {
    const v = sp.get(key);
    if (v) attr[key] = v.slice(0, 100);
  }
  if (document.referrer) attr.referrer = document.referrer.slice(0, 500);
  set('session', ATTR_KEY, JSON.stringify(attr));
  return attr;
}

export function sendVisit(type: string, data: { item?: string; detail?: string } = {}): void {
  if (typeof window === 'undefined' || window.location.pathname.startsWith('/admin')) return;
  try {
    const attr = attribution();
    const body = JSON.stringify({
      vid: visitorId(),
      sid: sessionId(),
      t: type,
      p: window.location.pathname,
      i: data.item?.slice(0, 120),
      d: data.detail?.slice(0, 200),
      r: attr.referrer,
      us: attr.utm_source || (attr.gclid ? 'google' : attr.fbclid ? 'facebook' : undefined),
      um: attr.utm_medium || (attr.gclid ? 'cpc' : attr.fbclid ? 'paid_social' : undefined),
      uc: attr.utm_campaign,
    });
    const blob = new Blob([body], { type: 'application/json' });
    if (!navigator.sendBeacon?.('/api/track', blob)) {
      void fetch('/api/track', { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } });
    }
  } catch {
    // Statistika hech qachon saytni buzmasin.
  }
}
