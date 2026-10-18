import Image from 'next/image';
import { redirect } from 'next/navigation';
import { currentUser } from '@/server/session';
import { getDb } from '@/server/db/client';
import { LoginForm } from './LoginForm';

export const metadata = { title: 'Kirish' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; e?: string }> }) {
  if (await currentUser()) redirect('/admin');
  const sp = await searchParams;
  const noDb = !getDb();
  return (
    <main className="adm-login" id="main-content">
      <div className="adm-login__box">
        <Image src="/images/brand/logo-ink.webp" alt="SPS" width={58} height={36} priority />
        <h1>Admin panelga kirish</h1>
        <LoginForm
          next={sp.next}
          initialError={noDb || sp.e === 'db' ? "Baza ulanmagan: serverda DATABASE_URL sozlanishi kerak (docs/ADMIN.md)." : undefined}
        />
      </div>
    </main>
  );
}
