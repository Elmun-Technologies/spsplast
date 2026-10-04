# SPS — Real Katalog & Kontent (2026)

Ushbu hujjat saytdagi barcha **soxta/uydirilgan** ma'lumotlar olib tashlangani va real katalog
(`sps old.zip` — eski bosma katalog + yangi suratga olingan qoliplar) asosida qayta qurilganini
hujjatlashtiradi.

## 1. Asosiy brend

- **Brend:** SPS / STONE PROFY SERVISE
- **Sayt:** https://sps.uz
- **Email:** stoneprofyservise@mail.ru
- **Telefon / Telegram / WhatsApp:** +998 (98) 300-77-72
- **Manzil:** Toshkent sh., Uchtepa tumani, Xalqa yo'li ko'chasi, 7A
- **Yagona manba:** `src/lib/constants/contacts.ts` (sayt bo'ylab barcha kontakt shu fayldan)

Katalogdagi identifikatsiya (har bir sahifada `SPS` logo, `www.sps.uz`,
`stoneprofyservise@mail.ru`, `+998 (98) 300-77-72`) to'liq real ma'lumot sifatida qabul qilindi.

## 2. Katalog yo'nalishlari

Eski katalog ikki asosiy yo'nalishni o'z ichiga oladi — ikkalasi ham **teng urg'u** bilan saqlangan:

### A. Qoliplar (asosiy mahsulot)
- **Bruschatka qoliplari:** Yalta, Cvetok, Astana, Yulduz, Guruch, Bodom, Parket, Parus, Gladkiy
- **Trotuar plitka qoliplari:** Rio, Viking, Palma, Bumerang, Royal 1, Royal 2, Ona-Bola, Uzor 4 Gul, Dubai 40x40, Kare, Tumba, Ventilyator, Faron
- **Bordyur / devor paneli qoliplari:** 190x50 devor paneli, Kirpich, Kamen Skala

### B. Fasad dekor elementlari
- **Karnizlar:** KRN-005 ... KRN-010
- **Pilyastrlar:** PL-002, PL-003, PL-012 ... PL-015
- **Tsokollar:** SL-001 ... SL-004
- **Dekor panellar:** FSD-013 ... FSD-016
- **Fasad termopanellari:** TP-001 ... TP-012 (30x60, 25x50, 20x40)

## 3. Material / xususiyatlar (katalogdan)

- **Qolip materiali:** Polipropilen, ABS
- **Fasad dekor materiali:** Penopolistol (asos), Travertin / Mramor (qoplama)
- **O'lchamlar:** har mahsulot uchun `dimensions` atributida (mm)
- **Ranglar:** Travertin, Mramor
- **Narx:** katalogda ko'rsatilmagan → `price = 0` ("Narx so'rash"). Narx faqat zayafkadan keyin menejer hisob-kitobida aytiladi — saytda narx ham, ombor qoldig'i ham ko'rsatilmaydi.

## 4. Olib tashlangan soxta da'volar

Quyidagi uydirilgan/tasdiqlanmagan raqamlar sayt bo'ylab olib tashlandi yoki yumshatildi:

| Eski (uydirilgan) | Yangi (real / neytral) |
|---|---|
| `+998 (90) 123-45-67`, `info@spsplast.uz` | `+998 (98) 300-77-72`, `stoneprofyservise@mail.ru` |
| `500K+ sotilgan qolip` | Material ma'lumoti (Polipropilen/ABS) |
| `300+ mijoz sexlar` | "O'zbekiston bo'ylab sexlar bilan ishlaymiz" |
| `10 yil / EST. 2014` (asoslanmagan) | Olib tashlandi (faqat "Tashkent • Uzbekistan") |
| `2000+ qolip/kun` (about) | Sifatli xomashyo tavsifi |
| `300+ quyish kafolati` (barcha sahifalar) | "Resurs modelga bog'liq" / "Sifatli xomashyo" |
| `yetakchi zavod` | Neytral "ishlab chiqaruvchi zavod" |
| `spsplast.uz` | `sps.uz` |

## 5. Rasmlar

Yangi suratga olingan kadrlar web uchun `public/catalog/catalog-*.jpg` sifatida
joylashtirildi (yengil, maks. 1200 px). Asl master fayllar `media-src/` da turadi va
git'ga kirmaydi; ularni qayta optimallashtirish: `python3 scripts/build-media.py`.

Har bir mahsulotda rasm maydonlari:

- `moldImage` — qolipning o'zi;
- `resultImage` — shu qolipdan quyilgan tayyor mahsulot;
- `images[]` — galereya.

Rasm almashtirish tartibi (admin panel yo'q) — `docs/CONTENT-REPLACEMENT.md`, 4-bo'lim.

## 6. Katalog qanday yasaladi

Baza va seed skriptlari **yo'q**. Manbalar `data/` papkasida, natija esa
`src/data/catalog.json` da:

```bash
node scripts/build-static-catalog.js          # data/*.json -> src/data/catalog.json
node scripts/build-static-catalog.js --check  # mos kelishini tekshiradi (CI uchun)
```

Skript soxta Unsplash mahsulotlarini ham, eski `scripts/seed-more.js` ni ham
ishlatmaydi — faqat real `catalog_build/products.json` va `data/*.json`.

## 7. 2026 studiya seriyasi (2026-09-27)

Oq fonda suratga olingan yangi qoliplardan **50 ta mahsulot kartasi** qo'shildi
(`public/catalog/catalog-084.jpg … catalog-133.jpg`). Har bir kartada tanlanadigan
opsiyalar bor: **qolip materiali** (PP / ABS) va **plastik qalinligi** (2.0 / 3.0 mm) —
jami 200 ta variant.

Ma'lumot manbai: `data/molds-2026.json`.
To'liq hujjat: [`docs/CATALOG-2026.md`](CATALOG-2026.md).

Shu bo'limdagi "soxta ma'lumot yo'q" qoidasi saqlangan:

- narx yo'q → `basePrice = 0` («Narx so'rash»);
- `durabilityCasts` (quyish resursi) umuman berilmagan — tasdiqlanmagan da'vo;
- `yieldPerCast` faqat suratdan sanalgan uyachalar soni;
- o'lchamlar oila standarti bo'yicha va `*` bilan belgilangan
  (`dimensionsConfirmed: false`) — buyurtmada tasdiqlanadi.
