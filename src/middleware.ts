import { NextResponse, type NextRequest } from 'next/server';
import { validateSameOrigin } from '@/lib/csrf';

/**
 * CSRF gate for the admin API.
 *
 * `src/lib/csrf.ts` shipped with the project but was never wired up, so every
 * cookie-authenticated mutation (`DELETE /api/admin/products/:id`,
 * `PATCH /api/admin/orders/:id/status`, `POST /api/categories`, …) accepted a
 * cross-site request: an attacker page could fire
 * `fetch(url, { method: 'DELETE', credentials: 'include' })` and the browser
 * would attach the admin session cookie. A `Content-Type: text/plain` body
 * skips the CORS pre-flight entirely and `await req.json()` does not care about
 * the content type, so the request really did reach the handler.
 *
 * Enforcing it here (one place, before any handler runs) is safer than
 * remembering to call it in each of the dozen admin routes.
 */

/** Safe methods never mutate anything. */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Cookie-authenticated API prefixes. Everything else under `/api` is either
 * public (orders, leads, search, feed, health) or called by a third party
 * (payment webhooks, cron, OAuth callback) and has no admin cookie to steal.
 */
const ADMIN_PREFIXES = [
  '/api/admin/',
  '/api/attributes',
  '/api/categories',
  '/api/products',
];

/**
 * Endpoints that must stay reachable without a browser `Origin` header:
 * server-to-server callers never send one.
 */
const ORIGIN_EXEMPT_PREFIXES = [
  '/api/admin/login', // rate-limited instead; the login form itself
  '/api/admin/integrations/', // amoCRM OAuth redirect back to us
  '/api/payments/', // Click / Payme callbacks
  '/api/cron/', // scheduler ping, guarded by CRON_SECRET
];

function isAdminApiPath(pathname: string): boolean {
  return ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isOriginExempt(pathname: string): boolean {
  return ORIGIN_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Til afzalligi: avval foydalanuvchi tanlagan til (cookie), keyin brauzer
 * `Accept-Language` sarlavhasi, aks holda saytning standart tili (`uz`).
 *
 * `uz-UZ,ru;q=0.8,en;q=0.6` kabi qiymatlarni `q` og'irligiga qarab emas,
 * birinchi uchragan mos tilga qarab hal qilamiz — amalda bu yetarli va
 * kutilmagan natija bermaydi.
 */
const LOCALE_COOKIE = 'sps_lang';

function preferredLocale(req: NextRequest): 'uz' | 'ru' {
  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale === 'uz' || cookieLocale === 'ru') return cookieLocale;

  const header = req.headers.get('accept-language') || '';
  for (const part of header.split(',')) {
    const tag = part.split(';')[0]?.trim().toLowerCase() || '';
    if (tag.startsWith('ru')) return 'ru';
    if (tag.startsWith('uz')) return 'uz';
  }

  return 'uz';
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /**
   * `/` — yagona til neytral manzil. Uni to'g'ridan-to'g'ri `/uz` ga
   * yo'naltirish o'rniga foydalanuvchi tilini aniqlaymiz: rus tilida
   * gaplashadigan mijoz darhol o'z tilidagi katalogga tushadi (eski sayt ham
   * rus tilida edi va uning indeksi shunga ishora qiladi).
   *
   * `app/page.tsx` dagi `/uz` redirect zaxira variant sifatida qoladi
   * (middleware o'chirilgan muhitlar uchun).
   */
  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${preferredLocale(req)}`, req.url));
  }

  if (SAFE_METHODS.has(req.method)) return NextResponse.next();
  if (!isAdminApiPath(pathname) || isOriginExempt(pathname)) return NextResponse.next();

  if (!validateSameOrigin(req)) {
    return NextResponse.json(
      { error: 'CSRF validation failed: Invalid origin' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  // `/` — til aniqlash, qolganlari: API CSRF darvozasi.
  // Sahifa navigatsiyalari va statik fayllar tegilmaydi.
  matcher: ['/', '/api/:path*'],
};
