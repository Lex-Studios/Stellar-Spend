# ADR-016: The canonical API client

## Status

Accepted (issue #1252).

## Context

Three client modules exist: `src/lib/apiClient.ts`, `src/lib/api/client.ts` and
`src/lib/clients/http-client.ts`. `API_CLIENT_DEDUP.md` is referenced by the issue, but it is not
in the repository.

## Decision

`src/lib/api/client.ts` is the canonical client. It has the most importers (10 files import it
directly). `src/lib/apiClient.ts` re-exports it and is kept only for compatibility; do not add
imports of it. `src/lib/clients/http-client.ts` is for the external provider clients in
`src/lib/clients/` and is not a general-purpose API client.

## Consequences

New code imports `@/lib/api/client`. Migrating the remaining imports of `apiClient.ts` is a
follow-up.
