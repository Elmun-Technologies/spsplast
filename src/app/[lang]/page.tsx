import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { getProductsServer } from '@/lib/services/productService';
import { ProductCard } from '@/components/product/ProductCard';
import { CategoryCard } from '@/components/product/CategoryCard';
import { MoldResultShowcase } from '@/components/product/MoldResultShowcase';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Badge } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import {
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  Truck,
  PackageCheck,
  Headphones,
  Clock,
  Sparkles,
} from 'lucide-react';

interface HomePageProps {
  params: { lang: Locale };
}

export default async function HomePage({ params: { lang } }: HomePageProps) {
  const dict = getDictionary(lang);

  // 1. Fetch Active Categories from DB
  const rawCategories = await db.category.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { sortOrder: 'asc' },
    include: {
      translations: { where: { locale: lang } },
      _count: { select: { products: true } },
    },
  });

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

  // 2. Fetch Bestseller Products (~8 items)
  let bestsellers = await getProductsServer({
    locale: lang,
    isBestseller: true,
    limit: 8,
  });

  if (!bestsellers || bestsellers.length === 0) {
    bestsellers = await getProductsServer({
      locale: lang,
      limit: 8,
    });
  }

  // 3. Fetch Category-specific Product Rows
  const allProducts = await getProductsServer({
    locale: lang,
    limit: 48,
  });

  // Filter category products
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
      cat?.slug?.includes('termopanel') ||
      cat?.nameUz?.toLowerCase().includes('termopanel') ||
      p.titleUz?.toLowerCase().includes('termopanel') ||
      p.titleRu?.toLowerCase().includes('термопанел')
    );
  }).slice(0, 4);

  const panellar3DProducts = allProducts.filter((p) => {
    const cat = (p as any).category;
    return (
      cat?.slug?.includes('3d') ||
      p.titleUz?.toLowerCase().includes('3d') ||
      p.titleRu?.toLowerCase().includes('3d')
    );
  }).slice(0, 4);

  const dekorProducts = allProducts.filter((p) => {
    const cat = (p as any).category;
    return (
      cat?.slug?.includes('dekor') ||
      p.titleUz?.toLowerCase().includes('dekor') ||
      p.titleRu?.toLowerCase().includes('декор')
    );
  }).slice(0, 4);

  const block1Products = bruschatkaProducts.length > 0 ? bruschatkaProducts : allProducts.slice(0, 4);
  const block2Products = termopanelProducts.length > 0 ? termopanelProducts : allProducts.slice(4, 8);
  const block3Products = panellar3DProducts.length > 0 ? panellar3DProducts : allProducts.slice(8, 12);
  const block4Products = dekorProducts.length > 0 ? dekorProducts : allProducts.slice(12, 16);

  const featuredMold = allProducts.find((p) => p.resultImage) || allProducts[0];
  const dealOfTheDay = bestsellers[0] || allProducts[0];

  return (
    <div className="bg-[#F8F9FA] text-gray-900 min-h-screen pb-12">

      {/* ==========================================
          1. HERO BENTO SECTION (Asymmetric Commerce Layout)
         ========================================== */}
      <section className="pt-4 pb-3">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
            
            {/* Main Double-Bezel Hero Banner (8 cols) */}
            <div className="lg:col-span-8 bg-[#161920] p-1.5 rounded-2xl border border-gray-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="bg-[#1A1D24] rounded-xl p-6 sm:p-8 flex flex-col justify-between h-full relative overflow-hidden border border-white/5">
                {/* Background Accent Mesh */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-brand-red/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="space-y-3.5 max-w-lg z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-red/20 border border-brand-red/40 rounded-full text-brand-red text-[11px] font-bold tracking-wide uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{lang === 'ru' ? 'Прямо с завода SPS PLAST' : 'Zavoddan to‘g‘ridan-to‘g‘ri'}</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white font-sans">
                    {lang === 'ru'
                      ? 'Пластиковые формы и термопанели высокого качества'
                      : 'Bruschatka qoliplari va fasad termopanellari'}
                  </h1>

                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-normal">
                    {lang === 'ru'
                      ? 'Европейское сырье, выдержка более 300 заливок, прямые заводские цены без посредников.'
                      : 'Yevropa xomashyosi, 300+ marotaba quyish kafolati va vositachilarsiz arzon factory narxlar.'}
                  </p>
                </div>

                {/* Hero Dual Action Buttons */}
                <div className="pt-6 z-10 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/${lang}/catalog`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs sm:text-sm rounded-lg transition-all shadow-xs group"
                  >
                    <span>{lang === 'ru' ? 'Перейти в каталог' : 'Katalogga o‘tish'}</span>
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>

                  <Link
                    href={`/${lang}/catalog/bruschatka-qoliplari`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm rounded-lg border border-white/15 transition-colors"
                  >
                    <span>{lang === 'ru' ? 'Формы брусчатки' : 'Bruschatka qoliplari'}</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Deal of the Day Card (4 cols) */}
            <div className="lg:col-span-4 bg-[#F8F9FA] p-1.5 rounded-2xl border border-gray-200 shadow-xs flex flex-col">
              <div className="bg-white rounded-xl p-4 sm:p-5 flex flex-col justify-between h-full border border-gray-100">
                
                {/* Timer Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                      {lang === 'ru' ? 'Товар дня' : 'Kun mahsuloti'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold bg-red-50 text-brand-red px-2 py-0.5 rounded border border-red-100">
                    <Clock className="w-3 h-3" />
                    <span>23:59:59</span>
                  </div>
                </div>

                {dealOfTheDay && (
                  <div className="flex-1 flex flex-col justify-between gap-3">
                    <Link
                      href={`/${lang}/product/${dealOfTheDay.slug}`}
                      className="block relative aspect-square w-full bg-[#F8F9FA] rounded-lg border border-gray-100 overflow-hidden p-3 group"
                    >
                      {dealOfTheDay.images?.[0]?.url && (
                        <Image
                          src={dealOfTheDay.images[0].url}
                          alt={dealOfTheDay.titleUz}
                          fill
                          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <span className="absolute top-2 left-2 bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                        -40% OFF
                      </span>
                    </Link>

                    <div className="space-y-1">
                      <Link
                        href={`/${lang}/product/${dealOfTheDay.slug}`}
                        className="text-xs sm:text-sm font-semibold text-gray-900 hover:text-brand-red line-clamp-2 leading-snug"
                      >
                        {lang === 'ru' ? dealOfTheDay.titleRu : dealOfTheDay.titleUz}
                      </Link>
                      
                      <Price
                        price={dealOfTheDay.price}
                        oldPrice={dealOfTheDay.oldPrice}
                        lang={lang}
                        size="md"
                      />
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </Container>
      </section>

      {/* ==========================================
          2. TRUST FACTORS STRIP (Double-Bezel Cards)
         ========================================== */}
      <section className="py-2">
        <Container>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            
            <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-3.5 flex items-center gap-3 shadow-xs hover:border-gray-300 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-brand-red shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">
                  {lang === 'ru' ? 'Доставка по Узбекистану' : 'O‘zbekiston bo‘ylab yetkazish'}
                </h4>
                <p className="text-[10px] text-gray-500 font-medium">
                  {lang === 'ru' ? 'Быстро va ishonchli' : 'Pochta va kuryer orqali'}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-3.5 flex items-center gap-3 shadow-xs hover:border-gray-300 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-brand-red shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">
                  {lang === 'ru' ? 'Гарантия качества 300+' : 'Sifat kafolati 300+'}
                </h4>
                <p className="text-[10px] text-gray-500 font-medium">
                  {lang === 'ru' ? 'Официальный стандарт' : 'Oliy navli plastmassa'}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-3.5 flex items-center gap-3 shadow-xs hover:border-gray-300 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-brand-red shrink-0">
                <PackageCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">
                  {lang === 'ru' ? 'Прямой производитель' : 'To‘g‘ridan-to‘g‘ri ishlab chiqaruvchi'}
                </h4>
                <p className="text-[10px] text-gray-500 font-medium">
                  {lang === 'ru' ? 'Без посредников' : 'Vositachilarsiz hamyonbop'}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-3.5 flex items-center gap-3 shadow-xs hover:border-gray-300 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-brand-red shrink-0">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">
                  {lang === 'ru' ? 'Поддержка и консультация' : 'Mutaxassis maslahati'}
                </h4>
                <p className="text-[10px] text-gray-500 font-medium">
                  {lang === 'ru' ? 'Помощь в выборе' : 'Bepul professional maslahat'}
                </p>
              </div>
            </div>

          </div>
        </Container>
      </section>

      {/* ==========================================
          3. CATEGORIES GRID
         ========================================== */}
      <section className="py-5">
        <Container>
          <SectionHeader
            title={lang === 'ru' ? 'Категории товаров' : 'Mahsulot kategoriyalari'}
            subtitle={lang === 'ru' ? 'Выберите нужный раздел каталога' : 'Kerakli bo‘limni tanlang'}
            linkText={lang === 'ru' ? 'Все категории' : 'Barcha kategoriyalar'}
            linkHref={`/${lang}/catalog`}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.slice(0, 6).map((cat) => (
              <CategoryCard key={cat.id} category={cat} lang={lang} />
            ))}
          </div>
        </Container>
      </section>

      {/* ==========================================
          4. BESTSELLERS PRODUCT GRID
         ========================================== */}
      <section className="py-3">
        <Container>
          <SectionHeader
            title={lang === 'ru' ? 'Популярные товары' : 'Ommabop mahsulotlar'}
            subtitle={lang === 'ru' ? 'Самые покупаемые позиции' : 'Eng ko‘p sotiladigan qoliplar'}
            linkText={lang === 'ru' ? 'Смотреть все' : 'Barchasini ko‘rish'}
            linkHref={`/${lang}/catalog`}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {bestsellers.map((product) => (
              <ProductCard key={product.id} product={product} lang={lang} />
            ))}
          </div>
        </Container>
      </section>

      {/* ==========================================
          5. CATEGORY ROWS (Dense Commerce Layout)
         ========================================== */}
      {/* Row 1: Bruschatka qoliplari */}
      <section className="py-3">
        <Container>
          <SectionHeader
            title={lang === 'ru' ? 'Формы для брусчатки' : 'Bruschatka qoliplari'}
            linkText={lang === 'ru' ? 'Все брусчатки' : 'Barcha qoliplar'}
            linkHref={`/${lang}/catalog/bruschatka-qoliplari`}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {block1Products.map((product) => (
              <ProductCard key={product.id} product={product} lang={lang} />
            ))}
          </div>
        </Container>
      </section>

      {/* Row 2: Termopanellar */}
      <section className="py-3">
        <Container>
          <SectionHeader
            title={lang === 'ru' ? 'Термопанели' : 'Termopanellar'}
            linkText={lang === 'ru' ? 'Все термопанели' : 'Barcha panellar'}
            linkHref={`/${lang}/catalog/termopanel`}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {block2Products.map((product) => (
              <ProductCard key={product.id} product={product} lang={lang} />
            ))}
          </div>
        </Container>
      </section>

      {/* Row 3: 3D Panellar */}
      <section className="py-3">
        <Container>
          <SectionHeader
            title={lang === 'ru' ? '3D Панели' : '3D Panellar'}
            linkText={lang === 'ru' ? 'Все 3D панели' : 'Barcha 3D panellar'}
            linkHref={`/${lang}/catalog/3d-panellar`}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {block3Products.map((product) => (
              <ProductCard key={product.id} product={product} lang={lang} />
            ))}
          </div>
        </Container>
      </section>

      {/* Row 4: Dekorativ G'ishtlar */}
      <section className="py-3">
        <Container>
          <SectionHeader
            title={lang === 'ru' ? 'Декоративный кирпич' : 'Dekorativ G\'ishtlar'}
            linkText={lang === 'ru' ? 'Весь декор' : 'Barcha dekorlar'}
            linkHref={`/${lang}/catalog/dekorativ-gishtlar`}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {block4Products.map((product) => (
              <ProductCard key={product.id} product={product} lang={lang} />
            ))}
          </div>
        </Container>
      </section>

      {/* ==========================================
          6. MOLD → FINISHED RESULT SHOWCASE
         ========================================== */}
      {featuredMold && (
        <section className="py-4">
          <Container>
            <MoldResultShowcase
              moldImage={featuredMold.moldImage || featuredMold.images?.[0]?.url || ''}
              resultImage={featuredMold.resultImage || featuredMold.images?.[0]?.url || ''}
              moldTitle={featuredMold.titleUz}
              resultTitle={
                lang === 'ru' ? 'Готовая брусчатка после заливки' : 'Tayyor quyilgan bruschatka'
              }
              productSlug={featuredMold.slug}
              productPrice={featuredMold.price}
              lang={lang}
            />
          </Container>
        </section>
      )}

      {/* ==========================================
          7. FAQ SECTION
         ========================================== */}
      <section className="py-5">
        <Container>
          <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* SEO Content */}
              <div className="lg:col-span-6 space-y-3">
                <h2 className="text-lg font-bold text-gray-900">
                  SPS PLAST — SIFATLI QOLIPLAR VA TERMOPANELLAR
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
                  SPS Plast O‘zbekistondagi yetakchi plastmassa matritsalar hamda fasad termopanellarini ishlab chiqaruvchi zavod hisoblanadi. Mahsulotlarimiz yuqori bosimli vakuum-formovka va zamonaviy uskunalar yordamida tayyorlanadi.
                </p>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
                  Bruschatka, bordyur, dekorativ plitkalar hamda fasad tizimlari uchun arzon va sifatli qoliplarni onlayn buyurtma qilishingiz mumkin.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-xs font-semibold text-brand-red">
                  <Link href={`/${lang}/catalog`} className="hover:underline bg-gray-50 px-2.5 py-1 rounded border border-gray-200">#Qoliplar</Link>
                  <Link href={`/${lang}/catalog/bruschatka-qoliplari`} className="hover:underline bg-gray-50 px-2.5 py-1 rounded border border-gray-200">#Bruschatka</Link>
                  <Link href={`/${lang}/catalog/termopanel`} className="hover:underline bg-gray-50 px-2.5 py-1 rounded border border-gray-200">#Termopanel</Link>
                </div>
              </div>

              {/* Accordion FAQ */}
              <div className="lg:col-span-6 space-y-2.5">
                <h3 className="text-base font-bold text-gray-900 mb-3">
                  {lang === 'ru' ? 'Часто задаваемые вопросы' : 'Ko‘p beriladigan savollar'}
                </h3>

                <details className="group bg-[#F8F9FA] border border-gray-200 p-3.5 rounded-lg cursor-pointer">
                  <summary className="flex items-center justify-between font-semibold text-xs sm:text-sm text-gray-900 list-none">
                    <span>Qoliplarning xizmat ko‘rsatish resursi qancha?</span>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200/60 leading-relaxed">
                    ABS va polipropilen materialdan tayyorlangan qoliplarimiz to‘g‘ri ishlatilganda 300 marotabadan ortiq quyish resursiga ega.
                  </p>
                </details>

                <details className="group bg-[#F8F9FA] border border-gray-200 p-3.5 rounded-lg cursor-pointer">
                  <summary className="flex items-center justify-between font-semibold text-xs sm:text-sm text-gray-900 list-none">
                    <span>Viloyatlarga yetkazib berish shartlari qanday?</span>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200/60 leading-relaxed">
                    Respublikaning barcha viloyatlariga pochta yoki yuk tashish xizmatlari orqali tezkor va xavfsiz yetkazib beramiz.
                  </p>
                </details>

                <details className="group bg-[#F8F9FA] border border-gray-200 p-3.5 rounded-lg cursor-pointer">
                  <summary className="flex items-center justify-between font-semibold text-xs sm:text-sm text-gray-900 list-none">
                    <span>Ulgurji xaridorlar uchun chegirmalar bormi?</span>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200/60 leading-relaxed">
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
