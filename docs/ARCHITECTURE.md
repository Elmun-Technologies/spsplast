# SPS PLAST E-Commerce Platform - Architectural Specification

## 1. Talablar Tahlili (Requirements Analysis)
- **Tizim turi**: B2C / B2B E-commerce & Lead Generation platformasi.
- **Asosiy yo'nalishlar**: Termopanel, Bruschatka qoliplari, Bordyur qoliplari, Beton qoliplari, Zina, Qurilish & Dekorativ buyumlar.
- **Auditoriya**: B2C (Xususiy uy egalari, ustalar), B2B (Beton sexlari, qurilish firmalari, dilerlar).
- **Asosiy xususiyatlar**: Multilingual (/uz, /ru), SEO-optimized, Fast PageSpeed (85+ mobile, 90+ desktop), Dynamic Filters, Mold Result Showcase (Qolip -> Tayyor mahsulot), B2B Wholesale Pricing Form, Guest Checkout, Telegram Order Notification, UTM tracking, Admin Panel, Analytics event tracking.

---

## 2. Sitemap
```
/ [Language Redirect to /uz or /ru]
├── /uz/ or /ru/
│   ├── / (Home Page)
│   ├── /catalog (All Products & Filtering)
│   ├── /catalog/[categorySlug] (Category Filtered)
│   ├── /product/[productSlug] (Product Detail Page)
│   ├── /cart (Cart Page)
│   ├── /checkout (Simple Guest Checkout)
│   ├── /order-success/[orderId] (Order Confirmation)
│   ├── /about (Biz haqimizda)
│   ├── /production (Ishlab chiqarish quvvati va texnologiya)
│   ├── /projects (Bajarilgan loyihalar / Real obyektlar / Before-After)
│   ├── /blog (SEO Maqolalar)
│   ├── /blog/[postSlug] (Maqola batafsil)
│   ├── /contact (Aloqa va rekvizitlar)
│   ├── /landings/[landingSlug] (Marketing Landing Pages: e.g., /termopanel, /bruschatka-qoliplari)
│   ├── /privacy (Maxfiylik siyosati)
│   ├── /terms (Ommaviy oferta)
│   ├── /delivery-payment (Yetkazib berish va to'lov)
│   └── /returns (Qaytarish shartlari)
└── /admin
    ├── /login
    ├── /dashboard
    ├── /products (CRUD, Images, Attributes, Variants)
    ├── /categories (CRUD)
    ├── /orders (Order Status, Details, Export)
    ├── /leads (B2B Lead Requests, UTM Info)
    ├── /banners (Hero & Promo Banners)
    ├── /blog (Manage Articles)
    └── /settings (Delivery rates, Telegram bot credentials, SEO global)
```

---

## 3. User Flow
1. **Public Discovery Flow**:
   - User enters Home / Landing via Search or Social Ads (with UTM tags).
   - Views Bestsellers / Categories / Mold Result showcases.
   - Searches with auto-suggestions or filters in `/catalog`.
   - Views `/product/[slug]`: inspects gallery, dimension specs, mold-to-final product comparison, B2B wholesale pricing inquiry, video tutorial.
   - Click "Savatga qo'shish" -> Cart Drawer / Page.
2. **Checkout Flow**:
   - Guest Checkout: Name, Phone (Uzbekistan validation format), Region, City/District, Address, Delivery Method, Payment Method (Cash, Click/Payme link, Bank transfer), Notes.
   - Order submit -> Saved to DB with UTM attributes & Geo -> Instant Telegram Notification to Admin -> Redirected to `/order-success/[orderId]`.
3. **B2B Wholesale Lead Flow**:
   - User clicks "Ulgurji narx olish" on product page or B2B section.
   - Fills minimal modal form: Name, Phone, Company, Product, Quantity.
   - Lead saved with status `NEW` + Telegram notification sent to B2B manager.

---

## 4. Database Schema (Prisma PostgreSQL)
- **User** (Admin credentials, Roles)
- **Category** (id, slug, nameUz, nameRu, image, parentId, seoTitle, seoDesc)
- **Product** (id, slug, sku, titleUz, titleRu, descUz, descRu, price, oldPrice, isBestseller, isNew, inStock, stockQty, yieldPerCast, durabilityCasts, dimensions, weight, material, videoUrl, categoryId, resultImage, createdAt)
- **ProductImage** (id, productId, url, altText, order)
- **ProductAttribute** (id, productId, keyUz, keyRu, valueUz, valueRu)
- **ProductVariant** (id, productId, sku, nameUz, nameRu, price, stockQty, optionsJson)
- **Order** (id, orderNumber, customerName, customerPhone, region, city, address, deliveryType, deliveryFee, paymentMethod, status, totalAmount, utmSource, utmMedium, utmCampaign, utmContent, utmTerm, createdAt)
- **OrderItem** (id, orderId, productId, variantId, title, price, quantity)
- **Lead** (id, name, phone, company, type [B2B_QUOTATION, CONSULTATION], message, productId, utmJson, status, createdAt)
- **BlogPost** (id, slug, titleUz, titleRu, contentUz, contentRu, coverImage, isPublished, publishedAt)
- **Project** (id, titleUz, titleRu, descriptionUz, descriptionRu, beforeImage, afterImage, location, createdAt)
- **Banner** (id, titleUz, titleRu, subTitleUz, subTitleRu, imageUrl, linkUrl, position, isActive)
- **Setting** (id, key, valueJson)

---

## 5. Technology Stack & System Architecture
- **Framework**: Next.js 14+ (App Router, Server Components + Client Components where appropriate)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI primitive patterns + Lucide icons
- **State Management**: Zustand / React Context (Cart, Locale, Filters state)
- **Database & ORM**: PostgreSQL (via Prisma ORM / SQLite fallback for quick local testing if Postgres not bound)
- **i18n**: Subpath routing `/uz` and `/ru` using lightweight Next.js App Router i18n middleware/dictionary pattern
- **Image Optimization**: Next.js `next/image` with WebP/AVIF generation, responsive sizes, lazy loading
- **Notifications**: Telegram Bot API integration via HTTPS POST webhooks

---

## 6. Component Architecture
- **UI Base**: Button, Input, Select, Dialog/Modal, Drawer, Badge, Toast, Skeleton, Table, Dropdown
- **Layout**: Header (Desktop Nav, Mobile Drawer, Lang Switcher, Search Bar, Cart Counter), Footer, Floating Sticky Contact Bar (Mobile)
- **E-Commerce**: ProductCard, CategoryCard, ProductGallery, ProductMoldResult, QuantitySelector, CartDrawer, B2BModal, FilterSidebar, FilterMobileDrawer, Pagination
- **Sections**: HeroSection, CategoryGrid, BestsellersSection, WhyUsSection, MoldResultSection, NewProductsSection, ProductionShowcase, RealProjectsSection, B2BWholesaleSection, BlogGrid, FAQAccordion

---

## 7. Admin Panel Architecture
- Route: `/admin`
- Auth: JWT / Session token cookie with HttpOnly flag
- Layout: Admin Sidebar (Dashboard, Products, Categories, Orders, Leads, Banners, Blog, Settings), Header with logout
- Order Table: Real-time status update, filtering by status (New, Confirmed, Shipped, Delivered, Cancelled), Order Details Modal, Export to CSV
- Lead Table: Review wholesale inquiries with full UTM tracking details
- Product Manager: Rich form with multi-image drag-and-drop, attribute key-value editor, mold result image uploader, variant setup

---

## 8. API Structure (Next.js App Router API Routes)
- `POST /api/auth/login` - Admin login
- `GET/POST /api/products` - List / Create products
- `GET/PUT/DELETE /api/products/[id]` - Product details & management
- `GET/POST /api/categories` - List / Create categories
- `POST /api/orders` - Public checkout order submission + Telegram broadcast
- `GET/PATCH /api/orders` - Admin order list & status update
- `POST /api/leads` - B2B quote request + Telegram broadcast
- `GET /api/sitemap` - Dynamic sitemap XML generator
- `POST /api/webhooks/crm` - External CRM webhook trigger

---

## 9. SEO Architecture
- Dynamic Meta Tags (Title, Description, Canonical URL, OpenGraph, Twitter Cards) for every product, category, and blog post in UZ and RU
- JSON-LD Structured Data:
  - `Product` & `Offer` schema on Product detail page
  - `BreadcrumbList` on Catalog and Product pages
  - `Organization` & `LocalBusiness` schema on Home page
  - `FAQPage` schema for FAQ section
- Robots.txt & Dynamic `sitemap.xml` with multilang hreflang alternates (`uz`, `ru`)

---

## 10. Analytics Event Map
Tracks ecommerce actions via unified dataLayer / custom event handler for GA4, Yandex Metrica, Meta Pixel:
- `view_item`: Product view
- `view_item_list`: Category / Catalog view
- `search`: Site search query
- `add_to_cart`: Product added to cart
- `remove_from_cart`: Item removed
- `begin_checkout`: Cart to Checkout step
- `purchase`: Order successfully placed
- `generate_lead`: B2B quote submitted
- `phone_click`: Contact phone clicked
- `telegram_click`: Telegram button clicked
- `whatsapp_click`: WhatsApp button clicked

---

## 11. Security Risks & Mitigation
- **XSS & Injection**: Sanitized user inputs, Prisma parameterized queries (prevents SQLi).
- **CSRF & Authentication**: Admin API routes protected via signed HttpOnly session cookies.
- **Rate Limiting**: API routes (Checkout, Lead submission, Search) protected with IP rate-limiting logic.
- **Sensitive Data**: Telegram Bot Tokens & API secrets stored strictly in environment variables (`.env`).
- **Input Validation**: Zod schema validation on all API endpoints (Order format, Uzbekistan phone format: `+998XXXXXXXXX`).

---

## 12. Implementation Plan
1. Step 1: Initializing Next.js 14, Tailwind CSS, dependencies, and folder structure.
2. Step 2: Database setup with Prisma schema & seed script containing realistic Uzbek SPS Plast categories and products (Termopanel, Bruschatka qoliplari, Bordyur qoliplari, etc.).
3. Step 3: i18n Dictionary & middleware implementation for `/uz` and `/ru`.
4. Step 4: Core UI Component Library & Layouts (Header, Mobile Sticky Contact, Footer).
5. Step 5: Public Pages (Home, Catalog, Product Detail with Mold Result showcase, Cart, Checkout, Order Success).
6. Step 6: Content & Landing Pages (Biz haqimizda, Ishlab chiqarish, Projects, Blog, Contact, Legal).
7. Step 7: Backend API routes (Orders, Leads, Products, Admin Auth, Telegram bot integration).
8. Step 8: Admin Panel dashboard and management pages.
9. Step 9: SEO, Analytics, Performance optimization & verification tests.
