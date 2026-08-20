# SPS PLAST E-Commerce - Security Architecture

## Admin Authentication & Session Management
- **Password Security**: Passwords hashed using `bcrypt` with salt round 10. No plaintext passwords stored.
- **Session Tokens**: Cryptographically strong random tokens stored as SHA-256 hashes in `AdminSession` table.
- **HttpOnly Cookies**: Session tokens stored in signed `HttpOnly`, `SameSite=Lax`, `Secure` (production) cookies. Never stored in `localStorage`.
- **Audit Logging**: All admin authentication events, product creations, and status changes recorded in `AuditLog`.

## Server-Side Order & Price Validation
- **Server Price Calculation**: Frontend client cart submits only `{ productId, variantId, quantity }`. The server fetches the authoritative product and variant prices from the database inside a transaction. Client-submitted prices are ignored.
- **Integer Money Representation**: All monetary values are represented as integers in Uzbek Som (UZS) to eliminate floating-point rounding errors.

## Data Sanitization & Phone Normalization
- **Phone Formatting**: Input phone numbers normalized to standard E.164 format `+998XXXXXXXXX`.
- **SQL Injection Prevention**: Prisma ORM parameterized queries used exclusively; no unsafe raw SQL.
- **Environment Variables**: Sensitive tokens (`TELEGRAM_BOT_TOKEN`, `AUTH_SECRET`, `DATABASE_URL`) strictly isolated in `.env` and `.env.example`.
