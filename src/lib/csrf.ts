import { NextResponse } from 'next/server';

/**
 * Validates request origin to protect cookie-authenticated mutation endpoints against CSRF attacks.
 */
export function validateSameOrigin(req: Request): boolean {
  // Safe read-only HTTP methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return true;
  }

  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  const referer = req.headers.get('referer');

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      return originHost === host;
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      return refererHost === host;
    } catch {
      return false;
    }
  }

  // If neither origin nor referer is provided, enforce strict request header requirement
  const requestedWith = req.headers.get('x-requested-with');
  if (requestedWith === 'XMLHttpRequest') {
    return true;
  }

  return false;
}

export function csrfProtectionMiddleware(req: Request): NextResponse | null {
  if (!validateSameOrigin(req)) {
    return NextResponse.json(
      { error: 'CSRF validation failed: Invalid origin' },
      { status: 403 }
    );
  }
  return null;
}
