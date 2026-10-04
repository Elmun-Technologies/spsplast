import Script from 'next/script';

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

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';
const METRICA_ID = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID || '';
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

export function AnalyticsScripts() {
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
ym(${Number(METRICA_ID)},'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`}
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
    </>
  );
}
