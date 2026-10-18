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

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login' || req.cookies.get(ADMIN_COOKIE)) return NextResponse.next();
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
