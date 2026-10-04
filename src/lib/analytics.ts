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
  }
}

type EventParams = Record<string, any>;

const METRICA_ID = Number(process.env.NEXT_PUBLIC_YANDEX_METRICA_ID || 0);

export function trackEvent(eventName: string, params: EventParams = {}) {
  if (typeof window === 'undefined') return;

  const enriched = {
    ...params,
    timestamp: new Date().toISOString(),
    page_path: window.location.pathname,
    page_title: document.title,
  };

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
  if (window.ym && METRICA_ID) {
    try {
      window.ym(METRICA_ID, 'reachGoal', eventName, enriched);
    } catch {
      // Metrica skripti bloklangan bo'lsa sayt ishlashda davom etadi.
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${eventName}:`, enriched);
  }
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
