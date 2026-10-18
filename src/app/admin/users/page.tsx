import { asc } from 'drizzle-orm';
import { requireUser } from '@/server/session';
import { adminUsers } from '@/server/db/schema';
import { AdminShell } from '../AdminShell';
import { toggleUserAction } from '../actions';
import { ROLE_LABEL, formatDate } from '../labels';
import { CreateUserForm, PasswordForm } from './UserForms';

export const metadata = { title: 'Xodimlar' };

export default async function UsersPage() {
  const { user, db } = await requireUser('admin');
  const users = await db
    .select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
      active: adminUsers.active,
      lastLoginAt: adminUsers.lastLoginAt,
    })
    .from(adminUsers)
    .orderBy(asc(adminUsers.name));

  return (
    <AdminShell user={user} active="users" title="Xodimlar">
      <div className="adm-grid adm-grid--side">
        <table className="adm-table">
          <thead>
            <tr>
              <th scope="col">Xodim</th>
              <th scope="col">Rol</th>
              <th scope="col">Oxirgi kirish</th>
              <th scope="col">Amal</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={u.active ? undefined : { opacity: 0.55 }}>
                <td data-m="full">
                  <b>{u.name}</b>
                  {u.active ? '' : ' · faolsiz'}
                  <small>{u.email}</small>
                </td>
                <td>{ROLE_LABEL[u.role]}</td>
                <td data-m="right">{formatDate(u.lastLoginAt)}</td>
                <td data-m="full">
                  {u.id === user.id ? (
                    <small>Siz</small>
                  ) : (
                    <div className="adm-grid" style={{ gap: 8 }}>
                      <form action={toggleUserAction}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="active" value={u.active ? '0' : '1'} />
                        <button className="sps-btn sps-btn--link sps-btn--sm" type="submit">
                          {u.active ? "Faolsizlantirish (kira olmaydi)" : 'Faollashtirish'}
                        </button>
                      </form>
                      <PasswordForm userId={u.id} label="Parolni almashtirish" />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <section className="adm-card">
          <h2>Yangi xodim</h2>
          <CreateUserForm />
        </section>
      </div>
    </AdminShell>
  );
}
