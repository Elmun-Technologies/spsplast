# SPS PLAST — SQLite to PostgreSQL Migration Guide

## Overview

This guide details the procedure for migrating the SPS PLAST catalog, variants, orders, translations, and system settings from local SQLite to a production PostgreSQL database.

---

## 1. Safety & Preparation

1. **Create SQLite Backup:**
   Run the automated backup script before performing any export:
   ```bash
   node scripts/backup-sqlite.js
   ```
   Backup artifacts are stored safely in `./backups/sqlite-backup-<timestamp>.db`.

---

## 2. Data Export

Export all entities in dependency-safe order into a JSON export file:
```bash
node scripts/export-data.js
```
The export tool creates `backups/data-export-<timestamp>.json` preserving:
- Primary keys and UUID relations
- Integer currency values (UZS)
- SKU, slugs, and order numbers
- Media URLs and storage keys
- Historical order status timelines & prices

---

## 3. PostgreSQL Database Initialization

1. Point `DATABASE_URL` in `.env` to the PostgreSQL target instance:
   ```ini
   DATABASE_URL="postgresql://postgres:password@localhost:5432/spsplast?sslmode=disable"
   ```
2. Update `prisma/schema.prisma` provider to `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Generate client and apply initial PostgreSQL migration:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

---

## 4. Data Import & Verification

Import exported data into the PostgreSQL database:
```bash
node scripts/import-data.js backups/data-export-<timestamp>.json
```

The script will:
- Insert records in correct topological dependency order
- Verify count equality between export file and PostgreSQL target tables
- Audit price integer safety (ensuring no floating-point rounding errors)
- Validate unique constraints across variants, orders, and payment transactions

---

## 5. Rollback Procedure

If data import encounters unrecoverable errors:
1. Truncate/reset PostgreSQL tables: `npx prisma migrate reset --force`
2. Point `DATABASE_URL` back to SQLite database file.
3. Restore `prisma/schema.prisma` provider to `sqlite`.
4. Re-run `npx prisma generate`.
