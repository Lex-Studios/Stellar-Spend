# Primitive UI library: `components/ui` is canonical

## Status

Accepted (issue #1257). The migration is not finished.

## Context

Two primitive folders exist: `src/components/ui` (Button, Input, Label, Skeleton) and
`src/components/design-system` (Alert, Badge, Button, Card). `Button` is defined in both.

## Decision

`src/components/ui` is the canonical primitive library. New primitives go there. The
`design-system` folder is deprecated: do not add to it, and move its consumers to `ui` when you
touch them.

## Remaining work

- Move `Alert`, `Badge` and `Card` into `ui`, then delete `design-system/Button.tsx` once its
  consumers import from `ui`.
