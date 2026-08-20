# SPS PLAST — Content & Asset Replacement Checklist

This document details all temporary/placeholder images, business claims, and contact details in the repository, along with specifications for real SPS Plast production assets.

---

## 1. LOGO & BRAND ASSETS

| Asset | Current State | Required Real Asset | Dimensions / Format | Where Used |
|---|---|---|---|---|
| Primary Logo | Vector SVG mark + SPS PLAST text | Official vector SVG logo | Vector SVG / PNG (trans, 400x100) | Header, Footer, Admin, Mobile Drawer |
| Favicon | Next.js default favicon | SPS Plast icon mark | 32x32 ICO / 192x192 PNG | Browser tab |
| Social Share (OG Image) | Auto-generated or default | Factory / Hero product composite | 1200x630 JPEG/PNG | OpenGraph / Social sharing |

---

## 2. STOREFRONT MEDIA & CATEGORIES

| Category / Component | Current Source | Required Real SPS Plast Photo | Media Role | Dimensions / Aspect |
|---|---|---|---|---|
| Hero Banner | Unsplash factory image | Real SPS Plast injection molding production floor | HERO | 1920x1080 (16:9) |
| Bruschatka Molds | Unsplash paving mold photo | Physical plastic mold for paving stones | CATEGORY_MAIN | 800x800 (1:1) |
| Finished Paving Results | Unsplash paved walkway photo | Real paved stone walkway cast using SPS molds | FINISHED_RESULT | 800x800 (1:1) |
| Thermopanels | Unsplash facade photo | Real facade thermopanel sample photo | CATEGORY_MAIN | 800x800 (1:1) |
| Mold Product Detail | Seed / Unsplash | Clean photo of plastic injection mold on neutral bg | MOLD | Min 1600x1600 (1:1) |
| Result Product Detail | Seed / Unsplash | Actual concrete product cast from exact mold | FINISHED_RESULT | Min 1600x1600 (1:1) |
| Factory & Production | Unsplash industrial machines | Real SPS Plast workshop, CNC molds, storage | PRODUCTION | 1200x800 (3:2) |
| Project Showcase | Unsplash architectural photos | Real completed client building facades & paved sites | PROJECT | 1200x800 (3:2) |

---

## 3. PRODUCT PHOTO STANDARDS

Future photography supplied by SPS Plast should follow these standardized media roles:

1. **MAIN**: Clean product shot on neutral/white background showing the full physical item.
2. **MOLD**: Exact physical injection mold item (used in "Qolip -> Tayyor Natija" showcase).
3. **FINISHED_RESULT**: Actual concrete stone or panel created using that specific mold.
4. **DIMENSION**: Diagram or photo clearly displaying height, width, and thickness measurements.
5. **DETAIL**: Close-up high-resolution view of surface texture, material density, or locking mechanism.
6. **USAGE**: Practical site installation or concrete casting in progress.

**Recommended Resolution**: Minimum 1600x1600px for main/detail photos, 1920x1080px for hero/banner imagery.

---

## 4. CONTENT CLAIMS & BUSINESS VERIFICATION

The following metrics are currently configured and require explicit verification by SPS Plast management before public production launch:

- **Years in business**: 10+ yillik tajriba / 10+ лет опыта
- **Cast Durability**: 350+ marta betonga chidamlilik / 350+ циклов заливки
- **Raw Material**: Primary high-grade polypropylene & polystyrene (100% birinchi navli plastik)
- **Warranty**: 1-year factory warranty on injection molds
- **Delivery Timeline**: 24-48 hours within Tashkent, 3-5 days across Uzbekistan regions

---

## 5. CENTRALIZED CONTACT DATA

All public contact details are configured in `src/lib/constants/contacts.ts`:

- **Phone**: +998 (90) 123-45-67
- **Telegram**: https://t.me/spsplast (@spsplast)
- **WhatsApp**: https://wa.me/998901234567
- **Instagram**: https://instagram.com/spsplast
- **Factory Address (UZ)**: Toshkent sh., Sergeli tumani, Sanoat zonasi 4-daha
- **Factory Address (RU)**: г. Ташкент, Сергелийский р-н, Промзона 4
- **Email**: info@spsplast.uz
