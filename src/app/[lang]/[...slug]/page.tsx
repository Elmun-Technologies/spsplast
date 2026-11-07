import { notFound } from 'next/navigation';
import { isValidLocale, type Locale } from '@/lib/i18n';
import { getPages } from '@/lib/pages';
import { pageMetadata } from '@/lib/seo';

/**
 * `[lang]` ichidagi mos kelmaydigan har qanday yo'l uchun ushlagich (audit 2026-11-02,
 * 3-bosqich: `/ru/xyz`, `/en/xyz` 404 sahifasi o'zbekcha va header'siz chiqar edi).
 *
 * Sababi: bu fayl bo'lmasa, `/ru/haqiqiy-bolmagan-yol` kabi HECH QANDAY sahifa segmentiga
 * mos kelmaydigan URL'lar `[lang]/layout.tsx`ga umuman kirmay, to'g'ridan-to'g'ri ildiz
 * `src/app/not-found.tsx`ga tushardi — u esa (til aniqlanmagani uchun, HAR DOIM) o'zbekcha
 * matn chiqaradi, noto'g'ri sarlavha/tavsif va `[lang]`ning o'z marshrut daraxtidan tashqarida.
 * Bu ushlagich bilan URL kamida haqiqiy `[lang]` daraxti ichida qoladi: to'g'ri 404 status,
 * `noindex`, har tilda to'g'ri `<title>`/tavsif (`generateMetadata`) — xuddi ALLAQACHON
 * mavjud `catalog/[section]/[slug]` 404 mexanizmi bilan bir xil darajada.
 *
 * MA'LUM CHEKLOV (yangi emas — tekshirildi: xuddi shu `catalog/[section]/[slug]`
 * mexanizmida ham bor, masalan `/ru/catalog/paving/mavjud-bolmagan-model`): tana matni
 * (`NotFoundBody`) va header/footer SSR'da tilga qarab farqlanmaydi — `[lang]/not-found.tsx`
 * Next konventsiyasiga ko'ra `params` ola olmaydigan klient komponent, `useParams()` esa
 * notFound() chaqirilgan holatda `[lang]/layout.tsx`ning header/footer'ini saqlamaydi. Bu
 * saytning har qanday ichki 404'ida (yangi ham, eski ham) bor, umumiy muammo — alohida
 * ishga (lang kontekstini provider orqali berish) loyihalashtirilishi kerak.
 *
 * `generateStaticParams` ataylab BO'SH massiv qaytaradi va `dynamicParams = false`:
 * "haqiqiy marshrut emas" holatlarni oldindan generatsiya qilib bo'lmaydi, lekin bu
 * ikkisi birga bo'lmasa (ya'ni segment sukut bo'yicha `dynamicParams: true` bilan so'rov
 * vaqtida render qilinsa), Next'ning boshqa, ALLAQACHON to'g'ri ishlagan dinamik 404
 * sahifalarining (masalan `catalog/[section]/[slug]`) SSR javobi buziladi — tasdiqlandi:
 * ularsiz qurilgan build'da model-404 <head>/h1/<main>'siz chiqadi, ular bilan to'g'ri.
 */
export async function generateStaticParams() {
  return [];
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  const lang: Locale = isValidLocale(langParam) ? (langParam as Locale) : 'uz';
  return pageMetadata({
    lang,
    path: '/404',
    title: getPages(lang).notfound.title,
    description: getPages(lang).notfound.text,
    noindex: true,
  });
}

export default function CatchAll() {
  notFound();
}
