export interface AttributionData {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landingPage?: string;
}

const ATTRIBUTION_STORAGE_KEY = 'sps_attribution_data';

export function captureAttribution(): AttributionData | null {
  if (typeof window === 'undefined') return null;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const hasUtm = Array.from(urlParams.keys()).some((key) =>
      key.startsWith('utm_') || key === 'gclid' || key === 'fbclid'
    );

    let stored: AttributionData = {};
    const existing = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (existing) {
      stored = JSON.parse(existing);
    }

    if (hasUtm || !stored.landingPage) {
      const updated: AttributionData = {
        utmSource: urlParams.get('utm_source') || stored.utmSource || undefined,
        utmMedium: urlParams.get('utm_medium') || stored.utmMedium || undefined,
        utmCampaign: urlParams.get('utm_campaign') || stored.utmCampaign || undefined,
        utmContent: urlParams.get('utm_content') || stored.utmContent || undefined,
        utmTerm: urlParams.get('utm_term') || stored.utmTerm || undefined,
        gclid: urlParams.get('gclid') || stored.gclid || undefined,
        fbclid: urlParams.get('fbclid') || stored.fbclid || undefined,
        referrer: document.referrer || stored.referrer || undefined,
        landingPage: stored.landingPage || window.location.href,
      };

      localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }

    return stored;
  } catch (e) {
    return null;
  }
}

export function getStoredAttribution(): AttributionData {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}
