// Yagona analitika qatlami: GTM/GA4, Yandex Metrica va Meta Pixel.
//
// Sayt backendsiz ishlaydi va asosiy konversiya — "zayafka" (lead). Shu sababli
// savat/buyurtma hodisalari olib tashlangan: faqat sahifa ko'rish, qidiruv,
// sevimlilar/taqqoslash va lead hodisalari yuboriladi.
//
// Skriptlar faqat mos env ID mavjud bo'lsa yuklanadi
// (`src/components/analytics/AnalyticsScripts.tsx`).

declare global {
  interface Window {
    dataLayer?: Record<string, any>[];
    ym?: (id: number, action: string, eventName: string, data?: any) => void;
    fbq?: (action: string, eventName: string, data?: any) => void;
    gtag?: (...args: any[]) => void;
    ttq?: { track: (event: string, data?: any) => void; page: () => void };
    __spsYm?: number;
  }
}

import { sendVisit } from '@/lib/visitTracker';

type EventParams = Record<string, any>;

/** O'z statistikamizga ham ketadigan voqealar (admin → Tashriflar). */
const OWN_EVENTS: Record<string, (p: EventParams) => { item?: string; detail?: string }> = {
  add_to_request: (p) => ({ item: p.item_id }),
  add_to_compare: (p) => ({ item: p.item_id }),
  generate_lead: (p) => ({ detail: [p.lead_type, p.request_id].filter(Boolean).join(' ') }),
  search: (p) => ({ detail: p.search_term }),
};

export function trackEvent(eventName: string, params: EventParams = {}) {
  if (typeof window === 'undefined') return;

  const enriched = {
    ...params,
    timestamp: new Date().toISOString(),
    page_path: window.location.pathname,
    page_title: document.title,
  };

  const own = OWN_EVENTS[eventName];
  if (own) sendVisit(eventName, own(params));

  // 1. GTM / GA4 dataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...enriched });

  // 2. GA4 to'g'ridan-to'g'ri (gtag mavjud bo'lsa)
  if (window.gtag) {
    const gaMap: Record<string, string> = {
      view_item: 'view_item',
      view_item_list: 'view_item_list',
      search: 'search',
      generate_lead: 'generate_lead',
      add_to_wishlist: 'add_to_wishlist',
      add_to_compare: 'add_to_compare',
      share: 'share',
    };
    window.gtag('event', gaMap[eventName] || eventName, enriched);
  }

  // 3. Meta Pixel
  if (window.fbq) {
    const fbMap: Record<string, { fbEvent: string; mapper?: (p: EventParams) => any }> = {
      view_item: { fbEvent: 'ViewContent', mapper: (p) => ({ content_ids: [p.item_id], content_name: p.item_name }) },
      generate_lead: { fbEvent: 'Lead' },
      search: { fbEvent: 'Search', mapper: (p) => ({ search_string: p.search_term }) },
      add_to_wishlist: { fbEvent: 'AddToWishlist' },
      share: { fbEvent: 'Share' },
    };
    const fb = fbMap[eventName];
    if (fb) window.fbq('track', fb.fbEvent, fb.mapper ? fb.mapper(enriched) : enriched);
    else window.fbq('trackCustom', eventName, enriched);
  }

  // 4. Yandex Metrica — O'zbekiston bozorida asosiy kanal.
  // Metrica maqsadlarida to'g'ri ko'rinishi uchun hodisa nomini o'zini yuboramiz.
  const metricaId = window.__spsYm;
  if (window.ym && metricaId) {
    try {
      window.ym(metricaId, 'reachGoal', eventName, enriched);
    } catch {
      // Metrica skripti bloklangan bo'lsa sayt ishlashda davom etadi.
    }
  }

  // 5. TikTok Pixel
  if (window.ttq) {
    const ttMap: Record<string, string> = { view_item: 'ViewContent', generate_lead: 'SubmitForm', search: 'Search' };
    if (ttMap[eventName]) window.ttq.track(ttMap[eventName], { content_id: params.item_id });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${eventName}:`, enriched);
  }
}

/**
 * Redesign 2027 hodisalari (HANDOFF 5): `generate_lead`, `add_to_request`,
 * `add_to_compare`. Ro'yxat/solishtirish holati `src/lib/store/spsLists.ts`
 * ichida kuzatiladi — shunda hech bir chaqiruv joyi tushib qolmaydi.
 */
export function trackAddToRequest(item: { slug: string; code?: string | null; name?: string }) {
  trackEvent('add_to_request', { item_id: item.slug, item_code: item.code ?? '', item_name: item.name ?? '' });
}

export function trackRemoveFromRequest(slug: string) {
  trackEvent('remove_from_request', { item_id: slug });
}

export function trackAddToCompare(slug: string, count: number) {
  trackEvent('add_to_compare', { item_id: slug, compare_size: count });
}

export function trackRemoveFromCompare(slug: string, count: number) {
  trackEvent('remove_from_compare', { item_id: slug, compare_size: count });
}

export function trackLeadSent(info: {
  type: 'quick' | 'list' | 'partners';
  requestId?: string;
  items?: number;
  lang?: string;
  delivered?: boolean;
}) {
  trackEvent('generate_lead', {
    lead_type: info.type,
    request_id: info.requestId ?? '',
    item_count: info.items ?? 0,
    lang: info.lang ?? '',
    delivered: info.delivered ?? false,
  });
}

export function trackLeadFailed(info: { type: string; error: string }) {
  trackEvent('lead_failed', { lead_type: info.type, error: info.error });
}

// Hodisa yordamchilari — chaqiruv joyida maydon nomlari chalkashmasin.
export const analytics = {
  viewItem: (product: { id: string; name: string; category?: string }) =>
    trackEvent('view_item', { item_id: product.id, item_name: product.name, item_category: product.category }),
  viewItemList: (listName: string, products: { id: string; name: string }[]) =>
    trackEvent('view_item_list', { item_list_name: listName, items: products }),
  search: (term: string) => trackEvent('search', { search_term: term }),
  lead: (type: string, product?: string) => trackEvent('generate_lead', { lead_type: type, item_name: product }),
};

/** SPA o'tishlarida sahifa ko'rish: Metrica / Pixel / TikTok faqat birinchi yuklanishni o'zi sanaydi. */
export function trackPageviewNav(path: string) {
  if (typeof window === 'undefined') return;
  try {
    if (window.ym && window.__spsYm) window.ym(window.__spsYm, 'hit', path);
    if (window.fbq) window.fbq('track', 'PageView');
    if (window.ttq) window.ttq.page();
  } catch {
    // tashqi skript xatosi saytni to'xtatmasin
  }
}
