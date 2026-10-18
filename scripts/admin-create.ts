/**
 * Admin panelga xodim qo'shish (birinchi administrator shu bilan yaratiladi):
 *
 *   DATABASE_URL=postgres://... npm run admin:create -- --email boss@sps.uz --name "Rahbar" --role admin
 *
 * Parol: `ADMIN_PASSWORD` env'dan; berilmasa tasodifiy yaratilib, bir marta chiqariladi.
 * Keyingi xodimlar admin paneldagi "Xodimlar" sahifasidan qo'shiladi.
 */
import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';
import { createAdminUser, isUniqueViolation } from '../src/server/auth.ts';
import { getDb } from '../src/server/db/client.ts';

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    name: { type: 'string' },
    role: { type: 'string', default: 'admin' },
  },
});

if (!values.email || !values.name || (values.role !== 'admin' && values.role !== 'manager')) {
  console.error('Foydalanish: npm run admin:create -- --email E --name "Ism" [--role admin|manager]');
  process.exit(1);
}

const db = getDb();
if (!db) {
  console.error('DATABASE_URL berilmagan.');
  process.exit(1);
}

const generated = !process.env.ADMIN_PASSWORD;
const password = process.env.ADMIN_PASSWORD || randomBytes(12).toString('base64url');

try {
  const { id } = await createAdminUser(db, { email: values.email, name: values.name, role: values.role, password });
  console.log(`Xodim #${id} qo'shildi: ${values.email} (${values.role}).`);
  if (generated) console.log(`Vaqtinchalik parol: ${password}\nKirgandan keyin "Profil" sahifasida almashtiring.`);
  process.exit(0);
} catch (error) {
  const cause = (error as { cause?: { message?: string } })?.cause;
  console.error(
    isUniqueViolation(error)
      ? 'Bu e-pochta allaqachon bor.'
      : `Saqlanmadi: ${cause?.message ?? (error instanceof Error && !error.message.startsWith('Failed query') ? error.message : 'baza xatosi')}`,
  );
  process.exit(1);
}
