import { NextResponse, type NextRequest } from 'next/server';

/**
 * Til aniqlash middleware'i.
 *
 * Vazifalar: (1) `/` manzilini foydalanuvchi tiliga yo'naltirish;
 * (2) `/admin/*` da sessiya cookie'si bo'lmasa login'ga `?next=` bilan
 * yo'naltirish — Telegram'dagi "Admin'da ochish" havolasi kirishdan keyin
 * aynan o'sha zayafkaga olib boradi. Haqiqiy tekshiruv baribir sahifadagi
 * `requireUser()` da (bu yerda faqat cookie borligi qaraladi).
 *
 * Til afzalligi: avval foydalanuvchi tanlagan til (cookie), keyin brauzer
 * `Accept-Language` sarlavhasi, aks holda saytning standart tili (`uz`).
 *
 * `uz-UZ,ru;q=0.8,en;q=0.6` kabi qiymatlarni `q` og'irligiga qarab emas,
 * birinchi uchragan mos tilga qarab hal qilamiz — amalda bu yetarli va
 * kutilmagan natija bermaydi.
 */
const LOCALE_COOKIE = 'sps_lang';

function preferredLocale(req: NextRequest): 'uz' | 'ru' | 'en' {
  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale === 'uz' || cookieLocale === 'ru' || cookieLocale === 'en') return cookieLocale;

  const header = req.headers.get('accept-language') || '';
  for (const part of header.split(',')) {
    const tag = part.split(';')[0]?.trim().toLowerCase() || '';
    if (tag.startsWith('ru')) return 'ru';
    if (tag.startsWith('uz')) return 'uz';
    if (tag.startsWith('en')) return 'en';
  }

  return 'uz';
}

const ADMIN_COOKIE = 'sps_admin'; // src/server/auth.ts SESSION_COOKIE

/**
 * Admin uchun qat'iy CSP (audit 2026-11-02, 3-bosqich: xavfsizlik). Admin'da bitta ham
 * qo'lda yozilgan `<script>` yo'q (faqat Next'ning o'zi RSC/gidratatsiya uchun ichiga
 * qo'shadigan skriptlar) — shuning uchun `script-src`ni to'liq nonce'ga bog'lash mumkin,
 * `'unsafe-inline'`siz. Har bir sahifa `dynamic = 'force-dynamic'` (admin/layout.tsx),
 * shuning uchun har so'rovda yangi nonce xavfsiz: Next buni so'rov sarlavhasidagi
 * `Content-Security-Policy`dan o'qib, o'zi chiqargan skriptlarga avtomatik qo'yadi —
 * https://nextjs.org/docs/app/guides/content-security-policy. Nonce'ni faqat javob
 * sarlavhasiga qo'yish YETARLI EMAS: render qatlami uni so'rov sarlavhasidan o'qiydi.
 *
 * `next.config.js`dagi umumiy (butun saytga, `'unsafe-inline'` bilan) CSP `/admin`da
 * ALMASHTIRILADI (javobda faqat shu yerdagi sarlavha qoladi — tekshirildi real brauzerda,
 * `curl -sI`da ham), shuning uchun pastdagi qoida admin uchun o'zi yetarli bo'lishi kerak:
 * faqat o'zimiz (nonce) + hech qanday plagin (`object-src 'none'`), `<base>` ilib qo'yish
 * (`base-uri 'self'`) va clickjacking (`frame-ancestors 'none'`) yo'q.
 */
function adminCsp(nonce: string): string {
  return [
    // Bu qoida next.config.js'dagi umumiy CSP'ni ALMASHTIRADI (yuqoridagi izohga qarang),
    // shuning uchun o'zi to'liq: boshqa direktiva yo'q bo'lsa default-src ham cheklamas edi.
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // Admin sahifalarida ham React inline `style={{}}` atributi keng ishlatiladi — nonce
    // faqat `<script>`/`<style>` elementiga tegadi, `style=""` atributiga emas (CSP
    // spetsifikatsiyasi shunday), shuning uchun bu yerda ham `'unsafe-inline'` kerak.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

/** Admin HTML qaytaradigan har bir javobga (login, yoki haqiqiy sahifa) CSP qo'yadi. */
function adminResponse(req: NextRequest): NextResponse {
  if (process.env.NODE_ENV !== 'production') return NextResponse.next();
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = adminCsp(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set('Content-Security-Policy', csp);
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login' || req.cookies.get(ADMIN_COOKIE)) return adminResponse(req);
    const url = new URL('/admin/login', req.url);
    url.searchParams.set('next', pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  /**
   * `/` — yagona til neytral manzil. Uni to'g'ridan-to'g'ri `/uz` ga
   * yo'naltirish o'rniga foydalanuvchi tilini aniqlaymiz: rus tilida
   * gaplashadigan mijoz darhol o'z tilidagi katalogga tushadi (eski sayt ham
   * rus tilida edi va uning indeksi shunga ishora qiladi).
   */
  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${preferredLocale(req)}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*'],
};
