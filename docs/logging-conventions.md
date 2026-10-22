# Logging in components (issue #1259)

Components and `src/app` must not call `console.log`. Use `logger` from `src/lib/logger.ts`.

Checked with a search of `src/components` and `src/app` for `console.log`: **no matches**, so no
calls needed replacing.
