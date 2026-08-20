import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { ProductCard } from '@/components/product/ProductCard';
import { CategoryCard } from '@/components/product/CategoryCard';
import { MoldResultShowcase } from '@/components/product/MoldResultShowcase';
import { Button } from '@/components/ui/Button';
import {
  Layers,
  PhoneCall,
  Download,
  ShieldCheck,
  Truck,
  Building2,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Award,
} from 'lucide-react';

interface HomePageProps {
  params: { lang: Locale };
}

export default async function HomePage({ params: { lang } }: HomePageProps) {
  const dict = getDictionary(lang);

  // Fetch Categories, Bestsellers, New Products, Hero Banner, Projects from DB
  const categories = await db.category.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  const bestsellers = await db.product.findMany({
    where: { isBestseller: true },
    include: { images: true },
    take: 6,
  });

  const newProducts = await db.product.findMany({
    where: { isNew: true },
    include: { images: true },
    take: 6,
  });

  const featuredMoldProduct = await db.product.findFirst({
    where: { resultImage: { not: null } },
    include: { images: true },
  });

  const projects = await db.project.findMany({ take: 3 });

  return (
    <div className="space-y-16 lg:space-y-24 pb-12">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-card/90 via-brand-dark to-brand-dark py-16 sm:py-24 border-b border-brand-border/60">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-red/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-red/15 border border-brand-red/30 text-brand-red font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              SPS PLAST — Rasmiy Zavod Platformasi
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              {dict.hero.title}
            </h1>

            <p className="text-base sm:text-xl text-gray-300 max-w-2xl font-normal leading-relaxed">
              {dict.hero.subtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link href={`/${lang}/catalog`}>
                <Button size="lg" className="gap-2 text-base font-bold shadow-red">
                  <Layers className="w-5 h-5" />
                  {dict.hero.ctaCatalog}
                </Button>
              </Link>

              <a href="tel:+998901234567">
                <Button size="lg" variant="secondary" className="gap-2 text-base">
                  <PhoneCall className="w-5 h-5 text-brand-red" />
                  {dict.hero.ctaConsult}
                </Button>
              </a>

              <a
                href="/catalog.pdf"
                download
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-brand-border hover:border-brand-red text-xs font-semibold text-gray-300 hover:text-white transition-colors"
              >
                <Download className="w-4 h-4 text-brand-red" />
                {dict.hero.downloadPdf}
              </a>
            </div>

            {/* Stats row */}
            <div className="pt-8 border-t border-brand-border/60 grid grid-cols-3 gap-4 text-center lg:text-left">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">500+</p>
                <p className="text-xs text-gray-400">Qolip Turlari</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-brand-red">100%</p>
                <p className="text-xs text-gray-400">O‘z Ishlab chiqarishimiz</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-white">3000+</p>
                <p className="text-xs text-gray-400">Mamnun Mijozlar</p>
              </div>
            </div>
          </div>

          {/* Hero Right Visual */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border-2 border-brand-border shadow-2xl bg-black/60 group">
              <Image
                src="https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=1200&q=80"
                alt="SPS Plast Zavodi va Mahsulotlar"
                fill
                priority
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent opacity-80" />
              
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl glass-panel border border-white/10 space-y-1">
                <p className="text-xs font-mono uppercase text-brand-red font-bold">Industrial Quality</p>
                <p className="text-sm font-bold text-white">ABS va Polipropilen Vakuumli Qoliplar</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. CATEGORIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {dict.home.categoriesTitle}
            </h2>
            <p className="text-sm text-gray-400 mt-1">Qurilish va ishlab chiqarish uchun asosiy bo‘limlar</p>
          </div>

          <Link
            href={`/${lang}/catalog`}
            className="flex items-center gap-1.5 text-sm font-semibold text-brand-red hover:underline"
          >
            <span>{dict.home.viewAll}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} lang={lang} />
          ))}
        </div>
      </section>

      {/* 3. BESTSELLERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {dict.home.bestsellersTitle}
            </h2>
            <p className="text-sm text-gray-400 mt-1">Mijozlarimiz tomonidan eng ko‘p buyurtma berilgan qolipsimon va fasad mahsulotlari</p>
          </div>

          <Link
            href={`/${lang}/catalog`}
            className="flex items-center gap-1.5 text-sm font-semibold text-brand-red hover:underline"
          >
            <span>{dict.home.viewAll}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bestsellers.map((product) => (
            <ProductCard key={product.id} product={product} lang={lang} />
          ))}
        </div>
      </section>

      {/* 4. MOLD RESULT COMPARISON SHOWCASE (USP) */}
      {featuredMoldProduct && featuredMoldProduct.resultImage && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MoldResultShowcase
            moldImage={featuredMoldProduct.images[0]?.url || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80'}
            resultImage={featuredMoldProduct.resultImage}
            moldTitle={lang === 'ru' ? featuredMoldProduct.titleRu : featuredMoldProduct.titleUz}
            resultTitle={featuredMoldProduct.resultTitleUz || 'Tayyor bruschatka namunasi'}
            lang={lang}
          />
        </section>
      )}

      {/* 5. WHY SPS PLAST (USPs) */}
      <section className="bg-brand-card/60 border-y border-brand-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {dict.home.whyUsTitle}
            </h2>
            <p className="text-sm text-gray-400">Nima uchun yuzlab bruschatka va beton sexlari aynan SPS Plast brendini tanlaydi?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-brand-dark border border-brand-border space-y-3">
              <div className="w-12 h-12 rounded-xl bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">O‘z Ishlab chiqarishimiz</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Zamonaviy vakuum-formovka va quyish liniyalari. Hech qanday vositachilarsiz eng arzon birinchi qo‘l narx.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-brand-dark border border-brand-border space-y-3">
              <div className="w-12 h-12 rounded-xl bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Yuqori Chidamlilik (300+ Resurs)</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                2mm-3mm birinchi navli ABS va polipropilen plastik xomashyosi. Singan va deformatsiyaga chidamli.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-brand-dark border border-brand-border space-y-3">
              <div className="w-12 h-12 rounded-xl bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">O‘zbekiston Bo‘ylab Express Yetkazish</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Toshkent, Samarqand, Buxoro, Farg‘ona vodiysi va barcha viloyat markazlariga tezkor yetkazib berish.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-brand-dark border border-brand-border space-y-3">
              <div className="w-12 h-12 rounded-xl bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Shaxsiy Ulgurji Narxlar (B2B)</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Katta volumen va sex egalari uchun maxsus chegirma tizimi va shartnoma asosida ishlash.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-brand-dark border border-brand-border space-y-3">
              <div className="w-12 h-12 rounded-xl bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Mukammal Geometriya va Finish</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Har bir qolip 0.1mm aniqlikda ishlab chiqariladi. Beton osongina qolipdan ko‘chib chiqadi.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-brand-dark border border-brand-border space-y-3">
              <div className="w-12 h-12 rounded-xl bg-brand-red/10 border border-brand-red/30 flex items-center justify-center text-brand-red">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Texnologik Konsultatsiya</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Bruschatka quyish, betonga bo‘yoq va plastifikator qo‘shish boyicha bepul mutaxassis ko‘magi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. NEW PRODUCTS */}
      {newProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {dict.home.newProductsTitle}
              </h2>
              <p className="text-sm text-gray-400 mt-1">Yangi shakl va dizayndagi eng so‘nggi qoliplarimiz</p>
            </div>

            <Link
              href={`/${lang}/catalog`}
              className="flex items-center gap-1.5 text-sm font-semibold text-brand-red hover:underline"
            >
              <span>{dict.home.viewAll}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {newProducts.map((product) => (
              <ProductCard key={product.id} product={product} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {/* 7. REAL PROJECTS SHOWCASE */}
      {projects.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {dict.home.projectsTitle}
            </h2>
            <p className="text-sm text-gray-400">SPS Plast qoliplaridan tayyorlangan real hovli va ko‘chalar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden p-4 space-y-3"
              >
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black/40">
                  <Image
                    src={proj.afterImage}
                    alt={proj.titleUz}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Bajarilgan Loyiha
                  </div>
                </div>
                <h4 className="font-bold text-white text-base">{proj.titleUz}</h4>
                <p className="text-xs text-gray-400 line-clamp-2">{proj.descriptionUz}</p>
                <p className="text-[11px] font-mono text-brand-red">Lokatsiya: {proj.location}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. B2B WHOLESALE BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-r from-brand-card via-brand-dark to-brand-card border-2 border-brand-red/40 rounded-3xl p-8 sm:p-12 overflow-hidden shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-center lg:text-left">
            <span className="px-3 py-1 rounded-full bg-brand-red text-white font-extrabold text-xs uppercase tracking-wider">
              B2B / Wholesale Offer
            </span>
            <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              {dict.home.b2bBannerTitle}
            </h3>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              {dict.home.b2bBannerDesc}
            </p>
          </div>

          <Link href={`/${lang}/contact`}>
            <Button size="lg" className="px-8 py-4 font-bold text-base whitespace-nowrap shadow-red">
              {dict.home.getB2bQuote}
            </Button>
          </Link>
        </div>
      </section>

      {/* 9. FAQ ACCORDION SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            {dict.home.faqTitle}
          </h2>
          <p className="text-sm text-gray-400">Harid va texnologiya bo‘yicha eng ko‘p beriladigan savollar</p>
        </div>

        <div className="space-y-4">
          <details className="group bg-brand-card border border-brand-border rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex items-center justify-between cursor-pointer font-bold text-white text-base">
              <span>Viloyatlarga yetkazib berish mavjudmi?</span>
              <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-3 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-brand-border/60 pt-3">
              Ha, albatta. Biz O‘zbekistonning barcha viloyat va tumanlariga pochta va kuryerlik xizmati orqali yetkazib beramiz.
            </p>
          </details>

          <details className="group bg-brand-card border border-brand-border rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex items-center justify-between cursor-pointer font-bold text-white text-base">
              <span>Qoliplar necha marta beton quyishga chidaydi?</span>
              <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-3 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-brand-border/60 pt-3">
              Bizning 2mm va 3mm li ABS plastik qoliplarimiz to‘g‘ri parvarish va moylash bilan 300 dan 500 martagacha beton quyish resursiga ega.
            </p>
          </details>

          <details className="group bg-brand-card border border-brand-border rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex items-center justify-between cursor-pointer font-bold text-white text-base">
              <span>Ulgurji (Optom) narxlar va shartlar qanday?</span>
              <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-3 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-brand-border/60 pt-3">
              50 donadan ortiq buyurtmalar uchun maxsus ulgurji narxlar va chegirmalar amal qiladi. Savatda yoki mahsulot sahifasida "Ulgurji narx olish" tugmasini bosing.
            </p>
          </details>

          <details className="group bg-brand-card border border-brand-border rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex items-center justify-between cursor-pointer font-bold text-white text-base">
              <span>To‘lov usullari qanday?</span>
              <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-3 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-brand-border/60 pt-3">
              Naqd pul, Click, Payme, shuningdek yuridik shaxslar uchun bank o‘tkazmasi (pul o‘tkazish) orqali to‘lov qilishingiz mumkin.
            </p>
          </details>
        </div>
      </section>

    </div>
  );
}
