# Tirik suratlar (mahsulot fotosuratlari)

Shu papkaga yuklangan surat saytda **3D render o'rnini avtomatik egallaydi** — tirik surat
hamisha eng ustun manba (tirik surat → 2026 studiya → zavod DSC → 3D render).

## Fayl nomi qoidasi

```
<KOD>[-turi][-raqam].jpg
```

| Qism | Nima yoziladi | Misol |
|---|---|---|
| `KOD` | Saytdagi model kodi (kartochkadagi `№` dan keyingi yozuv) yoki model slugi | `01`, `70`, `TP-001`, `KRN-005`, `D05`, `Z03`, `S01`, `F23` |
| `turi` | `qolip` (qolipning o'zi), `plitka` (tayyor mahsulot), `sahna` (obyektda terilgan holati). Yozilmasa — `qolip` | `-plitka` |
| `raqam` | Bitta turdan bir nechta surat bo'lsa (hozircha birinchisi ishlatiladi) | `-2` |

Misollar:

```
01.jpg              -> №01 Monako qolipi
01-plitka.jpg       -> №01 tayyor plitka
01-sahna.jpg        -> №01 hovlida terilgan
TP-001-qolip.jpg    -> TP-001 termopanel qolipi
KRN-004-35x120-karniz.jpg  -> bir xil kodli ikki model bo'lsa — slug bilan
Z03-sahna.jpg       -> Z03 yevrozabor obyektda
```

Format: `.jpg`, `.jpeg`, `.png`, `.webp`. Katta fayl bo'lsa ham bo'ladi (sayt uchun 800–1400 px
WebP qilib kichraytiriladi), lekin bitta fayl 20 MB dan oshmasin (GitHub cheklovi 100 MB).

## Qanday yuklanadi

1. GitHub'da `media-src/live/` papkasini oching → **Add file → Upload files** → suratlarni
   tashlang → **Commit changes** (to'g'ridan-to'g'ri ishchi branchga yoki yangi branch + PR).
2. GitHub Action **"Tirik suratlar"** (`.github/workflows/live-photos.yml`) o'zi ishga tushadi:
   fonni olib tashlaydi (qolip va plitka — shaffof fon), WebP yasaydi, katalogni yangilaydi va
   natijani shu branchga commit qiladi. Tayyor bo'lgach — sayt navbatdagi deploy'da yangilanadi.
3. Nomi hech bir modelga mos kelmagan fayllar `docs/data-questions.md` dagi savollar ro'yxatiga
   tushadi (Action jurnalida ham ko'rinadi) — nomini to'g'rilab qayta yuklang.

Qo'lda (kompyuterda, rembg o'rnatilgan bo'lsa):

```bash
npm run photos:import
```

## Muhim

- Faqat **haqiqiy SPS** suratlari (stok rasm, boshqa zavod mahsuloti — yo'q).
- Qolip suratini bir xil, och fonda olish fon olib tashlashni yaxshilaydi.
- Admin panel orqali yuklangan rasm (Mahsulotlar → rasm) baza ishlaganda bundan ham ustun.
