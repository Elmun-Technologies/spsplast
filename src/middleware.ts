import { NextResponse, type NextRequest } from 'next/server';

/**
 * Til aniqlash middleware'i.
 *
 * Sayt backendsiz arxitekturaga o'tgach, bu yerdan admin API uchun CSRF
 * darvozasi olib tashlandi (admin panel ham, cookie-sessiya ham yo'q).
 * Qolgan yagona vazifa: `/` manzilini foydalanuvchi tiliga yo'naltirish.
 *
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
   */
  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${preferredLocale(req)}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
