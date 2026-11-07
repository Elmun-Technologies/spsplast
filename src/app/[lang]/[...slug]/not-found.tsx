/**
 * `[lang]/[...slug]` (catch-all ushlagich) o'z darajasida not-found.tsx talab qiladi —
 * `notFound()` bubbling `[lang]/not-found.tsx`ga to'g'ri yetib bormadi (tekshirildi: real
 * so'rovda root `/not-found.tsx` ishlatilardi, header/footer'siz, hamma vaqt o'zbekcha).
 * Shu bilan bir xil komponent — faqat shu segment darajasida, ambiguity qolmasin.
 */
export { default } from '../not-found';
