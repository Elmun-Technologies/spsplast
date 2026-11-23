# Kirishlar ro'yxati (parolsiz)

**Bu faylga parol, token, kalit YOZILMAYDI.** Faqat: xizmat nima, egasi kim, kimda kirish bor, sir qayerda saqlanadi.
Parollar — parol menejerida (1Password / Bitwarden, kompaniya "SPS Plast" papkasi). Sirlar (tokenlar) — faqat Coolify
Environment Variables'da.

Qoida: har xizmatning **egasi — kompaniya hisobi** (shaxsiy e-pochta emas), **kamida 2 kishida** kirish bor,
ishdan ketgan xodimning kirishi o'sha kuni yopiladi.

## Infratuzilma

| Xizmat | Nima uchun | Manzil | Egasi (hisob) | Kirish kimlarda | Sir qayerda |
|---|---|---|---|---|---|
| GitHub | Sayt kodi, CI | github.com/Elmun-Technologies/spsplast | | | parol menejeri (2FA) |
| Hetzner | Server (VPS) | console.hetzner.cloud | | | parol menejeri (2FA) |
| Coolify | Deploy, domenlar, env, zaxira | Coolify paneli (server IP orqali) | | | parol menejeri |
| Postgres `sps-postgres` | Zayafkalar, katalog, admin | Coolify ichida | — | Coolify orqali | `DATABASE_URL` — Coolify env |
| Domen `spsplast.uz` | Asosiy domen | registrator: | | | parol menejeri |
| Domenlar `sps.uz`, `spsplast.com` | Eski domenlar → 301 | registrator: | | | parol menejeri |
| DNS | A-yozuvlar | registrator / Cloudflare: | | | parol menejeri |
| Vercel | **Ishlatilmaydi** (eski hosting, hisob bloklangan) | — | | | o'chirish tavsiya etiladi |

## Zayafka oqimi

| Xizmat | Nima uchun | Egasi | Kirish kimlarda | Sir qayerda |
|---|---|---|---|---|
| Telegram bot (@BotFather) | Zayafkani guruhga yuborish | | | `TELEGRAM_BOT_TOKEN` — Coolify env |
| Telegram savdo guruhi | Menejerlar zayafkani ko'radi | | | `TELEGRAM_CHAT_ID` — Coolify env |
| Admin panel `/admin` | Zayafkalar, katalog, matnlar | — | Admin → Xodimlar ro'yxati | har xodimning o'z paroli |
| WhatsApp Business | Mijoz bilan yozishma | | | telefon |

## Analitika va qidiruv tizimlari

| Xizmat | Egasi (Google/Yandex hisobi) | Kirish kimlarda | Saytga ulanishi |
|---|---|---|---|
| Google Search Console | | | tasdiq kodi — admin → Integratsiyalar |
| Google Analytics 4 / GTM | | | ID — admin → Integratsiyalar |
| Google service account (hisobotlar) | | | admin → Analitika → Ulanishlar (alohida jadval, saytga chiqmaydi) |
| Yandex Metrica | | | ID — admin → Integratsiyalar |
| Yandex Webmaster | | | tasdiq kodi + OAuth — admin |
| Bing Webmaster | | | tasdiq kodi — admin |
| Meta Business (Pixel, reklama) | | | Pixel ID — admin → Integratsiyalar |

## Kontent manbalari

| Nima | Qayerda | Kim yangilaydi |
|---|---|---|
| PDF kataloglar | `public/catalog/pdf/` (repo) | dasturchi (fayl nomi o'zgarmaydi) |
| Tirik mahsulot suratlari | `media-src/live/` (repo) yoki admin → Mahsulotlar | dasturchi / menejer |
| 3D sahifalar (QR) | `public/3d/` — tashqi 3D pipeline | 3D dizayner |

## Topshirishda bajariladi

- [ ] Jadvaldagi bo'sh ustunlar to'ldirildi (egasi, kimlarda).
- [ ] Shaxsiy hisobdagi xizmatlar kompaniya hisobiga o'tkazildi yoki kompaniya hisobi admin qilib qo'shildi.
- [ ] GitHub, Hetzner, Coolify, registrator — 2FA yoqilgan.
- [ ] Ishlab chiquvchining shaxsiy kirishlari topshirishdan keyin olib tashlanadi yoki muddatli qilinadi
      (kelishuvga ko'ra qo'llab-quvvatlash davri).
- [ ] Telegram bot tokeni topshirishda **yangilandi** (@BotFather → /revoke) va Coolify env'ga yangisi yozildi —
      eski token kimdadir qolgan bo'lsa ham ishlamaydi.
