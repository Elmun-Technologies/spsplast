'use client';

import Image from 'next/image';
import { getModelBySlug, modelName } from '@/lib/catalog2027';
import { type Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { useCompareList } from '@/lib/store/spsLists';

/**
 * Solishtirish paneli: 1+ model belgilansa ekran pastida qora fixed panel
 * (maks 4 model, HANDOFF 3).
 */
export function CompareBar({ lang }: { lang: Locale }) {
  const t = getUi(lang).catalog;
  const compare = useCompareList();
  const models = compare.slugs.flatMap((s) => {
    const m = getModelBySlug(s);
    return m ? [m] : [];
  });
  if (models.length === 0) return null;

  return (
    <div className="cmp-bar" role="region" aria-label={t.cardCompare}>
      <span className="cmp-bar__thumbs">
        {models.slice(0, 4).map((m) =>
          m.images.molds.A || m.images.sceneSm ? (
            <Image key={m.slug} src={m.images.molds.A || m.images.sceneSm || ''} alt={modelName(m, lang)} width={40} height={40} style={{ objectFit: 'cover', borderRadius: 6 }} />
          ) : null,
        )}
      </span>
      <span className="cmp-bar__txt">
        {models.length} {t.compareOf}
      </span>
      <button type="button" className="sps-btn sps-btn--link" onClick={() => compare.clear()}>
        {t.compareClear}
      </button>
      <a className="sps-btn sps-btn--primary sps-btn--sm" href={`/${lang}/compare`}>
        {t.compareGo}
      </a>
    </div>
  );
}
