# Unused dependencies (knip)

`npm run dead-code` (knip) run on 2026-11-22.

## Removed in this PR

- `@zxing/browser` (root `dependencies`) — flagged "Unused dependencies"
- `dompurify` (root `dependencies`) — flagged "Unused dependencies"
- `@types/dompurify` (root `devDependencies`) — flagged "Unused devDependencies"; it is a stub ("dompurify provides its own type definitions"), so removing it is a straight replacement.

## Not removed (out of scope or false positives)

- **Unused files (33)** — e.g. `src/components/FormCard.tsx`, `src/components/form-card/*`, `src/components/right-panel/*`, `src/components/BankAccountInput.tsx`, `src/components/QuoteComparison.tsx`, `src/hooks/useFormCardState.ts`, `src/lib/help-topics/*`, `src/lib/bank-validation.ts`, `src/lib/compliance-screening.ts`, `src/lib/validation/bank-account.ts`. Removing these is a code cleanup tracked separately.
- **Unused devDependencies** — `license-checker` (used by `npm run license:check`/`license:report` scripts), `msw`, `node-mocks-http`, `@testing-library/jest-dom`, `@testing-library/user-event`, `eslint-config-next`, `eslint-plugin-storybook`, `@vitejs/plugin-react` (imported by `vitest.config.ts`).
- **Unlisted dependencies (32)** — e.g. `webpack` (referenced in `next.config.ts`), `ioredis`, `uuid`, `postcss`, `js-yaml`.
- **Unresolved imports (27)** — e.g. in `.storybook/preview.tsx` and error-page components.

## Verify build

`npm run build` (with the env vars from `vitest.config.ts` `test.env`, via `.env.local`):

- Fails on `./src/app/api/graphql/route.ts`: "Module not found: Can't resolve '../../../../lib/graphql/resolver-usage'".
- **This failure is pre-existing on this branch**: `git ls-files src/lib/graphql` shows only `src/lib/graphql/resolver-usage.test.ts` — the imported `src/lib/graphql/resolver-usage.ts` module does not exist and was never committed. It is unrelated to the changes in this PR (dependency removals are the only changes affecting the build).
