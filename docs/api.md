# Stellar-Spend API Documentation

Base URL: `http://localhost:3001` (development)

## Authentication

All `/api/offramp/*` endpoints are **server-side only** and use environment-configured secrets. Clients call these routes directly — no client-side API key is required or exposed.

The webhook endpoint (`/api/webhooks/paycrest`) verifies requests using HMAC-SHA256 via the `X-Paycrest-Signature` header.

---

## Rate Limiting

Two endpoints enforce per-IP rate limits:

| Endpoint | Limit |
|---|---|
| `POST /api/offramp/bridge/build-tx` | See `buildTxLimiter` config |
| `POST /api/offramp/paycrest/order` | See `paycrestOrderLimiter` config |

Rate-limited responses return `429` with a `Retry-After` header (seconds) and `X-Request-Id`.

---

## Idempotency

The following mutating endpoints support the `Idempotency-Key` header:

| Endpoint | Behavior |
|---|---|
| `POST /api/offramp/paycrest/order` | Replays the original order response for safe retries |
| `POST /api/offramp/execute-payout` | Replays the original transaction creation result |
| `POST /api/transactions` | Replays the original transaction write response |
| `PATCH /api/transactions/[id]` | Replays the original transaction update response |

### How it works

- Send a unique `Idempotency-Key` header with the first request.
- Retrying the exact same request with the same key returns the stored response instead of re-running the operation.
- Reusing the same key with a different request body returns `409 Conflict`.
- Reusing the same key while the first request is still in progress also returns `409 Conflict`.
- Completed entries are kept for `IDEMPOTENCY_TTL_MS` milliseconds. In-progress locks use `IDEMPOTENCY_LOCK_TTL_MS`.
- Server responses with `5xx` status are not cached, so clients can safely retry transient failures.

### Example

```bash
curl -X POST http://localhost:3001/api/offramp/paycrest/order \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: order-create-9d9f2b9d-1" \
  -d '{
    "amount": 100,
    "rate": 1600,
    "token": "USDC",
    "network": "stellar",
    "reference": "ref-001",
    "returnAddress": "0xreturnAddress",
    "recipient": {
      "institution": "ACCESS",
      "accountIdentifier": "1234567890",
      "accountName": "John Doe",
      "currency": "NGN"
    }
  }'
```

Responses include:

- `Idempotency-Key`: the key used for the request
- `Idempotency-Status: created` for the first successful processing
- `Idempotency-Status: replayed` for a cached replay
- `Idempotency-Status: conflict` for mismatched or in-progress reuse

---

## Error Format

All error responses follow this shape:

```json
{ "error": "Human-readable message" }
```

Validation errors from `POST /api/offramp/paycrest/order` include a `details` map:

```json
{
  "error": "Validation failed",
  "details": {
    "amount": "amount must be a positive number",
    "recipient.institution": "recipient.institution is required and must be a string"
  }
}
```

---

## Endpoints

### GET /api/health

Returns service health and version.

**Response `200`**
```json
{
  "status": "ok",
  "timestamp": "2026-04-22T22:30:11.068Z",
  "version": "1.0.0"
}
```

```bash
curl http://localhost:3001/api/health
```

---

### GET /api/notifications/preferences

Returns stored notification preferences for a wallet address.

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `userAddress` | string | ✅ | Wallet address tied to the transaction owner |

**Response `200`**
```json
{
  "data": {
    "userAddress": "GABC...",
    "email": "user@example.com",
    "phoneNumber": "+2348000000000",
    "emailEnabled": true,
    "smsEnabled": false,
    "notifyOnPending": true,
    "notifyOnCompleted": true,
    "notifyOnFailed": true
  }
}
```

If no preferences exist yet, the route returns `{ "data": null }`.

---

### PUT /api/notifications/preferences

Creates or updates notification preferences for a wallet address.

**Request Body**
```json
{
  "userAddress": "GABC...",
  "email": "user@example.com",
  "phoneNumber": "+2348000000000",
  "emailEnabled": true,
  "smsEnabled": false,
  "notifyOnPending": true,
  "notifyOnCompleted": true,
  "notifyOnFailed": true
}
```

**Response `200`**
```json
{
  "data": {
    "userAddress": "GABC...",
    "email": "user@example.com",
    "phoneNumber": "+2348000000000",
    "emailEnabled": true,
    "smsEnabled": false,
    "notifyOnPending": true,
    "notifyOnCompleted": true,
    "notifyOnFailed": true
  }
}
```

---

### GET /api/transactions/[id]/notifications

Returns notification delivery tracking records for a single transaction.

**Response `200`**
```json
{
  "data": [
    {
      "id": "delivery-uuid",
      "transactionId": "tx_123",
      "channel": "email",
      "status": "sent",
      "templateId": "transaction-completed-v1",
      "destination": "user@example.com"
    }
  ]
}
```

---

### GET /api/offramp/currencies

Returns supported fiat currencies. Cached for 5 minutes.

**Response `200`**
```json
{
  "data": [
    { "code": "NGN", "name": "Nigerian Naira", "symbol": "₦" },
    { "code": "KES", "name": "Kenyan Shilling", "symbol": "KSh" }
  ]
}
```

**Errors**

| Status | Meaning |
|---|---|
| `500` | Paycrest API unreachable |

```bash
curl http://localhost:3001/api/offramp/currencies
```

---

### GET /api/offramp/institutions/[currency]

Returns supported banks/institutions for a given fiat currency code.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `currency` | string | Fiat currency code, e.g. `NGN` |

**Response `200`**
```json
[
  { "code": "ACCESS", "name": "Access Bank" },
  { "code": "GTB", "name": "Guaranty Trust Bank" }
]
```

**Errors**

| Status | Meaning |
|---|---|
| `400` | Unsupported or unknown currency |
| `500` | Internal server error |

```bash
curl http://localhost:3001/api/offramp/institutions/NGN
```

---

### POST /api/offramp/quote

Fetches a conversion quote: Stellar USDC → fiat via Allbridge + Paycrest.

**Request Body**

```json
{
  "amount": "100",
  "currency": "NGN",
  "feeMethod": "USDC"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `amount` | string | ✅ | USDC amount to convert |
| `currency` | string | ✅ | Target fiat currency code |
| `feeMethod` | string | ✅ | `"USDC"` \| `"XLM"` \| `"stablecoin"` \| `"native"` |

**Response `200`**
```json
{
  "destinationAmount": "155000.00",
  "rate": 1550.0,
  "currency": "NGN",
  "expiresIn": 300
}
```

**Errors**

| Status | Meaning |
|---|---|
| `400` | Invalid amount, missing currency, or invalid feeMethod |
| `502` | Allbridge or Paycrest quote unavailable |
| `500` | Unexpected server error |

```bash
curl -X POST http://localhost:3001/api/offramp/quote \
  -H "Content-Type: application/json" \
  -d '{"amount":"100","currency":"NGN","feeMethod":"USDC"}'
```

---

### POST /api/offramp/verify-account

Verifies a beneficiary bank account via Paycrest.

**Request Body**

```json
{
  "institution": "ACCESS",
  "accountIdentifier": "0123456789"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `institution` | string | ✅ | Institution code from `/institutions/[currency]` |
| `accountIdentifier` | string | ✅ | Account number or identifier |

**Response `200`**
```json
{ "accountName": "John Doe" }
```

**Errors**

| Status | Meaning |
|---|---|
| `400` | Missing fields or account not found |
| `502` | Paycrest upstream error (5xx from Paycrest) |
| `500` | Internal server error |

```bash
curl -X POST http://localhost:3001/api/offramp/verify-account \
  -H "Content-Type: application/json" \
  -d '{"institution":"ACCESS","accountIdentifier":"0123456789"}'
```

---

### GET /api/offramp/bridge/gas-fee-options

Returns Allbridge gas fee options for the Stellar → Base USDC bridge. Cached for 60 seconds.

**Response `200`**
```json
{
  "feeOptions": {
    "native": { "int": "1000000", "float": "1.0" },
    "stablecoin": { "int": "500000", "float": "0.5" }
  }
}
```

`native` = XLM fee, `stablecoin` = USDC fee.

**Errors**

| Status | Meaning |
|---|---|
| `502` | Allbridge SDK timeout or unavailable |
| `500` | Chain details or token not found |

```bash
curl http://localhost:3001/api/offramp/bridge/gas-fee-options
```

---

### POST /api/offramp/bridge/build-tx

Builds an unsigned Soroban XDR transaction for bridging USDC from Stellar to Base via Allbridge. Rate-limited per IP.

**Request Body**

```json
{
  "amount": "99.5",
  "fromAddress": "GABC...XYZ",
  "toAddress": "0xabc...def",
  "feePaymentMethod": "stablecoin"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `amount` | string | ✅ | USDC amount to bridge |
| `fromAddress` | string | ✅ | Stellar (G...) sender address |
| `toAddress` | string | ✅ | Base (0x...) recipient address |
| `feePaymentMethod` | string | | `"stablecoin"` (default) or `"native"` |

**Response `200`**
```json
{
  "xdr": "AAAAAgAAAA...",
  "sourceToken": {
    "symbol": "USDC",
    "decimals": 7,
    "contract": "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
    "chain": "SRB"
  },
  "destinationToken": {
    "symbol": "USDC",
    "decimals": 6,
    "contract": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "chain": "ETH"
  }
}
```

**Errors**

| Status | Meaning |
|---|---|
| `400` | Invalid amount, address, or feePaymentMethod |
| `429` | Rate limit exceeded — check `Retry-After` header |
| `500` | Simulation failed, insufficient balance, or chain unavailable |

```bash
curl -X POST http://localhost:3001/api/offramp/bridge/build-tx \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "99.5",
    "fromAddress": "GABC...XYZ",
    "toAddress": "0xabc...def",
    "feePaymentMethod": "stablecoin"
  }'
```

---

### POST /api/offramp/bridge/submit-soroban

Submits a signed Stellar XDR transaction to the Soroban RPC.

**Request Body**

```json
{ "signedXdr": "AAAAAgAAAA..." }
```

| Field | Type | Required | Description |
|---|---|---|---|
| `signedXdr` | string | ✅ | Signed transaction XDR from the wallet |

**Response `200`**
```json
{ "status": "PENDING", "hash": "abc123..." }
```

| `status` | Meaning |
|---|---|
| `PENDING` | Transaction accepted, awaiting confirmation |
| `SUCCESS` | Transaction confirmed on-chain |

**Errors**

| Status | Meaning |
|---|---|
| `400` | Missing `signedXdr`, RPC error, or transaction rejected |
| `500` | Soroban RPC not configured or unreachable |

```bash
curl -X POST http://localhost:3001/api/offramp/bridge/submit-soroban \
  -H "Content-Type: application/json" \
  -d '{"signedXdr":"AAAAAgAAAA..."}'
```

---

### GET /api/offramp/bridge/tx-status/[hash]

Polls the Soroban RPC for a submitted transaction's confirmation status.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `hash` | string | Transaction hash from `submit-soroban` |

**Response `200`**
```json
{ "status": "SUCCESS", "hash": "abc123..." }
```

| `status` | Meaning |
|---|---|
| `SUCCESS` | Transaction confirmed |
| `FAILED` | Transaction failed on-chain |
| `NOT_FOUND` | Not yet indexed or invalid hash |

**Errors**

| Status | Meaning |
|---|---|
| `400` | RPC returned an error |
| `500` | Soroban RPC not configured or unreachable |

```bash
curl http://localhost:3001/api/offramp/bridge/tx-status/abc123...
```

---

### GET /api/offramp/bridge/status/[txHash]

Polls Allbridge for the cross-chain bridge transfer status.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `txHash` | string | Stellar transaction hash |

**Response `200`**
```json
{
  "data": {
    "status": "completed",
    "txHash": "abc123...",
    "receiveAmount": "99.0"
  }
}
```

| `status` | Meaning |
|---|---|
| `pending` | Bridge not yet picked up the transfer |
| `processing` | Transfer in progress |
| `completed` | USDC arrived on Base |
| `failed` | Bridge transfer failed |
| `expired` | Transfer expired |

**Errors**

| Status | Meaning |
|---|---|
| `500` | Allbridge SDK error |

```bash
curl http://localhost:3001/api/offramp/bridge/status/abc123...
```

---

### POST /api/offramp/paycrest/order

Creates a Paycrest fiat payout order. Rate-limited per IP.

**Request Body**

```json
{
  "amount": 99.0,
  "rate": 1550.0,
  "token": "USDC",
  "network": "base",
  "reference": "ref-unique-123",
  "returnAddress": "0xabc...def",
  "recipient": {
    "institution": "ACCESS",
    "accountIdentifier": "0123456789",
    "accountName": "John Doe",
    "currency": "NGN"
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `amount` | number | ✅ | USDC amount (positive) |
| `rate` | number | ✅ | FX rate from `/quote` (positive) |
| `token` | string | ✅ | Token symbol, e.g. `"USDC"` |
| `network` | string | ✅ | Chain name, e.g. `"base"` |
| `reference` | string | ✅ | Unique reference string |
| `returnAddress` | string | ✅ | Base address for refunds |
| `recipient.institution` | string | ✅ | Bank institution code |
| `recipient.accountIdentifier` | string | ✅ | Account number |
| `recipient.accountName` | string | ✅ | Verified account name |
| `recipient.currency` | string | ✅ | Fiat currency code |

**Response `200`**
```json
{
  "data": {
    "id": "order-uuid",
    "receiveAddress": "0xpaycrest...address"
  }
}
```

**Errors**

| Status | Meaning |
|---|---|
| `400` | Validation failed — see `details` map |
| `429` | Rate limit exceeded — check `Retry-After` header |
| `4xx` | Paycrest rejected the order |
| `500` | Internal server error |

```bash
curl -X POST http://localhost:3001/api/offramp/paycrest/order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 99.0,
    "rate": 1550.0,
    "token": "USDC",
    "network": "base",
    "reference": "ref-unique-123",
    "returnAddress": "0xabc...def",
    "recipient": {
      "institution": "ACCESS",
      "accountIdentifier": "0123456789",
      "accountName": "John Doe",
      "currency": "NGN"
    }
  }'
```

---

### GET /api/offramp/paycrest/order/[orderId]

Fetches the status of a Paycrest payout order.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `orderId` | string | Order ID from `POST /api/offramp/paycrest/order` |

**Response `200`**
```json
{
  "data": {
    "id": "order-uuid",
    "status": "pending"
  }
}
```

**Errors**

| Status | Meaning |
|---|---|
| `400` | Missing orderId |
| `404` | Order not found |
| `500` | Internal server error |

```bash
curl http://localhost:3001/api/offramp/paycrest/order/order-uuid
```

---

### GET /api/offramp/status/[orderId]

Polls Paycrest order status using Bearer token auth (alternative to the adapter-based route above).

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `orderId` | string | Paycrest order ID |

**Response `200`**
```json
{ "status": "pending", "id": "order-uuid" }
```

**Errors**

| Status | Meaning |
|---|---|
| `4xx/5xx` | Forwarded from Paycrest |
| `500` | Internal server error |

```bash
curl http://localhost:3001/api/offramp/status/order-uuid
```

---

### POST /api/webhooks/paycrest

Receives Paycrest event webhooks. Verifies the `X-Paycrest-Signature` HMAC-SHA256 header before processing.

**Headers**

| Header | Required | Description |
|---|---|---|
| `X-Paycrest-Signature` | ✅ | HMAC-SHA256 hex digest of the raw request body, keyed with `PAYCREST_WEBHOOK_SECRET` |

**Request Body** (example)
```json
{
  "event": "payment_order.settled",
  "data": { "id": "order-uuid" }
}
```

**Response `200`**
```json
{ "received": true }
```

**Errors**

| Status | Meaning |
|---|---|
| `401` | Invalid or missing signature |
| `400` | Malformed JSON payload |

---

## Typical Off-Ramp Flow

```
1. GET  /api/offramp/currencies              → pick fiat currency
2. GET  /api/offramp/institutions/[currency] → pick bank
3. POST /api/offramp/verify-account          → confirm account name
4. POST /api/offramp/quote                   → get FX rate + destination amount
5. GET  /api/offramp/bridge/gas-fee-options  → pick fee method
6. POST /api/offramp/bridge/build-tx         → get unsigned XDR
   (wallet signs XDR)
7. POST /api/offramp/bridge/submit-soroban   → submit signed XDR → get txHash
8. GET  /api/offramp/bridge/tx-status/[hash] → poll until SUCCESS
9. POST /api/offramp/paycrest/order          → create payout order → get orderId + receiveAddress
   (bridge delivers USDC to receiveAddress)
10. GET /api/offramp/bridge/status/[txHash]  → poll until completed
11. GET /api/offramp/paycrest/order/[id]     → poll until settled
```
