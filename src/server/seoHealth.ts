import type { Db } from './db/client.ts';
import { listSeoPages, SEO_HINTS } from './seoAdmin.ts';
import { getReportConfig } from './secrets.ts';
import { pendingChanges } from './settings.ts';
import { integrationValue } from '../lib/integrations.ts';
import { getModels, modelImage, modelName } from '../lib/catalog2027.ts';
import { indexablePaths } from '../lib/sitePaths.ts';
import { noindexPaths } from '../lib/seoOverrides.ts';
import { SITE_URL } from '../lib/seo.ts';

/**
 * Admin → SEO → "Salomatlik": saytdagi (oxirgi nashr) holat bo'yicha tekshiruvlar ro'yxati.
 * Har bir band — nima yetishmaydi va qayerda tuzatiladi.
 */
export type HealthCheck = { status: 'ok' | 'warn' | 'bad'; title: string; detail: string; href?: string };

export async function seoHealth(db: Db): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];
  const add = (status: HealthCheck['status'], title: string, detail: string, href?: string) => checks.push({ status, title, detail, href });

  // 1. Domen
  add(
    SITE_URL === 'https://spsplast.com' ? 'ok' : 'warn',
    'Kanonik domen',
    SITE_URL === 'https://spsplast.com' ? SITE_URL : `${SITE_URL} — rejadagi domen https://spsplast.com (NEXT_PUBLIC_SITE_URL)`,
  );

  // 2. Qidiruv tizimlarida tasdiq
  const verify: [string, string][] = [
    ['google_site_verification', 'Google Search Console'],
    ['yandex_verification', 'Yandex Webmaster'],
    ['bing_verification', 'Bing Webmaster'],
  ];
  for (const [key, label] of verify) {
    const on = !!integrationValue(key);
    add(on ? 'ok' : key === 'bing_verification' ? 'warn' : 'bad', `${label} tasdig'i`, on ? 'Meta-teg saytda' : "Meta-teg kiritilmagan yoki nashr qilinmagan", '/admin/settings');
  }

  // 3. Analitika
  const metrica = !!integrationValue('yandex_metrica_id');
  const google = !!(integrationValue('gtm_id') || integrationValue('ga4_id'));
  add(metrica ? 'ok' : 'bad', 'Yandex Metrica', metrica ? 'Hisoblagich saytda' : 'RU/KZ trafigi uchun asosiy — hisoblagich raqamini kiriting', '/admin/settings');
  add(google ? 'ok' : 'bad', 'Google Analytics 4 / GTM', google ? 'Saytda' : 'GA4 yoki GTM ulanmagan', '/admin/settings');
  add(integrationValue('indexnow_key') ? 'ok' : 'warn', 'IndexNow kaliti', integrationValue('indexnow_key') ? 'Yandex va Bing tez indekslaydi' : "Kalit yaratilmagan (SEO → Indekslash)", '/admin/seo?tab=index');

  // 4. Hisobotlar
  const cfg = await getReportConfig(db);
  add(cfg.serviceAccount && cfg.gscProperty ? 'ok' : 'warn', 'Search Console hisobotlari', cfg.serviceAccount && cfg.gscProperty ? 'Ulangan' : "Admin'da so'rovlar va pozitsiyalarni ko'rish uchun ulang", '/admin/analytics#connect');
  add(cfg.yandexToken ? 'ok' : 'warn', 'Yandex hisobotlari (Metrica, Webmaster)', cfg.yandexToken ? 'Ulangan' : 'OAuth token kiritilmagan', '/admin/analytics#connect');

  // 5. Katalog kontenti
  const models = getModels();
  const noRu = models.filter((m) => !m.name.ru);
  const noEn = models.filter((m) => !m.name.en);
  const noImg = models.filter((m) => !modelImage(m));
  add(
    noRu.length ? 'warn' : 'ok',
    'Rus tilidagi model nomlari',
    noRu.length
      ? `${noRu.length} / ${models.length} modelda tasdiqlangan name.ru yo'q — saytda avtomatik kirill transliteratsiyasi chiqadi (masalan: ${noRu
          .slice(0, 3)
          .map((m) => modelName(m, 'ru'))
          .join(', ')}); texnolog tekshirgan nom yaxshiroq`
      : 'Hammasi bor',
    '/admin/products',
  );
  add(noEn.length ? 'warn' : 'ok', 'Ingliz tilidagi model nomlari', noEn.length ? `${noEn.length} modelda name.en yo'q (avtomatik tarjima chiqadi)` : 'Hammasi bor', '/admin/products');
  add(noImg.length ? 'warn' : 'ok', 'Model rasmlari', noImg.length ? `${noImg.length} modelda rasm yo'q ("Foto tayyorlanmoqda")` : 'Hammasida rasm bor', '/admin/products');

  // 6. Admin SEO yozuvlari
  const rows = await listSeoPages(db);
  const longTitles = rows.filter((r) => r.title && r.title.length > SEO_HINTS.titleMax);
  const badDesc = rows.filter((r) => r.description && (r.description.length < SEO_HINTS.descriptionMin || r.description.length > SEO_HINTS.descriptionMax));
  add(
    longTitles.length ? 'warn' : 'ok',
    'Title uzunligi (admin)',
    longTitles.length ? `${longTitles.length} ta title ${SEO_HINTS.titleMax} belgidan uzun — Google qirqadi: ${longTitles.slice(0, 3).map((r) => `${r.lang}${r.path || '/'}`).join(', ')}` : `Hammasi ≤ ${SEO_HINTS.titleMax} belgi`,
    '/admin/seo',
  );
  add(
    badDesc.length ? 'warn' : 'ok',
    'Description uzunligi (admin)',
    badDesc.length ? `${badDesc.length} ta tavsif ${SEO_HINTS.descriptionMin}–${SEO_HINTS.descriptionMax} oralig'idan tashqarida` : 'Me\'yorda',
    '/admin/seo',
  );
  const hidden = noindexPaths();
  add(hidden.size ? 'warn' : 'ok', 'Indeksdan yopilgan sahifalar', hidden.size ? `${hidden.size} ta sahifa noindex: ${[...hidden].slice(0, 5).join(', ')}` : "Yo'q", '/admin/seo?k=noindex');

  // 7. Sitemap va nashr
  const urls = indexablePaths().filter((p) => !hidden.has(p.path)).length * 3;
  add('ok', 'Sitemap', `${urls} ta URL (3 tilda) — ${SITE_URL}/sitemap.xml`);
  const pending = await pendingChanges(db);
  const total = pending.products + pending.sections + pending.settings + pending.seo + pending.redirects + pending.texts;
  add(total ? 'warn' : 'ok', 'Nashr qilinmagan o\'zgarishlar', total ? `${total} ta o'zgarish saytda emas — "Nashr qilish"ni bosing` : "Hammasi saytda");

  return checks;
}
