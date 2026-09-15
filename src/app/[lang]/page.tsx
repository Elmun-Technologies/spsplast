import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import nextDynamic from 'next/dynamic';
import { db } from '@/lib/db';
import { Locale } from '@/lib/i18n';
import { getProductsServer } from '@/lib/services/productService';
import { ProductCard } from '@/components/product/ProductCard';
import { CategoryCard } from '@/components/product/CategoryCard';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Price } from '@/components/ui/Price';
import { DealCountdown } from '@/components/ui/DealCountdown';
import {
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  Truck,
  PackageCheck,
  Headphones,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

/**
 * Below-the-fold sections are lazily imported: their JS is served as separate
 * chunks (still SSR'd for SEO) instead of competing with the hero + first
 * product grid for bandwidth during the initial load.
 */
const MoldResultShowcase = nextDynamic(() => import('@/components/product/MoldResultShowcase').then((m) => m.MoldResultShowcase));
const RecentlyViewed = nextDynamic(() => import('@/components/product/RecentlyViewed').then((m) => m.RecentlyViewed));
const B2BBanner = nextDynamic(() => import('@/components/product/B2BBanner').then((m) => m.B2BBanner));

interface HomePageProps {
  params: { lang: Locale };
}

export const revalidate = 60; // ISR 60s for high traffic
export const dynamic = 'force-static';

export default async function HomePage({ params: { lang } }: HomePageProps) {
  // These independent reads used to block one another. Fetch the homepage payload together
  // so the slowest query, rather than the sum of all queries, determines TTFB.
  const [rawCategories, bestsellersResult, allProductsResult] = await Promise.all([
    db.category.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { sortOrder: 'asc' },
      include: {
        translations: { where: { locale: lang } },
        _count: { select: { products: true } },
      },
    }),
    getProductsServer({ locale: lang, isBestseller: true, limit: 8 }),
    getProductsServer({ locale: lang, limit: 48 }),
  ]);

  const categories = rawCategories.map((c) => {
    const trans = c.translations[0] || {};
    return {
      id: c.id,
      slug: trans.slug || c.id,
      nameUz: trans.name || '',
      nameRu: trans.name || '',
      descriptionUz: trans.description || '',
      descriptionRu: trans.description || '',
      image: c.image,
      _count: c._count,
    };
  });

  let bestsellers = bestsellersResult.products;
  const allProducts = allProductsResult.products;

  // Keep the fallback in the same request path only when it is actually needed.
  if (!bestsellers || bestsellers.length === 0) {
    bestsellers = allProducts.slice(0, 8);
  }

  const bruschatkaProducts = allProducts.filter((p) => {
    const cat = (p as any).category;
    return (
      cat?.slug?.includes('bruschatka') ||
      cat?.nameUz?.toLowerCase().includes('bruschatka') ||
      p.titleUz?.toLowerCase().includes('bruschatka') ||
      p.titleRu?.toLowerCase().includes('брусчатк')
    );
  }).slice(0, 4);

  const termopanelProducts = allProducts.filter((p) => {
    const cat = (p as any).category;
    return (
      cat?.slug?.includes('fasad') ||
      cat?.nameUz?.toLowerCase().includes('fasad') ||
      p.titleUz?.toLowerCase().includes('fasad') ||
      p.titleRu?.toLowerCase().includes('фасад')
    );
  }).slice(0, 4);

  const bordyurProducts = allProducts.filter((p) => {
    const cat = (p as any).category;
    return (
      cat?.slug?.includes('bordyur') ||
      cat?.nameUz?.toLowerCase().includes('bordyur') ||
      p.titleUz?.toLowerCase().includes('bordyur') ||
      p.titleRu?.toLowerCase().includes('бордюр')
    );
  }).slice(0, 4);

  const plitkaProducts = allProducts.filter((p) => {
    const cat = (p as any).category;
    return (
      cat?.slug?.includes('plitka') ||
      cat?.nameUz?.toLowerCase().includes('plitka') ||
      p.titleUz?.toLowerCase().includes('plitka') ||
      p.titleRu?.toLowerCase().includes('плитка')
    );
  }).slice(0, 4);

  const block1Products = bruschatkaProducts.length > 0 ? bruschatkaProducts : allProducts.slice(0, 4);
  const block2Products = termopanelProducts.length > 0 ? termopanelProducts : allProducts.slice(4, 8);
  const block3Products = bordyurProducts.length > 0 ? bordyurProducts : allProducts.slice(8, 12);
  const block4Products = plitkaProducts.length > 0 ? plitkaProducts : allProducts.slice(12, 16);

  const featuredMold = allProducts.find((p) => p.resultImage) || allProducts[0];
  const dealOfTheDay = bestsellers[0] || allProducts[0];

  // Real discount coming from the catalog data — never advertise a number that
  // the actual price does not carry.
  const dealDiscountPercent =
    dealOfTheDay?.oldPrice && dealOfTheDay.oldPrice > dealOfTheDay.price
      ? Math.round(((dealOfTheDay.oldPrice - dealOfTheDay.price) / dealOfTheDay.oldPrice) * 100)
      : 0;

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Qoliplar qanday materialdan tayyorlanadi?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Qoliplarimiz chidamli polipropilen va ABS plastikdan tayyorlanadi. Aniq resurs mahsulot modeliga va ishlatish shartlariga bog‘liq — savol bilan murojaat qiling.',
        },
      },
      {
        '@type': 'Question',
        name: 'Viloyatlarga yetkazib berish shartlari qanday?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Respublikaning barcha viloyatlariga pochta yoki yuk tashish xizmatlari orqali tezkor va xavfsiz yetkazib beramiz.',
        },
      },
      {
        '@type': 'Question',
        name: 'Ulgurji xaridorlar uchun chegirmalar bormi?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ha, 100 donadan ortiq buyurtmalar uchun dilerlik va ulgurji narxlar amal qiladi.',
        },
      },
    ],
  };

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SPS STONE PROFY SERVISE',
    url: 'https://sps.uz',
    logo: 'https://sps.uz/logo.png',
    description: 'SPS — O‘zbekistonda bruschatka, bordyur va trotuar plitka qoliplari hamda fasad dekor elementlarini ishlab chiqaruvchi zavod',
  };

  return (
    <div className="bg-surface-page text-ink min-h-screen pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />

      <section className="pt-5 pb-2">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Promo panel — light, spacious, one clear primary action */}
            <div className="lg:col-span-8 relative overflow-hidden rounded-[24px] bg-[#EDF0F5] p-6 sm:p-9 lg:p-11 flex flex-col justify-between">
              {/* Soft brand glow, kept subtle so the copy stays the hero */}
              <div className="absolute -right-24 -top-24 w-[380px] h-[380px] rounded-full bg-brand-red/10 blur-3xl pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 w-[280px] h-[280px] rounded-full bg-surface/70 blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-4 max-w-[560px]">
                <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-[12px] font-semibold text-ink-soft">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {lang === 'ru' ? 'Собственное производство · Ташкент' : 'O‘z ishlab chiqarishimiz · Toshkent'}
                </span>

                <h1 className="text-[30px] sm:text-[40px] lg:text-[48px] font-bold tracking-[-0.035em] leading-[1.05] text-ink">
                  {lang === 'ru' ? (
                    <>
                      Формы для <span className="text-brand-red">брусчатки</span> и термопанелей
                    </>
                  ) : (
                    <>
                      Bruschatka <span className="text-brand-red">qoliplari</span> va termopanellar
                    </>
                  )}
                </h1>

                <p className="text-[15px] sm:text-base leading-[1.6] text-ink-soft max-w-[520px]">
                  {lang === 'ru'
                    ? 'Прямые цены производителя, ресурс от 300 заливок и доставка по всему Узбекистану. Поможем подобрать формы под ваш объём.'
                    : 'Ishlab chiqaruvchi narxlari, 300+ martalik resurs va O‘zbekiston bo‘ylab yetkazib berish. Hajmingizga mos qolipni tanlashda yordam beramiz.'}
                </p>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
                  <div>
                    <div className="text-[17px] font-bold text-ink leading-none">Polipropilen</div>
                    <div className="text-[12px] text-ink-sub mt-1">{lang === 'ru' ? 'Основной материал' : 'Asosiy material'}</div>
                  </div>
                  <div className="w-px h-8 bg-[#DDE3EB]" />
                  <div>
                    <div className="text-[17px] font-bold text-ink leading-none">ABS plastik</div>
                    <div className="text-[12px] text-ink-sub mt-1">{lang === 'ru' ? 'Для сложных форм' : 'Murakkab shakllar uchun'}</div>
                  </div>
                  <div className="w-px h-8 bg-[#DDE3EB]" />
                  <div>
                    <div className="text-[17px] font-bold text-brand-red leading-none">1 m²</div>
                    <div className="text-[12px] text-ink-sub mt-1">{lang === 'ru' ? 'Точный расчёт' : 'Aniq hisob'}</div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={`/${lang}/catalog`}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-brand-red text-white font-semibold text-[15px] rounded-full hover:bg-brand-red-dark transition-all group min-h-[50px] shadow-[0_12px_28px_-12px_rgba(230,28,36,0.75)]"
                >
                  <span>{lang === 'ru' ? 'Смотреть каталог' : 'Katalogni ko‘rish'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href={`/${lang}/contact`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-surface text-ink font-semibold text-sm rounded-full hover:bg-[#F7F8FA] transition-colors min-h-[50px]"
                >
                  <span>{lang === 'ru' ? 'Получить консультацию' : 'Maslahat olish'}</span>
                </Link>

                <div className="hidden sm:flex items-center gap-2 text-[12px] font-medium text-ink-soft ml-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{lang === 'ru' ? 'Всё в наличии на складе' : 'Omborda mavjud'}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-surface rounded-[24px] p-5 flex flex-col shadow-card">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-line-soft">
                <div>
                  <div className="text-[15px] font-bold text-ink">
                    {lang === 'ru' ? 'Товар дня' : 'Kun tanlovi'}
                  </div>
                  <div className="text-[12px] text-ink-sub mt-0.5">{lang === 'ru' ? 'Скидка ограничена' : 'Cheklangan aksiya'}</div>
                </div>

                <DealCountdown lang={lang} />
              </div>

              {dealOfTheDay && (
                <div className="flex-1 flex flex-col justify-between gap-3">
                  <Link
                    href={`/${lang}/product/${dealOfTheDay.slug}`}
                    className="block relative aspect-[4/3] w-full bg-surface-soft rounded-[18px] overflow-hidden p-2 group"
                  >
                    {dealOfTheDay.images?.[0]?.url && (
                      <Image
                        src={dealOfTheDay.images[0].url}
                        alt={dealOfTheDay.titleUz}
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 420px"
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    {dealDiscountPercent > 0 && (
                      <span className="absolute top-3 left-3 bg-brand-red text-white text-[12px] font-bold px-2.5 py-1 rounded-full">
                        -{dealDiscountPercent}%
                      </span>
                    )}
                  </Link>

                  <div className="space-y-1.5">
                    <Link
                      href={`/${lang}/product/${dealOfTheDay.slug}`}
                      className="text-[15px] font-semibold text-ink hover:text-brand-red line-clamp-2 leading-snug"
                    >
                      {lang === 'ru' ? dealOfTheDay.titleRu : dealOfTheDay.titleUz}
                    </Link>

                    <Price price={dealOfTheDay.price} oldPrice={dealOfTheDay.oldPrice} lang={lang} size="md" />
                  </div>

                  <Link
                    href={`/${lang}/product/${dealOfTheDay.slug}`}
                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold bg-brand-red hover:bg-brand-red-dark text-white py-3 px-4 rounded-full transition-colors mt-1 min-h-[46px] shadow-[0_10px_24px_-12px_rgba(230,28,36,0.8)]"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{lang === 'ru' ? 'Купить по акции' : 'Aksiya bo‘yicha sotib olish'}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      <section className="py-6">
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="flex items-start gap-3.5 p-5 bg-surface rounded-[20px]">
              <div className="w-11 h-11 rounded-[20px] bg-surface-soft flex items-center justify-center text-ink shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-ink">{lang === 'ru' ? 'Доставка 1–3 дня' : 'Yetkazish 1–3 kun'}</h4>
                <p className="text-[13px] text-ink-sub mt-1 leading-relaxed">Toshkent 24 soat, viloyatlar 1–3 kun</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-5 bg-surface rounded-[20px]">
              <div className="w-11 h-11 rounded-[20px] bg-surface-soft flex items-center justify-center text-ink shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-ink">{lang === 'ru' ? 'Прочный материал' : 'Mustahkam material'}</h4>
                <p className="text-[13px] text-ink-sub mt-1 leading-relaxed">Polipropilen va ABS, uzoq resurs</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-5 bg-surface rounded-[20px]">
              <div className="w-11 h-11 rounded-[20px] bg-[#FEF0F0] flex items-center justify-center text-brand-red shrink-0">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-ink">{lang === 'ru' ? 'Завод, без посредников' : 'Zavod, vositachisiz'}</h4>
                <p className="text-[13px] text-ink-sub mt-1 leading-relaxed">{lang === 'ru' ? 'Прямая цена, опт −10%' : 'To‘g‘ridan-to‘g‘ri narx, ulgurji −10%'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-5 bg-surface rounded-[20px]">
              <div className="w-11 h-11 rounded-[20px] bg-surface-soft flex items-center justify-center text-ink shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-ink">{lang === 'ru' ? 'Техподдержка' : 'Texnik yordam'}</h4>
                <p className="text-[13px] text-ink-sub mt-1 leading-relaxed">{lang === 'ru' ? 'Бесплатная консультация' : 'Tanlashda bepul maslahat'}</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-6 sm:py-8">
        <Container>
          <SectionHeader
            title={lang === 'ru' ? 'Категории товаров' : 'Mahsulot kategoriyalari'}
            subtitle={lang === 'ru' ? 'Выберите нужный раздел каталога' : 'Kerakli bo‘limni tanlang'}
            linkText={lang === 'ru' ? 'Все категории' : 'Barcha kategoriyalar'}
            linkHref={`/${lang}/catalog`}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.slice(0, 6).map((cat) => (
              <CategoryCard key={cat.id} category={cat} lang={lang} />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-6 sm:py-8">
        <Container>
          <SectionHeader
            title={lang === 'ru' ? 'Популярные товары' : 'Ommabop mahsulotlar'}
            subtitle={lang === 'ru' ? 'Самые покупаемые позиции' : 'Eng ko‘p sotiladigan qoliplar'}
            linkText={lang === 'ru' ? 'Смотреть все' : 'Barchasini ko‘rish'}
            linkHref={`/${lang}/catalog`}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {bestsellers.map((product) => (
              <ProductCard key={product.id} product={product} lang={lang} />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-6 sm:py-8 cv-auto">
        <Container>
          <SectionHeader
            title={lang === 'ru' ? 'Формы для брусчатки' : 'Bruschatka qoliplari'}
            linkText={lang === 'ru' ? 'Все брусчатки' : 'Barcha qoliplar'}
            linkHref={`/${lang}/catalog?category=bruschatka-qoliplari`}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {block1Products.map((product) => (
              <ProductCard key={product.id} product={product} lang={lang} />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-6 sm:py-8 cv-auto">
        <Container>
          <SectionHeader
            title={lang === 'ru' ? 'Фасадные декор-элементы' : 'Fasad dekor elementlari'}
            linkText={lang === 'ru' ? 'Все декоры' : 'Barcha dekorlar'}
            linkHref={`/${lang}/catalog?category=fasad-dekor`}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {block2Products.map((product) => (
              <ProductCard key={product.id} product={product} lang={lang} />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-6 sm:py-8 cv-auto">
        <Container>
          <SectionHeader
            title={lang === 'ru' ? 'Бордюры и дорожные формы' : 'Bordyur va yo‘l qoliplari'}
            linkText={lang === 'ru' ? 'Все формы' : 'Barcha qoliplar'}
            linkHref={`/${lang}/catalog?category=bordyur-qoliplari`}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {block3Products.map((product) => (
              <ProductCard key={product.id} product={product} lang={lang} />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-6 sm:py-8 cv-auto">
        <Container>
          <SectionHeader
            title={lang === 'ru' ? 'Тротуарная плитка' : 'Trotuar plitka qoliplari'}
            linkText={lang === 'ru' ? 'Все плитки' : 'Barcha plitkalar'}
            linkHref={`/${lang}/catalog?category=plitka-qoliplari`}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {block4Products.map((product) => (
              <ProductCard key={product.id} product={product} lang={lang} />
            ))}
          </div>
        </Container>
      </section>

      {featuredMold && (
        <section className="py-6 sm:py-8">
          <Container>
            <MoldResultShowcase
              moldImage={featuredMold.moldImage || featuredMold.images?.[0]?.url || ''}
              resultImage={featuredMold.resultImage || featuredMold.images?.[0]?.url || ''}
              moldTitle={featuredMold.titleUz}
              resultTitle={lang === 'ru' ? 'Готовая брусчатка после заливки' : 'Tayyor quyilgan bruschatka'}
              productSlug={featuredMold.slug}
              productPrice={featuredMold.price}
              lang={lang}
            />
          </Container>
        </section>
      )}

      <B2BBanner lang={lang} />

      <Container>
        <RecentlyViewed lang={lang} />
      </Container>

      <section className="py-6 sm:py-8 cv-auto">
        <Container>
          <div className="bg-surface rounded-[24px] p-6 sm:p-9 shadow-card">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-6 space-y-4">
                <h2 className="text-[22px] sm:text-2xl font-bold text-ink tracking-[-0.02em]">SPS — SIFATLI QOLIPLAR VA FASAD DEKOR ELEMENTLARI</h2>
                <p className="text-sm text-ink-soft leading-relaxed">
                  SPS — bruschatka, bordyur va trotuar plitka uchun plastik qoliplar hamda fasad dekor elementlarini ishlab chiqaruvchi zavod. Mahsulotlarimiz polipropilen va ABS plastikdan tayyorlanadi.
                </p>
                <p className="text-sm text-ink-soft leading-relaxed">
                  Bruschatka, bordyur, dekorativ plitkalar hamda fasad tizimlari uchun sifatli qoliplarni onlayn buyurtma qilishingiz mumkin.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-[12px] font-semibold text-brand-red">
                  <Link href={`/${lang}/catalog`} className="bg-surface-soft hover:bg-[#FEF0F0] px-3.5 py-2 rounded-full transition-colors">#Qoliplar</Link>
                  <Link href={`/${lang}/catalog?category=bruschatka-qoliplari`} className="bg-surface-soft hover:bg-[#FEF0F0] px-3.5 py-2 rounded-full transition-colors">#Bruschatka</Link>
                  <Link href={`/${lang}/catalog?category=termopanel`} className="bg-surface-soft hover:bg-[#FEF0F0] px-3.5 py-2 rounded-full transition-colors">#Termopanel</Link>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-3">
                <h3 className="text-base font-semibold text-ink mb-3">{lang === 'ru' ? 'Часто задаваемые вопросы' : 'Ko‘p beriladigan savollar'}</h3>

                <details className="group bg-surface-soft rounded-[16px] p-4 cursor-pointer open:bg-surface open:shadow-card transition-all">
                  <summary className="flex items-center justify-between font-semibold text-sm text-ink list-none">
                    <span>Qoliplar qanday materialdan tayyorlanadi?</span>
                    <ChevronDown className="w-4 h-4 text-ink-sub group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="text-sm text-ink-soft mt-3 pt-3 border-t border-line leading-relaxed">
                    Qoliplarimiz chidamli polipropilen va ABS plastikdan tayyorlanadi. Aniq resurs mahsulot modeliga va ishlatish shartlariga bog‘liq.
                  </p>
                </details>

                <details className="group bg-surface-soft rounded-[16px] p-4 cursor-pointer open:bg-surface open:shadow-card transition-all">
                  <summary className="flex items-center justify-between font-semibold text-sm text-ink list-none">
                    <span>Viloyatlarga yetkazib berish shartlari qanday?</span>
                    <ChevronDown className="w-4 h-4 text-ink-sub group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="text-sm text-ink-soft mt-3 pt-3 border-t border-line leading-relaxed">
                    Respublikaning barcha viloyatlariga pochta yoki yuk tashish xizmatlari orqali tezkor va xavfsiz yetkazib beramiz.
                  </p>
                </details>

                <details className="group bg-surface-soft rounded-[16px] p-4 cursor-pointer open:bg-surface open:shadow-card transition-all">
                  <summary className="flex items-center justify-between font-semibold text-sm text-ink list-none">
                    <span>Ulgurji xaridorlar uchun chegirmalar bormi?</span>
                    <ChevronDown className="w-4 h-4 text-ink-sub group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="text-sm text-ink-soft mt-3 pt-3 border-t border-line leading-relaxed">
                    Ha, 100 donadan ortiq buyurtmalar uchun dilerlik va ulgurji narxlar amal qiladi.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
