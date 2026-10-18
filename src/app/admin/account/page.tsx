import { requireUser } from '@/server/session';
import { AdminShell } from '../AdminShell';
import { ROLE_LABEL } from '../labels';
import { PasswordForm } from '../users/UserForms';

export const metadata = { title: 'Profil' };

export default async function AccountPage() {
  const { user } = await requireUser();
  return (
    <AdminShell user={user} active="account" title="Profil">
      <section className="adm-card" style={{ maxWidth: 520 }}>
        <dl className="adm-dl" style={{ marginBottom: 20 }}>
          <dt>Ism</dt>
          <dd>{user.name}</dd>
          <dt>E-pochta</dt>
          <dd>{user.email}</dd>
          <dt>Rol</dt>
          <dd>{ROLE_LABEL[user.role]}</dd>
        </dl>
        <PasswordForm label="Parolni almashtirish (keyin qayta kirasiz)" />
      </section>
    </AdminShell>
  );
}
