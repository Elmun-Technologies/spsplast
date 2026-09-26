# SPS PLAST E-Commerce - Security Architecture

## Admin Authentication & Session Management
- **Password Security**: Passwords hashed using `bcrypt` with salt round 10. No plaintext passwords stored.
- **Session Tokens**: Cryptographically strong random tokens stored as SHA-256 hashes in `AdminSession` table.
- **HttpOnly Cookies**: Session tokens stored in signed `HttpOnly`, `SameSite=Lax`, `Secure` (production) cookies. Never stored in `localStorage`.
- **Audit Logging**: All admin authentication events, product creations, and status changes recorded in `AuditLog`.

## CSRF Protection
- **Middleware gate**: `src/middleware.ts` rejects every non-`GET` request to the
  cookie-authenticated API prefixes (`/api/admin/*`, `/api/attributes*`,
  `/api/categories*`, `/api/products*`) whose `Origin`/`Referer` host does not
  match the request `Host` (`src/lib/csrf.ts`). Without it a cross-site page
  could issue `fetch(url, { method: 'DELETE', credentials: 'include' })` and the
  browser would attach the admin session cookie.
- **Exemptions**: server-to-server callers that never send an `Origin`
  (`/api/payments/*`, `/api/cron/*`, `/api/admin/login`, amoCRM OAuth callback)
  are excluded and protected by their own secret / rate limit instead.
- Public write endpoints (`POST /api/orders`, `POST /api/leads`) carry no
  cookies, so they are rate-limited rather than origin-checked.

## Rate Limiting
- `POST /api/admin/login` — 5 attempts / IP / 15 min.
- `POST /api/orders` — 20 orders / IP / 15 min.
- `POST /api/leads` — 10 leads / IP / 15 min.
- The in-memory limiter is per instance; use `checkRateLimitAsync` (PostgreSQL
  backed) if the deployment runs more than one instance.

## Server-Side Order & Price Validation
- **Server Price Calculation**: Frontend client cart submits only `{ productId, variantId, quantity }`. The server fetches the authoritative product and variant prices from the database inside a transaction. Client-submitted prices are ignored.
- **Shared pricing module**: bulk-tier discounts and promo codes live in
  `src/lib/pricing.ts` and are used by *both* the storefront and
  `createOrderServerSide`, so the total shown at checkout is the total stored on
  the order. Coupons are re-validated server-side; a client-forged discount has
  no effect.
- **Payload validation**: `src/lib/schemas/order.ts` caps the payload (max
  `MAX_ORDER_LINES` lines, integer quantity `1..MAX_QUANTITY_PER_ITEM`, bounded
  string lengths) before any query runs, and validates the phone number.
- **Integer Money Representation**: All monetary values are represented as integers in Uzbek Som (UZS) to eliminate floating-point rounding errors.

## Data Sanitization & Phone Normalization
- **Phone Formatting**: Input phone numbers normalized to standard E.164 format `+998XXXXXXXXX`.
- **SQL Injection Prevention**: Prisma ORM parameterized queries used exclusively; no unsafe raw SQL.
- **Telegram HTML escaping**: order/lead notifications are sent with
  `parse_mode: HTML`, so user-supplied text goes through `escapeTelegramHtml()`.
- **Slug generation**: `src/lib/slug.ts` transliterates Cyrillic and normalizes
  the Uzbek `o‘` / `g‘` letters, so product slugs are never empty and cannot
  collide on the `@@unique([locale, slug])` index.
- **Environment Variables**: Sensitive tokens (`TELEGRAM_BOT_TOKEN`, `AUTH_SECRET`, `DATABASE_URL`) strictly isolated in `.env` and `.env.example`.
