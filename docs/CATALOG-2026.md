# 2026 studiya seriyasi — 50 ta yangi mahsulot kartasi

2026-09-27 kuni yuklangan **oq fondagi studiya suratlari** (79 ta unikal kadr) asosida
katalogga **50 ta real mahsulot kartasi** qo'shildi. Har bir kartada tanlanadigan
**opsiyalar** (variantlar) bor.

---

## 1. Ma'lumot manbai — bitta fayl

| Fayl | Vazifasi |
|---|---|
| `prisma/data/molds-2026.json` | Mahsulot matni (uz/ru), o'lcham, tekstura, uyachalar soni, rasm yo'li, opsiya o'qlari. **Yagona haqiqat manbai.** |
| `prisma/seed.js` | Shu JSON'ni o'qib, `Product` + `ProductTranslation` + `ProductMedia` + `ProductAttributeValue` + `ProductVariant` yozadi. |
| `public/catalog/catalog-084.jpg … catalog-133.jpg` | 50 ta optimallashtirilgan surat (maks. 1200 px, ~40–90 KB). |
| `src/app/catalog-preview/page.tsx` | Bazasiz kontent ko'rigi (`npm run dev` → `/catalog-preview`), faqat dev. |
| `tests/catalog2026.test.js` | JSON yaxlitligi: unikal SKU/slug, rasm mavjudligi, opsiya o'qlari, variant SKU'lari. |

Har bir mahsulotda `sourcePhoto` maydoni bor — qaysi asl kadrdan olingani ko'rinib turadi.

---

## 2. Kategoriyalar bo'yicha taqsimot

| Kategoriya | Soni | SKU prefiksi |
|---|---|---|
| Devor va to'siq panellari qoliplari (**yangi kategoriya**) | 14 | `SPS-26-PNL-xx` |
| Fasad dekor qoliplari (karniz, pilyastra, tsokol, kapitel, jalyuzi, podokonnik) | 14 | `SPS-26-FSD-xx` |
| Bruschatka qoliplari | 12 | `SPS-26-BRS-xx` |
| Trotuar plitka qoliplari | 7 | `SPS-26-BRS-xx` |
| Fasad termopanellari | 2 | `SPS-26-TP-xx` |
| Bordyur qoliplari | 1 | `SPS-26-BRD-01` |

Yangi kategoriya slug'lari: `devor-panel-qoliplari` (uz) / `formy-stenovyh-panelej` (ru).

---

## 3. Opsiyalar (variantlar)

Har bir mahsulotda **2 ta opsiya o'qi**, ya'ni **4 ta variant** (jami 200 ta variant):

| O'q (`AttributeDefinition.code`) | Qiymatlar | Izoh |
|---|---|---|
| `mold_material` — Qolip materiali | `pp` — Polipropilen (PP) · `abs` — ABS plastik | PP: yengil, egiluvchan. ABS: qattiq, aniq geometriya. |
| `plastic_thickness` — Plastik qalinligi | `t20` — 2.0 mm standart · `t30` — 3.0 mm kuchaytirilgan | 3.0 mm: vibrostol va intensiv ishlash uchun. |

- Variant SKU'si: `SPS-26-PNL-01-PP-T20` ko'rinishida.
- Ikkala o'q ham `variantAxis: true` — admin panelda ham variant o'qi sifatida ko'rinadi.
- Mahsulot sahifasida opsiyalar `src/components/product/ProductOptions.tsx` orqali tanlanadi;
  tanlov savatga, "1-klikda buyurtma"ga va ulgurji so'rovga (`B2BModal`) o'tadi.
- Katalog kartasida variantli mahsulot **«Tanlash»** tugmasi bilan ko'rinadi
  (`productService.getProductsServer` → `hasVariants`).

---

## 4. Real ma'lumot siyosati

| Maydon | Qiymat | Sabab |
|---|---|---|
| `basePrice` | `0` → «Narx so'rash» | Narxlar bosma katalogda ko'rsatilmagan. Admin panelda to'ldiriladi. |
| `yieldPerCast` | Faqat suratdan **sanalgan** uyachalar soni (>1 bo'lsa) | Real, tekshiriladigan ma'lumot. |
| `durabilityCasts` | `null` | "300+ quyish" kabi tasdiqlanmagan da'volar ishlatilmaydi (`docs/REAL-CATALOG.md`, 4-bo'lim). |
| `material` | `Polipropilen / ABS` | Katalogdagi real material. |
| `texture` | Suratdagi naqshdan | Real. |
| `dimensions` | Oila standarti bo'yicha + `*` | Quyidagi izohga qarang. |

### O'lchamlar haqida (`*` belgisi)

Suratdan aniq o'lcham o'lchab bo'lmaydi, shuning uchun o'lchamlar **mahsulot oilasining
standarti** bo'yicha berilgan va `*` bilan belgilangan — bu 2026 bosma katalogdagi
«O'lcham buyurtmada tasdiqlanadi» belgisi bilan bir xil ma'noda.

JSON'da bu `"dimensionsConfirmed": false` orqali ko'rinadi. Aniq o'lcham ma'lum bo'lgach:

```jsonc
{
  "sku": "SPS-26-PNL-01",
  "dimensions": "2000 × 500 × 45 mm",
  "dimensionsConfirmed": true   // -> "*" yo'qoladi
}
```

so'ng `npm run db:seed` (yoki admin panelda tahrirlash).

---

## 5. Ishga tushirish

```bash
# 1. Kontentni bazasiz ko'rish (faqat dev)
npm run dev          # -> http://localhost:3000/catalog-preview

# 2. Ma'lumot yaxlitligini tekshirish
npm test             # tests/catalog2026.test.js

# 3. Bazaga QO'SHISH — production uchun xavfsiz yo'l (hech narsa o'chirilmaydi)
npm run db:import:2026 -- --dry-run   # nima bo'lishini ko'rsatadi, bazaga ulanmaydi
npm run db:import:2026                # 50 ta mahsulot + 200 ta variant upsert qilinadi

# 4. (Muqobil) butun katalogni noldan qayta yuklash — faqat bo'sh/test bazada
npm run db:push
npm run db:seed      # 123 ta mahsulot: 73 ta eski + 50 ta yangi
```

> ⚠️ `npm run db:seed` boshida **barcha jadvallarni tozalaydi** (`deleteMany`) —
> buyurtmalar, leadlar va admin foydalanuvchilari ham o'chadi. Ishlab turgan saytda
> faqat `npm run db:import:2026` ishlating: u `sku` bo'yicha upsert qiladi, shuning
> uchun qayta-qayta ishga tushirish xavfsiz.

Yangi rasmlar `public/catalog/` ichida, ya'ni deploy bilan birga ketadi — alohida
yuklash shart emas. Vercel'da deploy tugagach import skriptini bir marta ishga
tushirish kifoya (lokalda `DATABASE_URL` production bazaga qaratilgan holda ham bo'ladi).

---

## 6. Keyingi qadamlar (mijoz tasdig'i kerak)

1. **Narxlar** — har bir SKU uchun ulgurji/chakana narx (`basePrice`).
2. **O'lchamlar** — `dimensionsConfirmed: false` bo'lgan 50 ta pozitsiya.
3. **Nomlar** — agar zavod katalogida rasmiy savdo nomi bo'lsa (masalan «Farovon», «Setka»),
   `nameUz`/`nameRu` shunga moslashtiriladi.
4. **Quyma suratlari** — har bir qolip uchun tayyor beton mahsulot surati (`FINISHED_RESULT`)
   qo'shilsa, kartada "qolip → natija" almashinuvi va `MoldResultShowcase` bloki ishlaydi.
