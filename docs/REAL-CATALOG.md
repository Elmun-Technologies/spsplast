# SPS — Real Katalog & Kontent (2026)

Ushbu hujjat saytdagi barcha **soxta/uydirilgan** ma'lumotlar olib tashlangani va real katalog
(`sps old.zip` — eski bosma katalog + yangi suratga olingan qoliplar) asosida qayta qurilganini
hujjatlashtiradi.

## 1. Asosiy brend

- **Brend:** SPS / STONE PROFY SERVISE
- **Sayt:** https://sps.uz
- **Email:** stoneprofyservise@mail.ru
- **Telefon / Telegram / WhatsApp:** +998 (98) 300-77-72
- **Manzil:** Tashkent, Uzbekistan

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
- **Narx:** katalogda ko'rsatilmagan → `basePrice = 0` ("Narx so'rash" rejimi). Admin orqali to'ldiriladi.

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

Yangi suratga olingan **71 ta rasm** va **1 ta video** (`sps old.zip` dan) `public/product/` da,
web sayt uchun `public/catalog/catalog-001.jpg ... catalog-071.jpg` sifatida joylashtirildi.
Har bir mahsulotga quyidagi media rollari tayinlangan:

- `MOLD` — qolipning o'zi
- `FINISHED_RESULT` — shu qolipdan quyilgan tayyor mahsulot
- `MAIN` — asosiy rasm

Tasvirlar admin panel orqali qayta tayinlanishi mumkin (`/admin/products`).

## 6. Seed

`prisma/seed.js` endi faqat real mahsulotlarni yaratadi:

```bash
npm run db:push   # prisma db push
npm run db:seed   # node prisma/seed.js
```

Eskirgan `scripts/seed-more.js` (soxta Unsplash mahsulotlari) o'chirildi.
