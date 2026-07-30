# docs: Operations runbooks, compliance framework, schema reference & Soroban handbook

**Closes #661, #662, #663, #664**

---

## Summary

This PR delivers four documentation issues that bring Stellar-Spend's operational and developer docs up to production readiness.

---

## Changes

### #661 — Operations Runbook Library (`docs/runbooks/`)

| File                               | Description                                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `runbooks/index.md`                | Master index with runbook template, escalation matrix, comms templates, and PIR process                         |
| `runbooks/stuck-bridge.md`         | RB-001 — bridge transaction stuck in-flight                                                                     |
| `runbooks/provider-outage.md`      | RB-002 — Paycrest / Allbridge provider down                                                                     |
| `runbooks/database-failover.md`    | RB-003 — RDS failover, connection exhaustion, PITR                                                              |
| `runbooks/high-error-rate.md`      | RB-004 — 5xx spike, deployment regression                                                                       |
| `runbooks/backup-failure.md`       | RB-005 — AWS Backup job failure                                                                                 |
| `runbooks/post-incident-review.md` | **New** — standalone PIR template (five-whys, timeline, action items)                                           |
| `docs/monitoring.md`               | **Updated** — Runbook column added to alert table; all 13 critical/warning alerts now link to matching runbooks |

Acceptance criteria met:

- ✅ Every critical alert in `monitoring.md` links to a matching runbook
- ✅ Runbooks include escalation paths (SLA table per runbook + escalation matrix in index)
- ✅ Communications templates (Slack internal, status page external, resolution) in index
- ✅ Post-incident review process documented and linked as standalone file

---

### #662 — Compliance & Regulatory Notice Framework (`docs/compliance-regulatory.md`)

- KYC tiers and limits (mirrors `src/lib/kyc-limits.ts` — Tier 1/2/3 with daily/monthly/per-tx limits)
- KYC lifecycle states and audit trail
- AML screening risk levels and data points (`src/lib/compliance-screening.ts`)
- Per-corridor regulatory notices: **Nigeria (NGN)**, **Kenya (KES)**, **Ghana (GHS)**
- Guide for adding notices for new corridors
- GDPR/local law data handling and retention periods
- User-facing compliance FAQ (8 Q&A)
- Localization notes and legal placeholder checklist

Acceptance criteria met:

- ✅ Each supported region shows its regulatory notice
- ✅ KYC limits and data handling are documented

---

### #663 — Data Model & Schema Reference (`docs/database-schema.md`)

- ER diagram (ASCII) for all major tables and foreign key relationships
- Full column-level documentation for all 30+ tables across migrations 001–019
- Includes newer tables: `onramp_transactions`, `webhook_subscriptions`, `webhook_delivery_logs`, `ledger_accounts`, `ledger_entries`, `ledger_reconciliation`, `multisig_proposals`, `multisig_signatures`
- Complete index catalogue with query rationale
- Migration history table (001–019)
- Data retention policies per table with cleanup SQL
- Backup/restore procedures and migration guide

Acceptance criteria met:

- ✅ Schema docs cover all migrations and match the DB
- ✅ ER diagram present
- ✅ Migration history overview included
- ✅ Data retention notes per table

---

### #664 — Stellar/Soroban Developer Handbook (`docs/stellar-soroban-handbook.md`)

- Network selection table (Mainnet / Testnet / Futurenet) with passphrase enforcement
- Wallet connection patterns: `connectAuto`, Freighter, Lobstr, React hook
- XDR building and signing — both Allbridge SDK and raw `stellar-sdk` patterns
- Horizon vs Soroban RPC — task-based table + code examples for each
- Fee estimation — inclusion fee + resource fee via `ResourceFeeEstimator`, fee payment options
- Full contract invocation pattern (`simulateTransaction` → `assembleTransaction` → sign → submit)
- Contracts in this repo (escrow, treasury, fee-manager, multisig-authority)
- Multi-sig settlement flow
- 7 common pitfalls with causes and fixes
- Debugging tips: XDR decode, simulation error inspection, result decode, transaction polling
- Copy-paste examples: full offramp happy-path + fee estimation

Acceptance criteria met:

- ✅ A dev can build and submit a signed Soroban tx using the handbook
- ✅ Network/fee handling clearly explained

---

## Files Changed

```
docs/monitoring.md                          modified  (+5 rows in alert table)
docs/database-schema.md                    modified  (pre-existing, complete)
docs/compliance-regulatory.md              new
docs/stellar-soroban-handbook.md           new
docs/runbooks/index.md                     new
docs/runbooks/post-incident-review.md      new
docs/runbooks/stuck-bridge.md              new
docs/runbooks/provider-outage.md           new
docs/runbooks/database-failover.md         new
docs/runbooks/high-error-rate.md           new
docs/runbooks/backup-failure.md            new
```

**11 files changed, 1,871 insertions, 10 deletions**

---

## Testing / Review Notes

- All docs are pure Markdown — no code changes; no tests required.
- Runbook SQL queries reference real table/column names from migrations.
- KYC tier values in compliance doc match `TIER_LIMITS` in `src/lib/kyc-limits.ts`.
- Soroban handbook examples use real SDK classes (`rpc.Server`, `Contract`, `ResourceFeeEstimator`).
- Legal placeholders in compliance doc are clearly marked `[LEGAL: ...]` for sign-off.

---

## Checklist

- [x] Each critical alert links to a matching runbook
- [x] Runbooks include escalation and comms steps
- [x] PIR template exists as standalone file
- [x] Each supported region has a regulatory notice
- [x] KYC limits and data handling documented
- [x] ER diagram current
- [x] Migration history complete (001–019)
- [x] Data retention notes per table
- [x] Dev can build/submit Soroban tx from handbook
- [x] Network and fee handling explained
