# SPS PLAST E-Commerce - Database Architecture (Production Foundation)

## Overview
The database architecture is designed with **Prisma ORM** for standard PostgreSQL production deployment (with developer SQLite local compatibility).

## Core Entities & Relationships

### 1. Authentication & Security
- `AdminUser`: Stores admin accounts with bcrypt hashed passwords (`passwordHash`).
- `AdminSession`: Stores server-side sessions with SHA-256 hashed tokens (`tokenHash`), client IP, user agent, and expiration (`expiresAt`).
- `AuditLog`: Immutable log of admin operations (`action`, `entityType`, `entityId`, `metadataJson`).

### 2. Normalized Localized Content
- `Category` $\rightarrow$ `CategoryTranslation`: `[categoryId, locale]` unique pairs storing localized category names, descriptions, and slugs (`uz`, `ru`, `en`).
- `Product` $\rightarrow$ `ProductTranslation`: `[productId, locale]` unique pairs storing product titles, slugs, short descriptions, metaTitles, and metaDescriptions.
- `BlogPost` $\rightarrow$ `BlogPostTranslation`: `[postId, locale]` unique pairs.

### 3. Dynamic Attribute System
- `AttributeDefinition`: Defines properties like `code` (e.g. `dimensions`, `thickness`, `material`), `type` (`TEXT`, `NUMBER`, `BOOLEAN`, `SELECT`, `MULTISELECT`), `unit`, `filterable`, `searchable`, `variantAxis`.
- `AttributeTranslation`: Localized attribute names.
- `AttributeOption` & `AttributeOptionTranslation`: Options for SELECT attributes.
- `CategoryAttribute`: Connects categories with relevant attributes (`[categoryId, attributeId]`).
- `ProductAttributeValue`: Product attribute values linking `productId`, `attributeId`, and typed values.

### 4. Product Lifecycle, Variants & Media Roles
- `Product`: Stores core product fields (`sku`, `status` [DRAFT, ACTIVE, ARCHIVED], `basePrice` [Integer UZS], `compareAtPrice`, `inStock`, `stockQty`, `trackInventory`, `allowBackorder`).
- `ProductVariant`: Supports product variations (e.g., thickness/color variants).
- `ProductMedia`: Structured media storage with roles:
  - `MAIN`: Primary catalog card image.
  - `GALLERY`: Additional detail photos.
  - `MOLD`: Physical mold image (USP).
  - `FINISHED_RESULT`: Concrete product output image (USP).
  - `DIMENSION`: Technical drawing/dimension photo.
  - `VIDEO`: Video tutorial link.

### 5. Orders & Snapshot Security
- `Order`: Purchase details with marketing attribution snapshot (`utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `utmTerm`, `gclid`, `fbclid`, `referrer`, `landingPage`).
- `OrderItem`: Immutable purchase-time snapshot (`productId`, `variantId`, `sku`, `productName`, `variantName`, `unitPrice` [Integer UZS], `quantity`, `lineTotal`).

### 6. B2B Leads
- `Lead`: Captures wholesale inquiries (`name`, `phone` normalized to `+998XXXXXXXXX`, `company`, `type`, `quantity`, `message`, `status`, `utmSource`).
