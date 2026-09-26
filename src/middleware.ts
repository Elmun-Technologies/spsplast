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

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
  // Only API routes: page navigations and static assets are untouched.
  matcher: '/api/:path*',
};
