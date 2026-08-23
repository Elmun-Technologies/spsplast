// Unified E-commerce Analytics Tracker (GA4, GTM, Yandex Metrica, Meta Pixel)

declare global {
  interface Window {
    dataLayer?: Record<string, any>[];
    ym?: (id: number, action: string, eventName: string, data?: any) => void;
    fbq?: (action: string, eventName: string, data?: any) => void;
    gtag?: (...args: any[]) => void;
  }
}

type EventParams = Record<string, any>;

export function trackEvent(eventName: string, params: EventParams = {}) {
  if (typeof window === 'undefined') return;

  const enriched = {
    ...params,
    timestamp: new Date().toISOString(),
    page_path: window.location.pathname,
    page_title: document.title,
  };

  // 1. Google Tag Manager / GA4 dataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...enriched,
  });

  // 2. GA4 via gtag if available
  if (window.gtag) {
    const gaMap: Record<string, string> = {
      view_item: 'view_item',
      view_item_list: 'view_item_list',
      add_to_cart: 'add_to_cart',
      remove_from_cart: 'remove_from_cart',
      begin_checkout: 'begin_checkout',
      purchase: 'purchase',
      search: 'search',
      generate_lead: 'generate_lead',
      add_to_wishlist: 'add_to_wishlist',
      view_cart: 'view_cart',
      add_to_compare: 'add_to_compare',
      share: 'share',
      one_click_order: 'begin_checkout',
    };
    const gaEvent = gaMap[eventName] || eventName;
    window.gtag('event', gaEvent, enriched);
  }

  // 3. Meta Pixel (Facebook)
  if (window.fbq) {
    const fbMap: Record<string, { fbEvent: string; mapper?: (p: EventParams) => any }> = {
      purchase: { fbEvent: 'Purchase', mapper: (p) => ({ value: p.value, currency: p.currency || 'UZS' }) },
      add_to_cart: { fbEvent: 'AddToCart', mapper: (p) => ({ content_ids: [p.item_id], content_name: p.item_name, value: p.price }) },
      view_item: { fbEvent: 'ViewContent', mapper: (p) => ({ content_ids: [p.item_id], content_name: p.item_name }) },
      generate_lead: { fbEvent: 'Lead' },
      search: { fbEvent: 'Search', mapper: (p) => ({ search_string: p.search_term }) },
      add_to_wishlist: { fbEvent: 'AddToWishlist' },
      begin_checkout: { fbEvent: 'InitiateCheckout' },
    };
    const fb = fbMap[eventName];
    if (fb) {
      window.fbq('track', fb.fbEvent, fb.mapper ? fb.mapper(enriched) : enriched);
    } else {
      window.fbq('trackCustom', eventName, enriched);
    }
  }

  // 4. Yandex Metrica
  if (window.ym) {
    try {
      // Assuming first counter ID from env or default
      // window.ym(counterId, 'reachGoal', eventName, enriched)
      window.dataLayer.push({ ym_event: eventName, ym_params: enriched });
    } catch {}
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${eventName}:`, enriched);
  }
}

// Specific e-commerce helpers
export const analytics = {
  viewItem: (product: { id: string; name: string; price: number; category?: string }) =>
    trackEvent('view_item', { item_id: product.id, item_name: product.name, price: product.price, item_category: product.category }),
  viewItemList: (listName: string, products: { id: string; name: string }[]) =>
    trackEvent('view_item_list', { item_list_name: listName, items: products }),
  addToCart: (product: { id: string; name: string; price: number; quantity?: number }) =>
    trackEvent('add_to_cart', { item_id: product.id, item_name: product.name, price: product.price, quantity: product.quantity || 1 }),
  viewCart: (value: number, numItems: number) => trackEvent('view_cart', { value, num_items: numItems }),
  beginCheckout: (value: number, numItems: number) => trackEvent('begin_checkout', { value, num_items: numItems }),
  purchase: (orderNumber: string, value: number) => trackEvent('purchase', { transaction_id: orderNumber, value, currency: 'UZS' }),
  search: (term: string) => trackEvent('search', { search_term: term }),
  lead: (type: string) => trackEvent('generate_lead', { lead_type: type }),
};
