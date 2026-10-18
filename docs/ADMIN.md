# Admin panel — o'rnatish va foydalanish (Bosqich 7–8)

Admin panel saytning o'zida: **`https://sps.uz/admin`** (indekslanmaydi, robots.txt da yopiq).

## Nima qila oladi

| Bo'lim | Imkoniyat |
|---|---|
| Bosh sahifa | 24 soat / 7 / 30 kun zayafkalar, holatlar, davlatlar, ko'p so'ralgan modellar, manbalar (UTM), Telegram'ga yetmaganlar |
| Zayafkalar | holat bo'yicha chiplar, qidiruv (ism, telefon, SPS-raqam, shahar, kompaniya), tur / mas'ul / sana filtri, CSV (Excel) eksport |
| Zayafka kartochkasi | qo'ng'iroq / WhatsApp / Telegram tugmalari, modellar va qolip soni, holat (Yangi → Bog'lanildi → Taklif → Kelishildi / Rad etildi + sabab), mas'ul menejer, izohlar, to'liq tarix |
| Xodimlar (faqat administrator) | xodim qo'shish, rol (administrator / menejer), faolsizlantirish, parol almashtirish |
| Profil | o'z parolini almashtirish |

Zayafka oqimi: sayt formasi → **avval bazaga** (ketma-ket raqam `SPS-YYMM-NNNN`) → Telegram xabari
("Admin'da ochish" havolasi bilan). Telegram ishlamasa ham zayafka saqlanadi va admin'da
"Telegram'ga yetmagan" deb belgilanadi.

## O'rnatish (bir marta)

1. **Postgres baza** oching — tavsiya: [Neon](https://neon.tech) (Vercel integratsiyasi bor) yoki Supabase.
   Ulanish satrini oling (pooler/pgbouncer manzili ham ishlaydi).
2. Vercel → Project → Settings → Environment Variables: `DATABASE_URL=postgres://...`
   (Production va Preview uchun alohida baza tavsiya etiladi).
3. Jadvallarni yarating (lokal kompyuterdan yoki CI'dan):
   ```bash
   DATABASE_URL=postgres://... npm run db:migrate
   ```
   Qayta ishga tushirish xavfsiz (faqat yangi migratsiyalar qo'llanadi).
4. Birinchi administrator:
   ```bash
   DATABASE_URL=postgres://... ADMIN_PASSWORD='kamida-10-belgi' \
     npm run admin:create -- --email boss@sps.uz --name "Rahbar" --role admin
   ```
   `ADMIN_PASSWORD` berilmasa vaqtinchalik parol chiqariladi. Qolgan xodimlar — admin'dagi "Xodimlar" sahifasidan.
5. Tekshirish: `https://sps.uz/api/health` → `"database": "connected"`.

## Xavfsizlik

- Parollar scrypt bilan xeshlanadi; sessiya cookie'si `httpOnly`, `secure`, `/admin` yo'liga bog'langan, 14 kun.
  Bazada faqat token xeshi saqlanadi.
- Login: bir IP'dan 15 daqiqada 10 ta **xato** urinishdan keyin blok.
- Faolsizlantirilgan xodim yoki parol almashganda barcha sessiyalar yopiladi.
- Menejer "Xodimlar" sahifasiga kira olmaydi; har bir sahifa va amal serverda sessiyani tekshiradi.
- CSV eksportda formula-injection'dan himoya (`=`, `+`, `-`, `@` bilan boshlangan qiymatlar `'` bilan).

## Dasturchi uchun

- Sxema: `src/server/db/schema.ts`. O'zgartirgach: `npm run db:generate` → `drizzle/` ga yangi SQL → commit → `npm run db:migrate`.
- Mantiq: `src/server/leads.ts`, `src/server/auth.ts` (testlar: `tests/admin2027.test.js`, PGlite ustida, tashqi baza kerak emas).
- Next yelimi: `src/server/session.ts` (`requireUser()`), sahifalar `src/app/admin/*`, amallar `src/app/admin/actions.ts`.
- Ommaviy sayt bazani import qilmaydi (`tests/platform.test.js` 6-test) — sahifalar statik qoladi.
- Lokal sinov: `DATABASE_URL` bo'lmasa sayt ishlaydi (zayafka faqat Telegram'ga), admin "Baza ulanmagan" deydi.
