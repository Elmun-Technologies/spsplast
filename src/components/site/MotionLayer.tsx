'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Sayt animatsiyalari uchun yagona yengil qatlam (kutubxonasiz, ~1 KB):
 *  - header'ga soya: sahifa aylantirilganda `html[data-scrolled]`;
 *  - aylantirganda paydo bo'lish: faqat **ekrandan pastdagi** bloklar yashirilib, ko'ringanda
 *    chiqadi — birinchi ekran (LCP) hech qachon yashirilmaydi va miltillamaydi;
 *  - raqamlar sanog'i (`[data-countup]`): faqat ekrandan pastda bo'lsa (SSR qiymati yakuniy).
 * `prefers-reduced-motion` da hech narsa qilinmaydi (CSS ham animatsiyani o'chiradi).
 */
const REVEAL = [
  'main .sps-card',
  'main .usp > *',
  'main .steps > div',
  'main .who',
  'main .secs > .st',
  'main .faq',
  'main .rel > *',
  'main section h2.h1',
  'main .ct-row',
  'main .pt-form',
  'main .sps-stat',
].join(',');

function countUp(el: HTMLElement) {
  const target = el.textContent ?? '';
  const m = /^(\d[\d\s ]*)(.*)$/.exec(target.trim());
  if (!m) return;
  const end = Number(m[1].replace(/\D/g, ''));
  if (!Number.isFinite(end) || end < 2) return;
  const sep = /\d[\s ]\d/.test(m[1]) ? m[1].match(/[\s ]/)?.[0] ?? ' ' : '';
  const fmt = (n: number) => (sep ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep) : String(n)) + m[2];
  const t0 = performance.now();
  const dur = 900;
  const tick = (now: number) => {
    const k = Math.min(1, (now - t0) / dur);
    el.textContent = fmt(Math.round(end * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  };
  el.textContent = fmt(0);
  requestAnimationFrame(tick);
}

export function MotionLayer() {
  const pathname = usePathname();

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        document.documentElement.toggleAttribute('data-scrolled', window.scrollY > 8);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const fold = window.innerHeight;

    const io = new IntersectionObserver(
      (entries) => {
        let i = 0;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          if (el.hasAttribute('data-countup')) {
            countUp(el);
            continue;
          }
          el.style.transitionDelay = `${Math.min(i, 4) * 60}ms`;
          el.setAttribute('data-rv', 'in');
          i += 1;
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );

    const scan = () => {
      document.querySelectorAll<HTMLElement>(REVEAL).forEach((el) => {
        if (el.hasAttribute('data-rv')) return;
        // Faqat ekrandan pastdagilar: yuqoridagisi darhol ko'rinib turadi (miltillamaydi).
        if (el.getBoundingClientRect().top < fold) return;
        el.setAttribute('data-rv', '');
        io.observe(el);
      });
      document.querySelectorAll<HTMLElement>('[data-countup]').forEach((el) => {
        if (el.dataset.cu) return;
        el.dataset.cu = '1';
        if (el.getBoundingClientRect().top >= fold) io.observe(el);
      });
    };
    scan();
    // "Yana ko'rsatish", filtrlar — mijoz tomonida qo'shilgan kartochkalar.
    let t = 0;
    const mo = new MutationObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(scan, 80);
    });
    const main = document.getElementById('main-content');
    if (main) mo.observe(main, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      window.clearTimeout(t);
    };
  }, [pathname]);

  return null;
}
