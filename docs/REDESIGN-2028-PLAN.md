# SPS Plast — UI'ni qayta chizish rejasi (Redesign 2028)

Maket: Claude Design kanvasi **"SPS Plast — Redesign 2028"**
(https://claude.ai/artifact/WbxAKEFb5CTYftK7ogy2eH — shaxsiy, Share menyusidan ulashiladi).

Biznes qoidalari o'zgarmaydi (CLAUDE.md "Business Rules"): narx/savat yo'q, faqat zayafka,
"yaratish" so'zi yo'q, tasdiqlangan raqamlar tokenlar orqali, `[...]` placeholder ko'rsatilmaydi.
Katalog soni maketda joriy ma'lumotdan: 119 model (trotuar 95, fasad 12, dekor 11, skameyka 1).

## 1. Yo'nalish — "Beton laboratoriyasi"

Eski B uslubi (pill tugmalar, iliq bej) o'rniga texnik-sanoat tili:

| Token | Qiymat | Qo'llanish |
|---|---|---|
| `--bg` | `#F2F0EB` | sahifa foni (beton) |
| `--surface` | `#FFFFFF` | kartochka, forma, header |
| `--surface-2` | `#E6E3DC` | segmented control, xarita |
| `--ink` | `#15171A` | matn, qora bloklar, ikkilamchi CTA |
| `--ink-2` | `#4F5358` | ikkilamchi matn |
| `--line` / `--line-strong` | `#D9D5CC` / `#8C887F` | chegaralar / input |
| `--red` / `--red-ink` | `#D7262E` / `#B51E25` | asosiy CTA / qizil matn, hover |
| `--red-on-dark` | `#F0928F` | qora fondagi aksent |
| success / error | `#1F7A4D` + `#E6F2EB` / `#B51E25` + `#FBE9EA` | holatlar |

- Shrift: Onest (o'zimizda), 400/500/600, `tabular-nums`. Display 64/66, H1 52/56 (mobil 32/36), H2 40/44 (mobil 26/32).
- Radius: 4 teg · 8 tugma/input · 12 kartochka · pill faqat filtr chip va til.
- Tugmalar: 44/48/56 px; qizil — sahifadagi asosiy CTA, kartochkadagi "Zayafka" — grafit.
- Imzo motivlari: o'lcham chizig'i (`├── 300 mm ──┤`), qolip ostidagi mm-to'r, katta model raqami `№ 01`.
- **Rasm qoidasi:** faqat SPS materiallari — studiyadagi qolip suratlari (`media-src/factory`, oq fon →
  `mix-blend-mode: multiply`), terilgan plitka sahnalari, tayyor plitka, zavod, eksport xaritasi.
  Stok odamlar (`master-laying`, `master-pouring`) va tasodifiy ombor/qurilish suratlari ishlatilmaydi.

## 2. Kanvasdagi ekranlar

Desktop 1440: Bosh sahifa · Katalog · Model (interaktiv: galereya, kalkulyator, tablar) · Zayafka ro'yxati
(+ xato va muvaffaqiyat holati) · Ulgurji va hamkorlik · Ishlab chiqarish va eksport · Kontakt · 404.
Mobil 390: Bosh sahifa · Menyu · Katalog (+ solishtirish paneli) · Filtr sheet · Model (+ sticky panel) ·
Tez zayafka (interaktiv: forma → "qabul qilindi").
Dizayn tizimi: tokenlar, tipografika, komponentlar, Header/Footer (desktop + mobil) komponent sifatida.

Yangi bloklar (eski saytda yo'q edi):
- **"Qolipni 3 savolda tanlang"** — qo'llanish → o'lcham → to'plam, natija: "N ta model mos keladi".
- **Bosh sahifadagi kalkulyator** (kunlik m² → qolip soni va vazni) va hero'dagi "spec karta".
- **"Qaysi qolip kerakligini bilmaysizmi?"** maslahat kartochkasi (Telegram + telefon).
- Bosh sahifa oxirida FAQ + zayafka formasi yonma-yon.

## 2a. Raqobatchi (korun.uz) — olingan g'oyalar

Manba: foydalanuvchi yuborgan hero skrinshoti (sandbox tarmog'ida domen bloklangan).
Korun: qorong'i fon + sariq diagonal, UPPERCASE yirik sarlavha, hero'da 3D qolip,
menyuda "Jarayon / 3D studiya / Kalkulyator", "Aylantiring — qolip qanday ishlashini ko'ring", suzuvchi Telegram tugmasi.

Biz ko'chirmaymiz, g'oyani o'z tilimizda qilamiz — **"01B · Bosh sahifa V2"** artboard:
- Qorong'i hero + **chizma taxtasi**: qolip mm-to'r ustida, 300 mm o'lcham chiziqlari va izohlar (30 mm, 11 dona/m², PP/ABS).
  Sarlavha: "119 xil plitka. Bitta zavod." (raqam katalogdan).
- **Jarayon hikoyasi** (scroll-driven, bosib ham bo'ladi): Qolip → Quyish → Plitka → Yo'lak, progress chizig'i bilan.
- **Plitka studiyasi**: 8 model qolipidan birini tanlaysiz → terilgan sahna / qolip ko'rinishi, xususiyatlar, "Shu model uchun zayafka".
- Header'da **"Kalkulyator"** havolasi, sahifa burchagida **suzuvchi Telegram** tugmasi.
- Korun pigment/plastifikator ham sotadi — SPS'da bu yo'q, qo'shilmaydi.

## 3. Kodga o'tkazish bosqichlari

1. **Tokenlar** — `src/app/globals.css` `:root` ni 1-bo'limdagi qiymatlarga almashtirish; radius/tugma
   o'lchamlarini yangilash. Test: `npm test`, `npm run audit:a11y` (kontrast).
2. **Global** — `SiteHeader` (2 qator: qora utilita qatori + bo'limlar tab'lari), mobil header,
   `MobileMenu`, `SiteFooter` (CTA band + 4 ustun).
3. **Katalog bloki** — kartochka (4:3 sahna + qolip inset + `№` teg), filtr sidebar, toolbar, solishtirish paneli, filtr sheet.
4. **Bosh sahifa** — hero + spec karta, statistika, bo'limlar, 3 savolli tanlagich (`catalogFilters` dan
   facet sonlari), kalkulyator, ishlab chiqarish, ulgurji, FAQ + forma.
5. **Model sahifasi** — galereya + o'lcham chizig'i, 2×2 raqamlar, kalkulyator (+/−), tablar, o'xshash modellar, mobil sticky panel.
6. **Qolgan sahifalar** — zayafka ro'yxati, ulgurji, ishlab chiqarish, kontakt, 404, maxfiylik, solishtirish.
7. **Rasmlar** — studiya qolip suratlarini WebP qilib `public/images/site/molds/` ga (pipeline orqali), stok rasmlarni olib tashlash.
8. **Tekshiruv** — `npm run audit`, `npm run shots` (390/1440/360, gorizontal scroll yo'q), Lighthouse budjetlari.

## 4. Qo'shimcha (2-to'lqin)

- Desktop: Solishtirish (interaktiv "faqat farqlar"), Maxfiylik siyosati.
- Mobil: zayafka ro'yxati, solishtirish, ulgurji, ishlab chiqarish, kontakt, maxfiylik, 404 — jami 13 mobil ekran.
- **SEO · RU bozorlar** sahifasi: `Формы для тротуарной плитки` (desktop + mobil), geo-sahifa
  `Казахстан` (8 davlat uchun shablon), Header/Footer RU (footer'da 8 davlatga ichki havolalar).
  Strategiya: `docs/SEO-2028-RU.md` (domen masalasi — 0-bo'lim).

## 5. Ochiq savollar

- **Domen**: `sps.uz` Google'da O'zbekistonga geo-bog'langan — RU/KZ top-3 uchun `.com` (yoki `.ru`/`.kz`) kerak.
- Rus tilidagi model nomlari (`name.ru`), PP va ABS farqi bo'yicha texnolog matni (`docs/data-questions.md`).
