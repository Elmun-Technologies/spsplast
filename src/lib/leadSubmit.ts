'use client';

import { trackLeadFailed, trackLeadSent } from '@/lib/analytics';

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

function utm(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const sp = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'fbclid']) {
    const v = sp.get(key);
    if (v) out[key] = v;
  }
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
