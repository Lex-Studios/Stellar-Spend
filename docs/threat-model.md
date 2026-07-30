# Stellar-Spend Threat Model

**Version:** 1.0  
**Date:** 2026-06-27  
**Status:** Living document — review before each mainnet deployment

---

## 1. Scope

This threat model covers the Stellar-Spend off-ramp application:

- Next.js API server (bridge, payout, webhook routes)
- Soroban smart contracts (`escrow`, `treasury`, `fee-manager`)
- Browser frontend (wallet interaction, localStorage)
- CI/CD pipeline and deployment infrastructure

Out of scope: Allbridge Protocol internals, Paycrest backend, Stellar/Base protocol layers.

---

## 2. Assets

| Asset                                          | Confidentiality | Integrity | Availability |
| ---------------------------------------------- | --------------- | --------- | ------------ |
| `BASE_PRIVATE_KEY` (payout wallet)             | Critical        | Critical  | High         |
| `PAYCREST_API_KEY` / `PAYCREST_WEBHOOK_SECRET` | High            | High      | Medium       |
| `DATABASE_URL` and user PII                    | High            | High      | High         |
| Escrow contract settlement authority           | Critical        | Critical  | High         |
| User stablecoin funds (in-flight)              | N/A             | Critical  | High         |
| Transaction history (localStorage)             | Medium          | Medium    | Low          |
| CI/CD secrets (registry, deploy tokens)        | High            | High      | Medium       |

---

## 3. Trust Boundaries

```
[Browser] -- TLS --> [Next.js API] -- TLS --> [Paycrest API]
                                   -- RPC --> [Base Chain]
                                   -- RPC --> [Stellar Horizon/Soroban]
[GitHub Actions] --> [Container Registry] --> [Production K8s/Cloud]
[Paycrest] -- HMAC-signed webhook --> [/api/webhooks/paycrest]
```

---

## 4. Actors

| Actor                       | Trust Level | Notes                                                 |
| --------------------------- | ----------- | ----------------------------------------------------- |
| Authenticated user          | Low-Medium  | Controls their own wallet; can craft malicious inputs |
| Paycrest webhook            | Medium      | Verified via HMAC-SHA512; IPs should be allowlisted   |
| CI/CD pipeline              | High        | Has deploy credentials; supply-chain risk             |
| External auditor            | High        | Read-only access to code and staging                  |
| Malicious browser extension | None        | May intercept wallet interactions                     |
| Contract attacker           | None        | May try to drain escrow via replay/reentrancy         |

---

## 5. Attack Surfaces & STRIDE Analysis

### 5.1 API Layer

| Threat                          | STRIDE                 | Mitigation                                       |
| ------------------------------- | ---------------------- | ------------------------------------------------ |
| Forged Paycrest webhook         | Spoofing               | HMAC-SHA512 verification + constant-time compare |
| Replay a payout request         | Repudiation            | Idempotency keys (`src/lib/idempotency.ts`)      |
| Inject SQL via bank details     | Tampering              | Parameterized queries only                       |
| DoS via quote hammering         | Denial of Service      | Rate limiting (30 req/min/IP)                    |
| Leak `BASE_PRIVATE_KEY` via log | Information Disclosure | No key logging; Sentry PII scrubbing             |
| Escalate to admin via API key   | Elevation of Privilege | Scoped API keys with per-route checks            |

### 5.2 Smart Contracts (Soroban)

| Threat                         | STRIDE       | Mitigation                                                          |
| ------------------------------ | ------------ | ------------------------------------------------------------------- |
| Unauthorized release           | Spoofing/EoP | `settlement_auth.require_auth()` on every release                   |
| Double-release / double-refund | Tampering    | Boolean guards (`released`, `refunded`) checked before state change |
| Fund lock via bad timeout      | DoS          | `can_refund` available to depositor after `timeout_ledger`          |
| Reentrancy during release      | Tampering    | Soroban execution model is atomic; no external calls mid-function   |
| Upgrade to malicious WASM      | Tampering    | Multi-sig required for upgrade authority (issue #629)               |
| Integer overflow on amount     | Tampering    | `i128` arithmetic; validate `amount > 0`                            |

### 5.3 Frontend / Wallet

| Threat                        | STRIDE                 | Mitigation                                        |
| ----------------------------- | ---------------------- | ------------------------------------------------- |
| XSS via user-supplied content | Tampering              | `isomorphic-dompurify` sanitization; strict CSP   |
| localStorage key exfiltration | Information Disclosure | Never store private keys in localStorage          |
| Phishing via wallet prompt    | Spoofing               | Display human-readable XDR summary before signing |
| MITM on RPC endpoint          | Tampering              | Pin RPC URLs in env; use TLS-only providers       |

### 5.4 Supply Chain / CI

| Threat                     | STRIDE                 | Mitigation                                               |
| -------------------------- | ---------------------- | -------------------------------------------------------- |
| Compromised npm dependency | Tampering              | `npm ci --frozen-lockfile`; Dependabot alerts; SBOM      |
| Container base image CVE   | Information Disclosure | Trivy/Grype scan on every build; weekly schedule         |
| Leaked CI secret           | Information Disclosure | Secrets scoped per environment; no `NEXT_PUBLIC_` prefix |
| Malicious GitHub Action    | Tampering              | Pin all Actions to SHA; Dependabot for Actions           |

---

## 6. High/Critical Findings (Pre-mainnet Gate)

> **No deployment to mainnet until all items below are resolved.**

| ID     | Severity | Description                                                                      | Status            |
| ------ | -------- | -------------------------------------------------------------------------------- | ----------------- |
| TM-001 | Critical | Multi-sig not enforced on escrow `release` — single key controls all funds       | Addressed by #629 |
| TM-002 | High     | No SBOM or CVE gate in CI                                                        | Addressed by #644 |
| TM-003 | High     | E2E tests ran against dev server (hot reload); must run against production build | Addressed by #643 |
| TM-004 | Medium   | `lint --max-warnings` allowed 50 warnings, masking potential issues              | Addressed by #643 |

---

## 7. Ongoing Review Cadence

| Activity                                 | Frequency                            | Owner         |
| ---------------------------------------- | ------------------------------------ | ------------- |
| Automated CVE scan (Trivy + Grype)       | Every PR + weekly                    | CI            |
| `npm audit`                              | Every PR                             | CI            |
| Threat model review                      | Before each mainnet upgrade          | Security lead |
| External audit                           | Before mainnet launch, then annually | External firm |
| Dependency updates (Dependabot/Renovate) | Weekly                               | Automated     |
| Incident response drill                  | Quarterly                            | Ops team      |

---

## 8. Out-of-Scope Risks (Accepted)

- Stellar or Base consensus failures (protocol-level; beyond our control)
- Paycrest API outages (handled via retry + user notification)
- User's own wallet compromise (non-custodial by design)
