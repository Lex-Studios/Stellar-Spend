# Shared Transaction Type & Module Grouping (Issue 1210)

## What changed

`transaction-merge.ts`, `transaction-split.ts`, `transaction-search.ts`,
`transaction-analytics.ts`, and `transaction-status.ts` now live under
`src/lib/transactions/` and are exposed through its barrel export.

## Shared type

The canonical `Transaction` type remains in `src/lib/transaction-storage.ts`.
`src/lib/transactions/types.ts` re-exports it alongside the status, payout,
bridge, and trade-state types. The merge, search, and analytics modules import
the shared type from `./types`; split transactions retain their distinct shape.

## Grouping

Barrel module: `src/lib/transactions/index.ts`

```ts
export * from './transaction-merge';
export * from './transaction-split';
export * from './transaction-search';
export * from './transaction-analytics';
export * from './transaction-status';
export type { Transaction } from './types';
```

The grouped public surface is available under `@/lib/transactions`.

## Call sites updated

- All affected application and library imports now use `@/lib/transactions`
  or the relevant module path within `src/lib/transactions/`.

## Tests

`src/lib/transactions/index.test.ts` — existing smoke test confirming the
barrel re-exports symbols from the grouped modules. Not run for this change.

## Acceptance criteria status

- [x] Shared type used consistently (`@/lib/transactions` → `Transaction`)
- [ ] Unit tests — not run per request
- [ ] Code review — pending PR review
