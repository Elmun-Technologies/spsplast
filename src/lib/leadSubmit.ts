'use client';

import { trackLeadFailed, trackLeadSent } from '@/lib/analytics';
import { attribution, sessionId, visitorId } from '@/lib/visitTracker';

/** /api/leads mijoz wrapper'i (HANDOFF 5 payload) + `generate_lead` analitikasi. */
export type LeadPayload = {
  type: 'quick' | 'list' | 'partners';
  clientType?: 'workshop' | 'dealer' | 'builder' | 'private';
  name: string;
  phone: string;
  city?: string;
  volumeM2?: number;
  company?: string;
  country?: string;
  material?: 'pp' | 'abs' | 'advice';
  items?: { slug: string; code?: string | null; m2?: number }[];
  message?: string;
  lang: 'uz' | 'ru' | 'en';
};

export type LeadResult = { ok: boolean; requestId?: string; error?: string };

/**
 * UTM/gclid — sessiyaning birinchi sahifasidan (mijoz reklamadan kirib, keyin
 * boshqa sahifada forma to'ldirsa ham manba yo'qolmaydi) + tashrif ID'lari
 * (admin'da zayafka kartochkasida "mijoz yo'li").
 */
function utm(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const { referrer: _referrer, ...attr } = attribution();
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(attr)) if (v) out[k] = v;
  out.visitorId = visitorId();
  out.sessionId = sessionId();
  return out;
}

export async function submitLead(payload: LeadPayload): Promise<LeadResult> {
  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        pageUrl: typeof window === 'undefined' ? '' : window.location.pathname,
        ...utm(),
        website: '',
      }),
    });
    const data = (await res.json()) as LeadResult & { issues?: unknown; delivered?: boolean };
    if (!res.ok) {
      trackLeadFailed({ type: payload.type, error: data.error || 'http_error' });
      return { ok: false, error: data.error || 'http_error' };
    }
    trackLeadSent({
      type: payload.type,
      requestId: data.requestId,
      items: payload.items?.length ?? 0,
      lang: payload.lang,
      delivered: data.delivered,
    });
    return data;
  } catch {
    trackLeadFailed({ type: payload.type, error: 'network' });
    return { ok: false, error: 'network' };
  }
}
