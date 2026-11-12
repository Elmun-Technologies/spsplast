import { NotFoundBody } from '@/components/site/NotFoundBody';
import { NotFoundLangPick } from '@/components/site/NotFoundLangPick';

/**
 * Til ichidagi 404. Next `not-found.tsx` ga `params` bermaydi — tana uch tilda server'da
 * renderlanadi, til mijozda `useParams()` bilan tanlanadi (noma'lum holatda uz).
 */
export default function LangNotFound() {
  return <NotFoundLangPick uz={<NotFoundBody lang="uz" />} ru={<NotFoundBody lang="ru" />} en={<NotFoundBody lang="en" />} />;
}
