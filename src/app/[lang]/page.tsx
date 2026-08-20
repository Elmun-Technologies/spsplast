import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { getProductsServer } from '@/lib/services/productService';
import { ProductCard } from '@/components/product/ProductCard';
import { CategoryCard } from '@/components/product/CategoryCard';
import { MoldResultShowcase } from '@/components/product/MoldResultShowcase';
import {
  ArrowRight,
  PhoneCall,
  Factory,
  ChevronDown,
  ArrowUpRight,
  Truck,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Tag,
  Award,
  Sparkles,
  Percent,
  Clock,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

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
    <div className="bg-[#F8F9FA] text-[#111111] min-h-screen pb-20">
      {/* ==========================================
          1. NEW COMMERCE HERO (Santehnika Online Style)
          Desktop height: ~420–520px. 
          Structure: LEFT Banner (8 cols), RIGHT Products of the day (4 cols)
         ========================================== */}
      <section className="pt-6 lg:pt-8 pb-6">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[380px] lg:min-h-[400px]">

            {/* LEFT HERO (8 cols): Main Promotional Banner */}
            <div className="lg:col-span-8 bg-[#2A313C] rounded-3xl p-8 sm:p-12 relative overflow-hidden flex flex-col justify-center text-white shadow-card">
              {/* Decorative Background Elements */}
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 100% 100%, #ffffff 0%, transparent 50%)' }}></div>
              <div className="relative z-10 space-y-5 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold rounded-full shadow-sm">
                  <span>Скидки до 60%</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                  {lang === 'ru'
                    ? 'Созданы для ежедневного наслаждения'
                    : 'Har kunlik qulaylik uchun yaratilgan'}
                </h1>

                <p className="text-sm sm:text-base text-neutral-300 max-w-md leading-relaxed">
                  {lang === 'ru'
                    ? 'Формы для брусчатки и термопанели напрямую от производителя. Качество гарантировано.'
                    : 'Bruschatka qoliplari va termopanellar. Kafolatlangan sifat.'}
                </p>

                <div className="pt-4">
                  <Link
                    href={`/${lang}/catalog`}
                    className="inline-flex px-8 py-3.5 bg-white hover:bg-neutral-100 text-[#111111] font-semibold text-sm rounded-xl transition-all shadow-soft items-center gap-2"
                  >
                    <span>{lang === 'ru' ? 'К товарам' : 'Mahsulotlarga'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* RIGHT HERO (4 cols): "Товары дня" (Products of the day) */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 flex flex-col border border-neutral-100 shadow-soft relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#111111]">
                  {lang === 'ru' ? 'Товары дня' : 'Kun mahsulotlari'}
                </h2>
                <div className="text-sm font-semibold bg-[#F4F5F7] px-3 py-1.5 rounded-lg text-brand-red">
                  08 : 30 : 31
                </div>
              </div>

              {bestsellers[0] && (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="bg-[#FF3B30] text-white text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-2">
                        -40%
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-[#111111]">{formatPrice(bestsellers[0].price, lang)}</span>
                      </div>
                      {bestsellers[0].oldPrice && (
                        <span className="text-sm text-[#98A2B3] line-through block mt-1">{formatPrice(bestsellers[0].oldPrice, lang)}</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/${lang}/product/${bestsellers[0].slug}`} className="text-sm text-[#333333] hover:text-brand-blue line-clamp-2 mb-4 font-medium">
                    {lang === 'ru' ? bestsellers[0].titleRu : bestsellers[0].titleUz}
                  </Link>
                  <div className="relative flex-1 bg-[#F9FAFB] rounded-2xl flex items-center justify-center p-4 min-h-[160px] group">
                    {bestsellers[0].images?.[0]?.url && (
                      <Image
                        src={bestsellers[0].images[0].url}
                        alt="Product"
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ==========================================
          2. QUICK CATEGORY NAVIGATION
          Immediately under hero. 
         ========================================== */}
      <section className="py-6 px-4 sm:px-8 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.slice(0, 6).map((cat) => (
            <CategoryCard key={cat.id} category={cat} lang={lang} />
          ))}
          <Link
            href={`/${lang}/catalog`}
            className="group relative bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-all duration-300 rounded-3xl p-4 sm:p-5 flex flex-col justify-center items-center border border-neutral-100 hover:border-neutral-200 shadow-sm hover:shadow-md overflow-hidden min-h-[160px]"
          >
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-brand-blue shadow-sm mb-3 group-hover:scale-110 transition-transform">
              <ArrowRight className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm text-[#333333] group-hover:text-brand-blue">
              {lang === 'ru' ? 'Смотреть все' : 'Barchasini ko‘rish'}
            </span>
          </Link>
        </div>
      </section>

      {/* ==========================================
          PROMO BANNER
         ========================================== */}
      <section className="py-8 px-4 sm:px-8 max-w-[1440px] mx-auto">
        <div className="bg-[#386532] rounded-3xl overflow-hidden relative min-h-[220px] flex items-center p-8 shadow-card">
          <div className="absolute inset-0 opacity-40 bg-[url('/noise.png')] mix-blend-overlay"></div>
          <div className="relative z-10 max-w-lg text-white space-y-4">
            <h2 className="text-4xl font-black leading-tight">
              {lang === 'ru' ? 'Созрели для ремонта?' : 'Ta\'mirga tayyormisiz?'}
            </h2>
            <div className="inline-block bg-[#F4E3BA] text-[#4A3219] font-black text-xl px-4 py-2 transform -rotate-2 border-2 border-dashed border-[#4A3219] shadow-sm">
              Скидки до 70%
            </div>
            <div className="pt-2">
              <Link href={`/${lang}/catalog`} className="inline-block bg-[#E5F5A4] hover:bg-[#D5E594] text-[#111111] font-bold px-6 py-3 rounded-xl transition-colors shadow-sm">
                Смотреть подборку
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          3. PRODUCT SECTION STARTS EARLY: BESTSELLERS
         ========================================== */}
      <section className="py-8 px-4 sm:px-8 max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111111]">
            {lang === 'ru' ? 'Популярные товары' : 'Ommabop mahsulotlar'}
          </h2>
          <Link
            href={`/${lang}/catalog`}
            className="text-sm font-semibold text-brand-blue hover:underline flex items-center gap-1"
          >
            <span>{lang === 'ru' ? 'Все товары' : 'Barcha mahsulotlar'}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {bestsellers.map((product) => (
            <ProductCard key={product.id} product={product} lang={lang} />
          ))}
        </div>
      </section>

      {/* ==========================================
          4. CATEGORY PRODUCT ROWS
         ========================================== */}
      {/* Row 1: Bruschatka qoliplari */}
      <section className="py-10 px-4 sm:px-8 max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111111]">
            {lang === 'ru' ? 'Формы для брусчатки' : 'Bruschatka qoliplari'}
          </h2>
          <Link
            href={`/${lang}/catalog/bruschatka-qoliplari`}
            className="text-sm font-semibold text-brand-blue hover:underline flex items-center gap-1"
          >
            <span>{lang === 'ru' ? 'Смотреть все' : 'Barchasini ko‘rish'}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {block1Products.map((product) => (
            <ProductCard key={product.id} product={product} lang={lang} />
          ))}
        </div>
      </section>

      {/* Row 2: Termopanellar */}
      <section className="py-10 px-4 sm:px-8 max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111111]">
            {lang === 'ru' ? 'Термопанели' : 'Termopanellar'}
          </h2>
          <Link
            href={`/${lang}/catalog/termopanel`}
            className="text-sm font-semibold text-brand-blue hover:underline flex items-center gap-1"
          >
            <span>{lang === 'ru' ? 'Смотреть все' : 'Barchasini ko‘rish'}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {block2Products.map((product) => (
            <ProductCard key={product.id} product={product} lang={lang} />
          ))}
        </div>
      </section>

      {/* Row 3: 3D Panellar */}
      <section className="py-10 px-4 sm:px-8 max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111111]">
            {lang === 'ru' ? '3D Панели' : '3D Panellar'}
          </h2>
          <Link
            href={`/${lang}/catalog/3d-panellar`}
            className="text-sm font-semibold text-brand-blue hover:underline flex items-center gap-1"
          >
            <span>{lang === 'ru' ? 'Смотреть все' : 'Barchasini ko‘rish'}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {block3Products.map((product) => (
            <ProductCard key={product.id} product={product} lang={lang} />
          ))}
        </div>
      </section>

      {/* Row 4: Dekorativ G'ishtlar */}
      <section className="py-10 px-4 sm:px-8 max-w-[1440px] mx-auto bg-white rounded-[40px] shadow-sm my-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111111]">
            {lang === 'ru' ? 'Декоративный кирпич' : 'Dekorativ G\'ishtlar'}
          </h2>
          <Link
            href={`/${lang}/catalog/dekorativ-gishtlar`}
            className="text-sm font-semibold text-brand-blue hover:underline flex items-center gap-1"
          >
            <span>{lang === 'ru' ? 'Смотреть все' : 'Barchasini ko‘rish'}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {block4Products.map((product) => (
            <ProductCard key={product.id} product={product} lang={lang} />
          ))}
        </div>
      </section>

      {/* ==========================================
          6. MOLD → FINISHED RESULT SHOWCASE (Interactive comparison)
         ========================================== */}
      {featuredMold && (
        <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6">
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
        </section>
      )}

      {/* ==========================================
          8. SERVICES & USEFUL CARDS
         ========================================== */}
      <section className="py-10 px-4 sm:px-8 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="bg-[#F3F4F8] rounded-3xl p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden group hover:shadow-md transition-all duration-300 border border-neutral-200/60">
            <div>
              <h3 className="font-extrabold text-xl text-[#111111] tracking-tight">Qo‘llanma va Jurnal</h3>
              <p className="text-xs text-[#667085] mt-2 leading-relaxed">
                Bruschatka quyish va fasad montaji sirlarini o‘rganing.
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white border border-neutral-200/80 flex items-center justify-center text-neutral-700 group-hover:bg-brand-red group-hover:text-white transition-all shadow-xs shrink-0 mt-6">
              <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          <div className="bg-[#F3F4F8] rounded-3xl p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden group hover:shadow-md transition-all duration-300 border border-neutral-200/60">
            <div>
              <h3 className="font-extrabold text-xl text-[#111111] tracking-tight">Zavod va Ombormiz</h3>
              <p className="text-xs text-[#667085] mt-2 leading-relaxed">
                Toshkent shahridagi bosh ombor va ishlab chiqarish sexlarimiz.
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white border border-neutral-200/80 flex items-center justify-center text-neutral-700 group-hover:bg-brand-red group-hover:text-white transition-all shadow-xs shrink-0 mt-6">
              <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          <div className="bg-[#F3F4F8] rounded-3xl p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden group hover:shadow-md transition-all duration-300 border border-neutral-200/60">
            <div>
              <h3 className="font-extrabold text-xl text-[#111111] tracking-tight">O‘rnatish va Texnologiya</h3>
              <p className="text-xs text-[#667085] mt-2 leading-relaxed">
                Tajribali ustalarimiz quyish texnologiyasini o‘rgatishadi.
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white border border-neutral-200/80 flex items-center justify-center text-neutral-700 group-hover:bg-brand-red group-hover:text-white transition-all shadow-xs shrink-0 mt-6">
              <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

          <div className="bg-[#F3F4F8] rounded-3xl p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden group hover:shadow-md transition-all duration-300 border border-neutral-200/60">
            <div>
              <h3 className="font-extrabold text-xl text-[#111111] tracking-tight">Arzon yetkazib berish</h3>
              <p className="text-xs text-[#667085] mt-2 leading-relaxed">
                Viloyatlarga qulay va tezkor yuk tashish xizmatlari.
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white border border-neutral-200/80 flex items-center justify-center text-neutral-700 group-hover:bg-brand-red group-hover:text-white transition-all shadow-xs shrink-0 mt-6">
              <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>

        </div>
      </section>

      {/* ==========================================
          9. FAQ + SEO SECTION (Cleaned up)
         ========================================== */}
      <section className="py-12 px-4 sm:px-8 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* SEO Paragraphs & Useful Internal Links */}
          <div className="lg:col-span-6 space-y-4 text-[#111111]">
            <h2 className="text-2xl font-bold font-sans">
              SPS PLAST — SIFATLI QOLIPLAR VA TERMOPANELLAR
            </h2>
            <p className="text-sm text-[#667085] leading-relaxed">
              SPS Plast O‘zbekistondagi yetakchi plastmassa matritsalar hamda fasad termopanellarini ishlab chiqaruvchi zavod hisoblanadi. Mahsulotlarimiz yuqori bosimli vakuum-formovka va zamonaviy uskunalar yordamida tayyorlanadi.
            </p>
            <p className="text-sm text-[#667085] leading-relaxed">
              Bruschatka, bordyur, dekorativ plitkalar hamda fasad tizimlari uchun arzon va sifatli qoliplarni onlayn buyurtma qilishingiz mumkin. O‘zbekiston bo‘ylab yetkazib beramiz.
            </p>
            {/* Useful SEO Links */}
            <div className="pt-2 flex flex-wrap gap-2 text-sm font-semibold text-brand-blue">
              <Link href={`/${lang}/catalog`} className="hover:underline bg-white px-3 py-1.5 rounded-lg border border-neutral-200">#Qoliplar</Link>
              <Link href={`/${lang}/catalog/bruschatka-qoliplari`} className="hover:underline bg-white px-3 py-1.5 rounded-lg border border-neutral-200">#Bruschatka</Link>
              <Link href={`/${lang}/catalog/termopanel`} className="hover:underline bg-white px-3 py-1.5 rounded-lg border border-neutral-200">#Termopanel</Link>
            </div>
          </div>

          {/* Accordion FAQ */}
          <div className="lg:col-span-6 space-y-3">
            <h3 className="text-xl font-bold text-[#111111] mb-4">
              Вопросы и ответы
            </h3>

            <details className="group bg-white border border-neutral-200 p-4 rounded-2xl cursor-pointer shadow-sm">
              <summary className="flex items-center justify-between font-semibold text-[#111111] list-none">
                <span>Qoliplarning xizmat ko‘rsatish resursi qancha?</span>
                <ChevronDown className="w-5 h-5 text-neutral-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-sm text-[#667085] mt-3 pt-3 border-t border-neutral-100 leading-relaxed font-sans">
                ABS va polipropilen materialdan tayyorlangan qoliplarimiz to‘g‘ri ishlatilganda 300 marotabadan ortiq quyish resursiga ega.
              </p>
            </details>

            <details className="group bg-white border border-neutral-200 p-4 rounded-2xl cursor-pointer shadow-sm">
              <summary className="flex items-center justify-between font-semibold text-[#111111] list-none">
                <span>Viloyatlarga yetkazib berish shartlari qanday?</span>
                <ChevronDown className="w-5 h-5 text-neutral-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-sm text-[#667085] mt-3 pt-3 border-t border-neutral-100 leading-relaxed font-sans">
                Respublikaning barcha viloyatlariga pochta yoki yuk tashish xizmatlari orqali tezkor va xavfsiz yetkazib beramiz.
              </p>
            </details>

            <details className="group bg-white border border-neutral-200 p-4 rounded-2xl cursor-pointer shadow-sm">
              <summary className="flex items-center justify-between font-semibold text-[#111111] list-none">
                <span>Ulgurji xaridorlar uchun chegirmalar bormi?</span>
                <ChevronDown className="w-5 h-5 text-neutral-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-sm text-[#667085] mt-3 pt-3 border-t border-neutral-100 leading-relaxed font-sans">
                Ha, 100 donadan ortiq buyurtmalar uchun dilerlik va ulgurji narxlar amal qiladi.
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
