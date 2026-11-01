import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireUser } from '@/server/session';
import { getSeoPage, H1_KINDS, knownPath } from '@/server/seoAdmin';
import { fetchLiveMeta } from '@/server/liveMeta';
import { SITE_URL } from '@/lib/seo';
import { AdminShell } from '../../AdminShell';
import { PublishBar } from '../../PublishBar';
import { SeoEditForm } from '../forms';
import { resetSeoPageAction, saveSeoPageAction } from '../actions';

export const metadata = { title: 'SEO · tahrirlash' };

export default async function SeoEditPage({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
  const { user, db } = await requireUser('admin');
  const path = (await searchParams).path ?? '';
  const page = knownPath(path);
  if (!page) notFound();

  const rows = await getSeoPage(db, path);
  const initial: Record<string, string> = {};
  for (const r of rows) {
    for (const k of ['title', 'description', 'h1', 'intro'] as const) initial[`${r.lang}.${k}`] = r[k] ?? '';
  }
  // Saytda hozir chiqayotgan matn (standart yoki oldingi nashr) — joriy deploy'dan o'qiladi.
  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`;
  const [uz, ru, en] = await Promise.all(['uz', 'ru', 'en'].map((l) => fetchLiveMeta(origin, `/${l}${path}`)));

  return (
    <AdminShell
      user={user}
      active="seo"
      title={page.label}
      actions={
        <Link className="sps-btn sps-btn--link sps-btn--sm" href="/admin/seo">
          ← Sahifalar
        </Link>
      }
    >
      <PublishBar db={db} />
      <p className="adm-note">
        Manzil: <span className="adm-mono">/{'{uz|ru|en}'}{path || ''}</span> ·{' '}
        <a href={`${SITE_URL}/ru${path}`} target="_blank" rel="noopener noreferrer">
          saytda ochish
        </a>
        {!uz && !ru && !en ? ' · (joriy matnni o\'qib bo\'lmadi — standart placeholder ko\'rinmaydi)' : ''}
      </p>
      <SeoEditForm
        action={saveSeoPageAction}
        path={path}
        initial={initial}
        initialNoindex={rows.some((r) => r.noindex)}
        live={{ uz, ru, en }}
        allowH1={(H1_KINDS as readonly string[]).includes(page.kind)}
        siteUrl={SITE_URL}
      />
      {rows.length ? (
        <form action={resetSeoPageAction} style={{ marginTop: 16 }}>
          <input type="hidden" name="path" value={path} />
          <button className="sps-btn sps-btn--outline sps-btn--sm" type="submit">
            Standartga qaytarish (admin matnlarini o&apos;chirish)
          </button>
        </form>
      ) : null}
    </AdminShell>
  );
}
