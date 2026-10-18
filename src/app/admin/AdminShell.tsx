import Link from 'next/link';
import Image from 'next/image';
import { count, eq } from 'drizzle-orm';
import type { SessionUser } from '@/server/auth';
import { getDb } from '@/server/db/client';
import { leads } from '@/server/db/schema';
import { AutoRefresh } from './AutoRefresh';
import { logoutAction } from './actions';
import { ROLE_LABEL } from './labels';

const NAV = [
  { href: '/admin', label: 'Bosh sahifa', key: 'home' },
  { href: '/admin/leads', label: 'Zayafkalar', key: 'leads' },
  { href: '/admin/visits', label: 'Tashriflar', key: 'visits' },
  { href: '/admin/products', label: 'Mahsulotlar', key: 'products' },
  { href: '/admin/settings', label: 'Sozlamalar', key: 'settings', admin: true },
  { href: '/admin/users', label: 'Xodimlar', key: 'users', admin: true },
  { href: '/admin/account', label: 'Profil', key: 'account' },
] as const;

/** Menyudagi "Zayafkalar" yonida yangi (hali ishlanmagan) zayafkalar soni. */
async function newLeadsCount(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  try {
    const [{ n }] = await db.select({ n: count() }).from(leads).where(eq(leads.status, 'new'));
    return n;
  } catch {
    return 0;
  }
}

export async function AdminShell({
  user,
  active,
  title,
  actions,
  children,
}: {
  user: SessionUser;
  active: (typeof NAV)[number]['key'];
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const fresh = await newLeadsCount();
  return (
    <>
      <header className="adm-top">
        <div className="adm-wrap adm-top__row">
          <Link href="/admin" className="adm-brand" aria-label="SPS Admin">
            <Image src="/images/brand/logo-ink.webp" alt="" width={52} height={32} priority />
            <span>Admin</span>
          </Link>
          <nav className="adm-nav" aria-label="Admin bo'limlari">
            {NAV.filter((n) => !('admin' in n) || user.role === 'admin').map((n) => (
              <Link key={n.key} href={n.href} aria-current={n.key === active ? 'page' : undefined}>
                {n.label}
                {n.key === 'leads' && fresh ? (
                  <span className="adm-navbadge" aria-label={`${fresh} ta yangi`}>
                    {fresh}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
          <div className="adm-user">
            <span>
              <b>{user.name}</b>
              <small>{ROLE_LABEL[user.role]}</small>
            </span>
            <form action={logoutAction}>
              <button className="sps-btn sps-btn--outline sps-btn--sm" type="submit">
                Chiqish
              </button>
            </form>
          </div>
        </div>
      </header>
      {/* Yangi zayafka kelsa sahifa o'zi yangilanadi (forma to'ldirilayotgan bo'lsa — yo'q). */}
      <AutoRefresh seconds={60} />
      <main className="adm-wrap adm-main" id="main-content">
        <div className="adm-head">
          <h1>{title}</h1>
          {actions ? <div className="adm-head__act">{actions}</div> : null}
        </div>
        {children}
      </main>
    </>
  );
}

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <span className={`adm-st adm-st--${status}`}>{label}</span>;
}
