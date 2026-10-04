# SPS PLAST × MADANI.UZ — Raqobat auditi va loyihani A→Z yakunlash rejasi

**Sana:** 2026-10-04
**Tayyorladi:** Arena Agent
**Tekshirilgan:** `https://madani.uz/` (uz / ru / en), `https://sps.uz/` (eski sayt, live), `spsplast` repozitoriysi (`arena/01a10775-spsplast`)
**Maqsad:** raqibni barcha ochiq sahifalari va texnik signallari bo'yicha tahlil qilish, SPS Plast'ning hozirgi holati bilan solishtirish va loyihani **A dan Z gacha tugatish** uchun bajariladigan ishlar ro'yxatini (prioritet, fayl, mezon, muddat bilan) berish.

**Qamrov:** raqibning tashqi UI (bosh sahifa, katalog, mahsulot, kompaniya, aloqa, yangiliklar, huquqiy sahifalar) va ichki/media qismi (2.5–2.6), SPS kod bazasi va jonli `sps.uz` (3-bo'lim), solishtirma (4-bo'lim) va A→Z reja (5–11-bo'limlar).

> **Belgilar:** `[F]` = fakt (saytdan bevosita ko'rildi yoki kodda mavjud) · `[X]` = xulosa/talqin · `[?]` = taxmin, tasdiqlash kerak.

---

## 0. EXECUTIVE SUMMARY — 12 qator o'qishga

**Raqib nima qilgan yaxshi:**
madani.uz — 1997-yildan beri ishlaydigan zavodning 3 tilli (en/uz/ru) korporativ sayti. Kuchli tomoni: **brend hikoyasi va ishonch bloklari** — "o'z ishlab chiqarishimiz", 27 yillik tarix, 1 120 marta quyish sinovi, zavod jarayoni, jamoa, video, 10 ta mijoz fikri, hamkor logotiplari, Yandex xarita, har sahifada "Yordam kerakmi?" formasi.

**Raqibning hal qiluvchi zaifligi:**
saytda **birorta ham narx yo'q**, savat yo'q, onlayn buyurtma yo'q, filtr/qidiruv yo'q. Butun sayt bitta lead-formaga (qo'ng'iroq kutiladi) qurilgan. Ya'ni raqib **katalog**, biz esa **do'kon** bo'lish imkoniyatiga egamiz.

**Raqibning texnik/kontent nuqsonlari (isbotlangan):**
`/uz` va `/en` mahsulot sahifalarida tavsif va xususiyatlar **rus tilida** qolgan; metodika "100+ marta" deb yozadi, ayni paytda bosh sahifada "600–1000 quyish, 1120 quyish sinovi" deyiladi; statistikada "27 yil" va "15+ yil tajriba" bir vaqtda turadi; jamoa sahifasida **"Ta'lim bo'limi rahbari"** (boshqa kompaniya shablonidan qolgan) lavozimi bor; 10 ta sharhning hammasi **bitta bir xil `user.png` avatar**; "To'liq katalogni yuklab olish" tugmasi **PDF bermaydi** (katalog sahifasiga olib boradi); `sitemap.xml`da **mahsulot sahifalari umuman yo'q** (faqat 18 ta statik URL); mahsulot URL'lari `/products/3` — slug emas; FAQ'dagi 4 savoldan 3 tasining **javobi bo'sh**.

**SPS Plast bugungi holati:**
Loyiha texnik jihatdan raqibdan **oldinda**: narxlar, savat, checkout, ulgurji narx pog'onalari, kalkulyator, filtr + sort + sahifalash, live-qidiruv, ulashish/taqqoslash, 130 mahsulot (mold / natija / muhit — 3 xil rasm), PDF katalog, admin panel, Click/Payme, amoCRM, Telegram, JSON-LD, sitemap (mahsulot bilan), PWA.

**Lekin 12 ta "launch blocker" (P0) bor** — eng kattasi: **yangi sayt hali deploy qilinmagan**; `sps.uz` hozir 2017-yilgi eski saytni ko'rsatadi va unda **20 dan ortiq indekslangan URL** bor, ularga 301 redirect yozilmagan. Kontaktlar chala (ko'cha/manzil yo'q, 4 ta telefon o'rniga 1 ta), sharhlar — **soxta (mock)**, blog va loyihalar sahifalari bo'sh, repozitoriy 424 MB (129 ta rasm va 4 ta PDF ildizda).

**Verdikt:** SPS'ni "tugatish" uchun ~4 hafta kerak. Sprint 0 (1 hafta) — launch blockerlar, Sprint 1–2 — konversiya va ishonch kontenti, Sprint 3 — SEO o'sish. Shundan keyin SPS funksional jihatdan raqibni **yutadi**, chunki narx + savat + checkout + kontentni raqib tezda qura olmaydi.

**Ball (ekspert bahosi, 30 mezon, 0–5):** SPS **97/150 (65%)** · Madani **82/150 (55%)** — farq aynan **konversiya o'qida** (narx, savat, checkout, filtr, qidiruv), raqib esa **kontent/brend o'qida** oldinda. Kontent 2 haftada qo'shiladi, e-commerce 6 oyda quriladi.

---

## 1. Metodologiya

| Bosqich | Nima qilindi |
|---|---|
| Raqib tashqi auditi | `madani.uz` bosh sahifasi (3 til), katalog, 8+ mahsulot kartasi, kompaniya tarixi, `/how-to-order`, `/contact-us`, yangiliklar ro'yxati va maqolasi, `robots.txt`, `sitemap.xml` |
| Raqibning "ichki" qismi | Admin panelga kirish yopiq `[F]`; faqat tashqaridan ko'rinadigan signallar tahlil qilindi: media fayllar `admin.madani-serves.uz` domenidan beriladi, `/media/...` galereya tuzilmasi, CDN belgisi yo'q |
| SPS tashqi | `sps.uz` (eski sayt) to'liq URL inventari + biznes ma'lumotlar (telefon, manzil, rekvizitlar) |
| SPS ichki (kod) | 151 fayl: sahifalar, komponentlar, servislar, Prisma sxema, seed, import skriptlari, `docs/*`, `next.config.js`, `tailwind.config.js`, kontaktlar, sitemap, JSON-LD (audit paytidagi holat) |
| Solishtirish | 30 mezonli matritsa (4-bo'lim), har biri 0–5 ball |
| Natija | 12 ta P0 (launch blocker), 14 ta P1, 10 ta P2, 8 ta P3 vazifa + 4 haftalik sprint rejasi + 301 xarita + kontent banki |

Cheklovlar: tezlik (Lighthouse/CrUX) o'lchovi sandboxdan tashqi tarmoqqa chiqish yopiq bo'lgani uchun **o'lchanmadi** — faqat kuzatiladigan signallar (rasm formati, domen, kesh sarlavhalari) berildi `[X]`. Raqibning admin paneli login ortida `[F]`.

---

## 2. RAQIB: MADANI.UZ PROFILI

### 2.1 Umumiy ma'lumotlar

| Ko'rsatkich | Qiymat | Manba |
|---|---|---|
| Brend | ООО «MADANI», Toshkent | `[F]` |
| Tashkil topgan | 1997 (bosh sahifada "27 yillik") | `[F]` |
| Tillar | `en` (default `/`), `uz` (`/uz`), `ru` (`/ru`) — uchalasi ham ishlaydi | `[F]` |
| Telefon | +998 71 297-40-07 | `[F]` |
| Email | info@madani.uz | `[F]` |
| Ko'rsatilgan manzil | Toshkent, Chilonzor tumani, Gavhar ko'chasi 124 (+ Yashnobod tumanida ombor) | `[F]` |
| Xarita | Yandex Maps iframe (69.198331, 41.255051) | `[F]` |
| Kategoriyalar | Formalar (bruschatka), kanalizatsiya quvurlari, gul tuvaklari, plastik baklar, komodlar | `[F]` |
| Mahsulot kartalari | ID 3 … 120+ (raqamli URL) | `[F]` |
| Media domeni | `admin.madani-serves.uz/media/...` | `[F]` |
| Savat / narx / onlayn to'lov | **Yo'q** | `[F]` |
| Maqsad (xulosa) | Lead-generation: "Buyurtma berish" → ism + telefon formasi | `[X]` |

### 2.2 Sayt xaritasi (ochiq URL lar)

| URL | Sahifa | Holat | Izoh |
|---|---|---|---|
| `/` | Bosh (EN) | ⚠️ | Default til ingliz; `/en` bilan bir xil kontent — dublikat riski `[X]` |
| `/uz`, `/en` | Bosh (UZ/RU) | 🟡 | Slayder (4 slayd), 4 ishonch bloki, kategoriyalar, 10 mashhur mahsulot, raqamlar, katalog CTA, 10 sharh, 8 yangilik, FAQ, aloqa formasi, hamkorlar |
| `/products` | Katalog | 🟡 | Kategoriya tablari + "Показать: 10" + "Сначала новые"; narx va filtr yo'q |
| `/products/{id}` | Mahsulot kartasi | 🔴 | Slug yo'q; tavsif/xususiyatlar UZ va EN versiyada ham ruscha; spetsifikatsiya ikki marta va ziddiyatli; tablar bo'sh |
| `/company` | Kompaniya | 🟡 | Tarix (1997/2005/2015/bugun), ishlab chiqarish 4 qadam, jamoa (8 kishi), video, FAQ, hamkorlar |
| `/how-to-order` | Qanday buyurtma berish | 🟢 | 4 qadam, aniq va foydali — **bizda bunday sahifa yo'q** |
| `/news`, `/news/{id}` | Yangiliklar | 🟡 | 8 post, hammasi bir kunda (17.08.2026) chop etilgan; maqola matni qisqa (2 abzats) |
| `/contact-us` | Kontaktlar | 🔴 | Forma (ism, telefon, xabar) + xarita; sahifada tegishli bo'lmagan "bu kategoriyada mahsulot yo'q" bloki chiqadi |
| `/terms` | Foydalanish shartlari | 🟡 | Mavjud, lekin faqat "Отправить" yonida havola |
| `robots.txt` | — | 🟡 | `Allow: /`, `?ordering=`, `?page=`, `?page_size=` yopilgan; eskirgan `Host:` direktivasi |
| `sitemap.xml` | — | 🔴 | Faqat 18 statik URL; **mahsulot va kategoriya sahifalari yo'q**; `lastmod` har kuni bugungi sana |

### 2.3 Kuchli tomonlari (o'rganish kerak bo'lgan 10 ta narsa)

1. **Brend hikoyasi raqamlar bilan:** "1997-yildan beri", "1 000 tagacha sikl", "Montana qolipi +70 °C da 1 120 marta quyishga bardosh berdi". Bu — sotadigan va eslab qoladigan da'vo `[F]`.
2. **"Biz qayta sotuvchi emasmiz" pozitsiyasi** — zavod ekanini har sahifada takrorlaydi `[F]`.
3. **Kontentli banner slayderi** (4 slayd: kompaniya / quvurlar / tuvaklar / komod) — katalogdan tashqari assortimentni ham sotadi.
4. **Har sahifada "Yordam kerakmi?" formasi + 3 ta contact card** — lead yig'ish nuqtasi doimiy ekranda `[F]`.
5. **`/how-to-order` sahifasi** — "qanday ishlaydi"ni 4 qadamda tushuntiradi; yangi mijoz uchun ishonch `[F]`.
6. **Jamoa va tarix sahifasi** — 8 kishi, ism-sharifi, lavozim, tavsif. "Kim bilan ishlayapman?" savoliga javob `[F]`.
7. **Video (YouTube embed)** — "Кадры с производства" ishlab chiqarishni ko'rsatadi `[F]`.
8. **Hamkorlar logotiplari** (9 ta) — B2B ishonchi `[F]`.
9. **UZOQ SEO-matnlar** gul tuvaklari kartalarida: "Toshkentda optom va chakana kupit", yetkazib berish muddati, material izohi — sahifa bo'yicha keyword klasterlari yozilgan `[F]`.
10. **3 tilli meta-title'lar dinamik** — har til uchun alohida title (uz/ru/en) `[F]`.

### 2.4 Zaif tomonlari — 15 ta isbotlangan nuqson

| # | Nuqson | Isbot | Ta'sir |
|---|---|---|---|
| Z1 | **Narx yo'q** | Barcha kartalarda "Скидка %" yozuvi, lekin raqam yo'q `[F]` | Xaridor "narxini bilmoqchiman" → chiqib ketadi; konversiya leadга bog'liq |
| Z2 | **Savat / onlayn buyurtma yo'q** | Faqat "Заказать" → forma `[F]` | Pulsiz, tunda, hafta oxiri kelgan mijoz yo'qoladi |
| Z3 | **To'lov yo'q** | Product tab "Способы оплаты" bo'sh `[F]` | Naqd/bank/Click-Payme haqida ma'lumot yo'q |
| Z4 | **i18n buzilgan** | `/uz/products/3` va `/en/products/3` da tavsif va spetsifikatsiya ruscha; kategoriya nomlari ham ruscha `[F]` | EN/UZ auditoriya tushunmaydi → SEO ham, konversiya ham zarar |
| Z5 | **Sitemap'da mahsulotlar yo'q** | `sitemap.xml` = 18 URL, `/products/*` yo'q `[F]` | Google mahsulot katalogni indekslamaydi — organik trafik yo'qoladi |
| Z6 | **URL'da slug yo'q** | `/products/3`, `/news/10` `[F]` | Keyword'siz URL, CTR past, link massasi arzon |
| Z7 | **FAQ javoblari bo'sh** | 4 savoldan 3 tasining javobi render bo'lmaydi `[F]` | Ishonch va rich-snippet imkoni yo'q |
| Z8 | **Ziddiyatli raqamlar** | "27 yil" / "15+ yil tajriba"; "154 mijoz" / "500+ mijoz"; "100+ marta" / "600–1000 quyish" `[F]` | Professional xaridor ishonmaydi |
| Z9 | **Shablon qoldiqlari** | Jamoada "Rуководитель отдела образования" (ta'lim bo'limi) `[F]` | "Bu kompaniya bizga tegishli emas" signali |
| Z10 | **Bitta placeholder avatar** | 10 sharh, 8 jamoa a'zosi — hammasi `user.png` / `team_member.png` `[F]` | Sharhlar soxta ko'rinadi |
| Z11 | **Buzilgan CTA** | "Скачать полный каталог" → PDF emas, `/products` `[F]` | Va'da bajarilmaydi |
| Z12 | **Kontent chiqindisi** | Kontakt va yangilik sahifalarida "bu kategoriyada mahsulot yo'q" bo'sh holati `[F]` | Sayt chala ko'rinadi |
| Z13 | **Filtrlarsiz katalog** | Ro'yxatda faqat kategoriya tabi + sahifa hajmi + saralash; narx/o'lcham filtri yo'q `[F]` | Foydalanuvchi kerakli qolipni topa olmaydi |
| Z14 | **Media gigienasi** | Rasmlar `admin.madani-serves.uz` dan, alt matnlar "Product image 1", "Thumbnail 1" `[F]` | Rasm qidiruvida ko'rinmaydi; CDN yo'q |
| Z15 | **Bir xil sanali yangiliklar** | 8 post — 17.08.2026 `[F]` | Kontent "to'ldirilgan" ko'rinadi, lekin yangilanmaydi |

**Qo'shimcha kuzatuv:** mahsulot spetsifikatsiyasi ikki marta chiqadi (bir xil sahifada ikki xil qiymat bilan — masalan, o'lcham "25×25 / 30×30 / 40×40" va "Различные размеры (25×25, 30×30)") `[F]`. Texnik xatolar sahifa shablonida, ma'lumotda emas — ya'ni ular buni tez tuzatmaydi.

### 2.5 Tashqi UI/UX auditi — element bo'yicha

| Element | Kuchli | Zaif | SPS uchun saboq |
|---|---|---|---|
| **Header / navigatsiya** | Brend markazda, "Katalogga o'tish" va "Kontaktlar" doim ko'rinadi; telefon headerda | Til almashtirgich ishlaydi, lekin kontent tarjima qilinmagan (Z4) — "til tugmasi bor, natijasi yo'q" | Til almashtirgich **ishlashi** va kontentni tekshirish (bizda uz/ru tarjimalar DB'da — QA testi kerak) |
| **Hero (bosh sahifa)** | 4 slaydli banner, har biri alohida mahsulot yo'nalishi uchun; rasm `.webp` | Har slaydda **bir xil sarlavha** — "Madani company"; haqiqiy sarlavha faqat H1 darajasida. Slayd avtomatik aylanishini boshqarish yo'q | Slaydda **aniq sarlavha + CTA**; bosh sahifada bitta asosiy H1 (bizda shunday) |
| **Ishonch bloklari** | 4 ta karta: o'z ishlab chiqarish, 27 yil, 1000 sikl, 100+ tur | Ziddiyatli raqamlar (Z8) | Raqam = **dalil**; bir marta tasdiqlangan raqam hamma joyda bir xil |
| **Kategoriya kartalari** | Ikona + nom, SVG format (yengil) | Nomlar UZ sahifada ruscha (Z4); "0 mahsulot" holati noto'g'ri joyda chiqadi (Z12) | Kategoriya nomlari DB'dan til bo'yicha; bo'sh kategoriya yashiriladi |
| **Mahsulot kartasi** | Rasm, model, tavsif, 2 CTA ("Buyurtma berish" / "Batafsil") | **Narx yo'q**, "chegirma %" raqamsiz, o'lcham/material kartada ko'rinmaydi | Kartada: narx, o'lcham, material, resurs, chegirma % — **raqam bilan** |
| **Mahsulot sahifasi** | Katta rasm + thumbnail, 6 ta tavsif bloki, "o'xshash mahsulotlar", xususiyatlar jadvali | Tablar bo'sh (yetkazib berish/to'lov tavsifsiz), spetsifikatsiya ikki marta va ziddiyatli, video yo'q, o'lcham chizmasi yo'q | Har tab **matn bilan to'ldirilgan**; bitta ishonchli spetsifikatsiya manbai |
| **Katalog ro'yxati** | Kategoriya tablari, sahifa hajmi, saralash, "Yana ko'rsatish" | Narx/o'lcham/material filtri yo'q, qidiruv paneli yo'q, grid/list ko'rinishi yo'q | Bizda filtr bor — uni **ko'zga tashlanadigan** qilish (yuqorida sticky filtr) |
| **Formalar** | Har sahifada lead formasi; kontakt sahifasida 3 maydon (qisqa) | Xato holati/validatsiya ko'rinmaydi, yuborilgandan keyin javob aniq emas (kuzatilmadi) `[?]` | Bizda field-level xato + success holati bor — saqlash |
| **Footer** | Brend, kontaktlar, kategoriya havolalari | Faqat bir nechta havola; huquqiy sahifalar deyarli yo'q | Bizda huquqiy to'plam bor (privacy/terms/returns) — to'ldirish kerak |
| **Mobil UX** | Kontent moslashgan, tugmalar katta | Telefon raqami mobil headerda ham to'liq ko'rinadi; "sticky" aloqa paneli aniqlanmadi `[X]` | Bizda `StickyMobileContact` bor — raqibda yo'q **ustunlik** |
| **A11y / semantika** | — | Rasm alt'lari "Product image 1", "Thumbnail 1"; ikonkalarda `aria-label` belgilari yo'q; iframe (xarita) uchun izoh yo'q; kontrast tekshirilmagan | Bizda alt/aria bor; har rasm alt matni **mahsulot nomi bilan** (Ilova B) |
| **Ishonch signallari** | 10 sharh, hamkor logotiplari, jamoa, "kafolat beramiz" bloki | Sharh avatarlari bir xil (Z10), sharhlar EN sahifada ruscha (Z4) | Real sharh + real mijoz nomi/fotosi yoki umuman yo'q |

**UI umumiy taassurot `[X]`:** sayt "tayyor shablon + kuchli kontent" kombinatsiyasi. Dizayn toza va zamonaviy, lekin **detallar yarim qolgan**: bo'sh tablar, bo'sh FAQ javoblari, raqamsiz chegirmalar, bir xil avatarlar, shablon lavozimi. Bu bizning eng katta imkoniyatimiz — bizda kontent kam, lekin **detallar to'g'ri**; ularnikida kontent ko'p, lekin **detallar buzuq**.

### 2.6 Ichki (admin/media) qism bo'yicha kuzatuvlar

Admin panel `admin.madani-serves.uz` domenida, login ortida `[F]` — ochiq audit qilib bo'lmaydi. Lekin tashqi signallar ichki tizim haqida ko'p narsani aytadi:

| Signal | Kuzatuv | Xulosa `[X]` |
|---|---|---|
| Media domeni | Barcha rasm/fayl `admin.madani-serves.uz/media/...` dan beriladi | Frontend va CMS **ajratilgan** (API-based); media **sayt domenida emas** |
| URL tuzilmasi | `/media/products/gallery/{slug}_{hash}.png`, `/media/category/gallery/{fayl}.svg`, `/media/news/gallery/{fayl}.jpg`, `/media/media/ourpartner/{uuid}.png` | Admin'da **galereya moduli** bor; fayl nomlari originals (kirill harflar URL-encoded: `%D0%B0%D0%BD%D0%B4%D0%B0%D0%BB%D1%83%D1%81.png`) |
| Rasm formati | Mahsulot rasmlari `.png` (`_F0p1FmE` ko'rinishidagi unikal suffix bilan) | **WebP/AVIF'ga aylantirish yo'q** → katta fayllar; bosh sahifa hero'si esa `.webp` — ya'ni optimizatsiya qism-qism qilingan |
| CDN / kesh | Tarmoq cheklovi tufayli sarlavhalarni o'lchash imkoni bo'lmadi `[?]`; media **alohida domenda** | Har rasm so'rovi boshqa domenga ketadi → qo'shimcha DNS+TLS; CDN bo'lmasa tezlik yo'qoladi |
| Til boshqaruvi | Admin'da kontent 3 tilda kiritiladi, lekin UZ/EN uchun ruscha matn chiqadi | Tarjima **qo'lda** kiritiladi va nazorat qilinmaydi — bizda `ProductTranslation` modeli bor, **to'ldirish majburiy qilinishi** kerak |
| Yondashuv | Yangiliklar galereyasi, hamkorlar galereyasi, jamoa (rasm bilan) modullari bor | Admin **kontentga boy** — bizning admin'da jamoa/blog/loyiha CRUD'ini tekshirish kerak (6-bo'lim) |

**Bizga tegishli xulosa:** raqibning admin'i kontent boshqaruviga qaratilgan (media galereyalari, jamoa, hamkorlar), bizning adminimiz **savdoga** qaratilgan (mahsulot, variant, buyurtma, lead, integratsiya). Agar biz ham kontent modullarini (jamoa, hamkor, video, blog) admin'ga qo'shsak — **ikkala o'qda ham** ustunlik qilamiz.

### 2.7 Raqibning tahdidi nimada (halol baho)

- **Brend va yosh:** 1997 = 29 yil. Ularda narx yo'q, lekin **obro'** bor; B2B segmentida (bruschatka sexlari, dilerlar) bu muhim.
- **Assortiment kengligi:** qoliplardan tashqari kanalizatsiya quvurlari, gul tuvaklari, baklar, komodlar, fitinglar, mebel furnituraси. Ya'ni ular **keng pozitsiyada**, biz **qoliplar/termopanel**da chuqurroqmiz `[X]`.
- **3 til:** EN bilan eksport bozoriga chiqish imkoni bor — bizda hozir uz/ru.
- Ular narx ko'rsatmasa ham, bizning narx **ochiq** bo'lishi bizga ustunlik beradi, lekin **"narx so'rab qo'ng'iroq qilish" yo'qotilishini** ham hisobga olish kerak (12-bo'limdagi P1-1 tavsiya).

---

## 3. SPS PLAST — HOZIRGI HOLAT (kod va jonli sayt)

### 3.1 Jonli `sps.uz` — hali eski sayt

`https://sps.uz` hozir **2017-yilgi eski CMS saytini** ko'rsatadi `[F]`. Unda qiymatli **biznes ma'lumotlar** va indekslangan URL'lar bor:

**Biznes ma'lumotlar (eski saytdan):**

| Maydon | Qiymat |
|---|---|
| Kompaniya | ООО «STONE PROFY SERVISE» |
| Telefonlar | +998 98 300-77-72; +998 33 888-77-72; +998 33 338-77-72; +998 78 777-00-07 |
| Email | stoneprofyservise@mail.ru |
| Manzil | Toshkent, Uchtepa tumani, Xalqa yo'li ko'chasi, 7A |
| Ish vaqti | 9:00 – 18:00 |
| Rekvizitlar | р/с 2020 8000 1048 0307 7001, АКБ «Hamkorbank», Учтепа филиали, МФО 00083, ИНН 301330578 |
| Xarita | Google Maps 41.299833, 69.150472 |

⇒ **Muhim:** yangi loyihadagi `src/lib/constants/contacts.ts` da manzil `"Toshkent sh., Uzbekistan"` — ko'cha, tuman, uy raqami yo'q; telefon 1 ta; rekvizitlar sahifasi yo'q. Bu **P0** (5-bo'lim, P0-3).

**Eski saytning indekslangan URL'lari (eski `sitemap.xml` dan):**
`/`, `/about`, `/produkciya`, `/formi` (+ `/formi/p/1…5`, `/formi/image/{id}` — 6 sahifa rasm), `/plitki`, `/kolodtsy`, `/bordyury-i-lotki`, `/uslugi`, `/proizvoditeli`, `/doc`, `/otzyvy-o-nas`, `/fotogalereya`, `/novosti`, `/novosti/news_post/testovaya-novost`, `/napishite-nam`, `/kontakty`, `/search`, `/karta-sayta`, `/user`.

⇒ Yangi saytga o'tishda **301 redirect qilinmasa** — 2017-yildan to'plangan indeks va havolalar **404** bo'ladi. Xarita 8-bo'limda.

### 3.2 Yangi loyiha: nima bor (feature inventory)

| Blok | Holat | Dalil (fayl) |
|---|---|---|
| Bosh sahifa (hero, ishonch, kategoriya, 4 mahsulot rail, showcase, B2B, FAQ, tez ko'rish) | ✅ | `src/app/[lang]/page.tsx` |
| Katalog: kategoriya, sort, narx filtri, material filtri, grid/list, sahifalash | ✅ | `CatalogClient.tsx`, `productService.ts` |
| Qidiruv (live suggestions, klaviatura navigatsiya) | ✅ | `HeaderClient.tsx`, `public/search-index.json` |
| Mahsulot: galereya, bulk narx, kalkulyator (m²), sticky ATC, tablar, o'xshashlar, sharhlar | ✅ / ⚠️ | `ProductDetailClient.tsx`, `ProductReviews.tsx` (sharhlar — mock) |
| Savat + promokod + bepul yetkazish progressi + confirm modal | ✅ | `cart/page.tsx`, `couponStore.ts` |
| Checkout: 3 qadam, telefon maskasi, validatsiya, CASH / CLICK / BANK_TRANSFER | ✅ | `checkout/page.tsx` |
| To'lov integratsiyasi (Click/Payme) | ✅ kod / ❓ kalitlar | `src/lib/payments/*` |
| Admin panel: mahsulot, kategoriya, variant, buyurtma, lead, media, integratsiya sozlamalari | ✅ | `src/app/admin/*` |
| amoCRM + Telegram + outbox/cron | ✅ kod / ❓ production | `src/lib/amocrm`, `src/app/api/cron/integrations` |
| SEO: sluglar, sitemap (mahsulot/kategoriya/blog bilan), robots, JSON-LD (Product, Breadcrumb, FAQ, Organization), hreflang | ✅ | `src/app/sitemap.ts`, `product/[slug]/page.tsx` |
| Analytics: GTM/GA4/Meta Pixel/Yandex Metrica helperlari | ✅ kod / ❓ ID lar | `src/lib/analytics.ts` |
| PWA (manifest, ikonkalar, install banner) | ✅ | `public/manifest.json` |
| Feed (`/api/feed/products`) — marketplace uchun | ✅ | `src/app/api/feed/products/route.ts` |
| Kontent: 130 mahsulot × (qolip + natija + muhit) rasm | ✅ | `public/catalog/2026` (390 fayl), `catalog_build/products.json` |
| 2026 studiya seriyasi: 50 mahsulot + variantlar | ✅ | `data/molds-2026.json` (audit paytida `prisma/data/` da edi) |
| PDF katalog (4 variant) | ✅ fayl / ❌ saytda yo'q | ildizdagi `*.pdf` |
| Blog | ⚠️ 1 ta seed post, sahifa "Tez orada" holatida | `blog/page.tsx` |
| Loyihalar | ⚠️ 1 ta seed loyiha | `projects/page.tsx` |
| Sharhlar | 🔴 **mock** edi, moderatsiya imkonsiz (baza yo'q) | `ProductReviews.tsx` (keyinchalik butunlay olib tashlandi — `OPTIMIZATION-LOG`, Batch 3) |
| Jamoa / video / hamkorlar / sertifikatlar | ❌ yo'q | — |
| "Qanday buyurtma berish" sahifasi | ❌ yo'q (raqibda bor) | — |
| EN tili | ❌ yo'q | `middleware.ts` faqat uz/ru |
| Eski URL → yangi URL 301 | ❌ yo'q | `next.config.js` (faqat `rewrites`) |

### 3.3 P0 darajasidagi aniqlangan muammolar (fayl bilan)

| # | Muammo | Fayl/dalil | Natija |
|---|---|---|---|
| M1 | Sayt `sps.uz` ga deploy qilinmagan | `sps.uz` = 2017-yil sayti `[F]` | Butun loyiha hali "sandbox"da; trafik eski saytda |
| M2 | Eski URL'larga 301 yo'q | `next.config.js` | 20+ indekslangan URL 404 bo'ladi; SEO qulashi |
| M3 | Kontaktlar chala | `src/lib/constants/contacts.ts` | Mijoz manzilni/ish vaqtini topmaydi; 4 ta telefon yo'qolgan |
| M4 | Sharhlar soxta | `ProductReviews.tsx` — `MOCK_REVIEWS` client-side | Ishonchga ziyon; "reviews" ko'rsatib bo'lmaydi |
| M5 | Blog va loyihalar bo'sh | `blog/page.tsx`, `projects/page.tsx` | Raqibda 8 yangilik va 9 hamkor logotipi bor; bizda "tez orada" |
| M6 | Repozitoriy 424 MB | 129 rasm + 4 PDF (34 MB) ildizda `[F]` | Deploy/CI sekin; klon 450 MB; tasodifiy o'chirish xatari |
| M7 | Rekvizitlar/hujjatlar sahifasi yo'q | `docs/*` da tilga olinmagan | B2B xaridor (sex, diler) shartnoma uchun ma'lumot izlaydi |
| M8 | 1 ta email (`@mail.ru`) | `contacts.ts` | Korporativ ishonch emas; SPF/DKIM yo'q |
| M9 | PDF katalog saytda yo'q | `public/` da faqat `catalog/*.jpg` | Raqibning "katalog yuklab olish" g'oyasi bizda tayyor fayl bor, lekin ulanmagan |
| M10 | UZ sahifada ham RU matnlar (kategoriya nomlari DB'da aralash bo'lishi mumkin) | `docs/REAL-CATALOG.md`, seed | Lokalizatsiya nazorati kerak |
| M11 | Trust da'volari auditi yo'q | `docs/REAL-CATALOG.md` (soxta raqamlar olib tashlangan), lekin hali "300+", "500+" kabi ifodalar bor joylar bo'lishi mumkin | Har da'vo uchun dalil kerak |

### 3.4 Kod gigienasi kuzatuvlari (sifat uchun)

- `src/app/[lang]/page.tsx` dagi mahsulot "rail"lari **sarlavha bo'yicha matn qidiruvi** bilan filtrlanadi (`titleUz.includes('bruschatka')`) — mo'rt; kategoriya bog'lanishi (`category.slug`) bo'yicha qilish kerak `[X]`.
- Repo ildizida 129 ta surat va 4 ta PDF — `public/` ga yoki object storage'ga ko'chirish kerak `[F]`.
- `catalog_build/` (Python skriptlar + products.json) — build artefakti; `docs`ga ko'chirish yoki `.gitignore` `[X]`.

---

### 3.5 SPS ning UI/UX holati (kod bo'yicha, qisqa)

**Bor va yaxshi (raqibdan ustun):**

| Element | Holat | Fayl |
|---|---|---|
| Dizayn tizimi | `surface/line/ink/brand` tokenlari, yagona red `#E61C24`, radiuslar, soyalar | `tailwind.config.js` |
| Tipografiya | O'z-o'zidan hostlangan Inter (build internetsiz ishlaydi), 12–72 px shkala | `globals.css`, `public/fonts` |
| Mobil aloqa paneli | 2 tugma + aloqa sheet, 44px touch target | `StickyMobileContact.tsx` |
| Savat drawer | Animatsiya, ESC bilan yopish, backdrop | `CartDrawer.tsx` |
| Mahsulot kartasi | Skeleton, hover'da 2-rasm, ulashish (Web Share), tez ko'rish | `ProductCard.tsx`, `QuickViewModal.tsx` |
| Mahsulot sahifasi | Sticky ATC, kalkulyator, bulk narx jadvali, "qolip→natija" slider | `ProductDetailClient.tsx`, `BeforeAfterSlider.tsx` |
| Header | Live-qidiruv (spinner, klaviatura nav), mega-menyu, savat/sevimli/taqqoslash hisoblagichlari | `HeaderClient.tsx` |
| PWA | Manifest + ikonkalar + install banner | `public/manifest.json` |

**Zaif joylar (UI/QA nuqtai nazaridan):**

| # | Muammo | Dalil | Yechim |
|---|---|---|---|
| U1 | `<html lang="uz">` **hardcode** — `/ru` sahifalarda ham `uz` qoladi | `src/app/layout.tsx:80` `[F]` | `[lang]` segmentiga mos dinamik `lang` (root layoutni `[lang]` ostiga olish yoki middleware/script) |
| U2 | Bosh sahifada i18n **dictionary emas**, 34 ta inline `lang === 'ru' ? …` | `src/app/[lang]/page.tsx` `[F]` | Matnlarni `uz.json`/`ru.json` ga ko'chirish (tarjima tushib qolish riski) |
| U3 | ~~"Skip to content" havolasi yo'q~~ — **tekshiruvda xato**: havola `[lang]/layout.tsx` da allaqachon bor (`#main-content`) `[F]` | tuzatildi | Qolgan a11y ishlari: `aria-label`, kontrast, Lighthouse auditi (P1-14) |
| U4 | SEO matn bosh sahifada kam; hero abstrakt panel | `page.tsx` `[F]` | Real zavod/ombor surati yoki video + 300+ so'zli blok |
| U5 | Blog/loyihalar sahifalari bo'sh | `blog/page.tsx`, `projects/page.tsx` `[F]` | P0-5 |
| U6 | Sharhlar mock | `ProductReviews.tsx` `[F]` | P0-4 / P1-8 |

---

## 4. TAQQOSLASH MATRITSA (30 mezon)

Ball: 0 = yo'q · 5 = raqibdan aniq yaxshi.

| # | Mezon | SPS | Madani | Izoh |
|---|---|---|---|---|
| 1 | Narx ko'rsatish | **5** | 0 | Raqibda umuman yo'q |
| 2 | Savat va onlayn buyurtma | **5** | 0 | Raqibda lead-forma |
| 3 | To'lov (Click/Payme/bank) | 4 | 0 | Bizda kod bor, kalitlar tekshirilishi kerak |
| 4 | Katalog filtri / sort / sahifalash | **5** | 2 | Raqibda faqat kategoriya + sahifa hajmi |
| 5 | Qidiruv | **5** | 1 | Raqib ro'yxatida qidiruv/filtr paneli ko'rinmadi |
| 6 | Mahsulot mediasi (qolip→natija→muhit) | 4 | 3 | Bizda 3 xil rasm; raqibda 1–2 |
| 7 | Tavsif chuqurligi (SEO matn) | 3 | **5** | Raqibda "Toshkentda optom" klasterli uzun matnlar |
| 8 | Assortiment hajmi | **5** | 4 | 130+ (biz) vs ~70–120 ID |
| 9 | O'zbek tili sifati | 4 | 2 | Raqibda ruscha bloklar aralash |
| 10 | Ingliz tili | 0 | **4** | Eksport kanali |
| 11 | Brend hikoyasi (1997, sinovlar) | 2 | **5** | Bizda aniq raqamlar yo'q |
| 12 | Jamoa sahifasi | 1 | **5** | Raqibda 8 kishi (ishonch, lekin shablon qoldig'i bilan) |
| 13 | Video / ishlab chiqarish kadrlari | 1 | **4** | Raqibda YouTube embed |
| 14 | Yangiliklar / blog | 1 | 4 | Bizda sahifa bor, kontent yo'q |
| 15 | Sharhlar | 1 | 2 | Ikkalasi ham soxta; raqibda 10 ta, bizda 3 ta |
| 16 | Hamkorlar logotiplari | 1 | **4** | Bizda yo'q |
| 17 | Hujjatlar / rekvizitlar | 1 | 2 | Ikkalasi ham kuchsiz |
| 18 | Aloqa kanallari (tel/Telegram/WhatsApp) | **4** | 3 | Bizda 3 kanal kontentda bor |
| 19 | Xarita va manzil | 2 | **4** | Raqibda Yandex embed; bizda manzil chala |
| 20 | Yetkazib berish / to'lov sahifasi | **4** | 2 | Bizda mavjud, raqibda bo'sh tab |
| 21 | "Qanday buyurtma berish" | 2 | **4** | Raqibda bor |
| 22 | URL tuzilmasi (slug) | **5** | 2 | `/product/andalus` vs `/products/3` |
| 23 | Sitemap (mahsulot bilan) | **5** | 2 | Raqibda mahsulot yo'q |
| 24 | Schema.org | **4** | 1 | Bizda Product/Breadcrumb/FAQ/Organization |
| 25 | Landing/SEO sahifalar | 3 | 3 | Ikkalasi ham yetarli emas |
| 26 | Texnik sifat (Next, ISR, avif/webp, self-hosted font) | **4** | 3 | Raqibda katta PNG, mediada CDN yo'q |
| 27 | Mobil UX | **4** | 3 | Bizda sticky bar, 44px touch targetlar |
| 28 | Konversiya yo'li (sotuvga olib borish) | **5** | 1 | Tubsiz farq |
| 29 | Ishonch elementlari (kafolat, qaytarish, to'lov ikonkalari) | 3 | 4 | Raqibda "kafolat" bloki, bizda tarqoq |
| 30 | Kontentning uzluksizligi (yangilanish) | 2 | 2 | Ikkalasi ham muzlagan |
| | **JAMI** | **97/150 (65%)** | **82/150 (55%)** | |

**Diagramma (matnli):**
```
Konversiya o'qi (10 mezon):   SPS ████████████████████ 41/50 · Madani ███ 7/50
Kontent/brend o'qi (10):      SPS ████████ 15/50       · Madani ███████████ 33/50
Texnik/SEO o'qi (10):         SPS ████████████████ 41/50 · Madani ████████████ 30/50
```

**Strategik xulosa:** raqibning kuchli tomonlari — **kontent** (2 haftada yoziladi/qo'shiladi), bizning kuchimiz — **mahsulot va savdo mexanikasi** (6+ oyda quriladi). Demak, sprint maqsadi: **kontent bo'shliqni yopish + narx/checkout ustunligini ko'zga tashlanadigan qilish.**

---

## 5. A→Z ISHLAR REJASI

### 5.1 P0 — Launch blockerlar (Sprint 0, 5 ish kuni)

**Holat belgisi:** ✅ bajarildi (batch 1, `docs/OPTIMIZATION-LOG.md`) · ⬜ navbatda

| ID | Holat | Vazifa | Nima qilinadi | Fayl/Joy | Qabul mezoni |
|---|---|---|---|---|---|
| **P0-1** | 🟡 | **Saytni `sps.uz` ga chiqarish** | DNS (A/CNAME), TLS, `NEXT_PUBLIC_SITE_URL=https://sps.uz`, env to'liq (Telegram + analitika), health-check | Vercel + `.env.example` | `https://sps.uz/api/health` → `{status:"ok"}`, uz/ru sahifalar 200 | 6 soat |
| **P0-2** | ✅ | **301 redirect xaritasi** | 8-bo'limdagi jadval bo'yicha `redirects()` + `/formi/p/*` wildcard + `www` → apex | `next.config.js` | Har eski URL 301 → mantiqiy yangi URL; 404 yo'q; GSC'da "Coverage" xatosi o'smaydi | 4 soat |
| **P0-3** | ✅ | **Kontakt ma'lumotlarini to'ldirish** | Manzil (Uchtepa, Xalqa yo'li 7A), 4 telefon, ish vaqti 9:00–18:00, email, Telegram/WhatsApp; Yandex xarita embed | `contacts.ts`, `Footer.tsx`, `contact/page.tsx` | Manzil to'liq; 3-bo'limdagi jadval bilan bir xil; NAP izchil | 3 soat |
| **P0-4** | ✅ | **Soxta sharhlarni olib tashlash** | Foydalanuvchi qarori: bazasiz arxitekturada moderatsiya imkonsiz — sharhlar bo'limi va forma butunlay olib tashlandi | `ProductTabs.tsx`, `ProductReviews.tsx` (o'chirilgan) | Saytda tasdiqlanmagan sharh yo'q | 2 soat |
| **P0-5** | ✅ | **Blog va loyihalarni to'ldirish** | 7 maqola + 6 loyiha yozildi (`data/content-2026.json` → `scripts/build-static-catalog.js` orqali `src/data/catalog.json` ga); muqova va "oldin/keyin" rasmlari `public/media/` da | `data/content-2026.json`, `scripts/build-static-catalog.js` | Sahifalarda "tez orada" yo'q; har post uz/ru, muqova rasmli; kontent statik fayldan o'qiladi, bazaga import kerak emas | 8 soat |
| **P0-6** | ✅ | **Repo gigienasi** | Master fayllar 169 ta katta PNG (306 MB) `media-src/masters/` ga ko'chirildi va git kuzatuvidan chiqarildi; sayt uchun yengil nusxalar `public/media/` va `public/catalog/` da | `media-src/`, `public/media/`, `.gitignore`, `scripts/build-media.py` | Repo ildizida master fayl yo'q; git hajmi o'smaydi | 3 soat |
| **P0-7** | ✅ | **PDF katalog ulash** | 108 betli `full_compressed` versiya (15 MB) → `public/catalog/pdf/sps-qoliplar-katalogi-2026.pdf`; bosh sahifa va footer'da yuklab olish + hajm ko'rsatilgan | `public/catalog/…pdf`, `page.tsx`, `Footer.tsx` | Tugma haqiqiy PDF yuklaydi (raqibda bu CTA buzilgan) | 3 soat |
| **P0-8** | ✅ | **Trust da'volar auditi** | Har bir raqam uchun dalil. Olib tashlandi: "−5%/−10%" chegirmalar, "1 000 000 so'mdan bepul", "50 000 so'm" tarif, avtomatik to'lov havolasi, kunlik taymer bilan "cheklangan aksiya", "Nemis/Italiya texnologiyasi", "laboratoriya testi", "14 kun / 100% kafolat"; yetkazib berish muddatlari yagona manbaga keltirildi. **2-to'lqin:** "Omborda mavjud" badge + `StockBadge` + "Faqat omborda" filtri + taqqoslashdagi "Mavjudlik" qatori + `stockQty: 100` olib tashlandi (`stockQty: null`); Product JSON-LD'dan `offers` (price 0 / InStock) chiqarildi; hero'dagi "300+ martalik resurs" o'rniga "Zavoddan to'g'ridan-to'g'ri"; to'lov faqat **naqd / yuridik shaxslarga hisob-faktura** (Click/Payme/UZUM yo'q); savat metaforasi (`ShoppingBag`) → `Send` | butun sayt, `src/lib/faq.ts`, `data/category-seo-2026.json`, `scripts/build-static-catalog.js`, `src/lib/catalog/types.ts` | Saytda "dalisiz" raqam qolmaydi | 4 soat |
| **P0-9** | 🟡 | **E2E buyurtma sinovi** | Zayafka oqimi E2E: home→katalog→mahsulot→"Zayafka berish"→Telegram guruh (uz/ru), honeypot va rate-limit tekshiruvi | staging | Test zayafka Telegram guruhida to'liq kontekst bilan ko'rinadi | 3 soat |
| **P0-10** | ➖ | **To'lov kalitlari holati** | Onlayn to'lov moduli olib tashlandi (do'kon yo'q): to'lov tartibi menejer bilan kelishiladi — naqd yoki bank o'tkazmasi | `delivery-payment/page.tsx`, `how-to-order/page.tsx` | UI'dagi imkoniyat = real jarayon | 1 soat |
| **P0-11** | ✅ | **SEO va a11y texnik tekshiruv** | `src/lib/seo.ts`: canonical + hreflang (uz/ru/**x-default**, endi har tilning **o'z slug'i**) + `og:image` + Twitter kartasi; sitemap'ga **kategoriya sahifalari** qo'shildi va alternatlar tuzatildi; dinamik marshrutlarda `dynamicParams = false` → noma'lum slug **haqiqiy 404** (ilgari 200 + soft-404 edi); a11y: forma maydonlari `id`/`htmlFor` bilan bog'landi, ikonkali tugmalar `aria-label` oldi, aktiv nav `aria-current`; yangi testlar (13, 14) buni qo'riqlaydi | `src/lib/seo.ts`, `src/app/sitemap.ts`, `[lang]/**/page.tsx`, `HeaderClient.tsx`, `LeadModal.tsx` | Qoldi: Rich Results Test va Lighthouse o'lchovi (real domenda) | 5 soat |
| **P0-12** | ✅ | **Analitika yoqish** | GTM/GA4/Meta Pixel ID + **Yandex Metrica** (UZ bozorida muhim), `view_item`, `view_item_list`, `search`, `share`, `add_to_wishlist`, `generate_lead` | `.env`, `AnalyticsScripts.tsx`, `analytics.ts` | Har event real vaqtda ko'rinadi; maqsad sozlangan | 3 soat |

**Sprint 0 jami:** ~50–56 soat (1 hafta, 1–2 dasturchi + kontent mas'uli).

### 5.2 P1 — Konversiya va ishonch (Sprint 1–2, 2 hafta)

**Holat:** ✅ bajarildi · 🟡 qismən · ⬜ navbatda

| ID | Holat | Vazifa | Nega muhim | Mezon |
|---|---|---|---|---|
| P1-1 | ⬜ | **Narx strategiyasi:** chakana narx ochiq, ulgurji narx "so'rov orqali" | Raqibda narx yo'q → bizning ochiqlik ustunlik. Lekin raqobatchiga narxni "ochiq kartada" bermaslik uchun B2B pog'onali chegirma so'rov orqali qoladi | Har kartada narx + "10+ dona: -5%" ko'rinadi |
| P1-2 | ⬜ | **Ulgurji cennik (PDF) email/telefon evaziga** | Lead yig'ish + B2B ishonch | Forma → PDF + CRM'ga lead |
| P1-3 | ✅ | **"Qanday buyurtma berish" sahifasi** | 4 qadam, to'lov usullari, 5 savol-javob; FAQ + HowTo JSON-LD; footer va mobil menyudan havola | `/[lang]/how-to-order` |
| P1-4 | 🟡 | **Rekvizitlar + shartnoma namunasi sahifasi** | B2B (sex, diler) uchun to'g'ridan-to'g'ri tanlov omili | `/[lang]/requisites`: INN, MFO, hisob raqam, bank, yuridik manzil, PDF shartnoma |
| P1-5 | ⬜ | **Ishonch bloklari:** kafolat shartlari, 14 kun qaytarish, to'lov ikonkalari, ombor rasmlari | Raqibda "kafolat" bor; bizda tarqoq | Har mahsulot sahifasida 4 ta ishonch elementi |
| P1-6 | 🟡 | **Yetkazib berish jadvali:** Toshkent kuryer 1 ish kuni, viloyatlarga 1–3 kun, ombordan olib ketish bepul — sahifa ikki tilda, kafolat va qaytarish bloklari bilan | "Operator aniqlaydi" — savat tashlash sababi | Qoldi: og'irlik asosidagi narx kalkulyatori |
| P1-7 | ✅ | **Kategoriya sahifalariga SEO matn + FAQ** | Har kategoriyada 300+ so'z (uz/ru), 5 FAQ + FAQPage JSON-LD, statik sahifa `/{lang}/catalog/{slug}` | `data/category-seo-2026.json`, `catalog/[categorySlug]/page.tsx` |
| P1-8 | ⬜ | **Real sharhlar tizimi** | Ishonch + rich snippet (AggregateRating) | Admin moderatsiyasi, foto sharh, "Tasdiqlangan xarid" belgisi |
| P1-9 | ⬜ | **Video kontent:** har mahsulotga 10–20 s quyish videosi + zavod videosi | Raqibda video bor — bizda yo'q | 6+ video, `Product` sahifasida va YouTube'da |
| P1-10 | ⬜ | **"Bizni tanlaganlar" bo'limi:** diler/sex logotiplari + 3 keys | Raqibda 9 hamkor logotipi | 6+ logotip, ruxsat olingan |
| P1-11 | ⬜ | **Bosh sahifa rail'larini kategoriya bog'lanishi bo'yicha qilish** | Hozir sarlavha bo'yicha `includes()` — mo'rt | `category.slug` bo'yicha filtr; test |
| P1-12 | ⬜ | **Marketplace va Telegram savdo:** `/api/feed/products` ni Uzum/Yandex Market'ga ulash, Telegram botda katalog | Qo'shimcha kanal, raqibda yo'q | Feed validatsiyadan o'tadi |
| P1-13 | ⬜ | **i18n gigienasi (U2):** bosh sahifadagi 34 ta inline matnni `dictionaries/uz.json` + `ru.json` ga ko'chirish | Tarjima tushib qolish riski, kontentni nusxalash qiyin | `grep "lang === 'ru' ?" src/app/[lang]/page.tsx` → 0 natija |
| P1-14 | ⬜ | **A11y to'plami:** `aria-label`, focus ko'rinishi, kontrast auditi (WCAG 2.1 AA) — skip-link allaqachon bor | B2B xaridor ko'pincha klaviatura/zoom bilan ishlaydi; huquqiy risk | Lighthouse a11y ≥ 95, axe'da kritik xato 0 |

### 5.3 P2 — O'sish va SEO (Sprint 3, 2–4 hafta)

| ID | Vazifa | Izoh |
|---|---|---|
| P2-1 | **EN tili** (yoki EN landing + mahsulot tarjimalari) | Raqibda 3 til; eksport segmenti |
| P2-2 | **Kalkulyator 2.0:** m² → qolip soni → jami summa → chegirma → PDF taklif + savatga qo'shish | Raqibda umuman yo'q — killer feature |
| P2-3 | **Shahar/viloyat landinglari:** "Toshkentda bruschatka qoliplari", "Samarqandda…" | Mahalliy qidiruv trafigi |
| P2-4 | **Google Business + Yandex Business + 2GIS** profillari, NAP izchilligi | Xarita qidiruvidan mijoz |
| P2-5 | **Dilerlar sahifasi + diler narxlari** | B2B kanal kengaytirish |
| P2-6 | **Jamoa + zavod sayohati (foto/virtual tur)** | Raqibda jamoa sahifasi bor |
| P2-7 | **Performance byudjeti:** LCP < 2.0 s, CLS < 0.1, JS < 300 KB | Raqibning katta PNG'lari — bizning afzallik |
| P2-8 | **Qaytarilgan tashrifchilar:** Telegram kanal + email obuna (bepul PDF katalog evaziga) | Lead magnit |
| P2-9 | **Landing: "termopanel narxi 2026"** | Savdo kaliti, raqibda termopanel yo'q |
| P2-10 | **A/B testlar:** ATC joyi, kalkulyator ko'rinishi, narx ko'rsatish usuli | Opt-in o'sish |

### 5.4 P3 — Differensiatsiya (1–3 oy)

1. **AR/3D:** qolipdan chiqqan bruschatkani hovlida ko'rish yoki 3D konfigurator.
2. **B2B portali:** login, shaxsiy narxlar, buyurtma tarixi, PDF hisob-faktura.
3. **Multi-ombor** (Toshkent / Samarqand / Farg'ona) + "shu shaharda mavjud" ko'rsatkichi.
4. **Marketplace integratsiyasi:** Uzum Market, Yandex Market, OLX — stok va narx sinxron.
5. **AI yordamchi (bor):** "50 m² hovli uchun qolip tanla" + savatga o'tkazish.
6. **Video commerce:** har mahsulotda 15 s quyish videosi (P1-9 ni kengaytirish).
7. **Diler CRM va bonus tizimi** (amoCRM asosida).
8. **Eksport uchun EN + RU + KZ bozorlari** (Qozog'iston, Qirg'iziston).

### 5.5 Sprint taqvimi (4 hafta)

| Hafta | Maqsad | Natija |
|---|---|---|
| **0-hafta (T-7…T-1)** | P0-1,2,3,4,5,6,11 + staging E2E | Sayt `sps.uz` da, 301 ishlaydi, kontaktlar to'liq, soxta sharh yo'q |
| **1-hafta (T+1…T+7)** | P0-7,8,9,10,12 + metrika | To'lov/CRM/Telegram real, metrika o'qiyapti, PDF ulandi |
| **2-hafta** | P1-1…P1-6 | Narx strategiyasi, cennik, how-to-order, rekvizitlar, ishonch |
| **3-hafta** | P1-7…P1-12, P2-4 | Kategoriya SEO matnlari, sharhlar, video, hamkorlar, xarita profillari |
| **4-hafta** | P2-1…P2-3, P2-7 | EN/landinglar, kalkulyator 2.0, performance |

---

## 6. SAHIFA-SAHIFA CHECKLIST (tugatish uchun)

**Bosh sahifa (`/[lang]`)**
- [ ] Hero: real zavod surati yoki 10 s video fon (hozir abstrakt panel) `[X]`
- [ ] Trust strip: faqat tasdiqlangan raqamlar (P0-8)
- [ ] Mahsulot rail'lari kategoriya bog'lanishi bo'yicha (P1-11)
- [ ] "Qolip → natija" showcase: 3–5 ta mahsulot karuseli (hozir 1 ta)
- [ ] Kalkulyator bloki: "Hovlim uchun qancha qolip kerak?" (P2-2)
- [ ] PDF katalog yuklab olish (P0-7)
- [ ] Hamkorlar / mijoz logotiplari (P1-10)
- [ ] FAQ: 8 savol (7-bo'limdagi tayyor matn) + JSON-LD
- [ ] SEO matn 300+ so'z (bruschatka qoliplari, termopanel, Toshkent)

**Katalog (`/[lang]/catalog`)**
- [ ] Narx filtri va "chegirmali" filtri
- [ ] Kategoriya chips + material + o'lcham
- [ ] "Sahifada X ta mahsulot" + sort
- [ ] Har kategoriya uchun izoh matni (SEO)
- [ ] Bo'sh holat: "Hech narsa topilmadi" + qidiruvga o'tish (raqibda bu blok noto'g'ri joyda chiqadi — bizda to'g'ri bo'lsin)

**Kategoriya (`/[lang]/catalog/[slug]`)**
- [ ] H1 + 300+ so'z tavsif + 4–6 FAQ
- [ ] Breadcrumb + JSON-LD `CollectionPage`
- [ ] Ichki bog'lanish: qardosh kategoriyalar

**Mahsulot (`/[lang]/product/[slug]`)**
- [ ] 4–8 rasm: qolip, natija, muhit, o'lcham chizmasi, video
- [ ] Narx + bulk pog'onalar + "10+ dona: -5%" ko'rinishi
- [ ] Kalkulyator + Yetkazib berish + Kafolat tablari (matn bilan, bo'sh emas)
- [ ] Sticky ATC (bor) + 1-klik buyurtma (bor)
- [ ] Sharhlar: real (P0-4/P1-8) yoki umuman ko'rsatilmasin
- [ ] Schema: Product + Offer + AggregateRating (real bo'lsa)

**Savat / Checkout**
- [ ] Promokod (bor) + bepul yetkazish progressi (bor)
- [ ] Yetkazib berish narxi aniq (P1-6)
- [ ] To'lov usullari UI = backend holati (P0-10)
- [ ] Field-level xatolar, telefon maskasi (bor)
- [ ] Oferta checkbox (bor) — havola ishlashini tekshirish

**About / Production / Projects / Contact**
- [ ] Real zavod suratlari (repo'dagi 129 rasm — P0-6 bilan birga)
- [ ] Jamoa + tarix (raqibda bor)
- [ ] Yandex xarita + ish vaqti + 4 telefon (P0-3)
- [ ] Rekvizitlar (P1-4)

**Blog / News**
- [ ] 6+ maqola (P0-5), har biri 600+ so'z, ichki havolalar
- [ ] Muqova rasm, muallif, sana, "o'xshash maqolalar"

**Admin**
- [ ] Sharh moderatsiyasi (P1-8)
- [ ] Buyurtma statuslari + Telegram bildirishnoma (P0-9)
- [ ] Kontent: blog/loyiha CRUD borligini tekshirish

---

## 7. KONTENT BANKI — tayyor matnlar va to'ldirish ro'yxati

### 7.1 To'ldirilishi shart ma'lumotlar (tasdiqlash kerak `[?]`)

| Maydon | Qiymat (eski saytdan) | Holat |
|---|---|---|
| Yuridik nom | ООО «STONE PROFY SERVISE» | tasdiqlansin |
| Manzil | Toshkent, Uchtepa tumani, Xalqa yo'li ko'chasi, 7A | tasdiqlansin |
| Ish vaqti | 9:00 – 18:00 (shanba?) | tasdiqlansin |
| Telefonlar | +998 98 300-77-72 (asosiy), +998 33 888-77-72, +998 33 338-77-72, +998 78 777-00-07 | qaysi biri asosiy? |
| Email | stoneprofyservise@mail.ru → `info@sps.uz` | qaror kerak |
| Rekvizitlar | р/с 2020 8000 1048 0307 7001, Hamkorbank Uchtepa filiali, MFO 00083, INN 301330578 | tasdiqlansin |
| Koordinatalar | 41.299833, 69.150472 | Yandex xaritada tekshirilsin |
| Ijtimoiy tarmoqlar | Telegram `@sps_stone`, WhatsApp, Instagram `sps.stone` | havolalar tekshirilsin |

### 7.2 "Qanday buyurtma berish" — 4 qadam (uz/ru, tayyor)

**UZ:**
1. **Mahsulotni tanlang** — katalogdan kerakli qolipni tanlang; har bir kartada o'lcham, material va resurs ko'rsatilgan.
2. **Savatga qo'shing yoki 1-klikda buyurtma bering** — miqdorni kiriting; ulgurji hajmda narx avtomatik pasayadi.
3. **Ma'lumotlaringizni qoldiring** — ism, telefon, manzil. Menejer 15 daqiqa ichida tasdiqlaydi (ish vaqtida).
4. **Yetkazib oling yoki olib keting** — Toshkentda 1–2 kun, viloyatlarga 3–5 kun; ombordan o'zingiz olib ketish bepul.

**RU:** (1) Выберите товар в каталоге — размер, материал и ресурс указаны в карточке. (2) Добавьте в корзину или оформите в 1 клик — при оптовом объёме цена снижается автоматически. (3) Оставьте контакты — менеджер подтвердит заказ в течение 15 минут в рабочее время. (4) Доставка или самовывоз — по Ташкенту 1–2 дня, в регионы 3–5 дней, самовывоз со склада бесплатно.

### 7.3 FAQ — 8 savol (raqibda 3 tasining javobi bo'sh — bizda to'liq bo'lsin)

1. **Qolip qanday materialdan tayyorlanadi?** — Polipropilen va ABS plastik; material modelga qarab tanlanadi. Barcha qoliplar UZ sharoitida (+60 °C gacha) sinovdan o'tgan. *(aniq raqamlar tasdiqlangach qo'shiladi)*
2. **Bir qolip necha marta quyishga chidaydi?** — Modelga va ishlatish shartlariga bog'liq. Aniq resursni menejerdan so'rang yoki katalogdagi "resurs" maydoniga qarang. *(tasdiqlangan raqam bo'lsa, shu yerda)*
3. **Viloyatlarga yetkazib berasizmi?** — Ha. Toshkent 1–2 kun, viloyatlar 3–5 kun; yuk tashish kompaniyalari orqali.
4. **Nostandart o'lchamda qolip yasaysizmi?** — Ha, individual buyurtma bo'yicha; chizma yoki namuna asosida hisob-kitob qilinadi.
5. **Ulgurji narxlar bormi?** — Ha, 10+ dona va 50+ dona uchun pog'onali chegirma; dilerlar uchun alohida shartlar.
6. **To'lov usullari qanday?** — Naqd, bank o'tkazmasi (yuridik shaxslar uchun), Click/Payme (havola orqali).
7. **Kafolat beriladimi?** — *[tasdiqlangach yoziladi: muddat, shartlar, qaytarish]*
8. **Qolipdan qanday qilib to'g'ri quyish kerak?** — Beton aralashmasini tayyorlang → qolipga tekis quying → quriting → ajratib oling; batafsil qo'llanma blogda/har mahsulot sahifasida.

### 7.4 Blog (P0-5 uchun 6 maqola g'oyasi)

1. "Bruschatka sexini qanday boshlash: 0 dan birinchi partiyagacha" (P1, B2B)
2. "Qolip resursini 2 barobar oshirishning 7 usuli" (parvarish qo'llanmasi)
3. "Termopanel narxi nimaga bog'liq: 2026 hisob-kitobi"
4. "Polipropilen yoki ABS: qaysi qolipni tanlash kerak?"
5. "Beton quyishda eng ko'p uchraydigan 5 xato"
6. "Trotuar plitka o'rnatish: bosqichma-bosqich yo'riqnoma (foto bilan)"

### 7.5 Ishonch da'volari — qoida

Har bir raqam uchun dalil bo'lishi shart: sinov bayonnomasi, sertifikat, ombor/sex rasmi, shartnoma, mijoz xati. **Dalilsiz raqam saytga chiqmaydi.** (Raqib "15 yil" va "27 yil" ni bir vaqtda yozib, ishonchni yo'qotmoqda — biz bu xatoni takrorlamaymiz.)

---

## 8. SEO VA MIGRATSIYA

### 8.1 301 redirect xaritasi (eski `sps.uz` → yangi sayt)

| Eski URL | Yangi URL (301) | Izoh |
|---|---|---|
| `/` | `/ru` | Eski sayt rus tilida edi → RU versiyaga |
| `/about` | `/ru/about` | |
| `/kontakty` | `/ru/contact` | |
| `/napishite-nam` | `/ru/contact` | |
| `/produkciya` | `/ru/catalog` | |
| `/formi` | `/ru/catalog` | Qoliplar katalogi |
| `/formi/p/*` | `/ru/catalog?page=*` | Sahifalash |
| `/formi/image/*` | `/ru/catalog` | Rasm sahifalari (yoki mahsulotga map qilinsa — mahsulot) |
| `/plitki` | `/ru/catalog?category=trotuar-plitka-qoliplari` | Slug'ni DB'dan tekshirish |
| `/bordyury-i-lotki` | `/ru/catalog?category=bordyur-qoliplari` | Slug'ni tekshirish |
| `/kolodtsy` | `/ru/catalog` | Alohida kategoriya yo'q bo'lsa |
| `/uslugi` | `/ru/production` | |
| `/proizvoditeli` | `/ru/production` | |
| `/doc` | `/ru/delivery-payment` | Hujjatlar uchun yangi sahifa (P1-4) |
| `/otzyvy-o-nas` | `/ru/about#reviews` yoki `/ru/reviews` | Real sharhlar tayyor bo'lgach |
| `/fotogalereya` | `/ru/projects` | |
| `/novosti` | `/ru/blog` | |
| `/novosti/news_post/testovaya-novost` | `/ru/blog` | Test yozuvi → blog |
| `/search` | `/ru/search` | |
| `/karta-sayta` | `/ru` | |
| `/user` | `/ru` (yoki 410) | Ma'nosi yo'q |

### 8.2 Texnik SEO checklist

- [ ] `NEXT_PUBLIC_SITE_URL=https://sps.uz`; `www` → apex 301
- [ ] `hreflang`: `uz` ↔ `ru` (+ `x-default` → `uz`) har sahifada
- [ ] Canonical: o'z tili, filtr parametrlari uchun `?page=`/`sort` canonical'ga tushmasin
- [ ] `sitemap.xml`: mahsulot, kategoriya, blog, loyiha; `lastmod` real
- [ ] `robots.txt`: `Disallow: /*?sort=`, `?page=`; (raqibdagidek) `Host:` direktivasi **yozilmasin** (Google qo'llamaydi)
- [ ] Schema: `Product` (+`Offer`, real bo'lsa `AggregateRating`), `BreadcrumbList`, `FAQPage`, `Organization`, `LocalBusiness` (manzil bilan!)
- [ ] `og:image`: har mahsulot uchun o'z rasmi (hozir umumiy logo)
- [ ] Google Search Console + **Yandex Webmaster** (UZ bozorida muhim) — yangi sayt tasdiqlansin, eski sitemap olib tashlansin
- [ ] Eski va yangi sayt 2 hafta parallel kuzatilsin (404 log, redirect xatolari)
- [ ] Yandex Metrica + GA4 + Google Business + Yandex Business + 2GIS profillari

### 8.3 Nima uchun biz raqibdan SEO'da ustunmiz

Raqibning sitemap'ida mahsulot sahifalari yo'q, URL'lari raqamli ID, kontenti 3 tilda aralash. Bizning slug'lar, sitemap, hreflang va JSON-LD tayyor. **Asosiy ish — eski URL'larning obro'sini yo'qotmaslik (301) va kategoriya sahifalariga matn yozish.**

---

## 9. LAUNCH REJASI VA KUZATUV

**T-7:**
- [ ] Staging'da to'liq E2E (uz/ru, mobil/desktop, 5 ta brauzer)
- [ ] Barcha P0 vazifalar bajarilgani tasdiqlansin
- [ ] DB zaxira nusxasi (backup) va `db push` rejasi
- [ ] Redirect jadvali test muhitida tekshirilsin (har URL 301)

**T-1:**
- [ ] Env va to'lov kalitlari production'da
- [ ] DNS TTL kamaytirilsin (1 soat)
- [ ] Rollback rejasi: eski sayt nusxasi + DNS qaytarish (5 daqiqada)

**T-0 (launch kuni):**
- [ ] DNS almashtirish → apex + www
- [ ] TLS tekshirish, `https://` majburiy
- [ ] `/api/health`, `/sitemap.xml`, `/robots.txt`, uz/ru bosh sahifalar
- [ ] Test buyurtma + test lead → Telegram/CRM
- [ ] GSC/Yandex Webmaster'ga yangi sitemap yuborish
- [ ] Kunduzgi 4 soat ichida 404 va error log monitoring

**T+1…T+7:**
- [ ] 404 xatolarni yig'ish va yangi redirectlar qo'shish
- [ ] Order konversiyasini kuzatish (analitika)
- [ ] Yandex/Google'da indekslash holati
- [ ] Tezlik (Lighthouse) va mobil test

**T+30 / T+60 / T+90 (KPI):**

| Metrika | O'lchov | Maqsad g'oyasi `[X]` |
|---|---|---|
| Organik sessiya | GA4/Metrica | T+30: baseline → T+90: 2x (kontent bilan) |
| Katalog → mahsulot CTR | event | > 35% |
| Mahsulot → savat | event | > 8% |
| Checkout boshlash → yakun | event | > 55% |
| Lead (B2B forma) | CRM | Haftada 10+ |
| O'rtacha buyurtma | admin | Mavjud baza bo'yicha +15% |
| LCP (mobil) | CrUX/Lab | < 2.0 s |
| Sharh soni | admin | T+90: 20+ real sharh |
| Blog trafigi | GA4 | T+90: jami sessiyaning 15% |

---

## 10. RISKLAR VA CHORA

| Risk | Ehtimol | Ta'sir | Chora |
|---|---|---|---|
| Eski URL'lar 404 → trafik yo'qotish | Yuqori | Yuqori | P0-2, 2 hafta 404 monitoring |
| Narx ochiq → raqib nusxalaydi | O'rta | O'rta | Chakana ochiq, ulgurji so'rov orqali |
| Soxta sharh/dalilsiz da'vo fosh bo'lishi | O'rta | Yuqori | P0-4, P0-8 (qat'iy) |
| Kontent tayyor emas (blog/jamoa/video) | Yuqori | O'rta | P0-5 + kontent mas'uli tayinlanadi |
| To'lov provayderi kechikishi | O'rta | O'rta | "Operator orqali to'lov" fallback matni |
| Media fayllar yuklanmasligi (S3/R2 sozlama) | O'rta | Yuqori | P0-9 test + CDN fallback |
| Repo hajmi katta → deploy sekin | Yuqori | Past | P0-6 |
| Admin huquqlari/parol yagona joyda | Past | Yuqori | 2 admin, 2FA, backup |

---

## 11. KEYINGI 5 TA AMALIY QADAM (bugun boshlash mumkin)

1. **P0-2 (301 xarita)** — `next.config.js` ga `redirects()` blokini yozish (8-bo'lim jadvali tayyor).
2. **P0-3 (kontaktlar)** — `contacts.ts` ni eski saytdagi real ma'lumotlar bilan to'ldirish (`addressUz/Ru`, ish vaqti, 4 telefon, Yandex xarita linki).
3. **P0-4 (sharhlar)** — `ProductReviews.tsx` da mock'larni yashirish (yoki `Review` modelini qo'shish).
4. **P0-6 (repo gigienasi)** — 129 rasm + 4 PDF'ni `public/media/` ga ko'chirish, `.gitignore` yangilash.
5. **P0-5 (kontent)** — 6 blog post + 6 loyihani seed/import skripti bilan yozish (`public/catalog/2026/*-env.jpg` rasmlari allaqachon mavjud).

> Har bir qadam aynan shu hujjatdagi ID bilan bog'langan — hisobotni sprint board'ga to'g'ridan-to'g'ri ko'chirish mumkin.

---

## 12. ILOVA A — Tekshirilgan manbalar jurnali

| Sana | Manba | Topilma |
|---|---|---|
| 2026-10-04 | `madani.uz/` (EN), `/uz`, `/en` | 3 tilli brend, slayder, ishonch bloklari, 10 sharh (placeholder avatar), FAQ (3 bo'sh javob), hamkorlar, kontaktlar |
| 2026-10-04 | `madani.uz/products` | Kategoriya tablari + sahifa hajmi + saralash; **narx yo'q**; "Скидка %" raqamsiz |
| 2026-10-04 | `madani.uz/products/3` (en/uz/ru) | Slug yo'q; tavsif va spetsifikatsiya ruscha (en/uz'da ham); spetsifikatsiya ikki marta va ziddiyatli; tablar bo'sh |
| 2026-10-04 | `madani.uz/company` | Tarix, 8 kishilik jamoa (placeholder rasm), "Ta'lim bo'limi rahbari" qoldig'i, YouTube video, statistika ziddiyati |
| 2026-10-04 | `madani.uz/how-to-order` | Yaxshi 4 qadamli sahifa (bizda yo'q) |
| 2026-10-04 | `madani.uz/contact-us` | Forma + Yandex xarita; "kategoriyada mahsulot yo'q" noto'g'ri bloki |
| 2026-10-04 | `madani.uz/news/10` | Bir xil sanali postlar; qisqa matn |
| 2026-10-04 | `madani.uz/sitemap.xml` | 18 URL, mahsulot/kategoriya yo'q |
| 2026-10-04 | `madani.uz/robots.txt` | `Host:` (eskirgan), `?ordering/page/page_size` yopilgan |
| 2026-10-04 | `sps.uz` (eski sayt) | 2017-yil sayti live; biznes ma'lumotlar, 20+ URL |
| 2026-10-04 | `sps.uz/sitemap.xml` | Eski URL inventari (redirect map uchun) |
| 2026-10-04 | `spsplast` repo | 151 ta manba fayl, 130 mahsulot dataseti, 390 rasm, 4 PDF, mock sharhlar, bo'sh blog/loyiha, redirect yo'q |

## 13. ILOVA B — Media standarti (raqibning alt-matn xatosini takrorlamaslik)

| Tur | Format | O'lcham | Alt matn shabloni |
|---|---|---|---|
| Mahsulot — qolip | WebP/AVIF | 1200×1200, ≤ 120 KB | `{Nomi} qolipi — {o'lcham} — SPS` |
| Mahsulot — natija | WebP/AVIF | 1200×1200, ≤ 120 KB | `{Nomi} qolipidan quyilgan bruschatka` |
| Muhit (obyekt) | WebP/AVIF | 1600×1000, ≤ 180 KB | `{Nomi} qoliplari bilan bezatilgan hovli` |
| Blog muqova | WebP/AVIF | 1600×900, ≤ 150 KB | `{Maqola sarlavhasi}` |
| Video | MP4 + poster | 1080p, ≤ 20 s | — |

## 14. ILOVA C — Lug'at (izchillik uchun)

| UZ | RU | Izoh |
|---|---|---|
| Qolip | Форма | Asosiy mahsulot |
| Bruschatka qolipi | Форма для брусчатки | |
| Trotuar plitka | Тротуарная плитка | |
| Bordyur | Бордюр | |
| Termopanel | Термопанель | |
| Natija (quyma) | Отливка / результат | Qolipdan chiqqan mahsulot |
| Resurs (quyish soni) | Ресурс (число заливок) | Da'vo uchun dalil kerak |
| Ulgurji | Опт | B2B |
| Rekvizitlar | Реквизиты | Yuridik ma'lumotlar |

---

**Xulosa bir gapda:** raqib **o'z zavodini yaxshi hikoya qiladi, lekin sotmaydi**; biz **sotish mexanikasiga egamiz, lekin hikoyani aytmayapmiz va hali eski sayt ostidamiz**. Sprint 0 da launch blockerlar yopilsa, 2 hafta ichida kontent bo'shlig'i yopiladi va SPS Plast bozorda **funksional jihatdan eng kuchli** qolip sotuvchi saytga aylanadi.

**Fayl:** `docs/MADANI-RAQOBAT-AUDITI.md` · Sprint board uchun tayyor (har bir vazifa ID bilan)
