'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

/**
 * Analitika skriptlari (P0-12).
 *
 * Bu komponent faqat mos muhit o'zgaruvchisi o'rnatilgan bo'lsa yuklanadi —
 * ID bo'lmasa saytga birorta ham tashqi skript qo'shilmaydi (tezlik va
 * cookie siyosati uchun muhim). `afterInteractive` strategiyasi skriptlarni
 * sahifa interaktiv bo'lgandan keyin yuklaydi, ya'ni LCP'ga ta'sir qilmaydi.
 *
 * `src/lib/analytics.ts` dagi `trackEvent()` shu skriptlar taqdim etadigan
 * `dataLayer` / `gtag` / `ym` / `fbq` global obyektlariga yozadi.
 */

/**
 * ID'lar root layout'da (server) `analyticsConfig()` dan keladi: admin →
 * "Integratsiyalar" (bazadan, nashr paytida) yoki env (NEXT_PUBLIC_GTM_ID,
 * NEXT_PUBLIC_GA_MEASUREMENT_ID, NEXT_PUBLIC_YANDEX_METRICA_ID,
 * NEXT_PUBLIC_META_PIXEL_ID). Formatlar `src/lib/integrations.ts` da tekshirilgan.
 */
export type AnalyticsConfig = { gtm: string; ga4: string; metrica: string; pixel: string; tiktok: string };

export function AnalyticsScripts({ config }: { config: AnalyticsConfig }) {
  const { gtm: GTM_ID, ga4: GA_ID, metrica: METRICA_ID, pixel: PIXEL_ID, tiktok: TIKTOK_ID } = config;
  // Admin panel trafigi sayt statistikasini buzmasin.
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      {GTM_ID && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;
j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      )}

      {/* GA4 to'g'ridan-to'g'ri: GTM ishlatilmasa ham `gtag()` mavjud bo'lsin. */}
      {GA_ID && !GTM_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:true});`}
          </Script>
        </>
      )}

      {METRICA_ID && (
        <Script id="ym-init" strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
ym(${Number(METRICA_ID)},'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});window.__spsYm=${Number(METRICA_ID)};`}
        </Script>
      )}

      {PIXEL_ID && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;
n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
        </Script>
      )}

      {TIKTOK_ID && (
        <Script id="tiktok-pixel-init" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${TIKTOK_ID}');ttq.page();}(window,document,'ttq');`}
        </Script>
      )}
    </>
  );
}
