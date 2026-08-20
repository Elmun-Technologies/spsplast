# SPS PLAST — INTEGRATIONS ARCHITECTURE (PHASE 7)

## Overview

This document describes the external integration architecture for SPS Plast, covering:
1. **Click.uz Payment Provider** (Prepare & Complete callbacks)
2. **Payme.uz Payment Provider** (JSON-RPC protocol implementation)
3. **amoCRM System Integration** (OAuth2 token exchange, Lead & Contact creation, outbox worker pattern)
4. **Idempotency & Security Guarantees**

---

## 1. Click.uz Payment Integration

### Endpoint
`POST /api/payments/click`

### Authentication & Signature
Requests from Click send `sign_string`:
`MD5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)`

The server verifies `sign_string` before executing any logic. If signature check fails, error `-1` (Sign failed) is returned.

### Actions
* `action = 0` (**Prepare**):
  - Checks if order exists by `merchant_trans_id` (orderId or orderNumber) and amount matches `order.totalAmount`.
  - Creates or updates `PaymentTransaction` with status `PENDING`.
  - Returns `error = 0` on success, or appropriate Click error code (`-2` amount invalid, `-5` order not found, `-4` already paid).
* `action = 1` (**Complete**):
  - Validates `error` payload from Click.
  - If `error < 0`, marks `PaymentTransaction` and order payment status as `FAILED`.
  - If `error === 0`, marks `PaymentTransaction` as `PAID`, sets `order.paymentStatus = 'PAID'`, logs audit entry, and enqueues amoCRM sync job.

---

## 2. Payme.uz Payment Integration

### Endpoint
`POST /api/payments/payme`

### Protocol
Payme uses JSON-RPC 2.0 with HTTP Basic Authentication (`Paycom:SECRET_KEY`).

### Supported JSON-RPC Methods
1. `CheckPerformTransaction`: Validates order existence and amount (`amount` in tiyn, i.e., UZS * 100).
2. `CreateTransaction`: Creates a transaction record or returns existing active transaction within timeout window (12 hours).
3. `PerformTransaction`: Marks transaction as `PAID`, sets `order.paymentStatus = 'PAID'`, logs audit entry, and enqueues amoCRM sync job.
4. `CancelTransaction`: Cancels transaction before or after payment (with reason).
5. `CheckTransaction`: Returns transaction status and details.
6. `GetStatement`: Returns statement of transactions in specified time window.

---

## 3. amoCRM Integration

### Authentication & Token Management
* OAuth 2.0 protocol.
* Redirect callback endpoint: `GET /api/admin/integrations/amocrm/callback?code=...`
* Tokens are stored securely in `AmoCrmToken` database table.
* Automatic refresh using `refresh_token` when `expiresAt` is near expiration.

### Lead & Contact Sync Flow
1. Orders or leads trigger an event in the system.
2. An `IntegrationJob` is enqueued in the `IntegrationJob` outbox table with status `PENDING`.
3. Worker `processPendingIntegrationJobs()` picks up jobs, syncs leads/contacts with custom field mapping (including UTM parameters: `utm_source`, `utm_medium`, `utm_campaign`), and updates `Order.amocrmLeadId` and `Order.amocrmSyncedAt`.
4. If amoCRM is unconfigured or returns an error, jobs enter `RETRY` (up to 5 attempts) and errors are safely captured without breaking customer checkout.

---

## 4. Security & Robustness Summary

* **Idempotency**: All webhook transactions verify existing `PaymentTransaction` records before executing state changes.
* **Fault Tolerance**: Non-critical external service failures (e.g. CRM down) do not block customer orders or payment processing.
* **Admin Monitoring**: `/admin/settings/integrations` provides live status, credential health, outbox queue state, and audit logs.
