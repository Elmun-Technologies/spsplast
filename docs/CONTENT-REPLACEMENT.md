# SPS PLAST — Content & Asset Replacement Checklist

This document details all temporary/placeholder images, business claims, and contact details in the repository, along with specifications for real SPS Plast production assets and Admin media management workflows.

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
| Hero Banner | Configurable via Admin Settings / neutral fallback | Real SPS Plast injection molding production floor | HERO | 1920x1080 (16:9) |
| Bruschatka Molds | Configurable via Category Admin upload | Physical plastic mold for paving stones | CATEGORY_MAIN | 800x800 (1:1) |
| Finished Paving Results | Category / Product Media upload | Real paved stone walkway cast using SPS molds | FINISHED_RESULT | 800x800 (1:1) |
| Thermopanels | Category Admin upload | Real facade thermopanel sample photo | CATEGORY_MAIN | 800x800 (1:1) |
| Mold Product Detail | Product Media Uploader (Role: MOLD) | Clean photo of plastic injection mold on neutral bg | MOLD | Min 1600x1600 (1:1) |
| Result Product Detail | Product Media Uploader (Role: FINISHED_RESULT) | Actual concrete product cast from exact mold | FINISHED_RESULT | Min 1600x1600 (1:1) |
| Factory & Production | Media Storage / Settings | Real SPS Plast workshop, CNC molds, storage | PRODUCTION | 1200x800 (3:2) |
| Project Showcase | Media Storage / Settings | Real completed client building facades & paved sites | PROJECT | 1200x800 (3:2) |

---

## 3. PRODUCT PHOTO STANDARDS

Future photography supplied by SPS Plast should follow these standardized media roles:

1. **MAIN (Asosiy rasm)**: Clean product shot on neutral/white background showing the full physical item (square or 4:3 catalog aspect ratio).
2. **MOLD (Qolip rasmi)**: Exact physical injection mold item (used in "Qolip -> Tayyor Natija" showcase).
3. **FINISHED_RESULT (Tayyor mahsulot rasmi)**: Actual concrete stone or panel created using that specific mold.
4. **DIMENSION (O'lcham)**: Diagram or photo clearly displaying height, width, and thickness measurements.
5. **DETAIL (Detal)**: Close-up high-resolution view of surface texture, material density, or locking mechanism.
6. **USAGE (Ishlatilish)**: Practical site installation or concrete casting in progress.

**Recommended Resolution**: Minimum 1200x1200px for catalog/detail photos, 1920x1080px for hero/banner imagery. Max file size: 10MB per image. Formats allowed: WebP, JPEG, PNG.

---

## 4. ADMIN REAL MEDIA REPLACEMENT WORKFLOW (NON-DEVELOPER INSTRUCTIONS)

Non-technical administrators can manage all product media without editing code or raw URLs:

1. Log into Admin Panel at `/admin/login`.
2. Navigate to **Mahsulotlar** (`/admin/products`).
3. Click **Tahrirlash** (Edit icon) next to any product.
4. Under **"Qolip va tayyor natija"**:
   - Click **[Rasm yuklash]** under **Qolip rasmi** to upload the exact physical mold photo (Role: `MOLD`).
   - Click **[Rasm yuklash]** under **Tayyor mahsulot rasmi** to upload the finished concrete photo (Role: `FINISHED_RESULT`).
5. Under **"Mahsulot Media Fayllari"**:
   - Drag & drop or select image files to upload to **Galereya** or set as **Asosiy rasm (MAIN)**.
   - Reorder images, assign roles (`Asosiy rasm`, `Galereya`, `O‘lcham`, `Detal`, `Ishlatilish`, `Video`), edit ALT texts, or remove media items.
6. Click **Saqlash** at the bottom of the page.

---

## 5. CONTENT CLAIMS & BUSINESS VERIFICATION

All factual business metrics and claims are configured centrally via **Admin Settings** (`/admin/settings`) or `Setting` model:

- **Years in business** (`yearsExperience`): Configurable (Hidden if empty).
- **Cast Durability** (`durabilityCasts`): Per-product attribute (e.g., 350+ casts).
- **Warranty** (`warrantyTextUz`, `warrantyTextRu`): Configurable via Admin Settings.
- **Production Capacity** (`productionCapacityUz`, `productionCapacityRu`): Configurable via Admin Settings.

*Safety Rule*: Unverified claims are not shown publicly with invented default numbers.

---

## 6. CENTRALIZED CONTACT DATA & SAFETY RULE

All public contact details are configured dynamically via Admin Settings (`/admin/settings`):

- **Phone**: Configurable via Admin Settings (`phoneDisplay`, `phoneRaw`).
- **Telegram**: Configurable (`telegramUrl`).
- **WhatsApp**: Configurable (`whatsappUrl`).
- **Instagram**: Configurable (`instagramUrl`).
- **Factory Address**: Configurable (`addressUz`, `addressRu`).
- **Email**: Configurable (`email`).
- **Working Hours**: Configurable (`workingHoursUz`, `workingHoursRu`).

*Absolute Safety Rule*: If a contact field is empty or unconfigured, corresponding CTAs, phone links, and buttons are hidden automatically. No placeholder values (such as fake `+998901234567`) are shown to public users.
