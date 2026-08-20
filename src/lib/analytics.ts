// Unified E-commerce Analytics Tracker (GA4, Yandex Metrica, Meta Pixel)

declare global {
  interface Window {
    dataLayer?: Record<string, any>[];
    ym?: (id: number, action: string, eventName: string, data?: any) => void;
    fbq?: (action: string, eventName: string, data?: any) => void;
  }
}

export function trackEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;

  // 1. Google Tag Manager / GA4 dataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...params,
    timestamp: new Date().toISOString(),
  });

  // 2. Meta Pixel (Facebook)
  if (window.fbq) {
    if (eventName === 'purchase') {
      window.fbq('track', 'Purchase', { value: params.value, currency: 'UZS' });
    } else if (eventName === 'add_to_cart') {
      window.fbq('track', 'AddToCart', { content_ids: [params.item_id], content_name: params.item_name });
    } else if (eventName === 'generate_lead') {
      window.fbq('track', 'Lead');
    }
  }

  // Console log in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics Event] ${eventName}:`, params);
  }
}
