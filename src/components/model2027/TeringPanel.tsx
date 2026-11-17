'use client';

import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n';

/**
 * "Соберите сами" / "Terib ko'ring" — trotuar modelining plitkasini o'zingiz teradigan 3D rejim (Lego kabi).
 * Mantiq `scripts/3d/tering/builder.js` da (QR 3D sahifalar bilan bir xil), three.js faqat shu tab ochilganda
 * dynamic import bilan yuklanadi. Skelet `.tg` ichida — builder shu DOM'ni topib ishlaydi.
 */
const T: Record<
  Locale,
  {
    aria: string;
    loading: string;
    count: string;
    fill: string;
    clear: string;
    rot: string;
    swatch: string;
    colors: [string, string][];
    hint: string;
    hintTurn: string;
    tray: string;
    left: string;
    done: string;
    nogl: string;
    fail: string;
    mm: string;
    locale: string;
  }
> = {
  uz: {
    aria: '3D: plitkani o‘zingiz teriring',
    loading: '3D yuklanmoqda…',
    count: 'Plitkalar: {n} · ≈ {area} m²',
    fill: 'Hammasini to‘ldirish',
    clear: 'Tozalash',
    rot: '⟳ Burish',
    swatch: 'Plitka rangi',
    colors: [['', 'Katalogdagidek'], ['#a3a19b', 'Kulrang'], ['#a64b3c', 'Qizil'], ['#d2ae5f', 'Sariq'], ['#7b5640', 'Jigarrang'], ['#47474b', 'Grafit']],
    hint: 'Plitkani to‘plamdan bo‘sh katakka sudrang · to‘rdagi plitkani bossangiz — olib tashlanadi',
    hintTurn: 'Plitkani bosing — buriladi',
    tray: 'Plitkalar to‘plami — to‘rga sudrang',
    left: 'qoldi',
    done: 'tayyor',
    nogl: 'Brauzer 3D ni qo‘llamaydi. «Terilgan» tabini ko‘ring.',
    fail: 'Model yuklanmadi. Sahifani yangilang.',
    mm: 'mm',
    locale: 'uz-UZ',
  },
  ru: {
    aria: '3D: уложите плитку сами',
    loading: 'Загрузка 3D…',
    count: 'Плиток: {n} · ≈ {area} м²',
    fill: 'Заполнить всё',
    clear: 'Очистить',
    rot: '⟳ Поворот',
    swatch: 'Цвет плитки',
    colors: [['', 'Как в каталоге'], ['#a3a19b', 'Серый'], ['#a64b3c', 'Красный'], ['#d2ae5f', 'Жёлтый'], ['#7b5640', 'Коричневый'], ['#47474b', 'Графит']],
    hint: 'Перетащите плитку из набора на пустую клетку · на плитку в сетке — уберите её',
    hintTurn: 'Нажмите на плитку — поверните её',
    tray: 'Набор плиток — перетащите на сетку',
    left: 'осталось',
    done: 'готово',
    nogl: 'Ваш браузер не поддерживает 3D. Посмотрите вкладку «Укладка».',
    fail: 'Не удалось загрузить модель. Обновите страницу.',
    mm: 'мм',
    locale: 'ru-RU',
  },
  en: {
    aria: '3D: lay the tiles yourself',
    loading: 'Loading 3D…',
    count: 'Tiles: {n} · ≈ {area} m²',
    fill: 'Fill all',
    clear: 'Clear',
    rot: '⟳ Rotate',
    swatch: 'Tile colour',
    colors: [['', 'As in catalog'], ['#a3a19b', 'Grey'], ['#a64b3c', 'Red'], ['#d2ae5f', 'Yellow'], ['#7b5640', 'Brown'], ['#47474b', 'Graphite']],
    hint: 'Drag a tile from the set onto an empty cell · click a placed tile to remove it',
    hintTurn: 'Click a tile to rotate it',
    tray: 'Tile set — drag onto the grid',
    left: 'left',
    done: 'done',
    nogl: 'Your browser does not support 3D. See the “Laid” tab.',
    fail: 'Could not load the model. Reload the page.',
    mm: 'mm',
    locale: 'en-US',
  },
};

export function TeringPanel({ id, hole, lang }: { id: string; hole: [number, number, number] | null; lang: Locale }) {
  const t = T[lang];
  const root = useRef<HTMLDivElement>(null);
  const hintEl = useRef<HTMLParagraphElement>(null);
  const [hint, setHint] = useState(t.hint);
  void setHint;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let handle: { show(on: boolean): void; dispose(): void } | null = null;
    let cancelled = false;
    import('../../../scripts/3d/tering/builder.js')
      .then((m) => {
        if (cancelled) return;
        handle = m.mount(el, {
          glb: `/3d/${id}/terilgan.glb`,
          hole,
          hint: hintEl.current,
          labels: {
            nogl: t.nogl,
            fail: t.fail,
            hintPlace: t.hint,
            hintTurn: t.hintTurn,
            tray: t.tray,
            left: t.left,
            done: t.done,
            count: t.count,
            mm: t.mm,
            locale: t.locale,
          },
        });
        handle.show(true);
      })
      .catch(() => {
        const bl = el.querySelector('.bl');
        if (bl) bl.textContent = t.fail;
      });
    return () => {
      cancelled = true;
      handle?.dispose();
    };
  }, [id, hole, t]);

  return (
    <div className="tg">
      <div ref={root} className="bd">
        <div className="bv" role="img" aria-label={t.aria}>
          <div className="bc" aria-live="polite">
            {t.count.replace('{n}', '0').replace('{area}', '0,00')}
          </div>
          <div className="bl">{t.loading}</div>
        </div>
        <div className="bt">
          <div className="sw" role="radiogroup" aria-label={t.swatch}>
            {t.colors.map(([c, n], i) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={i === 0}
                data-c={c}
                title={n}
                aria-label={n}
                style={c ? { background: c } : undefined}
              />
            ))}
          </div>
          <div className="ba">
            <button type="button" data-a="fill">{t.fill}</button>
            <button type="button" data-a="clear">{t.clear}</button>
            <button type="button" data-a="rot" aria-pressed="false">{t.rot}</button>
          </div>
        </div>
      </div>
      <p ref={hintEl} className="muted" style={{ margin: 0, fontSize: 14 }}>{hint}</p>
    </div>
  );
}
