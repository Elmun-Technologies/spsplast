/**
 * Admin parolini tiklash (xodim parolni unutgan yoki vaqtinchalik parol yo'qolgan bo'lsa):
 *
 *   npm run admin:reset -- --email boss@sps.uz
 *
 * Coolify → ilova → Terminal da ishga tushiriladi (DATABASE_URL u yerda bor).
 * Parol: `ADMIN_PASSWORD` env'dan; berilmasa tasodifiy yaratilib, bir marta chiqariladi.
 * Eski sessiyalar yopiladi (`setUserPassword`), shu e-pochta uchun login limiti tozalanadi.
 */
import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';
import { eq } from 'drizzle-orm';
import { normalizeEmail, setUserPassword } from '../src/server/auth.ts';
import { getDb } from '../src/server/db/client.ts';
import { adminUsers, rateHits } from '../src/server/db/schema.ts';
import { ipKey } from '../src/server/privacy.ts';

const { values } = parseArgs({ options: { email: { type: 'string' } } });

if (!values.email) {
  console.error('Foydalanish: npm run admin:reset -- --email E');
  process.exit(1);
}

const db = getDb();
if (!db) {
  console.error('DATABASE_URL berilmagan.');
  process.exit(1);
}

const email = normalizeEmail(values.email);
const [user] = await db
  .select({ id: adminUsers.id, active: adminUsers.active })
  .from(adminUsers)
  .where(eq(adminUsers.email, email))
  .limit(1);

if (!user) {
  console.error(`Bunday xodim yo'q: ${email}`);
  process.exit(1);
}

const generated = !process.env.ADMIN_PASSWORD;
const password = process.env.ADMIN_PASSWORD || randomBytes(12).toString('base64url');

try {
  await setUserPassword(db, user.id, password);
  await db.delete(rateHits).where(eq(rateHits.key, ipKey('login_email', email)));
  console.log(`Xodim #${user.id} (${email}) paroli yangilandi, eski sessiyalar yopildi.`);
  if (!user.active) console.log('DIQQAT: xodim nofaol — admin panelda "Xodimlar" sahifasidan faollashtiring.');
  if (generated) console.log(`Vaqtinchalik parol: ${password}\nKirgandan keyin "Profil" sahifasida almashtiring.`);
  process.exit(0);
} catch (error) {
  console.error(`Saqlanmadi: ${error instanceof Error ? error.message : 'baza xatosi'}`);
  process.exit(1);
}
