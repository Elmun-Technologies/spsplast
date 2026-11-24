# Admin panel — menejer va rahbar uchun qo'llanma

**Manzil:** https://spsplast.uz/admin (Google'da ko'rinmaydi) · **Kirish:** e-pochta + parol (har xodimga alohida).

Sayt do'kon emas: narx, savat, to'lov yo'q. Mijoz **zayafka** qoldiradi → zayafka **bazaga** yoziladi va
**Telegram guruhiga** keladi → menejer qo'ng'iroq qilib qolip soni va narxini aytadi. Admin panel — shu ishning markazi.

## 1. Har kuni (menejer, 10 daqiqa)

1. **Bosh sahifa (dashboard)** — 24 soat / 7 / 30 kunlik zayafkalar, ko'p so'ralgan modellar, manbalar.
   **"Telegram'ga yetmagan"** raqami **0** bo'lishi kerak. 0 bo'lmasa — 4-bo'limga qarang.
2. **Zayafkalar** — "Yangi" chipini bosing. Har bir yangi zayafkani **24 soat ichida** ko'rib chiqing:
   - kartochkani oching → **Qo'ng'iroq / WhatsApp / Telegram** tugmasi bilan bog'laning;
   - holatni o'zgartiring: **Yangi → Bog'lanildi → Taklif yuborildi → Kelishildi** yoki **Rad etildi** (sababi bilan);
   - **Mas'ul** menejerni tanlang, suhbat natijasini **izoh**ga yozing (tarix saqlanadi).
3. Zayafka kartochkasida mijoz tanlagan modellar, kunlik hajm (m²), qolip soni va **mijoz yo'li** (saytda qaysi
   sahifalarni ko'rgani, qayerdan kelgani — Google, Instagram, reklama) ko'rinadi. Qo'ng'iroqdan oldin o'qib chiqing.

Zayafka turlari: **Tez zayafka** (model kartochkasidan), **Zayafka ro'yxati** (bir nechta model), **Ulgurji forma**
(sex / diler / quruvchi). Raqam: `SPS-YYMM-NNNN` — mijozga shu raqamni ayting.

**Excel kerak bo'lsa:** Zayafkalar → filtr (sana, holat, mas'ul) → **CSV** → Excel'da ochiladi.

## 2. Mahsulotlar (qoliplar va tayyor mahsulotlar)

**Mahsulotlar** sahifasi: qidiruv (kod yoki nom), bo'lim va holat filtri, tayyor filtrlar **"Rasmsiz"**,
**"Ruscha nomsiz"**, **"Inglizcha nomsiz"** — to'ldirish kerak bo'lganlarini tez topish uchun.

Holatlar: **Nashrda** (saytda ko'rinadi) · **Qoralama** (tayyorlanmoqda) · **Arxiv** (saytdan olinadi). Nashrdagi
modelni arxivlasangiz, uning eski manzilini **SEO → Yo'naltirishlar**da o'xshash model yoki bo'limga yo'naltiring —
aks holda Google'dan kelgan mijoz "sahifa topilmadi"ni ko'radi.

Yangi qolip qo'shish:
1. **Mahsulotlar → Yangi** (yoki o'xshash mahsulotda **"Nusxa olish"** — tezroq).
2. Kod, bo'lim, nom **uch tilda** (uz / ru / en), qisqa tavsif, o'lcham, qalinlik, 1 m² dagi soni.
3. **Rasmlar:** qolip surati — fon brauzerning o'zida avtomatik olib tashlanadi, natijani ko'rib
   **"Fonsizini saqlash"** yoki **"Asl rasmni saqlash"** ni tanlang. Terilgan plitka (sahna) suratida fon qoladi.
   Telefon surati ham bo'ladi: tekis yorug'lik, qolip butunligicha kadrda, oq yoki bir rangli fon.
4. **Tartib** (sort): kichik raqam — bo'limda yuqoriroq. Yangi modellar trotuar boshida turadi.
5. Holat **Nashrda** → saqlash → **Nashr qilish** (5-bo'lim).

Rasmsiz model saytda ko'rinadi, lekin Google'ga yuborilmaydi va sahifasida "WhatsApp'da so'rash" tugmasi chiqadi —
rasm qo'shilgach o'zi indekslanadi.

**Ikki yo'nalish.** Sayt ikki qismdan iborat: **Qoliplar** (`/catalog`) va **Tayyor mahsulotlar** (`/ready` —
termopanel, karniz, pilyastra, fasad toshi, skameyka, yevrozabor…). Ikkalasi ham shu "Mahsulotlar" sahifasida
boshqariladi: mahsulot qaysi yo'nalishda ekanini uning **bo'limi** belgilaydi (bo'lim ro'yxatida "Qoliplar" va
"Tayyor mahsulotlar" guruhlari bor). Tayyor mahsulotda qolip qatori to'ldirilmaydi; o'lcham, 1 m² dagi soni va
"Texnik jadval" (qalinlik, asos, rang) yetarli. Rasmlar: asosiy — mahsulotning o'zi, qo'shimcha — fasaddagi ko'rinishi.

**Bo'limlar** (faqat administrator): yangi bo'lim — nom 3 tilda, URL, tartib va **yo'nalish** (qoliplar / tayyor
mahsulot). Mahsuloti bor bo'limning yo'nalishini o'zgartirib bo'lmaydi (saytdagi manzillar buziladi). Mahsulotsiz
bo'lim saytda ko'rinmaydi va Google'ga yuborilmaydi.

## 3. Sayt matnlari, raqamlar, kontaktlar

- **Sozlamalar → Kontaktlar:** telefonlar (asosiysi — WhatsApp ham), Telegram, Instagram, e-pochta, manzil (3 tilda).
  Saytning hamma joyida (header, footer, kontakt sahifasi, Google uchun ma'lumot) o'zi yangilanadi.
- **Sozlamalar → Raqamlar:** tajriba yili, oylik quvvat, obyektlar soni, eksport davlatlari. Matnlarda raqam
  qo'lda yozilmaydi — shu yerdan olinadi.
- **Matnlar:** saytdagi barcha yozuvlar (menyu, sahifalar, formalar, savol-javob) 3 tilda. Bo'sh qoldirilsa —
  standart matnga qaytadi. `{1}`, `{2}` kabi belgilarni o'chirmang (o'rniga son yoki davlat nomi qo'yiladi).
  O'zbekcha matnda **"yaratish"** so'zi ishlatilmaydi — **"ishlab chiqarilgan"**.
- **Sharhlar:** haqiqiy mijoz sharhlari (ism, shahar, matn, baho). Bo'sh bo'lsa bosh sahifada bu blok ko'rinmaydi —
  to'qima sharh qo'shmang.
- **Sozlamalar → Ishonch dalillari:** zavod videosi (YouTube yoki Vimeo havolasi) — "Ishlab chiqarish" sahifasida chiqadi.

## 4. "Telegram'ga yetmagan" zayafka

Zayafka baribir bazada saqlangan — yo'qolmagan. Kartochkani oching → **"Telegram guruhiga qayta yuborish"**.
Yana yetmasa: bot guruhdan chiqarilgan yoki bloklangan bo'lishi mumkin — dasturchiga xabar bering
(bot tokeni va guruh ID serverda, admin panelda emas).

## 5. Nashr qilish — o'zgarish saytga qachon chiqadi

Sayt tez ochilishi uchun sahifalar oldindan tayyorlanadi. Shuning uchun:

| O'zgarish | Saytda |
|---|---|
| Zayafkalar, izohlar, holatlar, tashriflar | darhol |
| Mahsulot, bo'lim, matn, kontakt, raqam, SEO, sharh, integratsiya | **"Nashr qilish"** bosilgach, **5–10 daqiqada** |

Bir nechta o'zgarishni qilib, oxirida **bir marta** "Nashr qilish" bosing. Yig'ish xato bersa, sayt eski versiyada
ishlashda davom etadi (hech narsa buzilmaydi) — dasturchiga ayting.

## 6. SEO va analitika (administrator)

- **SEO → Sahifalar:** har sahifaning Google'dagi sarlavhasi va tavsifi (3 tilda, belgi hisoblagich va Google
  ko'rinishi bilan). Odatda tegish shart emas — avtomatik matnlar sozlangan.
- **SEO → Yo'naltirishlar (301):** eski manzil → yangi. Mahsulot URL'i yoki bo'limi o'zgarsa, yo'naltirish o'zi qo'shiladi.
- **SEO → Indekslash:** sitemap'ni Google / Yandex'ga yuborish, IndexNow — katta o'zgarishlardan keyin bir marta.
- **SEO → Salomatlik:** qizil bandlar bo'lmasin.
- **Analitika:** Yandex Metrica, Google Search Console, Yandex Webmaster, GA4 hisobotlari (7 / 28 / 90 kun).
- **Tashriflar:** saytning o'z statistikasi — onlayn, manbalar, davlatlar, qurilmalar, voronka
  (kirdi → model → ro'yxat → zayafka).

## 7. Xodimlar va xavfsizlik

- **Xodimlar** (faqat administrator): qo'shish, rol (**Administrator** — hammasi; **Menejer** — zayafkalar, tashriflar,
  analitika, mahsulotlar va sharhlar; matnlar, SEO, sozlamalar va xodimlar unga ko'rinmaydi), ishdan ketganni **faolsizlantirish** (o'chirmang — zayafka tarixi saqlanib qoladi).
- **Profil:** o'z parolingizni almashtirish. Parol kamida 10 belgi, boshqa xizmatlarda ishlatilmagan.
- Parolni Telegram yoki WhatsApp'da yubormang. Har xodimning o'z kirishi bo'lsin — umumiy login yo'q.
- Bitta hisobga 5 marta noto'g'ri parol kiritilsa, kirish 15 daqiqaga bloklanadi (himoya) — kuting yoki
  administrator parolni almashtirsin.

## 8. Tez-tez so'raladigan savollar

- **Saytga narx qo'yish mumkinmi?** Yo'q — biznes qoidasi: narx faqat menejer orqali.
- **PDF katalogni yangiladik.** Faylni dasturchiga bering: eski fayl nomi bilan almashtiriladi, saytdagi
  "PDF katalog" tugmalari o'zgarmaydi. 50 MB dan katta fayl siqilgan nusxada joylanadi.
- **Model saytda ko'rinmayapti.** Tekshiring: holati "Nashrda", bo'limi to'g'ri, "Nashr qilish" bosilgan,
  10 daqiqa o'tgan.
- **Mijoz "zayafka yuborolmadim" deydi.** Formada xato bo'lsa sayt o'zi qo'ng'iroq / Telegram / WhatsApp tugmalarini
  ko'rsatadi. Bosh sahifadagi "Telegram'ga yetmagan" va server holatini (`/api/health`) dasturchi tekshiradi.
