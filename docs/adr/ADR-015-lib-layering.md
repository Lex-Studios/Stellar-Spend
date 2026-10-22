# ADR-015: Layering inside `src/lib`

## Status

Accepted (issue #1250).

## Context

`src/lib` holds about 119 files with no documented boundaries between services, repositories,
middleware and clients.

## Decision

Code in `src/lib` is organised in layers, and imports go only downward:

1. **Routes** (`src/app`, API route handlers): parse the request and call a service.
2. **Services** (`src/lib/services`-style modules): business logic. Call repositories and clients.
3. **Repositories**: storage access (database, local storage). No business logic.
4. **Clients**: calls to external systems. The HTTP client is `src/lib/api/client.ts` (ADR-016).

Middleware wraps routes and does not import services. A lower layer never imports a higher one.

## Consequences

New modules in `src/lib` declare their layer in a header comment. Existing modules are not moved
by this ADR.
